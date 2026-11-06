// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// What the panes view draws (sprint 321; plan PLAN-2026-11-04-shell-to-react-r5.md, E2). DCLogic owns
// the panes, the focus and the grid until App does (plan row E4); after each render it writes the
// grid's tracks and gutters and each pane's place, emphasis and kind here, with the focus and gutter
// actions. web/app/PanesView.tsx draws them.

import { createStore } from "../store";

type Handler = (ev?: { preventDefault(): void }) => void;

export interface PaneCellView {
  id: number;
  /** CSS grid placement, "1 / span 2". */
  gridCol: string;
  gridRow: string;
  /** The unfocused panes dim when there are several. */
  opacity: string;
  /** A pane with a session, or bound to a folder, draws the session; an unbound one its picker. */
  session: boolean;
  focus: Handler;
}

export interface PanesView {
  cols: string;
  rows: string;
  /** The transcript's type size, px. */
  fontSize: number;
  panes: PaneCellView[];
  colGutters: { left: string; grab: Handler }[];
  rowGutters: { top: string; grab: Handler }[];
}

// One instance per window, as in shell.ts (sprint 212).
const KEY = "__substratePanes";
const scope = globalThis as unknown as Record<string, ReturnType<typeof createStore<{ view: PanesView | null }>> | undefined>;
export const panes = scope[KEY] ?? (scope[KEY] = createStore<{ view: PanesView | null }>({ view: null }));
