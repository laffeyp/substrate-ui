// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// What the boot script hands the window (sprint 211; plan PLAN-2026-11-04-shell-to-react-r5.md, A7).
//
// web/reveal.ts used to reach the dc-runtime component through React's private fiber fields to set
// its state and call its methods. It now writes here instead: each pane controller's latest snapshot
// into the store, and the menu's commands into the channel. DCLogic subscribes to both.
//
// The window has two copies of this module: Vite bundles one into reveal-*.js for the boot script, and
// esbuild bundles another into the page with reveal_component.ts (vite.config.ts, inlineDcScript). The
// store and the channel therefore live on the window, made by whichever copy loads first, so both
// copies share them (sprint 212). One bundle after dc-runtime retires (plan E4) makes this one copy.

import type { Snapshot } from "../../vm/types";
import { createStore } from "../store";

export interface ShellState {
  /** Each pane's latest controller snapshot, by pane id. */
  snapshots: Record<number, Snapshot>;
  /** The pane whose snapshot changed last; null before the first. */
  changedPane: number | null;
}

/** The command channel's parts, shared like the store. */
interface Channel { listeners: Set<(command: ShellCommand) => void>; held: ShellCommand[]; }
interface Shared { store: ReturnType<typeof createStore<ShellState>>; channel: Channel; }
const KEY = "__substrateShell";
const scope = globalThis as unknown as Record<string, Shared | undefined>;
const shared: Shared = scope[KEY] ?? (scope[KEY] = {
  store: createStore<ShellState>({ snapshots: {}, changedPane: null }),
  channel: { listeners: new Set(), held: [] },
});

export const shell = shared.store;

export function mirrorSnapshot(paneId: number, snap: Snapshot): void {
  shell.set((st) => ({ snapshots: { ...st.snapshots, [paneId]: snap }, changedPane: paneId }));
}

/** The menu commands the window handles itself. */
export type ShellCommand = "toggle-meta" | "settings" | "close-pane";

const { listeners, held } = shared.channel;

/** Delivers the command to every listener, in order; with none yet, holds it for the first. */
export function sendCommand(command: ShellCommand): void {
  if (!listeners.size) { held.push(command); return; }
  for (const fn of [...listeners]) fn(command);
}

export function onCommand(fn: (command: ShellCommand) => void): () => void {
  listeners.add(fn);
  for (const command of held.splice(0)) fn(command);
  return () => { listeners.delete(fn); };
}
