// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The window's open view (sprint 346; plan process/planning/2026-11-05-editor-shared-work/, item 0(a)):
// one field naming what the window shows, `panes`, `meta` or a page (records, assays, studio), and the
// view a page returns to when it closes. It replaces App's `revealed` and `surface` pair with the same
// transitions, one for one, so the editor view (round 11) can be one more value. A refactor: nothing a
// user sees or does changes.

import { Surface } from "../../vm/kinds";

export type Page = (typeof Surface)[keyof typeof Surface];
export type Base = "panes" | "meta";
export type OpenView = Base | Page;

export interface ViewState {
  view: OpenView;
  /** The view a page returns to, and the view itself when no page is open. */
  base: Base;
}

export const START: ViewState = { view: "panes", base: "panes" };

const isBase = (v: OpenView): v is Base => v === "panes" || v === "meta";

/** The page open over the base view, if any. */
export function pageOf(st: ViewState): Page | null {
  return isBase(st.view) ? null : st.view;
}

/** Meta is the base view (a page may be open over it): what `revealed` said. */
export function metaBase(st: ViewState): boolean {
  return st.base === "meta";
}

/** ⌘M, View ▸ Meta and the top bar's view button: panes and meta swap and any page closes. */
export function toggleMeta(st: ViewState): ViewState {
  const base: Base = st.base === "meta" ? "panes" : "meta";
  return { view: base, base };
}

/** A page's key or button opens it over the base view, or closes it when it is the open page. */
export function togglePage(st: ViewState, page: Page): ViewState {
  return pageOf(st) === page ? { view: st.base, base: st.base } : { view: page, base: st.base };
}

/** Escape, and a session opened from the records page: the page closes and the base view shows. */
export function closePage(st: ViewState): ViewState {
  return { view: st.base, base: st.base };
}

/** A split, and the design tool's `view` prop: panes or meta, with no page. */
export function show(base: Base): ViewState {
  return { view: base, base };
}
