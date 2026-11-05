// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// What the top bar shows, and what its controls do (sprint 228; plan
// PLAN-2026-11-04-shell-to-react-r5.md, B3).
//
// The bar shows the focused pane: its status dot, its name, its driver and workspace chips and their
// cards, and the records and view buttons. DCLogic owns the panes, the open page and the view until
// they move (plan group E), so it computes these fields after each render and writes them here, and
// it registers the actions the bar's controls call. The React bar (web/app/TopBar.tsx) draws them.

import { createStore } from "../store";

export interface TopBarState {
  /** The status dot's fill and ring. */
  dotBg: string;
  dot: string;
  /** The focused session's name, with the open page after it ("pane-1 › records"). */
  crumb: string;
  /** The name is being edited; `nameVal` is the name it starts from. */
  editing: boolean;
  nameVal: string;
  /** The driver and workspace chips show in every view but the pages. */
  showChips: boolean;
  /** The driver chip shows once the pane has a driver. */
  showDriverChip: boolean;
  driverName: string;
  modelCardOpen: boolean;
  /** The model card's lines. Flat fields, so a write that changes nothing notifies no one. */
  model: string;
  modelVersion: string;
  guidance: string;
  length: string;
  tone: string;
  wsLabel: string;
  wsCardOpen: boolean;
  workspace: string;
  shape: string;
  branch: string;
  escHint: string;
  recordsColor: string;
  revealLabel: string;
  revealColor: string;
  revealBg: string;
}

export interface TopBarActions {
  startEdit(): void;
  /** Ends the edit; a name renames the session, null cancels. */
  finishEdit(name: string | null): void;
  toggleModelCard(): void;
  toggleWsCard(): void;
  openRecords(): void;
  toggleReveal(): void;
}

const INITIAL: TopBarState = {
  dotBg: "transparent", dot: "#4a4e55", crumb: "", editing: false, nameVal: "",
  showChips: true, showDriverChip: false, driverName: "",
  modelCardOpen: false, model: "—", modelVersion: "default", guidance: "auto", length: "", tone: "",
  wsLabel: "⌥ —", wsCardOpen: false, workspace: "", shape: "", branch: "",
  escHint: "", recordsColor: "#9aa0a8", revealLabel: "meta", revealColor: "#9aa0a8", revealBg: "#3d434c",
};

const NO_ACTIONS: TopBarActions = {
  startEdit() {}, finishEdit() {}, toggleModelCard() {}, toggleWsCard() {}, openRecords() {}, toggleReveal() {},
};

// One instance per window, as in shell.ts (sprint 212).
interface Shared { store: ReturnType<typeof createStore<TopBarState>>; actions: { current: TopBarActions }; }
const KEY = "__substrateTopBar";
const scope = globalThis as unknown as Record<string, Shared | undefined>;
const shared: Shared = scope[KEY] ?? (scope[KEY] = { store: createStore<TopBarState>(INITIAL), actions: { current: NO_ACTIONS } });

export const topBar = shared.store;

/** DCLogic registers its actions at mount; the returned function removes them. */
export function setTopBarActions(actions: TopBarActions): () => void {
  shared.actions.current = actions;
  return () => { if (shared.actions.current === actions) shared.actions.current = NO_ACTIONS; };
}

export function topBarActions(): TopBarActions {
  return shared.actions.current;
}
