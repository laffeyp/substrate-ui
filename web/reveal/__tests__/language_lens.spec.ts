// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The language lens laid out from a hand-built language view (web/reveal/language_lens.ts, UI
// sprint 169).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { buildLanguageLens, fmt, fmtSigned, LANE_W, languageView, languageViewTabs, LanguageStreamId, LanguageViewMode, niceCeil, ROW_H, TURN_COL } from "../language_lens";
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

test("bars scale to the lane's highest value so far and zero draws nothing", () => {
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

test("turns offer side by side and measures; a view the stream lacks falls back to its first", () => {
  assert.deepStrictEqual(languageViewTabs(LanguageStreamId.Relation), [LanguageViewMode.Sides, LanguageViewMode.Measures]);
  assert.deepStrictEqual(languageViewTabs(LanguageStreamId.Model), [LanguageViewMode.Bars, LanguageViewMode.Deviation, LanguageViewMode.Ribbons]);
  assert.strictEqual(languageView(LanguageStreamId.Relation, LanguageViewMode.Deviation), LanguageViewMode.Sides);
  assert.strictEqual(languageView(LanguageStreamId.Model, LanguageViewMode.Measures), LanguageViewMode.Bars);
});

test("ribbons: width is the window, the hairline is the reply's own value, both centred", () => {
  const lens = buildLanguageLens(view(), { stream: LanguageStreamId.Model, selTurn: null, lane: 0, view: LanguageViewMode.Ribbons });
  const cells = lens.rows.filter((r) => r.isTurn).map((r) => r.cells[0]);
  // words: values 40, 80, 400; windows 41, 81, 401 (the fixture adds one).
  assert.ok(cells[0].barW < cells[1].barW && cells[1].barW < cells[2].barW);
  // The lane's top is 500 (401 rounded up); the hairline is the reply's value on it.
  assert.deepStrictEqual(cells.map((c) => c.hairW), [40, 80, 400].map((x) => Math.round((x / 500) * (LANE_W - 14))));
  for (const c of cells) assert.ok(Math.abs((c.barLeft + c.barW / 2) - (c.hairLeft + c.hairW / 2)) < 1);
});

test("signed numbers", () => {
  assert.deepStrictEqual([fmtSigned(1.74), fmtSigned(-0.92), fmtSigned(0), fmtSigned(null)], ["+1.7", "−0.9", "0.0", "—"]);
});

// UI sprint 173: each lane runs from zero to its highest value or window so far, rounded up.
const BAR_MAX = LANE_W - 14;

test("round tops", () => {
  assert.deepStrictEqual([0, 0.3, 1, 7, 12, 22.2, 44.4, 401].map(niceCeil), [0, 0.5, 1, 10, 20, 25, 50, 500]);
});

test("a lane above its catalog range scales to its own values and never sits at full width", () => {
  const v = view();
  v.lanes.model.rate_kobak_style = lane([44.4, 42.3, 24.4], SEQS); // windows add one: 45.4 at most
  const lens = buildLanguageLens(v, { stream: LanguageStreamId.Model, selTurn: null, lane: 0 });
  const i = lens.lanes.findIndex((l) => l.key === "rate_kobak_style");
  assert.strictEqual(lens.lanes[i].top, 50);
  const widths = lens.rows.filter((r) => r.isTurn).map((r) => r.cells[i].barW);
  assert.deepStrictEqual(widths, [44.4, 42.3, 24.4].map((x) => Math.round((x / 50) * BAR_MAX)));
  assert.ok(widths.every((width) => width < BAR_MAX) && widths[2] < widths[0]);
  assert.match(lens.lanes[i].scaleTitle, /^A full bar is 50 per 1,000 words/);
  assert.strictEqual(lens.lanes[i].unit, "per 1k words");
  const ribbons = buildLanguageLens(v, { stream: LanguageStreamId.Model, selTurn: null, lane: 0, view: LanguageViewMode.Ribbons });
  const rw = ribbons.rows.filter((r) => r.isTurn).map((r) => r.cells[i].barW);
  assert.ok(rw.every((width) => width < BAR_MAX) && rw[2] < rw[0]);
});

test("an all-zero lane has no scale and says so; the header names the unit", () => {
  const v = view();
  v.lanes.model.format_list_items.points = v.lanes.model.format_list_items.points.map((p) => ({ ...p, value: 0, window: 0 }));
  const lens = buildLanguageLens(v, { stream: LanguageStreamId.Model, selTurn: null, lane: 0 });
  const zero = lens.lanes.find((l) => l.key === "format_list_items")!;
  assert.strictEqual(zero.top, 0);
  assert.strictEqual(zero.scaleTitle, "Every value so far is zero.");
  assert.strictEqual(zero.unit, "per 1k words");
  assert.strictEqual(lens.paths.length, LANGUAGE_WATCHED.length - 1); // no window curve on a lane with no scale
});

test("a divider at each lane's left edge, stronger where a group starts", () => {
  const lens = buildLanguageLens(view(), { stream: LanguageStreamId.Model, selTurn: null, lane: 0 });
  assert.deepStrictEqual(lens.dividers.map((d) => d.left), lens.lanes.map((l) => l.left - 3));
  const strong = lens.dividers.map((d, i) => (d.color.endsWith(".10)") ? LANGUAGE_MEASURES[lens.lanes[i].key].group : null)).filter(Boolean);
  assert.deepStrictEqual(strong, ["length", "tone", "guidance"]);
});

test("deviation before the warm-up says when it starts and how far the session is", () => {
  const lens = buildLanguageLens(view(), { stream: LanguageStreamId.Model, selTurn: null, lane: 0, view: LanguageViewMode.Deviation });
  assert.strictEqual(lens.note, "Deviation starts when a lane's warm-up ends: 20 replies whose values vary. This session has 3 so far.");
  assert.strictEqual(buildLanguageLens(view(), { stream: LanguageStreamId.Model, selTurn: null, lane: 0 }).note, "");
});

// UI sprint 174: the turns stream.
function turnsView(): LanguageView {
  const v = view();
  v.lanes.user = Object.fromEntries(LANGUAGE_WATCHED.map((m) => [m, lane([0, 0, 0], [5, 25, 45])]));
  v.lanes.user.words = lane([9, 12, 30], [5, 25, 45]);
  const rel = (seq: number, turn: number, values: Record<string, number | null>) => ({ seq, stream: "relation", turn, pairing: "final", values });
  const win = (seq: number, stream: string, words: number) => ({ seq, stream, values: { text: {}, window: { words } } });
  v.lines = [
    win(5, "user", 9), win(10, "model", 40), rel(11, 0, { length_ratio: 4.4, lexical_echo: 0.5, window_lsm: null }),
    win(25, "user", 21), win(30, "model", 120), rel(31, 1, { length_ratio: 6.7, lexical_echo: 0.6, window_lsm: null }),
    win(45, "user", 51), win(50, "model", 520), rel(51, 2, { length_ratio: 13.3, lexical_echo: 0.4, window_lsm: null }),
  ] as never;
  return v;
}

test("side by side: the message left of centre, the reply right, one scale for both", () => {
  const lens = buildLanguageLens(turnsView(), { stream: LanguageStreamId.Relation, selTurn: null, lane: 0 });
  assert.deepStrictEqual(lens.lanes.map((l) => l.key), [...LANGUAGE_WATCHED]);
  const words = lens.lanes[0];
  assert.strictEqual(words.top, 500); // the reply's 400 is the highest of either side
  const half = (LANE_W - 14) / 2 - 1;
  const cells = lens.rows.filter((r) => r.isTurn).map((r) => r.cells[0]);
  assert.deepStrictEqual(cells.map((c) => c.barW), [9, 12, 30].map((x) => Math.max(1, Math.round((x / 500) * half))));
  assert.deepStrictEqual(cells.map((c) => c.bar2W), [40, 80, 400].map((x) => Math.round((x / 500) * half)));
  const cx = words.left + 6 + (LANE_W - 14) / 2;
  for (const c of cells) {
    assert.strictEqual(c.barLeft + c.barW, cx - 1);
    assert.strictEqual(c.bar2Left, cx + 1);
  }
  assert.strictEqual(lens.readout.cells[0].text, "30 · 400");
  assert.match(lens.note, /message left of the centre line, the reply right/);
});

test("measures: the pair measures in the palette's colours, grouped LENGTH, ECHO, STYLE", () => {
  const lens = buildLanguageLens(turnsView(), { stream: LanguageStreamId.Relation, selTurn: null, lane: 0, view: LanguageViewMode.Measures });
  assert.deepStrictEqual(lens.groups.map((grp) => grp.label), ["LENGTH", "ECHO", "STYLE"]);
  assert.ok(lens.lanes.every((l) => l.color !== "#9aa0a8"));
  assert.strictEqual(lens.lanes[0].top, 20);
});

test("style match before its threshold: the shorter side's progress, both sides named", () => {
  const lens = buildLanguageLens(turnsView(), { stream: LanguageStreamId.Relation, selTurn: null, lane: 0, view: LanguageViewMode.Measures });
  const i = lens.lanes.findIndex((l) => l.key === "window_lsm");
  const last = lens.rows.filter((r) => r.isTurn).map((r) => r.cells[i]);
  assert.strictEqual(last[2].title, "style match (window): needs 1,600 words from each side; so far the messages have 51, the replies 520.");
  assert.strictEqual(last[2].barW, Math.round((51 / 1600) * (LANE_W - 14)));
  assert.strictEqual(lens.readout.cells[i].text, "51 of 1,600");
});
