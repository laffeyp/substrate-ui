// The bar line's settings tail (web/reveal/settings_tail.ts, UI sprint 172).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { settingsTail } from "../settings_tail";
import type { LanguageView } from "../../vm/types";

type Shift = LanguageView["shifts"][number];
const shift = (seq: number, measure: string, direction = "up", stream = "model"): Shift => ({ seq, turn: seq / 10, stream, measure, direction, source_seq: seq - 1 });
const view = (shifts: Shift[], changes: LanguageView["changes"] = []): LanguageView => ({ lines: [], lanes: {}, shifts, changes, last_seq: 500 });
const base = { guidance: "high", length: "full", tone: "blunt", off: false, clearedSeq: -1 };
const text = (segs: { text: string }[]) => segs.map((s) => s.text).join("");

test("each setting is named", () => {
  assert.strictEqual(text(settingsTail({ ...base, language: null })), " · guidance high · length full · tone blunt");
});

test("a shift follows the setting its measure answers to", () => {
  const segs = settingsTail({ ...base, language: view([shift(220, "words"), shift(290, "rate_hedges_hyland")]) });
  assert.strictEqual(text(segs), " · guidance high · length full words ↑ · tone blunt hedges ↑");
  const words = segs.find((s) => s.text === "words ↑")!;
  assert.ok(words.shift);
  assert.strictEqual(words.title, "words up, flagged at turn 22. Length is full; its text asks for more of this.");
});

test("only the replies' shifts since the last setting change, and since /language clear", () => {
  const v = view([shift(100, "words"), shift(220, "rate_hedges_hyland"), shift(230, "words", "up", "user")], [{ seq: 150, turn: 15, field: "length", old: "normal", new: "full" }]);
  assert.strictEqual(text(settingsTail({ ...base, language: v })), " · guidance high · length full · tone blunt hedges ↑");
  assert.strictEqual(text(settingsTail({ ...base, language: v, clearedSeq: 225 })), " · guidance high · length full · tone blunt");
});

test("/language off hides them; more than two in a group collapse to a count", () => {
  const v = view([shift(10, "rate_hedges_hyland"), shift(20, "rate_contractions"), shift(30, "format_exclamations")]);
  assert.strictEqual(text(settingsTail({ ...base, language: v, off: true })), " · guidance high · length full · tone blunt");
  assert.strictEqual(text(settingsTail({ ...base, language: v })), " · guidance high · length full · tone blunt 3 shifts");
});
