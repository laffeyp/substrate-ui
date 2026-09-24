// Sprint 075 — atom-level scroll anchor.
//
// The transcript scroller stays at whichever atom the user is
// reading. When an atom's height changes (tool card open/close,
// ToolProgress chunk lands, streaming pane grows), a
// `useLayoutEffect` reads the anchor atom's current viewport y and
// nudges `scrollTop` by the delta. Content grows below the anchor
// without moving the anchor. Content shrinks below the anchor
// without moving the anchor.
//
// Sticky-bottom kicks in when `anchorSeq === null` — the user has
// scrolled all the way down; new envelopes drop the anchor.
//
// The scroller is discovered once by walking parents from the mount
// div until an ancestor's computed `overflow-y` is `auto` or
// `scroll`. Its `overflow-anchor` is set to `none` so Chromium does
// not run its own anchor and race the hook.

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

export interface ScrollAnchor {
  registerRow: (seq: number, element: HTMLElement | null) => void;
  attachTo: (mount: HTMLElement | null) => void;
}

export function useScrollAnchor(): ScrollAnchor {
  const rowRefs = useRef<Map<number, HTMLElement>>(new Map());
  const anchorSeqRef = useRef<number | null>(null);
  const anchorOffsetRef = useRef<number>(0);
  const scrollerRef = useRef<HTMLElement | null>(null);
  const mountRef = useRef<HTMLElement | null>(null);
  const stickyRef = useRef<boolean>(true);

  const findScroller = useCallback((mount: HTMLElement): HTMLElement | null => {
    let node: HTMLElement | null = mount.parentElement;
    while (node) {
      const style = window.getComputedStyle(node);
      if (style.overflowY === "auto" || style.overflowY === "scroll") return node;
      node = node.parentElement;
    }
    return null;
  }, []);

  const updateAnchor = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    // Always pick the topmost-visible row as anchor. Sticky-bottom is
    // dc-runtime's job (reveal.ts:135-155); the atom hook only pins
    // whichever row the user is reading against height changes below
    // it. Clearing the anchor at scroll-bottom lets card expansion
    // jerk the header up by the added height — that's the caret_pin
    // regression this hook exists to prevent.
    stickyRef.current = false;
    // The anchor is the row that straddles the top of the viewport:
    // the row with the largest offset that is still ≤ 0 (its top edge
    // sits at or above the scroller's top edge, its bottom below).
    // A tool card whose header sits just inside the viewport has its
    // row wrapper's top slightly above the scroller top due to inline
    // margin; picking "smallest offset ≥ 0" would skip that card and
    // land on the next row down, so a click that expands the straddling
    // card would push its below-neighbour down and this hook would
    // drag scrollTop up to keep it — moving the clicked header off.
    const scrollerTop = scroller.getBoundingClientRect().top;
    let bestSeq: number | null = null;
    let bestOffset = Number.NEGATIVE_INFINITY;
    let fallbackSeq: number | null = null;
    let fallbackOffset = Number.POSITIVE_INFINITY;
    for (const [seq, element] of rowRefs.current) {
      const offset = element.getBoundingClientRect().top - scrollerTop;
      if (offset <= 0 && offset > bestOffset) {
        bestSeq = seq;
        bestOffset = offset;
      }
      if (offset > 0 && offset < fallbackOffset) {
        fallbackSeq = seq;
        fallbackOffset = offset;
      }
    }
    const pickSeq = bestSeq !== null ? bestSeq : fallbackSeq;
    const pickOffset = bestSeq !== null ? bestOffset : fallbackOffset;
    if (pickSeq !== null) {
      anchorSeqRef.current = pickSeq;
      anchorOffsetRef.current = pickOffset;
    }
  }, []);

  const restoreAnchor = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    // No anchor means the user hasn't scrolled away from wherever
    // the scroller started, so leave scrollTop alone. The dc-runtime
    // sticky-bottom autoscroll in reveal.ts:117-138 handles the
    // "keep at bottom on new envelopes" case; the anchor here only
    // holds a user-picked scroll position across atom height changes.
    if (anchorSeqRef.current === null) return;
    const anchor = rowRefs.current.get(anchorSeqRef.current);
    if (!anchor) return;
    const scrollerTop = scroller.getBoundingClientRect().top;
    const currentOffset = anchor.getBoundingClientRect().top - scrollerTop;
    const delta = currentOffset - anchorOffsetRef.current;
    if (delta !== 0) scroller.scrollTop += delta;
  }, []);

  const listenerRef = useRef<((event: Event) => void) | null>(null);
  const attachTo = useCallback((mount: HTMLElement | null) => {
    mountRef.current = mount;
    if (!mount) {
      if (scrollerRef.current && listenerRef.current) {
        scrollerRef.current.removeEventListener("scroll", listenerRef.current);
      }
      scrollerRef.current = null;
      listenerRef.current = null;
      return;
    }
    if (scrollerRef.current) return;
    const scroller = findScroller(mount);
    if (!scroller) return;
    scrollerRef.current = scroller;
    scroller.style.overflowAnchor = "none";
    const handler = (): void => updateAnchor();
    listenerRef.current = handler;
    scroller.addEventListener("scroll", handler, { passive: true });
    // Seed the anchor once so the first click after mount pins,
    // even if no user scroll has fired yet.
    updateAnchor();
  }, [findScroller, updateAnchor]);

  // Restore on every commit. `useLayoutEffect` runs after DOM writes
  // and before paint, so the correction is invisible to the user.
  useLayoutEffect(() => {
    restoreAnchor();
  });

  const registerRow = useCallback((seq: number, element: HTMLElement | null) => {
    if (element) rowRefs.current.set(seq, element);
    else rowRefs.current.delete(seq);
  }, []);

  return { registerRow, attachTo };
}
