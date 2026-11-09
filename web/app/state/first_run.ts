// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// First run (sprint 221; plan PLAN-2026-11-04-shell-to-react-r5.md, B2).
//
// The window opens on first run with `?firstrun=1`. A pick closes it, sets the controller's driver,
// and records the pick here; App, which owns the panes, reads `picked` and gives pane 1 that driver,
// as the old page's pick did.

import { createStore } from "../store";

export interface FirstRunState {
  done: boolean;
  /** The driver picked; null before the pick. */
  picked: string | null;
  /** The design tool's firstRun scenario (restored in sprint 334): first run shows as ?firstrun=1 shows it. */
  forced: boolean;
}

// One instance per window, as in shell.ts (sprint 212).
const KEY = "__substrateFirstRun";
const scope = globalThis as unknown as Record<string, ReturnType<typeof createStore<FirstRunState>> | undefined>;
export const firstRun = scope[KEY] ?? (scope[KEY] = createStore<FirstRunState>({ done: false, picked: null, forced: false }));

export function firstRunAsked(search: string): boolean {
  return /[?&]firstrun=1(?:&|$)/.test(search);
}

export function pickFirstRun(driver: string): void {
  firstRun.set({ done: true, picked: driver });
  const vm = (window as unknown as { __vm?: { pickDriver?(name: string): void } }).__vm;
  if (vm && typeof vm.pickDriver === "function") vm.pickDriver(driver);
}
