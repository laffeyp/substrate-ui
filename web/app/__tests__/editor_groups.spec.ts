// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The editor's groups: splits up to three across and three down (sprint 504).

import { test } from "node:test";
import assert from "node:assert/strict";
import { closeGroup, crossed, splitGroup } from "../derive/editor_groups";
import { SINGLE, type Cell, type Grid } from "../derive/panes";

const one: Cell[] = [{ id: 1, col: 1, row: 1, cw: 1, rh: 1 }];

test("right, then down: three groups, two across and two down", () => {
  const a = splitGroup(SINGLE, one, 1, "right", 2)!;
  const b = splitGroup(a.grid, a.cells, 2, "down", 3)!;
  assert.equal(b.cells.length, 3);
  assert.equal(crossed(b.grid, b.cells, true), 2);
  assert.equal(crossed(b.grid, b.cells, false), 2);
});

test("a fourth across is refused; a third across is not", () => {
  let grid: Grid = SINGLE, cells: Cell[] = one;
  for (const id of [2, 3]) { const out = splitGroup(grid, cells, id - 1, "right", id)!; grid = out.grid; cells = out.cells; }
  assert.equal(crossed(grid, cells, true), 3);
  assert.equal(splitGroup(grid, cells, 3, "right", 4), null);
  assert.ok(splitGroup(grid, cells, 3, "down", 4), "down still splits");
});

test("three by three is nine groups, and the tenth split is refused", () => {
  let grid: Grid = SINGLE, cells: Cell[] = one, id = 1;
  for (let col = 0; col < 2; col++) { const out = splitGroup(grid, cells, id, "right", ++id)!; grid = out.grid; cells = out.cells; }
  for (const top of [1, 2, 3]) { let at = top; for (let row = 0; row < 2; row++) { const out = splitGroup(grid, cells, at, "down", ++id); assert.ok(out, `split ${id}`); grid = out.grid; cells = out.cells; at = id; } }
  assert.equal(cells.length, 9);
  for (const cell of cells) for (const dir of ["right", "down"] as const) assert.equal(splitGroup(grid, cells, cell.id, dir, 99), null);
});

test("closing gives the space to a neighbour; the last group stays", () => {
  const a = splitGroup(SINGLE, one, 1, "right", 2)!;
  const b = closeGroup(a.grid, a.cells, 2)!;
  assert.deepEqual(b.cells, [{ id: 1, col: 1, row: 1, cw: 1, rh: 1 }]);
  assert.equal(closeGroup(b.grid, b.cells, 1), null);
});
