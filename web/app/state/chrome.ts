// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// What the window's chrome reads about the focused pane (sprint 220; plan
// PLAN-2026-11-04-shell-to-react-r5.md, B2).
//
// App owns the pane grid, so it writes these fields after each render; the footer reads them, and the
// pane's snapshot from shell.ts. A write that changes nothing notifies no one (store.ts).

import { createStore } from "../store";

export interface ChromeState {
  focusedPane: number;
  /** The focused pane has no workspace yet. */
  unbound: boolean;
  /** The focused session's name, as the pane header shows it. */
  title: string | null;
  /** The records, assays or studio page is open over the panes. */
  surfaceOpen: boolean;
  /** The design tool's simulateRateLimit scenario (restored in sprint 334): the footer shows the
   *  rate-limited status line of the dc-runtime template (`web/reveal.html` at `d4322e1`). */
  rateLimited: boolean;
}

// One instance per window, as in shell.ts (sprint 212).
const KEY = "__substrateChrome";
const scope = globalThis as unknown as Record<string, ReturnType<typeof createStore<ChromeState>> | undefined>;
export const chrome = scope[KEY] ?? (scope[KEY] = createStore<ChromeState>({ focusedPane: 1, unbound: true, title: null, surfaceOpen: false, rateLimited: false }));
