// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// What each unbound pane's picker shows (sprint 283; plan PLAN-2026-11-04-shell-to-react-r5.md, C5,
// C6). App owns the picker's state (the armed folder, the lit rows, the open groups) and its actions;
// after each render it writes each unbound pane's view here, rows and handlers included, built with
// web/app/derive/picker.ts and driver_label.ts.
// web/app/PanePicker.tsx draws it.

import { createStore } from "../store";

type Handler = (ev?: unknown) => void;

export interface ChoiceRowView { label: string; meta: string; lit: string; live: boolean; grey: boolean; color: string; greyColor: string; bg: string; pick: Handler; }
export interface WsSessionView { name: string; driver: string; statusLabel: string; dotColor: string; sessionIdShort: string; litAttr: string; bg: string; pick: Handler; }
export interface WsRowView { path: string; meta: string; key: string; c: string; bg: string; litAttr: string; chevron: string; expanded: boolean; sessions: WsSessionView[]; pick: Handler; toggleExpand: Handler; }
export interface ModelRowView { label: string; lit: string; indent: number; color: string; bg: string; cursor: string; chevron: string; liveRow: boolean; greyRow: boolean; pick: Handler; toggleExpand: Handler; }

export interface PickerView {
  pickerDir: string;
  wsListH: string;
  onWsListClick: Handler;
  wsRows: WsRowView[];
  modelArmed: string;
  modelBorderL: string;
  modelBorderT: string;
  modelInnerPos: string;
  modelScrollBottom: string;
  modelMaxH: string;
  modelHeadColor: string;
  modelRows: ModelRowView[];
  guidancePos: string;
  lines: { key: "guidance" | "length" | "tone"; head: string; bottom: string; headColor: string; rows: ChoiceRowView[]; noteClass: string; noteColor: string; note: string }[];
  wsQ: string;
  wsPlaceholder: string;
  onWsQ: (ev: { target: { value: string } }) => void;
  onWsKey: Handler;
}

// One instance per window, as in shell.ts (sprint 212).
const KEY = "__substratePicker";
const scope = globalThis as unknown as Record<string, ReturnType<typeof createStore<{ views: Record<number, PickerView> }>> | undefined>;
export const picker = scope[KEY] ?? (scope[KEY] = createStore<{ views: Record<number, PickerView> }>({ views: {} }));
