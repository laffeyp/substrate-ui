// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The records page's rows (sprint 235; plan PLAN-2026-11-04-shell-to-react-r5.md, B4). Moved from
// reveal_component.ts's records block unchanged, as data, without the handlers it built inline.
//
// One group per workspace the server lists, scratch folders left out; each group's count is the
// sessions the server has listed in it, or its paged total once opened. An open group lists the
// sessions fetched for it, in pages of 50. `flat` is the same rows in the order the keys walk them:
// a group, then its open sessions.

import type { SessionRow, WorkspaceRow } from "../../vm/types";
import { sessionStatusLook } from "../../reveal/session_status";

export const PAGE = 50;

export interface Paged { rows: SessionRow[]; total: number; }

export interface RecordsInput {
  workspaces: readonly WorkspaceRow[];
  /** The sessions the server lists, for the counts before a group is opened. */
  liveSessions: readonly SessionRow[];
  pagedByWs: Readonly<Record<string, Paged>>;
  expandedWs: Readonly<Record<string, boolean>>;
  /** The lit row, an index into `flat`. */
  sel: number;
  /** Now, in unix seconds, for the relative times. */
  now: number;
}

export interface SessionLine {
  row: SessionRow;
  name: string;
  driver: string;
  statusLabel: string;
  dotColor: string;
  idShort: string;
  when: string;
  lit: boolean;
}

export interface WorkspaceGroup {
  path: string;
  shapeLabel: string;
  countLabel: string;
  expanded: boolean;
  lit: boolean;
  sessions: SessionLine[];
  hasMore: boolean;
  remainingLabel: string;
}

export type FlatRow =
  | { kind: "workspace"; path: string; expanded: boolean; parent: null }
  | { kind: "session"; row: SessionRow; parent: number };

export interface Records { groups: WorkspaceGroup[]; flat: FlatRow[]; }

/** Scratch folders are not workspaces: per-session sandboxes, temp dirs, harness fixtures. */
export function isScratchPath(path: string): boolean {
  return /\.substrate\/sessions\/[^/]+\/workspace$/.test(path)
    || /^\/var\/folders\//.test(path)
    || /^\/tmp\//.test(path)
    || /substrate-walkthrough-/.test(path)
    || /substrate-harness-/.test(path);
}

/** Whole units only: `createdAt` is fractional, and the template printed "12.345s ago". */
export function relTime(unixSeconds: number, now: number): string {
  if (!unixSeconds) return "";
  const seconds = Math.max(0, Math.floor(now - unixSeconds));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

const SANDBOXES = "__PER_SESSION_SANDBOXES__";
const PER_SESSION = /\.substrate\/sessions\/[^/]+\/workspace$/;

function shapeLabel(shape: string): string {
  // UI sprint 154: sessions do not get worktrees, so a git folder reads only "git".
  if (shape === "worktree") return "git";
  if (shape === "sandbox") return "sandbox";
  if (shape === "per-session-sandboxes") return "per-session sandboxes · substrate-managed";
  return shape;
}

export function records(input: RecordsInput): Records {
  // Counts before a group is opened: the listed sessions, per-session sandboxes all under one key.
  const counts = new Map<string, number>();
  for (const row of input.liveSessions) {
    const raw = row.workspacePath || "(unknown)";
    const key = PER_SESSION.test(raw) ? SANDBOXES : raw;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const groups: WorkspaceGroup[] = [];
  const flat: FlatRow[] = [];
  for (const ws of input.workspaces.filter((row) => !isScratchPath(row.path))) {
    const countKey = ws.shape === "per-session-sandboxes" ? SANDBOXES : ws.path;
    const paged = input.pagedByWs[ws.path];
    const expanded = !!input.expandedWs[ws.path];
    const total = paged ? paged.total : counts.get(countKey) ?? 0;
    const at = flat.length;
    flat.push({ kind: "workspace", path: ws.path, expanded, parent: null });
    const sessions = (expanded && paged ? paged.rows : []).map((row): SessionLine => {
      const look = sessionStatusLook(row.status);
      const lit = flat.length === input.sel;
      flat.push({ kind: "session", row, parent: at });
      return {
        row, name: row.name || (row.sessionId || "").slice(0, 12), driver: row.driver || "?",
        statusLabel: look.label, dotColor: look.dot, idShort: (row.sessionId || "").slice(0, 12),
        when: relTime(row.createdAt, input.now), lit,
      };
    });
    groups.push({
      path: ws.path,
      shapeLabel: shapeLabel(ws.shape),
      countLabel: total === 1 ? "1 session" : `${total} sessions`,
      expanded,
      lit: at === input.sel,
      sessions,
      hasMore: !!(expanded && paged && paged.rows.length < paged.total),
      remainingLabel: paged ? `load next ${Math.min(PAGE, Math.max(0, paged.total - paged.rows.length))}` : "",
    });
  }
  return { groups, flat };
}
