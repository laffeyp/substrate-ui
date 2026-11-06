// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The pane grid (sprint 318; plan PLAN-2026-11-04-shell-to-react-r5.md, E1): splitting a pane,
// closing one, and the weights the gutters drag. Moved from reveal_component.ts (`_split`,
// `_closePane`'s layout, the gutter drag, `paneCols`, `colGutters`; sprints 085, 146, 182).
//
// The grid has `cols` × `rows` tracks, each with a weight. A pane covers a rectangle of whole tracks:
// it starts at track `col`, `row` (1-based) and spans `cw` columns and `rh` rows. A split halves the
// focused pane along one axis; where its span is a single track, every track on that axis doubles
// first, so the halves are whole tracks. A close hands the pane's rectangle to the one neighbour that
// shares a whole edge with it.

export interface Cell { id: number; col: number; row: number; cw: number; rh: number; }
export interface Grid { cols: number; rows: number; colW: number[]; rowW: number[]; }
export type SplitDir = "right" | "down";

/** Each split adds one pane, up to eight. */
export const MAX_PANES = 8;
export const SINGLE: Grid = { cols: 1, rows: 1, colW: [1], rowW: [1] };

const doubled = (weights: readonly number[]) => weights.flatMap((wt) => [wt, wt]);

/** The grid and panes after `focused` splits; the new pane takes the right or lower half and the
 *  fields of `fresh`. Null at the cap. A pane with no geometry yet covers the whole grid. */
export function splitPane<T extends Cell>(grid: Grid, panes: readonly T[], focused: number, dir: SplitDir, fresh: Omit<T, keyof Cell> & { id: number }): { grid: Grid; panes: T[]; made: T } | null {
  if (panes.length >= MAX_PANES) return null;
  let { cols, rows, colW, rowW } = grid;
  const next = panes.map((p) => ({ ...p, col: p.col || 1, row: p.row || 1, cw: p.cw || cols, rh: p.rh || rows }));
  const target = next.find((p) => p.id === focused) ?? next[0];
  let made: T;
  if (dir === "right") {
    if (target.cw < 2) {
      cols *= 2; colW = doubled(colW);
      for (const p of next) { p.col = p.col * 2 - 1; p.cw *= 2; }
    }
    const half = target.cw / 2;
    made = { ...fresh, col: target.col + half, row: target.row, cw: half, rh: target.rh } as T;
    target.cw = half;
  } else {
    if (target.rh < 2) {
      rows *= 2; rowW = doubled(rowW);
      for (const p of next) { p.row = p.row * 2 - 1; p.rh *= 2; }
    }
    const half = target.rh / 2;
    made = { ...fresh, col: target.col, row: target.row + half, cw: target.cw, rh: half } as T;
    target.rh = half;
  }
  return { grid: { cols, rows, colW: [...colW], rowW: [...rowW] }, panes: [...next, made], made };
}

/** The grid and panes after `closed` goes, and the pane that takes the focus. The last pane is
 *  never closed (null). One pane left takes the whole grid; otherwise the neighbour sharing the
 *  closed pane's whole right, left, upper or lower edge grows over it, and with none the space stays
 *  empty. */
export function closePane<T extends Cell>(grid: Grid, panes: readonly T[], closed: number): { grid: Grid; panes: T[]; focused: number } | null {
  const gone = panes.find((p) => p.id === closed);
  const rest = panes.filter((p) => p.id !== closed).map((p) => ({ ...p }));
  if (!rest.length || !gone) return null;
  if (rest.length === 1) return { grid: SINGLE, panes: [{ ...rest[0], col: 1, row: 1, cw: 1, rh: 1 }], focused: rest[0].id };
  const { col, row, cw, rh } = { col: gone.col || 1, row: gone.row || 1, cw: gone.cw || 1, rh: gone.rh || 1 };
  for (const p of rest) {
    const sameRows = p.row === row && p.rh === rh;
    const sameCols = p.col === col && p.cw === cw;
    if (sameRows && p.col + p.cw === col) { p.cw += cw; break; }
    if (sameRows && col + cw === p.col) { p.col = col; p.cw += cw; break; }
    if (sameCols && p.row + p.rh === row) { p.rh += rh; break; }
    if (sameCols && row + rh === p.row) { p.row = row; p.rh += rh; break; }
  }
  return { grid, panes: rest, focused: rest[0].id };
}

/** Track weights after the gutter before track `at` (1-based, the second track's gutter is 1) moves
 *  by `delta` of the axis: the two tracks beside it trade weight, neither under `floor`. */
export function dragTracks(weights: readonly number[], at: number, delta: number, floor: number): number[] {
  const total = weights.reduce((a, b) => a + b, 0);
  const out = [...weights];
  out[at - 1] = Math.max(floor, out[at - 1] + delta * total);
  out[at] = Math.max(floor, out[at] - delta * total);
  return out;
}

/** A column gutter moves by the drag's share of the window (at least 300px); a row gutter by its share
 *  of 600px, as before. Columns keep a quarter of a track, rows three tenths. */
export const dragCols = (colW: readonly number[], at: number, dx: number, winW: number) => dragTracks(colW, at, dx / Math.max(300, winW), 0.25);
export const dragRows = (rowW: readonly number[], at: number, dy: number) => dragTracks(rowW, at, dy / 600, 0.3);

/** The CSS track list, "1.000fr 1.000fr". */
export const trackList = (weights: readonly number[]): string => weights.map((wt) => wt.toFixed(3) + "fr").join(" ");

/** Each inner gutter's place along its axis, as a percentage to two decimals. */
export function gutterStops(weights: readonly number[]): string[] {
  const total = weights.reduce((a, b) => a + b, 0);
  return weights.slice(0, -1).map((_, i) => (weights.slice(0, i + 1).reduce((a, b) => a + b, 0) / total * 100).toFixed(2) + "%");
}
