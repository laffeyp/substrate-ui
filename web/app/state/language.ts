// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Meta's language lens: the stream it reads, its view and the focused lane (sprint 309; plan
// PLAN-2026-11-04-shell-to-react-r5.md, D6). Moved from DCLogic's state (`langStream`, `langView`,
// `langLane`; UI sprints 169, 174). The lens (web/app/LanguageLens.tsx) and DCLogic's keys read and
// write it.

import { createStore } from "../store";
import { LanguageStreamId, LanguageViewMode, type LanguageStreamIdValue, type LanguageViewModeValue } from "../../reveal/language_lens";

export interface LanguageState {
  stream: LanguageStreamIdValue;
  view: LanguageViewModeValue;
  lane: number;
}

// One instance per window, as in shell.ts (sprint 212).
const KEY = "__substrateLanguage";
const scope = globalThis as unknown as Record<string, ReturnType<typeof createStore<LanguageState>> | undefined>;
export const language = scope[KEY] ?? (scope[KEY] = createStore<LanguageState>({ stream: LanguageStreamId.Model, view: LanguageViewMode.Bars, lane: 0 }));

/** Another stream starts at its first lane. */
export function setLanguageStream(stream: LanguageStreamIdValue): void {
  language.set({ stream, lane: 0 });
}

export function setLanguageView(view: LanguageViewModeValue): void {
  language.set({ view });
}

export function setLanguageLane(lane: number): void {
  language.set({ lane });
}
