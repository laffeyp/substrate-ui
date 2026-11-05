// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The workspace tree's keys (sprint 236; plan PLAN-2026-11-04-shell-to-react-r5.md, B4), shared by
// the records page and, from plan row C4, the picker's workspace column (reveal_component.ts
// `_treeKey`, UI sprint 156). Moved as a function that names the step; the caller takes it.
//
// ↑ ↓ move and wrap; → opens a closed row; ← folds an open row, and on a session lights its row and
// folds it (UI sprint 152); ⇧↵ or ⌥↵ opens or folds; ↵ picks.

export interface TreeItem { expandable: boolean; expanded: boolean; parent: number | null; }
export interface TreeKeyEvent { key: string; shiftKey: boolean; altKey: boolean; }

export type TreeStep =
  | { move: number }
  | { toggle: number }
  /** Light the parent row and fold it. */
  | { fold: number }
  | { pick: number };

export function treeKey(flat: readonly TreeItem[], cur: number, ev: TreeKeyEvent): TreeStep | null {
  if (!flat.length) return null;
  const item = flat[cur];
  if (ev.key === "ArrowDown") return { move: (cur + 1) % flat.length };
  if (ev.key === "ArrowUp") return { move: (cur - 1 + flat.length) % flat.length };
  if (ev.key === "ArrowRight" && item.expandable && !item.expanded) return { toggle: cur };
  if (ev.key === "ArrowLeft" && item.expandable && item.expanded) return { toggle: cur };
  if (ev.key === "ArrowLeft" && item.parent !== null) return { fold: item.parent };
  // ⇧↵ on a session is taken and does nothing: the lit row stays.
  if (ev.key === "Enter" && (ev.shiftKey || ev.altKey)) return item.expandable ? { toggle: cur } : { move: cur };
  if (ev.key === "Enter") return { pick: cur };
  return null;
}
