// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Meta's language lens keys (web/app/derive/language_keys.ts, sprint 308).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { EnvelopeKind } from "../../vm/kinds";
import { languageKey, selectedTurn } from "../derive/language_keys";

const ENVS = [
  { seq: 1, kind: EnvelopeKind.SessionStarted, payload: {} },
  { seq: 2, kind: EnvelopeKind.UserMessage, payload: { turn_index: 0 } },
  { seq: 5, kind: EnvelopeKind.ModelReply, payload: {} },
  { seq: 8, kind: EnvelopeKind.UserMessage, payload: { turn_index: 1 } },
  { seq: 9, kind: EnvelopeKind.ModelReply, payload: {} },
];
const TURNS = [{ seq: 2 }, { seq: 8 }];

test("the selected turn is the last message's at or before the seq", () => {
  assert.deepStrictEqual([null, 1, 2, 5, 8, 9].map((sel) => selectedTurn(ENVS, sel)), [null, null, 0, 0, 1, 1]);
});

test("keys: ↑ ↓ between turns from the last with no selection, ← → between lanes, ↵ to the stream", () => {
  assert.deepStrictEqual(languageKey(TURNS, 13, null, 0, "ArrowUp"), { sel: 2 });
  assert.deepStrictEqual(languageKey(TURNS, 13, null, 0, "ArrowDown"), { sel: 8 });
  assert.deepStrictEqual(languageKey(TURNS, 13, 5, 0, "ArrowDown"), { sel: 8 });
  assert.deepStrictEqual(languageKey(TURNS, 13, 5, 0, "ArrowUp"), { sel: 2 });
  assert.deepStrictEqual(languageKey(TURNS, 13, 2, 0, "ArrowLeft"), { lane: 0 });
  assert.deepStrictEqual(languageKey(TURNS, 13, 2, 12, "ArrowRight"), { lane: 12 });
  assert.deepStrictEqual(languageKey(TURNS, 13, 2, 3, "ArrowRight"), { lane: 4 });
  assert.deepStrictEqual(languageKey(TURNS, 13, 2, 3, "Enter"), { toStream: true });
  assert.strictEqual(languageKey([], 13, 2, 3, "Enter"), null);
  assert.strictEqual(languageKey(TURNS, 13, 2, 3, "a"), null);
});
