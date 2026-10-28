// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The meta view's stream follows the bottom until the user scrolls up (UI sprint 158): the
// transcript's rule (useScrollAnchor, sprint 102) for a list dc-runtime draws, which has no rows
// registered with React. At the bottom (within STICK_PX), new rows scroll into view; scrolled up,
// the view stays where it is; back at the bottom, it follows again. Rows are only appended below,
// so holding scrollTop holds the row being read.

import { STICK_PX } from "./scroll_stick";

const attached = new WeakSet<HTMLElement>();

export function followBottom(scroller: HTMLElement): void {
  if (attached.has(scroller)) return;
  attached.add(scroller);
  let following = true;
  let own = -1; // the scrollTop this module last wrote, so its scroll event is not the user's
  const toBottom = () => {
    if (!following || scroller.clientHeight === 0) return;
    scroller.scrollTop = scroller.scrollHeight;
    own = scroller.scrollTop;
  };
  scroller.addEventListener("scroll", () => {
    if (scroller.clientHeight === 0) return;
    if (scroller.scrollTop === own) return;
    following = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <= STICK_PX;
  }, { passive: true });
  new MutationObserver(toBottom).observe(scroller, { childList: true, subtree: true, characterData: true });
  new ResizeObserver(toBottom).observe(scroller);
  toBottom();
}
