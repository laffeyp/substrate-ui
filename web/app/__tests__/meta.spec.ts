// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The meta view's state (web/app/state/meta.ts, sprint 313).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { GraphDirection, GraphMode } from "../../vm/kinds";
import { meta, pickSeq, selectSeq, setDir, setMode, splitAfterDrag, SPLIT_MAX, SPLIT_MIN } from "../state/meta";

test("leaving the stream resets the direction to down; the stream keeps it", () => {
  setMode(GraphMode.Stream, 1, null);
  setDir(GraphDirection.Side);
  setMode(GraphMode.Stream, 1, null);
  assert.strictEqual(meta.getSnapshot().dir, GraphDirection.Side);
  setMode(GraphMode.Structure, 1, null);
  assert.deepStrictEqual([meta.getSnapshot().mode, meta.getSnapshot().dir], [GraphMode.Structure, GraphDirection.Down]);
});

test("a pick toggles the seq; a select sets it", () => {
  selectSeq(null);
  pickSeq(4);
  assert.strictEqual(meta.getSnapshot().sel, 4);
  pickSeq(4);
  assert.strictEqual(meta.getSnapshot().sel, null);
  selectSeq(7);
  selectSeq(7);
  assert.strictEqual(meta.getSnapshot().sel, 7);
});

test("the split follows the drag in proportion and stays within its bounds", () => {
  // 100px of a 1000px window at 1.15 moves the weight by a tenth of 2.15.
  assert.ok(Math.abs(splitAfterDrag(1.15, 100, 1000) - 1.365) < 1e-9);
  // A window under 300px counts as 300.
  assert.strictEqual(splitAfterDrag(1, 30, 100), splitAfterDrag(1, 30, 300));
  assert.strictEqual(splitAfterDrag(2.9, 1000, 1000), SPLIT_MAX);
  assert.strictEqual(splitAfterDrag(0.6, -1000, 1000), SPLIT_MIN);
});
