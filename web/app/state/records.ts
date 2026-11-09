// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The records page's state and actions (sprint 237; plan PLAN-2026-11-04-shell-to-react-r5.md, B4).
//
// Which workspaces are open, the pages of sessions fetched for each, the lit row, and whether the
// folder picker is up. The rows themselves are derived (web/app/derive/records.ts) from this and the
// focused pane's snapshot. Opening a session binds the focused pane and closes the page; App owns the
// panes, so it registers that action here.

import type { SessionRow } from "../../vm/types";
import { createStore } from "../store";
import { PAGE, records, type Paged, type Records } from "../derive/records";
import { treeKey } from "../derive/tree_key";
import { chrome } from "./chrome";
import { shell } from "./shell";

export interface RecordsState {
  expandedWs: Record<string, boolean>;
  pagedByWs: Record<string, Paged>;
  sel: number;
  addWsBusy: boolean;
}

interface Vm {
  loadSessionsByWorkspace?(path: string, offset: number, limit: number): Promise<{ rows: SessionRow[]; total: number }>;
  addWorkspace?(path: string): Promise<unknown>;
  loadLiveSessions?(): Promise<unknown>;
}
interface Native { pickFolder?(): Promise<string | null>; }

// One instance per window, as in shell.ts (sprint 212).
interface Shared { store: ReturnType<typeof createStore<RecordsState>>; open: { current: (row: SessionRow) => void }; }
const KEY = "__substrateRecords";
const scope = globalThis as unknown as Record<string, Shared | undefined>;
const shared: Shared = scope[KEY] ?? (scope[KEY] = {
  store: createStore<RecordsState>({ expandedWs: {}, pagedByWs: {}, sel: 0, addWsBusy: false }),
  open: { current: () => undefined },
});

export const recordsState = shared.store;

const vm = () => (window as unknown as { __vm?: Vm }).__vm;

/** App registers how a picked session opens in the focused pane; the returned function removes it. */
export function setOpenSession(open: (row: SessionRow) => void): () => void {
  shared.open.current = open;
  return () => { if (shared.open.current === open) shared.open.current = () => undefined; };
}

export function openSession(row: SessionRow): void {
  shared.open.current(row);
}

/** The page's rows now: this store, and the focused pane's workspaces and sessions. */
export function currentRecords(now = Date.now() / 1000): Records {
  const snap = shell.getSnapshot().snapshots[chrome.getSnapshot().focusedPane];
  const st = recordsState.getSnapshot();
  return records({
    workspaces: snap?.recentWorkspaces ?? [], liveSessions: snap?.liveSessions ?? [],
    pagedByWs: st.pagedByWs, expandedWs: st.expandedWs, sel: st.sel, now,
  });
}

/** Opens or folds a workspace; the first open fetches its first page. */
export function toggleWorkspace(path: string): void {
  const st = recordsState.getSnapshot();
  const opening = !st.expandedWs[path];
  recordsState.set({ expandedWs: { ...st.expandedWs, [path]: opening } });
  const load = vm()?.loadSessionsByWorkspace;
  if (opening && load && !st.pagedByWs[path]) {
    load.call(vm(), path, 0, PAGE).then((r) => {
      recordsState.set((s) => ({ pagedByWs: { ...s.pagedByWs, [path]: { rows: r.rows, total: r.total } } }));
    }).catch(() => undefined);
  }
}

export function loadMore(path: string): void {
  const load = vm()?.loadSessionsByWorkspace;
  if (!load) return;
  const have = recordsState.getSnapshot().pagedByWs[path]?.rows ?? [];
  load.call(vm(), path, have.length, PAGE).then((r) => {
    recordsState.set((s) => {
      const prev = s.pagedByWs[path] ?? { rows: [], total: r.total };
      return { pagedByWs: { ...s.pagedByWs, [path]: { rows: [...prev.rows, ...r.rows], total: r.total } } };
    });
  }).catch(() => undefined);
}

/** In Electron the OS folder picker adds a workspace; a plain browser tab has none. */
export function canAddWorkspace(): boolean {
  const native = (window as unknown as { native?: Native }).native;
  return !!(native && typeof native.pickFolder === "function");
}

export async function addWorkspace(): Promise<void> {
  const native = (window as unknown as { native?: Native }).native;
  if (!native || typeof native.pickFolder !== "function") return;
  recordsState.set({ addWsBusy: true });
  try {
    const picked = await native.pickFolder();
    const v = vm();
    if (picked && v && typeof v.addWorkspace === "function") {
      await v.addWorkspace(picked);
      // The new workspace's row picks up any sessions already in it.
      if (typeof v.loadLiveSessions === "function") v.loadLiveSessions().catch(() => undefined);
    }
  } finally {
    recordsState.set({ addWsBusy: false });
  }
}

/** The page's keys (UI sprint 156), over the rows as drawn. True when the key was taken. */
export function recordsKey(ev: KeyboardEvent): boolean {
  const { flat } = currentRecords();
  if (!flat.length) return false;
  const cur = Math.max(0, Math.min(recordsState.getSnapshot().sel, flat.length - 1));
  const step = treeKey(flat.map((f) => ({ expandable: f.kind === "workspace", expanded: f.kind === "workspace" && f.expanded, parent: f.parent })), cur, ev);
  if (!step) return false;
  ev.preventDefault();
  const light = (i: number) => {
    recordsState.set({ sel: i });
    setTimeout(() => { document.querySelector('[data-records-lit="1"]')?.scrollIntoView({ block: "nearest" }); }, 0);
  };
  const pathAt = (i: number) => { const f = flat[i]; return f.kind === "workspace" ? f.path : null; };
  if ("move" in step) light(step.move);
  else if ("toggle" in step) { const p = pathAt(step.toggle); if (p) toggleWorkspace(p); }
  else if ("fold" in step) { light(step.fold); const p = pathAt(step.fold); if (p) toggleWorkspace(p); }
  else {
    const f = flat[step.pick];
    if (f.kind === "workspace") toggleWorkspace(f.path);
    else openSession(f.row);
  }
  return true;
}
