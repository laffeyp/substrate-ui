// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The editor view (sprint 407; roadmap process/planning/2026-11-09-code-editor/ROADMAP-2026-11-09-code-editor-r6.md,
// R1 and R3). ⌘⇧E shows it over the whole window on the focused pane's session (spec r6 §4, D86). Its
// four areas follow sheet frame 24a: the left column (the files tree, R4), the centre (the editor, a
// later phase), the right column (the inspector, a later phase) and, under the centre only, the
// substrate terminal: the pane's transcript, activity line and input bar (D90: the prompt is in every
// view). Sizes are 24a's, measured from the rendered frame (runs/design/sheet-v11/24a.png); colours
// are D7's. Only what works is drawn (D6): no tabs, no status line, no inspector sections yet. Sprints
// 414–416: columns resize, fold to rails (the terminal to a sill), the terminal docks right, the sides
// swap, and focus folds everything but the prompt (spec r6 §5.1).

import * as React from "react";
import { Transcript } from "../../reveal/transcript";
import { ActivityLine, TaskRows } from "../ActivityLine";
import { FindBar } from "../FindBar";
import { InputBar } from "../InputBar";
import { paneInput, setText } from "../state/input_bar";
import { setFindScope } from "../state/find";
import { FileTree } from "./FileTree";
import { Centre } from "./Centre";
import { ANCHOR_CELL, ANCHOR_ONE, ANCHOR_ZERO, encodeAnchor, encodeAnchor2, encodeAnchor3 } from "../derive/anchor";
import { Inspector } from "./Inspector";
import { editor } from "../state/editor";
import { clampSize, loadSizes, saveSizes, type EditorSizes } from "./sizes";
import { emit as emitSignal } from "../../vm/instrumentation/sdd";
import { EditorColumnFoldedCause, EditorColumnFoldedColumn, EditorColumnResizedColumn, EditorDockSetDock, Signal } from "../../vm/signals.gen";
import { shell } from "../state/shell";

export type Column = "left" | "right" | "bottom";

/** Fold a column to its rail, or the terminal to its sill, or unfold it (sprint 415; D51, D49 (d), frame
 *  16c): the store changes and one EDITOR_COLUMN_FOLDED says which, which way and why. */
export function foldColumn(column: Column, folded: boolean, cause: EditorColumnFoldedCause, paneId: number): void {
  const st = editor.getSnapshot();
  if (st.folded[column] === folded) return;
  // A person's own fold or unfold while focus is on ends focus; the layout stays as they left it.
  if (st.focus.on && cause !== EditorColumnFoldedCause.FOCUS) {
    editor.set({ focus: { on: false, before: null } });
    emitSignal(Signal.EDITOR_FOCUS_SET, { on: false }, { pane_id: paneId });
  }
  editor.set({ folded: { ...editor.getSnapshot().folded, [column]: folded } });
  emitSignal(Signal.EDITOR_COLUMN_FOLDED, { column: column as EditorColumnFoldedColumn, folded, cause }, { pane_id: paneId });
}

/** View ▸ Dock Terminal Right (sprint 416; spec r6 §5.1 (2)): below the centre, or a column right of it. */
export function toggleDock(paneId: number): void {
  const dock = editor.getSnapshot().dock === "bottom" ? "right" : "bottom";
  editor.set({ dock });
  emitSignal(Signal.EDITOR_DOCK_SET, { dock: dock as EditorDockSetDock }, { pane_id: paneId });
}

/** View ▸ Swap Sides (sprint 416; spec r6 §5.1 (3)): the files column and the inspector change sides. */
export function toggleSwap(paneId: number): void {
  const swapped = !editor.getSnapshot().swapped;
  editor.set({ swapped });
  emitSignal(Signal.EDITOR_SIDES_SWAPPED, { swapped }, { pane_id: paneId });
}

/** View ▸ Focus (sprint 416; spec r6 §5.1 (4), frame 16c): everything folds but the prompt; again, the
 *  folds focus made are undone and the layout before it returns (BLACKBOARD 2026-11-09, focus). */
export function toggleFocus(paneId: number): void {
  const st = editor.getSnapshot();
  const cols: Column[] = ["left", "right", "bottom"];
  if (!st.focus.on) {
    editor.set({ focus: { on: true, before: st.folded } });
    emitSignal(Signal.EDITOR_FOCUS_SET, { on: true }, { pane_id: paneId });
    for (const c of cols) foldColumn(c, true, EditorColumnFoldedCause.FOCUS, paneId);
    return;
  }
  const before = st.focus.before ?? { left: false, right: false, bottom: false };
  editor.set({ focus: { on: false, before: null } });
  emitSignal(Signal.EDITOR_FOCUS_SET, { on: false }, { pane_id: paneId });
  for (const c of cols) if (!before[c]) foldColumn(c, false, EditorColumnFoldedCause.FOCUS, paneId);
}

const RAIL = 26;
const GLYPH: React.CSSProperties = { color: "#62676f", fontSize: 10, cursor: "pointer", padding: "0 4px", flex: "none" };

/** A folded side column: 26 px of the sunk surface with its unfold mark and a vertical label (D51; 16c). */
function Rail({ column, label, start, paneId }: { column: Column; label: string; start: boolean; paneId: number }): React.ReactElement {
  return (
    <div data-editor-rail={column} onClick={() => foldColumn(column, false, EditorColumnFoldedCause.RAIL, paneId)} title={label.toLowerCase()}
      style={{ width: RAIL, flex: "none", background: SUNK, [start ? "borderRight" : "borderLeft"]: DIVIDER, display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", minHeight: 0 }}>
      <div style={{ height: EDITOR_SIZES.tabRow, display: "flex", alignItems: "center", color: "#62676f", fontSize: 10 }}>{start ? "▸" : "◂"}</div>
      <div style={{ writingMode: "vertical-rl", transform: start ? "rotate(180deg)" : undefined, ...LABEL, marginTop: 6 }}>{label}</div>
    </div>
  );
}

const storage = (): Storage | null => { try { return window.localStorage; } catch { return null; } };

/** A divider's grab zone (sprint 414): 6 px over the 1 px line between two areas. */
function Handle({ column, across, onGrab }: { column: keyof EditorSizes; across: boolean; onGrab: (column: keyof EditorSizes, ev: React.PointerEvent) => void }): React.ReactElement {
  return (
    <div style={{ position: "relative", flex: "none", width: across ? undefined : 0, height: across ? 0 : undefined, zIndex: 2 }}>
      <div data-editor-resize={column === "side" ? "bottom" : column} onPointerDown={(ev) => onGrab(column, ev)}
        style={across ? { position: "absolute", left: 0, right: 0, top: -3, height: 6, cursor: "row-resize" } : { position: "absolute", top: 0, bottom: 0, left: -3, width: 6, cursor: "col-resize" }} />
    </div>
  );
}

/** The pixel anchor (sprint 411; web/app/derive/anchor.ts): the last EDITOR_DRAWN record painted as a
 *  strip of cells at the view's bottom-left corner, a step off the sunk surface. */
function AnchorStrip(): React.ReactElement | null {
  const st = React.useSyncExternalStore(editor.subscribe, editor.getSnapshot, editor.getSnapshot);
  if (!st.anchor) return null;
  // Sprint 422: the second row, one cell above the first, carries the tab and inspector counts; sprint 424:
  // the third, above it, the buffer's state.
  return (
    <div data-editor-anchor={String(st.anchor.seq)} aria-hidden="true" style={{ position: "absolute", left: 0, bottom: 0, display: "flex", flexDirection: "column", pointerEvents: "none", zIndex: 1 }}>
      {st.anchor3 && <div data-editor-anchor3={String(st.anchor3.seq)} style={{ display: "flex", height: ANCHOR_CELL }}>{encodeAnchor3(st.anchor3).map((bit, i) => <div key={i} style={{ width: ANCHOR_CELL, height: ANCHOR_CELL, background: bit ? ANCHOR_ONE : ANCHOR_ZERO }} />)}</div>}
      {st.anchor2 && <div data-editor-anchor2={String(st.anchor2.seq)} style={{ display: "flex", height: ANCHOR_CELL }}>{encodeAnchor2(st.anchor2).map((bit, i) => <div key={i} style={{ width: ANCHOR_CELL, height: ANCHOR_CELL, background: bit ? ANCHOR_ONE : ANCHOR_ZERO }} />)}</div>}
      <div style={{ display: "flex", height: ANCHOR_CELL }}>{encodeAnchor(st.anchor).map((bit, i) => <div key={i} style={{ width: ANCHOR_CELL, height: ANCHOR_CELL, background: bit ? ANCHOR_ONE : ANCHOR_ZERO }} />)}</div>
    </div>
  );
}

const SUNK = "#1a1c20";
const GROUND = "#212327";
const SELECT = "#2e3138";
const DIVIDER = "1px solid #2d2f33";
const LABEL: React.CSSProperties = { fontSize: 10, letterSpacing: ".08em", color: "#62676f", whiteSpace: "nowrap" };

/** 24a's measured sizes, in CSS px. `centreMin`: the centre, which holds the prompt, narrows last
 *  (D90); below 210 + 300 + 240 px the side columns shrink in proportion to their widths (sprint 407,
 *  found at the window's 504 px minimum, where the side columns had covered the prompt). */
export const EDITOR_SIZES = { left: 210, right: 300, bottom: 176, tabRow: 26, centreMin: 240 } as const;

/** The left column's foot: the workspace, home written `~`, and its shape (24a: `~/code/crumb · worktree`). */
export function workspaceFoot(path: string | null, shape: string | null): string {
  const where = (path || "").replace(/^\/Users\/[^/]+/, "~");
  return [where, shape].filter(Boolean).join(" · ");
}

export function EditorView({ paneId, fontSize, sessionId, workspace, shape }: { paneId: number; fontSize: number; sessionId: string; workspace: string | null; shape: string | null }): React.ReactElement {
  // Sprint 414 (R10): each side column's width and the terminal's height follow a drag of their edge,
  // are kept per mode, and each finished drag is one EDITOR_COLUMN_RESIZED.
  const [sizes, setSizes] = React.useState<EditorSizes>(() => loadSizes("code", storage()));
  const ed = React.useSyncExternalStore(editor.subscribe, editor.getSnapshot, editor.getSnapshot);
  const { folded, dock, swapped } = ed;
  const snap = React.useSyncExternalStore(shell.subscribe, shell.getSnapshot, shell.getSnapshot).snapshots[paneId];
  const parked = !!snap?.parkReason;
  const viewRef = React.useRef<HTMLDivElement>(null);
  // Which edge of the view each side column sits on: files at the start unless the sides are swapped.
  const atStart = { left: !swapped, right: swapped };
  const grab = (column: keyof EditorSizes, ev: React.PointerEvent) => {
    ev.preventDefault();
    const el = ev.currentTarget as HTMLElement;
    el.setPointerCapture(ev.pointerId);
    const start = { x: ev.clientX, y: ev.clientY, size: sizes[column] };
    let now = sizes;
    const move = (e: PointerEvent) => {
      const rect = viewRef.current!.getBoundingClientRect();
      const dx = e.clientX - start.x;
      const delta = column === "bottom" ? start.y - e.clientY : column === "side" ? -dx : atStart[column] ? dx : -dx;
      now = { ...now, [column]: clampSize(column, start.size + delta, now, { width: rect.width, height: rect.height }, dock === "right") };
      setSizes(now);
    };
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      saveSizes("code", now, storage());
      // The terminal's size is reported as `bottom` docked either way (vocabulary v0.29, EDITOR_COLUMN_RESIZED).
      emitSignal(Signal.EDITOR_COLUMN_RESIZED, { column: (column === "side" ? "bottom" : column) as EditorColumnResizedColumn, size: now[column] }, { pane_id: paneId });
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
  };

  const filesColumn = (start: boolean) => folded.left ? <Rail column="left" label="FILES" start={start} paneId={paneId} /> : (
    <div data-editor-area="left" style={{ flex: `0 1 ${sizes.left}px`, minWidth: 0, overflow: "hidden", display: "flex", flexDirection: "column", background: SUNK, [start ? "borderRight" : "borderLeft"]: DIVIDER, minHeight: 0 }}>
      <div style={{ height: EDITOR_SIZES.tabRow, flex: "none", display: "flex", alignItems: "center", padding: "0 6px", gap: 4 }}>
        <span data-editor-left-tab="files" style={{ background: SELECT, color: "#d7dade", borderRadius: 3, padding: "1px 6px", fontSize: 11, whiteSpace: "nowrap" }}>files</span>
        <span style={{ flex: 1 }} />
        <span data-editor-fold="left" title="fold the files (⌥⌘L)" onClick={() => foldColumn("left", true, EditorColumnFoldedCause.RAIL, paneId)} style={GLYPH}>{start ? "◂" : "▸"}</span>
      </div>
      <div data-editor-tree="1" style={{ flex: 1, overflow: "auto", minHeight: 0 }}><FileTree key={sessionId} sessionId={sessionId} paneId={paneId} /></div>
      <div data-editor-workspace="1" title={workspace || ""} style={{ flex: "none", padding: "6px 12px 8px", borderTop: DIVIDER, fontSize: 10.5, color: "#62676f", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{workspaceFoot(workspace, shape)}</div>
    </div>
  );
  const inspectorColumn = (start: boolean) => folded.right ? <Rail column="right" label="INSPECTOR" start={start} paneId={paneId} /> : (
    <div data-editor-area="right" style={{ flex: `0 1 ${sizes.right}px`, minWidth: 0, overflow: "hidden", display: "flex", flexDirection: "column", background: SUNK, [start ? "borderRight" : "borderLeft"]: DIVIDER, minHeight: 0 }}>
      <div style={{ height: EDITOR_SIZES.tabRow, flex: "none", display: "flex", alignItems: "center", padding: "0 14px", gap: 8, borderBottom: "1px solid rgba(255,255,255,.055)", whiteSpace: "nowrap" }}><span style={{ fontSize: 9.5, letterSpacing: ".12em", color: "#9aa0a8" }}>INSPECTOR</span>{ed.active ? <span data-inspector-file="1" style={{ fontSize: 10.5, color: "#62676f", overflow: "hidden", textOverflow: "ellipsis" }}>{ed.active.slice(ed.active.lastIndexOf("/") + 1)}</span> : null}<span style={{ flex: 1 }} /><span data-editor-fold="right" title="fold the inspector (⌥⌘R)" onClick={() => foldColumn("right", true, EditorColumnFoldedCause.RAIL, paneId)} style={GLYPH}>{start ? "◂" : "▸"}</span></div>
      <Inspector paneId={paneId} workspace={workspace} />
    </div>
  );
  // The sill (D49 (d); 16c): the input stays; typing a character reopens the history.
  const sill = (
    <div data-editor-sill="1" onKeyDownCapture={(e) => {
        if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
        // The sill's box leaves the screen as the panel opens: the character goes into the pane's
        // text (state/input_bar.ts) and the caret into the panel's bar, so nothing typed is lost.
        e.preventDefault();
        setText(paneId, paneInput(paneId).text + e.key);
        foldColumn("bottom", false, EditorColumnFoldedCause.KEY, paneId);
        requestAnimationFrame(() => {
          const box = document.querySelector<HTMLTextAreaElement>('[data-editor-area="bottom"] textarea[data-input-bar]');
          if (box) { box.focus(); box.setSelectionRange(box.value.length, box.value.length); }
        });
      }}
      style={{ flex: "none", display: "flex", alignItems: "center", gap: 12, padding: "0 12px", borderTop: DIVIDER, background: GROUND }}>
      <div style={{ flex: 1, minWidth: 0 }}><InputBar paneId={paneId} compact /></div>
      <span data-editor-fold="bottom" onClick={() => foldColumn("bottom", false, EditorColumnFoldedCause.RAIL, paneId)} style={{ ...GLYPH, fontSize: 10.5 }}>▴ history{parked ? <span style={{ color: "#82a5c8" }}> · ◐ parked</span> : null}</span>
    </div>
  );
  // The terminal: below the centre, or docked right as a column between the centre and the end column.
  const terminal = (
    <div data-editor-area="bottom" data-editor-dock={dock}
      style={dock === "bottom" ? { height: sizes.bottom, flex: "none", display: "flex", flexDirection: "column", borderTop: DIVIDER, background: GROUND, minHeight: 0 }
        : { flex: `0 1 ${sizes.side}px`, minWidth: 0, display: "flex", flexDirection: "column", borderLeft: DIVIDER, background: GROUND, minHeight: 0 }}>
      <div style={{ flex: "none", padding: "6px 16px 2px", display: "flex", ...LABEL }}>SUBSTRATE TERMINAL<span style={{ flex: 1 }} /><span data-editor-fold="bottom" title="fold the terminal (⌘J)" onClick={() => foldColumn("bottom", true, EditorColumnFoldedCause.RAIL, paneId)} style={GLYPH}>▾</span></div>
      <div style={{ flex: "none" }}><FindBar view="meta" /></div>
      <div onClick={() => setFindScope("transcript")} style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "2px 16px", lineHeight: 1.7, fontSize, minWidth: 0, minHeight: 0 }}>
        <div data-vm-transcript-mount="editor" data-pane-id={String(paneId)}>
          {/* The reveal's scroll anchor: meta and the editor are never shown together. */}
          <div data-vm-atom-root="editor" data-pane-id={String(paneId)}><Transcript paneId={paneId} view="reveal" /></div>
        </div>
      </div>
      <div style={{ flex: "none" }}><ActivityLine paneId={paneId} view="meta" /></div>
      <div style={{ flex: "none" }}><TaskRows paneId={paneId} view="meta" /></div>
      <div style={{ flex: "none", padding: "4px 16px 10px" }}><InputBar paneId={paneId} /></div>
    </div>
  );
  const startCol = swapped ? inspectorColumn(true) : filesColumn(true);
  const endCol = swapped ? filesColumn(false) : inspectorColumn(false);
  const startKey: "left" | "right" = swapped ? "right" : "left";
  const endKey: "left" | "right" = swapped ? "left" : "right";
  return (
    <div ref={viewRef} data-editor-view="1" data-pane-id={String(paneId)} data-editor-swapped={swapped ? "1" : "0"} style={{ flex: 1, display: "flex", minHeight: 0, minWidth: 0, background: GROUND, position: "relative" }}>
      <AnchorStrip />
      {startCol}
      {!folded[startKey] && <Handle column={startKey} across={false} onGrab={grab} />}
      <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column", minWidth: EDITOR_SIZES.centreMin, minHeight: 0 }}>
        <Centre paneId={paneId} sessionId={sessionId} tabRow={EDITOR_SIZES.tabRow} />
        {dock === "bottom" && !folded.bottom && <Handle column="bottom" across onGrab={grab} />}
        {folded.bottom ? sill : dock === "bottom" ? terminal : null}
      </div>
      {dock === "right" && !folded.bottom && <Handle column="side" across={false} onGrab={grab} />}
      {dock === "right" && !folded.bottom && terminal}
      {!folded[endKey] && <Handle column={endKey} across={false} onGrab={grab} />}
      {endCol}
    </div>
  );
}
