// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Sprint 072 — Transcript subscribes to a pane's SessionController
// and renders each transcript row as a <Row>, keyed by callId+seq.
// ToolResult envelopes fold into their matching ToolCall, as the dc-runtime page folded them.
//
// Scroll is owned by useScrollAnchor (UI sprint 102): follow the bottom while the user is
// there, hold the row being read once they scroll up, per pane per view.
//
// Sprint 529: the transcript is windowed — only rows near the viewport have DOM nodes;
// distant rows are replaced by spacer divs whose heights come from a measurement cache.

import * as React from "react";
import { useController } from "./useController";
import { Row } from "./Row";
import { useScrollAnchor } from "./useScrollAnchor";
import { isToolResultRow } from "../../vm";
import { emit as emitSignal } from "../../vm/instrumentation/sdd";
import type { Snapshot, TranscriptRow } from "../../vm";
import { Signal, TranscriptRowSkippedReason } from "../../vm/signals.gen";
import { STICK_PX } from "../scroll_stick";

export interface TranscriptProps {
  paneId: number;
  view: "terminal" | "reveal";
}

function keyForRow(row: TranscriptRow): string {
  const id = row.callKey ?? row.callId;
  if (id) return id;
  return "seq:" + row.seq;
}

// UI sprint 144: "session started with <model> at <workspace>", the transcript's first line, so an
// empty pane shows where the conversation will appear. The home folder is written `~`.
function startLine(snapshot: Snapshot): string | null {
  if (!snapshot.driver) return null;
  const path = snapshot.workspacePath;
  // A per-session sandbox lives at <state>/sessions/<session id>/workspace; its path says nothing
  // a user needs, so it reads as what it is, before the session opens and after.
  const ownSandbox = !!path && !!snapshot.sessionId && path.endsWith(`/sessions/${snapshot.sessionId}/workspace`);
  const where = path && !ownSandbox ? path.replace(/^\/Users\/[^/]+/, "~") : "a per-session sandbox";
  return `session started with ${snapshot.driver} at ${where}`;
}

// --- Windowing helpers ---

const OVERSCAN = 8;
const EST_TEXT_HEIGHT = 48;
const EST_TOOL_HEIGHT = 200;

function estimateHeight(row: TranscriptRow): number {
  return row.role === "tool" ? EST_TOOL_HEIGHT : EST_TEXT_HEIGHT;
}

interface VisibleRange {
  startIndex: number;
  endIndex: number;
  topSpacerHeight: number;
  bottomSpacerHeight: number;
}

function computeVisibleRange(
  rows: TranscriptRow[],
  heightCache: Map<string, number>,
  scrollTop: number,
  viewportHeight: number,
): VisibleRange {
  if (rows.length === 0) {
    return { startIndex: 0, endIndex: -1, topSpacerHeight: 0, bottomSpacerHeight: 0 };
  }
  let accum = 0;
  let firstVisible = 0;
  for (let i = 0; i < rows.length; i++) {
    const ht = heightCache.get(keyForRow(rows[i])) ?? estimateHeight(rows[i]);
    if (accum + ht > scrollTop) { firstVisible = i; break; }
    accum += ht;
    if (i === rows.length - 1) firstVisible = i;
  }
  let lastVisible = firstVisible;
  let runningTop = accum;
  for (let i = firstVisible; i < rows.length; i++) {
    lastVisible = i;
    const ht = heightCache.get(keyForRow(rows[i])) ?? estimateHeight(rows[i]);
    runningTop += ht;
    if (runningTop >= scrollTop + viewportHeight) break;
  }
  const startIndex = Math.max(0, firstVisible - OVERSCAN);
  const endIndex = Math.min(rows.length - 1, lastVisible + OVERSCAN);
  let topSpacerHeight = 0;
  for (let i = 0; i < startIndex; i++) {
    topSpacerHeight += heightCache.get(keyForRow(rows[i])) ?? estimateHeight(rows[i]);
  }
  let bottomSpacerHeight = 0;
  for (let i = endIndex + 1; i < rows.length; i++) {
    bottomSpacerHeight += heightCache.get(keyForRow(rows[i])) ?? estimateHeight(rows[i]);
  }
  return { startIndex, endIndex, topSpacerHeight, bottomSpacerHeight };
}

function measureRowHeight(el: HTMLElement): number {
  const mt = parseFloat(el.style.marginTop || "0") || 0;
  return el.getBoundingClientRect().height + mt;
}

// The height cache and the last viewport, kept per pane+view across unmounts (sprint 536). A view
// switch (terminal → reveal → terminal) unmounts the transcript, so a component ref would lose the
// cache; the remount would then re-measure every off-screen row from its estimate to its real height
// and the restored scroll position would shift. These module-level maps survive the switch, keyed the
// same `${view}:${paneId}` way useScrollAnchor's savedByKey/reportedByKey are.
const heightCacheByKey = new Map<string, Map<string, number>>();
function getHeightCache(key: string): Map<string, number> {
  let m = heightCacheByKey.get(key);
  if (!m) { m = new Map(); heightCacheByKey.set(key, m); }
  return m;
}
const viewportByKey = new Map<string, { scrollTop: number; clientHeight: number }>();

// --- Component ---

export function Transcript(props: TranscriptProps): React.ReactElement | null {
  const snapshot = useController(props.paneId);
  const { registerRow, attachTo, scrollerRef } = useScrollAnchor(`${props.view}:${props.paneId}`, props.paneId);
  const resultByCallId = snapshot.resultByCallId;
  const rows: TranscriptRow[] = snapshot.transcript.filter((row) => !isToolResultRow(row));
  // T4 (v0.12): a tool result is drawn inside its call's card, not as a row. Sprint 532: the newly
  // folded results of one snapshot change are one TRANSCRIPT_ROWS_SKIPPED batch, not one record each;
  // last_seq advances T4's answered high-water (electron/invariants.ts).
  const foldedRef = React.useRef<Set<number>>(new Set());
  React.useEffect(() => {
    let count = 0;
    let lastSeq = -1;
    for (const row of snapshot.transcript) {
      if (!isToolResultRow(row) || foldedRef.current.has(row.seq)) continue;
      foldedRef.current.add(row.seq);
      count += 1;
      if (typeof row.seq === "number" && row.seq > lastSeq) lastSeq = row.seq;
    }
    if (count > 0) emitSignal(Signal.TRANSCRIPT_ROWS_SKIPPED, { count, reasons: { [TranscriptRowSkippedReason.FOLDED]: count }, last_seq: lastSeq }, { pane_id: props.paneId });
  }, [snapshot.transcript, snapshot.sessionId, props.paneId]);

  // Height cache: row key → last measured height (including marginTop). Kept per pane+view across
  // unmounts, so a view switch does not lose it (sprint 536; see the module-level maps above).
  const cacheKey = `${props.view}:${props.paneId}`;
  const heightCache = React.useRef<Map<string, number>>(getHeightCache(cacheKey));

  // seq → row key, rebuilt each render so the wrapped registerRow can look up keys by seq.
  const seqToKeyRef = React.useRef(new Map<number, string>());
  seqToKeyRef.current = new Map();
  for (const row of rows) seqToKeyRef.current.set(row.seq, keyForRow(row));

  // A tick that forces a re-render when scroll position or row heights change.
  const [, setScrollTick] = React.useState(0);
  const scrollRafRef = React.useRef<number | null>(null);

  // Listen to scroll and viewport-resize on the scroller element so the visible window updates.
  React.useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const invalidate = () => {
      if (scrollRafRef.current !== null) return;
      scrollRafRef.current = requestAnimationFrame(() => {
        scrollRafRef.current = null;
        setScrollTick((t) => t + 1);
      });
    };
    scroller.addEventListener("scroll", invalidate, { passive: true });
    const ro = new ResizeObserver(invalidate);
    ro.observe(scroller);
    invalidate();
    return () => {
      scroller.removeEventListener("scroll", invalidate);
      ro.disconnect();
      if (scrollRafRef.current !== null) {
        cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
    };
  });

  // One ResizeObserver watches every mounted row; height changes update the cache and re-render.
  const rowObserverRef = React.useRef<ResizeObserver | null>(null);
  const observedEls = React.useRef<Map<string, HTMLElement>>(new Map());
  const elToKeyRef = React.useRef<WeakMap<Element, string>>(new WeakMap());
  React.useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      let changed = false;
      for (const entry of entries) {
        const key = elToKeyRef.current.get(entry.target);
        if (!key) continue;
        const el = entry.target as HTMLElement;
        const ht = measureRowHeight(el);
        if (ht > 0 && heightCache.current.get(key) !== ht) {
          heightCache.current.set(key, ht);
          changed = true;
        }
      }
      if (changed) setScrollTick((t) => t + 1);
    });
    rowObserverRef.current = observer;
    return () => observer.disconnect();
  }, []);

  // Wraps the scroll anchor's registerRow: measures on mount, observes for resize, unobserves on unmount.
  const windowedRegisterRow = React.useCallback(
    (seq: number, el: HTMLElement | null) => {
      registerRow(seq, el);
      const key = seqToKeyRef.current.get(seq);
      if (!key) return;
      const observer = rowObserverRef.current;
      const prevEl = observedEls.current.get(key);
      if (prevEl) {
        observer?.unobserve(prevEl);
        elToKeyRef.current.delete(prevEl);
      }
      if (el) {
        const ht = measureRowHeight(el);
        if (ht > 0) heightCache.current.set(key, ht);
        observedEls.current.set(key, el);
        elToKeyRef.current.set(el, key);
        observer?.observe(el);
      } else {
        observedEls.current.delete(key);
      }
    },
    [registerRow],
  );

  // Compute which rows are near the viewport.
  const scroller = scrollerRef.current;
  const hasScroller = scroller !== null && scroller.clientHeight > 0;
  // A gate that reads the transcript's content, not its windowing, sets this seam to render every row.
  // Without it the windowing below (sprint 529) leaves off-screen rows as spacers, out of the DOM, so a
  // gate that counts or reads rows by DOM query misses the windowed-out ones. Production never sets it;
  // the W1 load gate (long_session_open) leaves it unset and so exercises the real windowed path.
  const noWindowing = typeof window !== "undefined" && (window as unknown as { __noTranscriptWindowing?: boolean }).__noTranscriptWindowing === true;
  let range: VisibleRange | null = null;
  if (!noWindowing && hasScroller) {
    range = computeVisibleRange(rows, heightCache.current, scroller.scrollTop, scroller.clientHeight);
    viewportByKey.set(cacheKey, { scrollTop: scroller.scrollTop, clientHeight: scroller.clientHeight });
    const atBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <= STICK_PX;
    if (atBottom && range.endIndex < rows.length - 1) {
      range.endIndex = rows.length - 1;
      range.bottomSpacerHeight = 0;
    }
  } else if (!noWindowing) {
    // First render, before attachTo wires the scroller. On a remount from a view switch the pane+view
    // has a remembered viewport and a surviving height cache, so window from them: off-screen rows stay
    // in the spacer and are not briefly mounted and re-measured — the re-measure (estimate → real) is
    // what shifted the restored scroll position across a switch (sprint 536). On the first ever mount,
    // with no remembered viewport, render every row, as before (the windowed range takes over next frame).
    const vp = viewportByKey.get(cacheKey);
    if (vp) range = computeVisibleRange(rows, heightCache.current, vp.scrollTop, vp.clientHeight);
  }

  const start = startLine(snapshot);
  const visibleRows = range ? rows.slice(range.startIndex, range.endIndex + 1) : rows;
  return (
    <div ref={attachTo}>
      {start ? <div data-session-start-line="1" style={{ color: "#62676f", marginBottom: 10, overflowWrap: "anywhere" }}>{start}</div> : null}
      {range ? <div data-windowing-spacer="top" style={{ height: range.topSpacerHeight }} /> : null}
      {visibleRows.map((row) => {
        const id = row.callKey ?? row.callId;
        const paired = id ? resultByCallId[id] : undefined;
        const progressEntry = id ? snapshot.progressByCallId[id] : undefined;
        return (
          <Row
            key={keyForRow(row)}
            row={row}
            paired={paired}
            progressText={progressEntry?.text ?? ""}
            progressEof={progressEntry?.eof ?? false}
            droppedLines={progressEntry?.droppedLines ?? 0}
            registerRow={windowedRegisterRow}
            paneId={props.paneId}
            sessionId={snapshot.sessionId}
          />
        );
      })}
      {range ? <div data-windowing-spacer="bottom" style={{ height: range.bottomSpacerHeight }} /> : null}
    </div>
  );
}
