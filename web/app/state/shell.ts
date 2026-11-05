// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// What the boot script hands the window (sprint 211; plan PLAN-2026-11-04-shell-to-react-r5.md, A7).
//
// web/reveal.ts used to reach the dc-runtime component through React's private fiber fields to set
// its state and call its methods. It now writes here instead: each pane controller's latest snapshot
// into the store, and the menu's commands into the channel. DCLogic subscribes to both.

import type { Snapshot } from "../../vm/types";
import { createStore } from "../store";

export interface ShellState {
  /** Each pane's latest controller snapshot, by pane id. */
  snapshots: Record<number, Snapshot>;
  /** The pane whose snapshot changed last; null before the first. */
  changedPane: number | null;
}

export const shell = createStore<ShellState>({ snapshots: {}, changedPane: null });

export function mirrorSnapshot(paneId: number, snap: Snapshot): void {
  shell.set((st) => ({ snapshots: { ...st.snapshots, [paneId]: snap }, changedPane: paneId }));
}

/** The menu commands the window handles itself. */
export type ShellCommand = "toggle-meta" | "settings" | "close-pane";

const listeners = new Set<(command: ShellCommand) => void>();
const held: ShellCommand[] = [];

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
