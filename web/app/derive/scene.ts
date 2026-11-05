// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Meta's scene lens (sprint 304; plan PLAN-2026-11-04-shell-to-react-r5.md, D5): the latest 2-D
// numeric grid on the record (game_of_life's `Generation.grid`), one cell per value, lit where it is
// non-zero. Moved from reveal_component.ts's renderVals (`_findGrid`, `scene*`).
//
// The lens draws at most SCENE_MAX_CELLS cells: a 500×500 grid drawn as 250,000 elements hung paint
// until the OS killed the renderer (2026-09-25). Before, a grid over the limit read as "no 2-D grid on
// this record"; the lens now says the grid is there and too large to draw.

import type { RawEnvelope } from "./stream";

export const SCENE_MAX_CELLS = 400;
export const LIT = "#82a5c8";
export const DARK = "#1a1c20";

export type Scene =
  | { kind: "none" }
  | { kind: "large"; rows: number; cols: number }
  | { kind: "grid"; rows: number; cols: number; cells: string[] };

/** A grid's rows: every row an array of numbers, all one length. */
function asGrid(value: unknown): number[][] | null {
  if (!Array.isArray(value) || !value.length || !Array.isArray(value[0]) || !value[0].length) return null;
  const cols = value[0].length;
  return value.every((row) => Array.isArray(row) && row.length === cols && row.every((v) => typeof v === "number")) ? value as number[][] : null;
}

/** The latest envelope whose payload carries `grid`, `cells` or `matrix` as a grid. A payload that
 *  throws on access counts as no grid. */
export function sceneOf(envs: readonly RawEnvelope[]): Scene {
  for (let at = envs.length - 1; at >= 0; at--) {
    let grid: number[][] | null = null;
    try {
      const p = envs[at]?.payload;
      if (p) grid = asGrid(p.grid || p.cells || p.matrix);
    } catch { grid = null; }
    if (!grid) continue;
    const rows = grid.length, cols = grid[0].length;
    if (rows * cols > SCENE_MAX_CELLS) return { kind: "large", rows, cols };
    return { kind: "grid", rows, cols, cells: grid.flat().map((v) => (v ? LIT : DARK)) };
  }
  return { kind: "none" };
}
