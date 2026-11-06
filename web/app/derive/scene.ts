// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Meta's scene lens (sprint 304; plan PLAN-2026-11-04-shell-to-react-r5.md, D5): the latest 2-D
// numeric grid on the record (game_of_life's `Generation.grid`), one cell per value, lit where it is
// non-zero. Moved from reveal_component.ts's renderVals (`_findGrid`, `scene*`) with its logic as it
// was (sprint 334 restored it; sprint 304 had added an over-the-limit message and refused ragged
// grids, which a refactor may not do: BLACKBOARD, 2026-11-05 failure entry).
//
// The search walks back from the latest envelope. A payload's `grid`, `cells` or `matrix` counts when
// it is a non-empty array whose first row is an array whose first value is a number; the grid's
// columns are its first row's length. A grid over SCENE_MAX_CELLS (400) ends the search with no grid,
// since a 500×500 grid drawn as 250,000 elements hung paint until the OS killed the renderer
// (2026-09-25). A payload that throws on access ends it too.

import type { RawEnvelope } from "./stream";

export const SCENE_MAX_CELLS = 400;
export const LIT = "#82a5c8";
export const DARK = "#1a1c20";

export type Scene =
  | { kind: "none" }
  | { kind: "grid"; rows: number; cols: number; cells: string[] };

export function sceneOf(envs: readonly RawEnvelope[]): Scene {
  let grid: unknown[][] | null = null;
  try {
    for (let at = envs.length - 1; at >= 0; at--) {
      const p = envs[at] && envs[at].payload;
      if (!p) continue;
      const candidate = (p.grid || p.cells || p.matrix) as unknown;
      if (!Array.isArray(candidate) || !candidate.length) continue;
      if (!Array.isArray(candidate[0])) continue;
      if (typeof candidate[0][0] !== "number") continue;
      if (candidate.length * candidate[0].length > SCENE_MAX_CELLS) break;
      grid = candidate as unknown[][];
      break;
    }
  } catch { grid = null; }
  if (!grid) return { kind: "none" };
  let cells: string[] = [];
  try { cells = grid.flat().map((v) => (v ? LIT : DARK)); } catch { cells = []; }
  return { kind: "grid", rows: grid.length, cols: grid[0].length, cells };
}
