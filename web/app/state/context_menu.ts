// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The window's right-click menu (sprint 457; roadmap r13 E10.4; D94: "right-click › Add to message"). Drawn in the
// page, not by Electron's Menu.popup, so the gates see and screenshot it (BLACKBOARD 2026-11-11). A source calls
// `openMenu` from its contextmenu event with its items; the menu opens at the pointer and takes the focus, and the
// focus goes back where it was when an item is picked or Escape closes it. ↑ ↓ ↵ reach `menuKey` and Escape
// reaches `closeMenu` through the key map (`menuOpen`), so Escape on an open menu never interrupts a turn. A press
// outside it or the window losing focus closes it (ContextMenu.tsx). Each opening is one CONTEXT_MENU_OPENED and
// each end one CONTEXT_MENU_CLOSED.

import { createStore } from "../store";
import { emit as emitSignal } from "../../vm/instrumentation/sdd";
import { ContextMenuClosedOutcome, type ContextMenuOpenedSource, Signal } from "../../vm/signals.gen";

/** One item: its words, what it acts on (the chip's label, drawn dim beside it), and what it does. */
export interface MenuItem { label: string; detail?: string; run(): void }

export interface MenuState {
  open: boolean;
  /** Where the pointer was, in the window's pixels. */
  x: number;
  y: number;
  source: ContextMenuOpenedSource | null;
  items: MenuItem[];
  /** The lit item; -1 with none, as a macOS menu opens. */
  lit: number;
  paneId: number | null;
}

const CLOSED: MenuState = { open: false, x: 0, y: 0, source: null, items: [], lit: -1, paneId: null };
export const contextMenu = createStore<MenuState>(CLOSED);

/** The element that had the focus when the menu opened, looked for through shadow roots (the code's editor
 *  lives in one), so the focus goes back to the code itself. */
let returnTo: HTMLElement | null = null;
function deepActive(): HTMLElement | null {
  let el: Element | null = document.activeElement;
  while (el && el.shadowRoot && el.shadowRoot.activeElement) el = el.shadowRoot.activeElement;
  return el instanceof HTMLElement ? el : null;
}

export function menuOpen(): boolean { return contextMenu.getSnapshot().open; }

/** A source's right-click: the page's own menu cancelled, ours drawn at the pointer. */
export function openMenu(ev: { clientX: number; clientY: number; preventDefault(): void; stopPropagation?(): void }, source: ContextMenuOpenedSource, items: MenuItem[], paneId: number | null = null): void {
  ev.preventDefault();
  ev.stopPropagation?.();
  if (!items.length) return;
  if (menuOpen()) closeMenu(ContextMenuClosedOutcome.OUTSIDE);
  returnTo = deepActive();
  contextMenu.set({ open: true, x: ev.clientX, y: ev.clientY, source, items, lit: -1, paneId });
  emitSignal(Signal.CONTEXT_MENU_OPENED, { source, items: items.length }, paneId === null ? undefined : { pane_id: paneId });
}

/** The menu closed. Escape and a pick give the focus back; a press outside or the window's blur leave it where
 *  that put it. */
export function closeMenu(outcome: ContextMenuClosedOutcome): void {
  const was = contextMenu.getSnapshot();
  if (!was.open) return;
  contextMenu.set(CLOSED);
  emitSignal(Signal.CONTEXT_MENU_CLOSED, { outcome }, was.paneId === null ? undefined : { pane_id: was.paneId });
  const back = returnTo;
  returnTo = null;
  if ((outcome === ContextMenuClosedOutcome.PICKED || outcome === ContextMenuClosedOutcome.ESCAPE) && back && back.isConnected) back.focus({ preventScroll: true });
}

/** An item picked by a click or ↵: the menu closes first, then the item runs. */
export function pickMenu(index: number): void {
  const item = contextMenu.getSnapshot().items[index];
  if (!item) return;
  closeMenu(ContextMenuClosedOutcome.PICKED);
  item.run();
}

/** ↑ ↓ light the items, wrapping; ↵ picks the lit one, and does nothing with none lit. */
export function menuKey(key: string): void {
  const s = contextMenu.getSnapshot();
  if (!s.open || !s.items.length) return;
  const n = s.items.length;
  if (key === "ArrowDown") contextMenu.set({ lit: s.lit < 0 ? 0 : (s.lit + 1) % n });
  else if (key === "ArrowUp") contextMenu.set({ lit: s.lit < 0 ? n - 1 : (s.lit - 1 + n) % n });
  else if (key === "Enter" && s.lit >= 0) pickMenu(s.lit);
}

/** The pointer moving over an item lights it, as in a native menu. */
export function lightMenu(index: number): void { if (contextMenu.getSnapshot().lit !== index) contextMenu.set({ lit: index }); }
