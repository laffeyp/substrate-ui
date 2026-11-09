// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The meta view's state (web/app/state/meta.ts, sprint 313).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { GraphDirection, GraphMode, RevealLevel } from "../../vm/kinds";
import { meta, pickSeq, selectSeq, setDir, setLevel, setMode, splitAfterDrag, SPLIT_MAX, SPLIT_MIN } from "../state/meta";
import { clearBuffer, snapshot } from "../../vm/instrumentation/sdd";
import { SeqSelectedHow, Signal } from "../../vm/signals.gen";

test("leaving the stream resets the direction to down; the stream keeps it", () => {
  setMode(GraphMode.Stream, 1, null);
  setDir(GraphDirection.Side, 1);
  setMode(GraphMode.Stream, 1, null);
  assert.strictEqual(meta.getSnapshot().dir, GraphDirection.Side);
  setMode(GraphMode.Structure, 1, null);
  assert.deepStrictEqual([meta.getSnapshot().mode, meta.getSnapshot().dir], [GraphMode.Structure, GraphDirection.Down]);
});

test("a pick toggles the seq; a select sets it", () => {
  selectSeq(null, 1, SeqSelectedHow.LANGUAGE_ROW);
  pickSeq(4, 1, SeqSelectedHow.STREAM_ROW);
  assert.strictEqual(meta.getSnapshot().sel, 4);
  pickSeq(4, 1, SeqSelectedHow.STREAM_ROW);
  assert.strictEqual(meta.getSnapshot().sel, null);
  selectSeq(7, 1, SeqSelectedHow.LANGUAGE_ROW);
  selectSeq(7, 1, SeqSelectedHow.LANGUAGE_ROW);
  assert.strictEqual(meta.getSnapshot().sel, 7);
});

test("each change of direction, level or lit seq is written once, in its pane; a set to the value shown writes none", () => {
  setMode(GraphMode.Stream, 2, null);
  setDir(GraphDirection.Down, 2);
  setLevel(RevealLevel.All, 2);
  selectSeq(null, 2, SeqSelectedHow.LANGUAGE_ROW);
  clearBuffer();
  setDir(GraphDirection.Side, 2);
  setDir(GraphDirection.Side, 2);
  setLevel(RevealLevel.App, 2);
  setLevel(RevealLevel.App, 2);
  pickSeq(9, 2, SeqSelectedHow.SIDE_GRAPH);
  pickSeq(9, 2, SeqSelectedHow.SIDE_GRAPH);
  selectSeq(null, 2, SeqSelectedHow.LANGUAGE_KEY);
  const got = snapshot().map((r) => [r.name, r.pane_id, r.payload]);
  assert.deepStrictEqual(got, [
    [Signal.STREAM_DIRECTION_SET, 2, { direction: "side" }],
    [Signal.STREAM_LEVEL_SET, 2, { level: "app" }],
    [Signal.SEQ_SELECTED, 2, { seq: 9, how: "side_graph" }],
    [Signal.SEQ_SELECTED, 2, { seq: null, how: "side_graph" }],
  ]);
});

test("the split follows the drag in proportion and stays within its bounds", () => {
  // 100px of a 1000px window at 1.15 moves the weight by a tenth of 2.15.
  assert.ok(Math.abs(splitAfterDrag(1.15, 100, 1000) - 1.365) < 1e-9);
  // A window under 300px counts as 300.
  assert.strictEqual(splitAfterDrag(1, 30, 100), splitAfterDrag(1, 30, 300));
  assert.strictEqual(splitAfterDrag(2.9, 1000, 1000), SPLIT_MAX);
  assert.strictEqual(splitAfterDrag(0.6, -1000, 1000), SPLIT_MIN);
});
