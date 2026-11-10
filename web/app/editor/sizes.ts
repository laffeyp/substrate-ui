// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The editor view's column sizes (sprint 414; roadmap 2026-11-09-code-editor r6, R10; spec r6 §5.1 (5):
// "widths remembered per mode"). Each side column's width and the substrate terminal's height start at
// sheet frame 24a's measured sizes, change by dragging their edge, and are kept per mode in
// localStorage until collection restore keeps them (round 4). A drag never takes the centre below its
// minimum, where the prompt lives (D90), nor a column below what its header needs.

export type EditorMode = "code";
/** `bottom` is the terminal's height docked below; `side` its width docked right (sprint 416). */
export interface EditorSizes { left: number; right: number; bottom: number; side: number }

export const DEFAULT_SIZES: EditorSizes = { left: 210, right: 300, bottom: 176, side: 380 };
export const MIN_SIDE = 120;
/** The bottom panel's least height: its header, one transcript line, the activity line and the input bar. */
export const MIN_BOTTOM = 96;
export const CENTRE_MIN = 240;
/** The centre's least height above the bottom panel. */
export const CENTRE_MIN_HEIGHT = 120;

const key = (mode: EditorMode) => `substrate.editor.sizes.${mode}`;

/** The sizes kept for `mode`, or 24a's when none are kept or the stored value is not three numbers. */
export function loadSizes(mode: EditorMode, store: Pick<Storage, "getItem"> | null): EditorSizes {
  try {
    const raw = store?.getItem(key(mode));
    if (!raw) return { ...DEFAULT_SIZES };
    const v = JSON.parse(raw) as Partial<EditorSizes>;
    const ok = (n: unknown) => typeof n === "number" && Number.isFinite(n);
    // A value kept before the terminal could dock right has no `side`: it takes the default.
    if ([v.left, v.right, v.bottom].every(ok)) return { left: v.left!, right: v.right!, bottom: v.bottom!, side: ok(v.side) ? v.side! : DEFAULT_SIZES.side };
  } catch { /* storage refused or the value is not JSON: the defaults */ }
  return { ...DEFAULT_SIZES };
}

export function saveSizes(mode: EditorMode, sizes: EditorSizes, store: Pick<Storage, "setItem"> | null): void {
  try { store?.setItem(key(mode), JSON.stringify(sizes)); } catch { /* storage refused: the sizes last for this window */ }
}

/** `want` held to the view's room: a side column between MIN_SIDE and what leaves the other column and
 *  the centre their minimums; the bottom panel between MIN_BOTTOM and what leaves the centre its height. */
export function clampSize(column: keyof EditorSizes, want: number, sizes: EditorSizes, view: { width: number; height: number }, dockRight = false): number {
  if (column === "bottom") return Math.round(Math.max(MIN_BOTTOM, Math.min(want, view.height - CENTRE_MIN_HEIGHT)));
  // The other columns across the view: the two side columns, and the terminal when it is docked right.
  const across = (["left", "right", "side"] as const).filter((c) => c !== column && (c !== "side" || dockRight));
  const others = across.reduce((n, c) => n + Math.max(MIN_SIDE, Math.min(sizes[c], view.width)), 0);
  return Math.round(Math.max(MIN_SIDE, Math.min(want, view.width - CENTRE_MIN - others)));
}
