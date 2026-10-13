// The language lens laid out from a hand-built language view (web/reveal/language_lens.ts, UI
// sprint 169).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { buildLanguageLens, fmt, fmtSigned, LANE_W, LanguageStreamId, LanguageViewMode, ROW_H, TURN_COL } from "../language_lens";
import { LANGUAGE_MEASURES, LANGUAGE_WATCHED } from "../../vm/language_measures.gen";
import type { LanguageLane, LanguageView } from "../../vm/types";

function lane(values: number[], seqs: number[]): LanguageLane {
  return {
    warmup_span: null, warmup_end_seq: null, mean: null, sd: null,
    points: values.map((v, i) => ({ seq: seqs[i], turn: i, value: v, window: v + 1, deviation: null })),
  };
}

const SEQS = [10, 30, 50];
function view(): LanguageView {
  const lanes: Record<string, LanguageLane> = {};
  for (const m of LANGUAGE_WATCHED) lanes[m] = lane([0, 0, 0], SEQS);
  lanes.words = lane([40, 80, 400], SEQS);
  return {
    lines: SEQS.map((seq, i) => ({ seq, stream: "model", turn: i, values: {}, setting_length: i < 2 ? "normal" : "full" }) as never),
    lanes: { model: lanes, user: {} },
    shifts: [{ seq: 55, turn: 2, stream: "model", measure: "words", direction: "up", source_seq: 50 }],
    changes: [{ seq: 45, turn: 2, field: "length", old: "normal", new: "full" }],
    last_seq: 60,
  };
}

test("one lane per watched measure, in groups", () => {
  const lens = buildLanguageLens(view(), { stream: LanguageStreamId.Model, selTurn: null, lane: 0 });
  assert.deepStrictEqual(lens.lanes.map((l) => l.key), [...LANGUAGE_WATCHED]);
  assert.deepStrictEqual(lens.groups.map((grp) => grp.label), ["LENGTH", "TONE", "GUIDANCE"]);
  assert.strictEqual(lens.width, TURN_COL + LANGUAGE_WATCHED.length * LANE_W);
  assert.strictEqual(lens.lanes[0].explanation, LANGUAGE_MEASURES.words.explanation);
});

test("turns down, the change rule above the turn it applies to", () => {
  const lens = buildLanguageLens(view(), { stream: LanguageStreamId.Model, selTurn: null, lane: 0 });
  assert.deepStrictEqual(lens.rows.map((r) => (r.isRule ? "rule" : r.label)), ["t0", "t1", "rule", "t2"]);
  assert.strictEqual(lens.rows[2].ruleText, "length normal → full · turn 2");
  assert.deepStrictEqual(lens.rows.map((r) => r.top), [0, ROW_H, 2 * ROW_H, 3 * ROW_H]);
  assert.strictEqual(lens.height, 4 * ROW_H);
});

test("the shift mark sits at its reply and names the setting's stated intent", () => {
  const lens = buildLanguageLens(view(), { stream: LanguageStreamId.Model, selTurn: null, lane: 0 });
  const t2 = lens.rows[3];
  assert.strictEqual(t2.cells[0].mark, "▲");
  assert.strictEqual(t2.cells[0].markTitle, "words up, flagged at turn 2. Length is full; its text asks for more of this.");
  assert.ok(lens.rows[1].cells.every((c) => c.mark === ""));
});

test("bars scale to the lane's range and zero draws nothing", () => {
  const lens = buildLanguageLens(view(), { stream: LanguageStreamId.Model, selTurn: null, lane: 0 });
  const words = lens.rows.filter((r) => r.isTurn).map((r) => r.cells[0].barW);
  assert.ok(words[0] < words[1] && words[1] < words[2]);
  assert.strictEqual(lens.rows[0].cells[1].barW, 0);
});

test("the readout is the selected turn's values, the last by default", () => {
  const last = buildLanguageLens(view(), { stream: LanguageStreamId.Model, selTurn: null, lane: 0 });
  assert.strictEqual(last.readout.label, "t2");
  assert.strictEqual(last.readout.cells[0].text, "400 ▲");
  const first = buildLanguageLens(view(), { stream: LanguageStreamId.Model, selTurn: 0, lane: 0 });
  assert.strictEqual(first.readout.cells[0].text, "40");
});

test("one window curve per lane with window values", () => {
  const lens = buildLanguageLens(view(), { stream: LanguageStreamId.Model, selTurn: null, lane: 0 });
  assert.strictEqual(lens.paths.length, LANGUAGE_WATCHED.length);
  assert.match(lens.paths[0].d, /^M[\d.]+ 9 L[\d.]+ 27 L[\d.]+ 63$/);
});

test("no view, and a view with no turns, say so", () => {
  assert.strictEqual(buildLanguageLens(null, { stream: LanguageStreamId.Model, selTurn: null, lane: 0 }).has, false);
  const bare = { ...view(), lanes: { model: {}, user: {} } };
  const lens = buildLanguageLens(bare, { stream: LanguageStreamId.Model, selTurn: null, lane: 0 });
  assert.strictEqual(lens.has, false);
  assert.match(lens.empty, /no measured turns yet/);
});

test("numbers read plainly", () => {
  assert.deepStrictEqual([fmt(0), fmt(412.3), fmt(14.94), fmt(2.25), fmt(0.083), fmt(null)], ["0", "412", "14.9", "2.3", "0.08", "—"]);
});

function viewWithDeviation(): LanguageView {
  const v = view();
  v.lanes.model.words.points = v.lanes.model.words.points.map((p, i) => ({ ...p, deviation: [null, 1.0, 3.5][i] }));
  return v;
}

test("deviation: bars from the lane's centre in warm-up SDs, emphasised past ±2, guides drawn", () => {
  const lens = buildLanguageLens(viewWithDeviation(), { stream: LanguageStreamId.Model, selTurn: null, lane: 0, view: LanguageViewMode.Deviation });
  const turns = lens.rows.filter((r) => r.isTurn).map((r) => r.cells[0]);
  assert.strictEqual(turns[0].barW, 0);
  assert.match(turns[0].title, /No deviation until the warm-up ends\./);
  assert.ok(turns[2].barW > turns[1].barW);
  assert.strictEqual(turns[1].color.length, 9); // the lane colour with alpha: within ±2 SD
  assert.strictEqual(turns[2].color, lens.lanes[0].color); // past +2 SD: full colour
  assert.strictEqual(lens.guides.length, LANGUAGE_WATCHED.length * 3);
  assert.strictEqual(lens.readout.cells[0].text, "+3.5 ▲");
  assert.strictEqual(lens.paths.length, 0);
});

test("deviation is not drawn for the turns stream", () => {
  const lens = buildLanguageLens(view(), { stream: LanguageStreamId.Relation, selTurn: null, lane: 0, view: LanguageViewMode.Deviation });
  assert.strictEqual(lens.has, false);
});

test("ribbons: width is the window, the hairline is the reply's own value, both centred", () => {
  const lens = buildLanguageLens(view(), { stream: LanguageStreamId.Model, selTurn: null, lane: 0, view: LanguageViewMode.Ribbons });
  const cells = lens.rows.filter((r) => r.isTurn).map((r) => r.cells[0]);
  // words: values 40, 80, 400; windows 41, 81, 401 (the fixture adds one).
  assert.ok(cells[0].barW < cells[1].barW && cells[1].barW < cells[2].barW);
  for (const c of cells) {
    assert.ok(Math.abs((c.barLeft + c.barW / 2) - (c.hairLeft + c.hairW / 2)) < 1);
    assert.ok(c.hairW <= c.barW + 1);
  }
});

test("signed numbers", () => {
  assert.deepStrictEqual([fmtSigned(1.74), fmtSigned(-0.92), fmtSigned(0), fmtSigned(null)], ["+1.7", "−0.9", "0.0", "—"]);
});
