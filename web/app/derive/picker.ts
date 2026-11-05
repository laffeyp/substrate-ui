// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The pane picker's workspace column and its control lines (sprint 274; plan
// PLAN-2026-11-04-shell-to-react-r5.md, C4, F337, F339). Moved from reveal_component.ts
// (`_wsPickerRows`, the workspace half of `_wsKey`, the guidance, length and tone lines' keys; UI
// sprints 124, 128, 143, 156) as functions of the pane's picker state and the server's lists.

import type { SessionRow, WorkspaceRow } from "../../vm/types";
import { sessionStatusLook } from "../../reveal/session_status";
import type { TreeItem } from "./tree_key";

/** The shared sandbox as the UI names it. The server reads this exact string as the sandbox under its
 *  own state root (server.py `_resolve_workspace_arg`), so a gate's home keeps its own (F337: the
 *  string was typed out in five places). */
export const SHARED_SANDBOX = "~/.substrate/sandbox";

/** A pane's workspace shape before the server reports one: the default per-session sandbox, the
 *  shared sandbox, or a folder the user picked. The server's own shapes are `worktree` (a folder with
 *  a git repository), `sandbox` and `path` (server.py `_classify_workspace_shape`). */
export type PaneShape = "isolated" | "sandbox" | "flat";

export function paneShape(ws: string, isDefault: boolean): PaneShape {
  if (isDefault) return "isolated";
  return ws === SHARED_SANDBOX ? "sandbox" : "flat";
}

/** A shape as the UI writes it. `worktree` means a git folder (no session gets a worktree of its
 *  own: UI sprint 154), so it reads "git", as on the records page. */
export function shapeLabel(shape: string): string {
  return shape === "worktree" ? "git" : shape;
}

/** Rows the picker never offers: the per-session sandboxes' collapse, scratch folders, the shared
 *  sandbox (it has its own row). Those live on the records page. */
export function skipInPicker(row: WorkspaceRow | null | undefined): boolean {
  return !row || typeof row.path !== "string" || !row.path
    || row.shape === "per-session-sandboxes"
    || /\.substrate\/sessions\//.test(row.path)
    || /^\/var\/folders\//.test(row.path)
    || /^\/tmp\//.test(row.path)
    || /substrate-walkthrough-/.test(row.path)
    || /substrate-harness-/.test(row.path)
    || row.path === SHARED_SANDBOX || row.path.endsWith("/.substrate/sandbox");
}

export type RowKind = "typed" | "default" | "inherit" | "sandbox" | "recent" | "choose";

export interface PickerInput {
  recentWorkspaces: readonly WorkspaceRow[];
  /** The first other bound pane with a folder, which a new pane can inherit. */
  inherit: { path: string; name: string } | null;
  /** The path typed in the column's box. */
  typed: string;
  armed: { ws: string; isDefault: boolean } | null;
  /** The column the keys work: "ws" until a folder is armed. */
  pickerHalf: string;
  /** The lit place in `flat`. */
  sel: number;
  expanded: Readonly<Record<string, boolean>>;
  paged: Readonly<Record<string, { rows: SessionRow[]; total: number }>>;
}

export interface PickerSession {
  row: SessionRow;
  name: string;
  idShort: string;
  driver: string;
  statusLabel: string;
  dotColor: string;
  lit: boolean;
}

export interface PickerRow {
  kind: RowKind;
  path: string;
  meta: string;
  expandable: boolean;
  /** The path an open row's sessions are read for. */
  expandKey: string;
  expanded: boolean;
  /** The folder the model column waits on. */
  armed: boolean;
  lit: boolean;
  /** The key shown at the row's end. */
  key: string;
  sessions: PickerSession[];
}

export type PickerFlat =
  | (TreeItem & { kind: "row"; at: number })
  | (TreeItem & { kind: "session"; at: number; row: SessionRow });

/** At most this many sessions under an open row. */
export const ROW_SESSIONS = 5;

export function workspaceRows(input: PickerInput): { rows: PickerRow[]; flat: PickerFlat[] } {
  const perSession = input.recentWorkspaces.find((r) => r && r.shape === "per-session-sandboxes");
  const base: { kind: RowKind; path: string; meta: string; expandable: boolean; expandKey: string; key: string }[] = [];
  if (input.typed) base.push({ kind: "typed", path: input.typed, meta: "typed — ↵ picks the folder", expandable: false, expandKey: input.typed, key: "↵" });
  base.push({ kind: "default", path: "per session sandbox", meta: "substrate manages · isolated", expandable: !!perSession, expandKey: perSession ? perSession.path : "per session sandbox", key: "" });
  if (input.inherit) base.push({ kind: "inherit", path: input.inherit.path, meta: "inherit · from " + (input.inherit.name || "split"), expandable: false, expandKey: input.inherit.path, key: "" });
  base.push({ kind: "sandbox", path: SHARED_SANDBOX, meta: "sandbox · shared across sessions", expandable: true, expandKey: SHARED_SANDBOX, key: "" });
  for (const r of input.recentWorkspaces.filter((row) => !skipInPicker(row)).slice(0, 2)) {
    base.push({ kind: "recent", path: r.path, meta: "recent", expandable: true, expandKey: r.path, key: "" });
  }
  base.push({ kind: "choose", path: "choose folder…", meta: "", expandable: false, expandKey: "choose folder…", key: "⌘O" });

  const onModel = input.pickerHalf === "model";
  const flat: PickerFlat[] = [];
  const rows = base.map((b, at): PickerRow => {
    const nav = flat.length;
    const expanded = b.expandable && !!input.expanded[b.expandKey];
    flat.push({ kind: "row", at, expandable: b.expandable, expanded, parent: null });
    const paged = b.expandable ? input.paged[b.expandKey] : undefined;
    const sessions = expanded && paged ? paged.rows.slice(0, ROW_SESSIONS).map((s): PickerSession => {
      const sNav = flat.length;
      flat.push({ kind: "session", at, row: s, expandable: false, expanded: false, parent: nav });
      const look = sessionStatusLook(s.status);
      return {
        row: s, name: s.name || (s.sessionId || "").slice(0, 8), idShort: (s.sessionId || "").slice(0, 12), driver: s.driver || "?",
        statusLabel: look.label, dotColor: look.dot, lit: !onModel && sNav === input.sel,
      };
    }) : [];
    const armed = !!(input.armed && (b.kind === "default" ? input.armed.isDefault : (!input.armed.isDefault && input.armed.ws === b.path)));
    const lit = onModel ? armed : nav === input.sel;
    return { ...b, expanded, armed, lit, key: armed ? "→" : (b.key || (lit ? "↵" : "")), sessions };
  });
  return { rows, flat };
}

/** ⇥ fills the typed box from the nearest recent, inherited or sandbox folder; null when none. */
export function tabFill(rows: readonly PickerRow[]): string | null {
  const first = rows.find((r) => r.kind === "recent" || r.kind === "inherit" || r.kind === "sandbox");
  return first ? first.path : null;
}

/** A control line's keys (guidance, length, tone): → ← move and wrap; ↵ picks; Escape and ↑ step
 *  back a line. */
export type LineStep = { move: number } | { pick: number } | { back: true } | null;

export function lineStep(n: number, at: number, key: string): LineStep {
  if (n <= 0) return null;
  const cur = Math.max(0, Math.min(at, n - 1));
  if (key === "ArrowRight") return { move: (cur + 1) % n };
  if (key === "ArrowLeft") return { move: (cur - 1 + n) % n };
  if (key === "Enter") return { pick: cur };
  if (key === "Escape" || key === "ArrowUp") return { back: true };
  return null;
}
