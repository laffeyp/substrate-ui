// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The editor's groups (sprint 504; roadmap 2026-11-14-editor-features r4 E6; the Architect, 2026-11-14: "splitting
// editor panes … command D and command shift D … you probably only really want to allow … three horizontal, three
// vertical … although the system should support everything"). A group is a cell of the pane grid's own layout
// (derive/panes.ts, the same split and close rules), holding its own tabs. A split is refused when a line across the
// centre, or down it, would cross more than three groups.

import { closePane, splitPane, type Cell, type Grid, type SplitDir } from "./panes";

export const MAX_GROUPS_ACROSS = 3;
export const MAX_GROUPS_DOWN = 3;

/** The most groups a vertical line (across: false) or a horizontal line (across: true) crosses. */
export function crossed(grid: Grid, cells: readonly Cell[], across: boolean): number {
  const tracks = across ? grid.rows : grid.cols;
  let most = 0;
  for (let t = 1; t <= tracks; t++) {
    const n = cells.filter((c) => (across ? c.row <= t && t < c.row + c.rh : c.col <= t && t < c.col + c.cw)).length;
    most = Math.max(most, n);
  }
  return most;
}

/** The layout after `focused` splits, or null past three across or three down. */
export function splitGroup(grid: Grid, cells: readonly Cell[], focused: number, dir: SplitDir, id: number): { grid: Grid; cells: Cell[] } | null {
  const out = splitPane(grid, cells, focused, dir, { id }, MAX_GROUPS_ACROSS * MAX_GROUPS_DOWN);
  if (!out) return null;
  if (crossed(out.grid, out.panes, true) > MAX_GROUPS_ACROSS || crossed(out.grid, out.panes, false) > MAX_GROUPS_DOWN) return null;
  return { grid: out.grid, cells: out.panes };
}

/** The layout after `gone` closes, and the group that takes the focus; null for the last group. */
export function closeGroup(grid: Grid, cells: readonly Cell[], gone: number): { grid: Grid; cells: Cell[]; focused: number } | null {
  const out = closePane(grid, cells, gone);
  return out ? { grid: out.grid, cells: out.panes, focused: out.focused } : null;
}
