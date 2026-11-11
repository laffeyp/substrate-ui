// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The one-line notes beside each session control's choices (sprint 258; plan
// PLAN-2026-11-04-shell-to-react-r5.md, C1). The levels, positions and defaults are generated from the
// kernel (web/vm/controls.gen.ts); only these notes are the UI's own. Moved from reveal_component.ts
// (UI sprints 143, 161), where the pane picker's choice lines and the slash menu both read them.

import { LengthPosition, TonePosition } from "../../vm/controls.gen";

/** The input bar's placeholder; a run's pane shows why it takes no typing instead (UI sprint 182). */
export const INPUT_HINT = "type to input · / for commands · ↵ to send";
/** Sprint 458 (24k's terminal header; D40, a hint is a tooltip): how a thing is added to the message. */
export const ADD_HINT = "⌥-click or drag to add · right-click › Add to message · ⌥A adds the selection · ⌫ removes the last chip";

export const GUIDANCE_AUTO_META = "follows the model";
export const GUIDANCE_META: Record<string, string> = { harness: "loop rules only", low: "one line a rule", medium: "rules, no examples", high: "the full standard" };

export const LENGTH_META: Record<string, string> = {
  [LengthPosition.TERSE]: "the answer and its facts",
  [LengthPosition.NORMAL]: "as the guidance has it",
  [LengthPosition.FULL]: "complete, not padded",
};

export const TONE_META: Record<string, string> = {
  [TonePosition.BLUNT]: "plain judgements, no softening",
  [TonePosition.NEUTRAL]: "as the guidance has it",
  [TonePosition.FORMAL]: "for readers outside the conversation",
  [TonePosition.DRY]: "understated and factual",
};

/** The notes the slash menu shows beside a command's choices, by command name. */
export const CHOICE_NOTES: Record<string, Record<string, string>> = {
  guidance: { auto: GUIDANCE_AUTO_META, ...GUIDANCE_META },
  length: LENGTH_META,
  tone: TONE_META,
};
