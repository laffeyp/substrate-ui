// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Meta's language lens: which turn the selection is in, and the lens's keys (sprint 308; plan
// PLAN-2026-11-04-shell-to-react-r5.md, D6). Moved from reveal_component.ts (renderVals'
// `_langSelTurn`, the keydown handler's language block; UI sprint 169).
//
// The selection is a seq, shared with the stream: the lens lights the turn whose UserMessage is the
// last at or before it. ↑ ↓ move between turns, ← → between lanes, ↵ opens the turn in the stream.

import { EnvelopeKind } from "../../vm/kinds";
import type { RawEnvelope } from "./stream";

/** The turn index of the last UserMessage at or before `sel`; null with no selection or none before it. */
export function selectedTurn(envs: readonly RawEnvelope[], sel: number | null): number | null {
  if (sel === null) return null;
  let turn: number | null = null;
  for (const env of envs) {
    if (env.seq > sel) break;
    if (env.kind === EnvelopeKind.UserMessage && env.payload) turn = Number(env.payload.turn_index);
  }
  return turn;
}

export type LanguageStep = { sel: number } | { lane: number } | { toStream: true } | null;

/** A key in the lens. With no selection the lens shows the last turn, so ↑ ↓ start there. */
export function languageKey(turns: readonly { seq: number }[], laneCount: number, sel: number | null, lane: number, key: string): LanguageStep {
  if (!turns.length) return null;
  let at = turns.length - 1;
  if (sel !== null) { at = 0; turns.forEach((t, i) => { if (t.seq <= sel) at = i; }); }
  if (key === "ArrowUp") return { sel: turns[Math.max(0, at - 1)].seq };
  if (key === "ArrowDown") return { sel: turns[Math.min(turns.length - 1, at + 1)].seq };
  if (key === "ArrowLeft") return { lane: Math.max(0, lane - 1) };
  if (key === "ArrowRight") return { lane: Math.min(Math.max(1, laneCount) - 1, lane + 1) };
  if (key === "Enter") return { toStream: true };
  return null;
}
