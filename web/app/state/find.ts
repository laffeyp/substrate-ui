// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Find (⌘F; sprint 270; plan PLAN-2026-11-04-shell-to-react-r5.md, C3): whether it is open, the
// query, and its scope, the lens last clicked (the transcript or meta's stream). The find bar
// (web/app/FindBar.tsx) draws them; DCLogic reads them to dim the stream's rows that do not match,
// and writes the stream's match count here, since it builds the stream's rows until plan row D1.

import { createStore } from "../store";

export type FindScope = "transcript" | "stream";

export interface FindState {
  open: boolean;
  q: string;
  scope: FindScope;
  /** Events in meta's stream matching `q`, counted by DCLogic. */
  streamMatches: number;
}

// One instance per window, as in shell.ts (sprint 212).
const KEY = "__substrateFind";
const scope = globalThis as unknown as Record<string, ReturnType<typeof createStore<FindState>> | undefined>;
export const find = scope[KEY] ?? (scope[KEY] = createStore<FindState>({ open: false, q: "", scope: "transcript", streamMatches: 0 }));

/** ⌘F: opens find, or closes it; either way the query starts empty. */
export function toggleFind(): void {
  find.set((s) => ({ open: !s.open, q: "" }));
}

export function closeFind(): void {
  find.set({ open: false, q: "" });
}

export function setFindQuery(q: string): void {
  find.set({ q });
}

export function setFindScope(next: FindScope): void {
  find.set({ scope: next });
}

/** The query as matched: lowercased and trimmed, empty while find is closed. */
export function findQuery(): string {
  const st = find.getSnapshot();
  return st.open ? st.q.trim().toLowerCase() : "";
}
