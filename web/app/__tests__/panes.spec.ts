// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The pane grid (web/app/derive/panes.ts, sprint 318).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { closePane, dragCols, dragRows, gutterStops, MAX_PANES, SINGLE, splitPane, trackList, type Cell } from "../derive/panes";

type P = Cell & { name: string };
const one: P[] = [{ id: 1, name: "a", col: 1, row: 1, cw: 1, rh: 1 }];
const geo = (ps: readonly Cell[]) => ps.map((p) => [p.id, p.col, p.row, p.cw, p.rh]);

test("a split halves the focused pane, doubling the axis's tracks when its span is one", () => {
  const right = splitPane(SINGLE, one, 1, "right", { id: 2, name: "b" })!;
  assert.deepStrictEqual(right.grid, { cols: 2, rows: 1, colW: [1, 1], rowW: [1] });
  assert.deepStrictEqual(geo(right.panes), [[1, 1, 1, 1, 1], [2, 2, 1, 1, 1]]);
  assert.strictEqual(right.made.name, "b");
  const down = splitPane(right.grid, right.panes, 2, "down", { id: 3, name: "c" })!;
  assert.deepStrictEqual([down.grid.rows, down.grid.rowW], [2, [1, 1]]);
  assert.deepStrictEqual(geo(down.panes), [[1, 1, 1, 1, 2], [2, 2, 1, 1, 1], [3, 2, 2, 1, 1]]);
  // A pane two tracks wide splits without doubling.
  const wide = splitPane({ cols: 2, rows: 1, colW: [1, 1], rowW: [1] }, [{ id: 1, name: "a", col: 1, row: 1, cw: 2, rh: 1 }], 1, "right", { id: 2, name: "b" })!;
  assert.deepStrictEqual([wide.grid.cols, geo(wide.panes)], [2, [[1, 1, 1, 1, 1], [2, 2, 1, 1, 1]]]);
});

test("no split past eight panes", () => {
  let grid = SINGLE, panes: P[] = one;
  for (let id = 2; id <= MAX_PANES; id++) ({ grid, panes } = splitPane(grid, panes, id - 1, id % 2 ? "down" : "right", { id, name: String(id) })!);
  assert.strictEqual(panes.length, MAX_PANES);
  assert.strictEqual(splitPane(grid, panes, 1, "right", { id: 9, name: "9" }), null);
});

test("a close gives the space to the neighbour sharing its edge; one left takes the grid", () => {
  const two = splitPane(SINGLE, one, 1, "right", { id: 2, name: "b" })!;
  const three = splitPane(two.grid, two.panes, 2, "down", { id: 3, name: "c" })!;
  // Pane 3 shares its upper edge with pane 2 (same columns): pane 2 grows down.
  const closed = closePane(three.grid, three.panes, 3)!;
  assert.deepStrictEqual(geo(closed.panes), [[1, 1, 1, 1, 2], [2, 2, 1, 1, 2]]);
  assert.strictEqual(closed.focused, 1);
  // Pane 1 shares its right edge with no single pane: the space stays empty.
  const gap = closePane(three.grid, three.panes, 1)!;
  assert.deepStrictEqual(geo(gap.panes), [[2, 2, 1, 1, 1], [3, 2, 2, 1, 1]]);
  const last = closePane(two.grid, two.panes, 2)!;
  assert.deepStrictEqual([last.grid, geo(last.panes)], [SINGLE, [[1, 1, 1, 1, 1]]]);
  assert.strictEqual(closePane(SINGLE, one, 1), null);
});

test("gutters trade weight between their two tracks, with floors; track lists and stops", () => {
  // 150px of a 1500px window moves a tenth of the total (2) from the right track to the left.
  assert.deepStrictEqual(dragCols([1, 1], 1, 150, 1500).map((wt) => +wt.toFixed(3)), [1.2, 0.8]);
  assert.deepStrictEqual(dragCols([1, 1], 1, -3000, 1500), [0.25, 5]);
  assert.deepStrictEqual(dragRows([1, 1], 1, 60).map((wt) => +wt.toFixed(3)), [1.2, 0.8]);
  assert.strictEqual(trackList([1, 1.5]), "1.000fr 1.500fr");
  assert.deepStrictEqual(gutterStops([1, 1, 2]), ["25.00%", "50.00%"]);
  assert.deepStrictEqual(gutterStops([1]), []);
});
