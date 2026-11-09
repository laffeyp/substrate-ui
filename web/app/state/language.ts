// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Meta's language lens: the stream it reads, its view and the focused lane (sprint 309; plan
// PLAN-2026-11-04-shell-to-react-r5.md, D6). Moved from DCLogic's state (`langStream`, `langView`,
// `langLane`; UI sprints 169, 174). The lens (web/app/LanguageLens.tsx) and App's language keys read
// and write it.

import { createStore } from "../store";
import { LanguageStreamId, LanguageViewMode, type LanguageStreamIdValue, type LanguageViewModeValue } from "../../reveal/language_lens";
import { emit } from "../../vm/instrumentation/sdd";
import { LanguageStreamSetStream, LanguageViewSetView, Signal } from "../../vm/signals.gen";

export interface LanguageState {
  stream: LanguageStreamIdValue;
  view: LanguageViewModeValue;
  lane: number;
}

// One instance per window, as in shell.ts (sprint 212).
const KEY = "__substrateLanguage";
const scope = globalThis as unknown as Record<string, ReturnType<typeof createStore<LanguageState>> | undefined>;
export const language = scope[KEY] ?? (scope[KEY] = createStore<LanguageState>({ stream: LanguageStreamId.Model, view: LanguageViewMode.Bars, lane: 0 }));

/** Each stream and view as the vocabulary names them (v0.24, P-0.24-ACTIONS). */
const STREAM_OF: Record<LanguageStreamIdValue, LanguageStreamSetStream> = {
  [LanguageStreamId.Model]: LanguageStreamSetStream.MODEL,
  [LanguageStreamId.User]: LanguageStreamSetStream.USER,
  [LanguageStreamId.Relation]: LanguageStreamSetStream.RELATION,
};
const VIEW_OF: Record<LanguageViewModeValue, LanguageViewSetView> = {
  [LanguageViewMode.Bars]: LanguageViewSetView.BARS,
  [LanguageViewMode.Deviation]: LanguageViewSetView.DEVIATION,
  [LanguageViewMode.Ribbons]: LanguageViewSetView.RIBBONS,
  [LanguageViewMode.Sides]: LanguageViewSetView.SIDES,
  [LanguageViewMode.Measures]: LanguageViewSetView.MEASURES,
};

/** Another stream starts at its first lane. A change for the meta view of `paneId` is LANGUAGE_STREAM_SET. */
export function setLanguageStream(stream: LanguageStreamIdValue, paneId: number): void {
  const was = language.getSnapshot().stream;
  language.set({ stream, lane: 0 });
  if (stream !== was) emit(Signal.LANGUAGE_STREAM_SET, { stream: STREAM_OF[stream] }, { pane_id: paneId });
}

/** A change of view is LANGUAGE_VIEW_SET. */
export function setLanguageView(view: LanguageViewModeValue, paneId: number): void {
  const was = language.getSnapshot().view;
  language.set({ view });
  if (view !== was) emit(Signal.LANGUAGE_VIEW_SET, { view: VIEW_OF[view] }, { pane_id: paneId });
}

/** A change of focused lane is LANGUAGE_LANE_SET. */
export function setLanguageLane(lane: number, paneId: number): void {
  const was = language.getSnapshot().lane;
  language.set({ lane });
  if (lane !== was) emit(Signal.LANGUAGE_LANE_SET, { lane }, { pane_id: paneId });
}
