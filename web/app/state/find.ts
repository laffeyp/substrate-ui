// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Find (⌘F; sprint 270; plan PLAN-2026-11-04-shell-to-react-r5.md, C3): whether it is open, the
// query, and its scope, the lens last clicked (the transcript or meta's stream). The find bar
// (web/app/FindBar.tsx) draws them; the stream lens dims the rows that do not match; App counts the
// stream's matches after each render and writes the count here.

import { createStore } from "../store";
import { emit } from "../../vm/instrumentation/sdd";
import { FindClosedCause, FindOpenedScope, FindScopeSetScope, Signal } from "../../vm/signals.gen";

export type FindScope = "transcript" | "stream";

export interface FindState {
  open: boolean;
  q: string;
  scope: FindScope;
  /** Events in meta's stream matching `q`, counted by App. */
  streamMatches: number;
}

// One instance per window, as in shell.ts (sprint 212).
const KEY = "__substrateFind";
const scope = globalThis as unknown as Record<string, ReturnType<typeof createStore<FindState>> | undefined>;
export const find = scope[KEY] ?? (scope[KEY] = createStore<FindState>({ open: false, q: "", scope: "transcript", streamMatches: 0 }));

const SCOPE_OF: Record<FindScope, FindOpenedScope> = { transcript: FindOpenedScope.TRANSCRIPT, stream: FindOpenedScope.STREAM };

/** ⌘F: opens find, or closes it; either way the query starts empty. FIND_OPENED or FIND_CLOSED (v0.24). */
export function toggleFind(): void {
  const was = find.getSnapshot();
  find.set((s) => ({ open: !s.open, q: "" }));
  if (was.open) emit(Signal.FIND_CLOSED, { cause: FindClosedCause.TOGGLE });
  else emit(Signal.FIND_OPENED, { scope: SCOPE_OF[was.scope] });
}

/** Escape closes find; FIND_CLOSED when it was open. */
export function closeFind(): void {
  const wasOpen = find.getSnapshot().open;
  find.set({ open: false, q: "" });
  if (wasOpen) emit(Signal.FIND_CLOSED, { cause: FindClosedCause.ESCAPE });
}

/** The query as typed; FIND_QUERY_CHANGED carries its length, never the text (E1). */
export function setFindQuery(q: string): void {
  const was = find.getSnapshot().q;
  find.set({ q });
  if (q !== was) emit(Signal.FIND_QUERY_CHANGED, { length: q.length });
}

/** The lens last clicked; FIND_SCOPE_SET when it changes. */
export function setFindScope(next: FindScope): void {
  const was = find.getSnapshot().scope;
  find.set({ scope: next });
  if (next !== was) emit(Signal.FIND_SCOPE_SET, { scope: next === "stream" ? FindScopeSetScope.STREAM : FindScopeSetScope.TRANSCRIPT });
}

/** The query as matched: lowercased and trimmed, empty while find is closed. */
export function findQuery(): string {
  const st = find.getSnapshot();
  return st.open ? st.q.trim().toLowerCase() : "";
}
