// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The assay page's state (sprint 253; plan PLAN-2026-11-04-shell-to-react-r5.md, B5): the machine's
// assays, the one picked, and the reports read so far. The page reads the listing each time it opens
// (`loadAssays`, ASSAYS_LOADED) and a report when an assay is picked (`loadAssayReport`,
// ASSAY_REPORT_LOADED); the server caches a report until its cells file changes.

import type { AssayReport, AssayRow } from "../../vm/types";
import { createStore } from "../store";

export interface AssaysState {
  /** null until the first listing arrives. */
  rows: AssayRow[] | null;
  selected: string | null;
  /** A report by name; null when the server had none by that name. Absent while it is read. */
  reports: Record<string, AssayReport | null>;
}

interface Vm { loadAssays?(): Promise<AssayRow[]>; loadAssayReport?(name: string): Promise<AssayReport | null>; }
const vm = () => (window as unknown as { __vm?: Vm }).__vm;

// One instance per window, as in shell.ts (sprint 212).
const KEY = "__substrateAssays";
const scope = globalThis as unknown as Record<string, ReturnType<typeof createStore<AssaysState>> | undefined>;
export const assays = scope[KEY] ?? (scope[KEY] = createStore<AssaysState>({ rows: null, selected: null, reports: {} }));

export function refreshAssays(): void {
  const v = vm();
  if (!v?.loadAssays) return;
  v.loadAssays().then((rows) => assays.set({ rows })).catch(() => assays.set({ rows: [] }));
}

/** Picks an assay and reads its report, once. */
export function pickAssay(name: string): void {
  assays.set({ selected: name });
  const v = vm();
  if (!v?.loadAssayReport || name in assays.getSnapshot().reports) return;
  v.loadAssayReport(name).then((report) => {
    assays.set((s) => ({ reports: { ...s.reports, [name]: report } }));
  }).catch(() => assays.set((s) => ({ reports: { ...s.reports, [name]: null } })));
}
