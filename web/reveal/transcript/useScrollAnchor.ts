// Transcript scroll: the one owner (UI sprint 102).
//
// Two behaviours, the ones the Architect asked for on 2026-09-15 (`83b20bd`) and that went
// missing on 2026-09-24 when Sprint 076 deleted reveal.ts's autoscroll as "superseded" by
// this hook, which did not follow the bottom at all:
//
//   following — the user is at the bottom (within STICK_PX): new content scrolls into view;
//   reading   — the user has scrolled up: the row at the top of the view stays exactly where
//               it is while content grows or shrinks around it;
//   pinned    — the user clicked a card's header (a <summary>): that header stays exactly where
//               it is while the card opens or closes, in either mode (Sprint 075's caret pin).
//               While pinned, the transcript keeps at least the height it had at the click
//               (bottom padding), so closing a card near the end cannot make the browser clamp
//               scrollTop and drag the header: caret_pin failed 1 run in 3-4 since before sprint
//               102 for exactly that (914 → 696 px of content in a 246 px view, scrollTop clamped
//               from 457 to 450). The padding goes when the user scrolls.
//
// Scrolling back to the bottom resumes following. The mode and position are saved per pane per
// view (`key`), so switching terminal ↔ reveal, or the root remounting when dc-runtime clears
// its mount div, comes back to the same place.
//
// The scroller is the nearest ancestor of the mount div with overflow-y auto|scroll. Its
// `overflow-anchor` is set to `none` so Chromium's own anchoring does not race this hook.

import { useCallback, useLayoutEffect, useRef } from "react";

export interface ScrollAnchor {
  registerRow: (seq: number, element: HTMLElement | null) => void;
  attachTo: (mount: HTMLElement | null) => void;
}

/** Distance from the bottom, in px, that still counts as "at the bottom". */
export const STICK_PX = 24;

interface Saved { scrollTop: number; following: boolean }
const savedByKey = new Map<string, Saved>();

export function useScrollAnchor(key: string): ScrollAnchor {
  const rowRefs = useRef<Map<number, HTMLElement>>(new Map());
  const anchorSeqRef = useRef<number | null>(null);
  const anchorOffsetRef = useRef<number>(0);
  const scrollerRef = useRef<HTMLElement | null>(null);
  const followingRef = useRef<boolean>(savedByKey.get(key)?.following ?? true);
  const cleanupRef = useRef<(() => void) | null>(null);
  // The clicked header and its viewport offset; held until the user scrolls.
  const pinRef = useRef<{ el: HTMLElement; offset: number; height: number } | null>(null);
  const mountRef = useRef<HTMLElement | null>(null);
  // scrollTop values this hook wrote, so their scroll events are not read as the user's.
  const ownWritesRef = useRef<Set<number>>(new Set());

  const findScroller = useCallback((mount: HTMLElement): HTMLElement | null => {
    let node: HTMLElement | null = mount.parentElement;
    while (node) {
      const style = window.getComputedStyle(node);
      if (style.overflowY === "auto" || style.overflowY === "scroll") return node;
      node = node.parentElement;
    }
    return null;
  }, []);

  // The anchor is the row straddling the top of the viewport: the largest offset still ≤ 0
  // (a tool card's wrapper sits slightly above its header, so "smallest offset ≥ 0" would
  // pick the row below the card the user is looking at). Fallback: the first row below.
  const updateAnchor = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const scrollerTop = scroller.getBoundingClientRect().top;
    let bestSeq: number | null = null;
    let bestOffset = Number.NEGATIVE_INFINITY;
    let fallbackSeq: number | null = null;
    let fallbackOffset = Number.POSITIVE_INFINITY;
    for (const [seq, element] of rowRefs.current) {
      const offset = element.getBoundingClientRect().top - scrollerTop;
      if (offset <= 0 && offset > bestOffset) { bestSeq = seq; bestOffset = offset; }
      if (offset > 0 && offset < fallbackOffset) { fallbackSeq = seq; fallbackOffset = offset; }
    }
    const pickSeq = bestSeq !== null ? bestSeq : fallbackSeq;
    if (pickSeq !== null) {
      anchorSeqRef.current = pickSeq;
      anchorOffsetRef.current = bestSeq !== null ? bestOffset : fallbackOffset;
    }
  }, []);

  // Put the view where the mode says: the bottom when following, the anchor row's old
  // viewport offset when reading. A hidden scroller (clientHeight 0) is left alone.
  const write = useCallback((scroller: HTMLElement, top: number) => {
    const before = scroller.scrollTop;
    scroller.scrollTop = top;
    if (scroller.scrollTop !== before) ownWritesRef.current.add(scroller.scrollTop);
  }, []);

  const settle = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller || scroller.clientHeight === 0) return;
    const pin = pinRef.current;
    if (pin && pin.el.isConnected) {
      const mount = mountRef.current;
      if (mount) {
        const pad = parseFloat(mount.style.paddingBottom || "0") || 0;
        const need = Math.max(0, pin.height - (scroller.scrollHeight - pad));
        if (need !== pad) mount.style.paddingBottom = need ? `${need}px` : "";
      }
      const delta = pin.el.getBoundingClientRect().top - scroller.getBoundingClientRect().top - pin.offset;
      if (delta !== 0) write(scroller, scroller.scrollTop + delta);
      return;
    }
    if (followingRef.current) {
      write(scroller, scroller.scrollHeight);
      return;
    }
    if (anchorSeqRef.current === null) return;
    const anchor = rowRefs.current.get(anchorSeqRef.current);
    if (!anchor) return;
    const delta = anchor.getBoundingClientRect().top - scroller.getBoundingClientRect().top - anchorOffsetRef.current;
    if (delta !== 0) write(scroller, scroller.scrollTop + delta);
  }, [write]);

  const onScroll = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller || scroller.clientHeight === 0) return; // hidden: keep the saved state
    if (ownWritesRef.current.delete(scroller.scrollTop)) return; // this hook moved it, not the user
    ownWritesRef.current.clear();
    if (pinRef.current) {
      pinRef.current = null; // the user scrolled: the clicked header is no longer held
      if (mountRef.current) mountRef.current.style.paddingBottom = "";
    }
    const following = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <= STICK_PX;
    followingRef.current = following;
    savedByKey.set(key, { scrollTop: scroller.scrollTop, following });
    updateAnchor();
  }, [key, updateAnchor]);

  const attachTo = useCallback((mount: HTMLElement | null) => {
    if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null; }
    scrollerRef.current = null;
    mountRef.current = mount;
    if (!mount) return;
    const scroller = findScroller(mount);
    if (!scroller) return;
    scrollerRef.current = scroller;
    scroller.style.overflowAnchor = "none";
    // Restore this pane+view's saved place. The ref fires after the rows are in the DOM.
    const saved = savedByKey.get(key);
    if (saved && !saved.following) {
      followingRef.current = false;
      scroller.scrollTop = saved.scrollTop;
    } else {
      followingRef.current = true;
      scroller.scrollTop = scroller.scrollHeight;
    }
    updateAnchor();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    // A click on a card header pins it before the card opens or closes (capture: before the
    // <details> toggles and the layout changes).
    const onClick = (event: Event): void => {
      const summary = (event.target as HTMLElement | null)?.closest?.("summary");
      if (!summary || !mount.contains(summary)) return;
      pinRef.current = {
        el: summary as HTMLElement,
        offset: summary.getBoundingClientRect().top - scroller.getBoundingClientRect().top,
        height: scroller.scrollHeight,
      };
    };
    mount.addEventListener("click", onClick, true);
    // Content that grows outside a React commit (a card opened, a font loaded) and a scroller
    // that changes size (window resize, a view shown again) both settle the view.
    let lastHeight = scroller.clientHeight;
    const observer = new ResizeObserver(() => {
      const wasHidden = lastHeight === 0;
      lastHeight = scroller.clientHeight;
      if (wasHidden && lastHeight > 0) {
        const back = savedByKey.get(key);
        if (back && !back.following) { scroller.scrollTop = back.scrollTop; updateAnchor(); return; }
      }
      settle();
    });
    observer.observe(scroller);
    observer.observe(mount);
    cleanupRef.current = () => {
      scroller.removeEventListener("scroll", onScroll);
      mount.removeEventListener("click", onClick, true);
      observer.disconnect();
    };
  }, [findScroller, key, onScroll, settle, updateAnchor, write]);

  // Every commit (new rows, streaming text) settles before paint.
  useLayoutEffect(() => { settle(); });

  const registerRow = useCallback((seq: number, element: HTMLElement | null) => {
    if (element) rowRefs.current.set(seq, element);
    else rowRefs.current.delete(seq);
  }, []);

  return { registerRow, attachTo };
}
