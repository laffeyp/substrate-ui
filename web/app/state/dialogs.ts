// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Which dialog the window shows (sprint 214; plan PLAN-2026-11-04-shell-to-react-r5.md, B1).
//
// One dialog at a time: settings, or the end-session confirm for a named session. DCLogic opens them
// (⌘,, the menu's Settings…, /exit) and reads `dialogOpen()` for the Escape order and the keys it
// leaves alone while a dialog is up; the React dialogs (web/app/Dialogs.tsx) draw them and close them.
// The export dialog had no endpoint behind it and is gone (F351).

import { createStore } from "../store";
import { clearNote } from "./settings";

export type DialogState =
  | { open: null }
  | { open: "settings" }
  /** `title` is the session's name as the pane header shows it. */
  | { open: "end-session"; title: string };

// One instance per window, as in shell.ts and settings.ts (sprints 212, 213).
const KEY = "__substrateDialogs";
const scope = globalThis as unknown as Record<string, ReturnType<typeof createStore<DialogState>> | undefined>;
export const dialogs = scope[KEY] ?? (scope[KEY] = createStore<DialogState>({ open: null }));

export function openSettings(): void {
  dialogs.set({ open: "settings" });
}

export function openEndSession(title: string): void {
  dialogs.set({ open: "end-session", title });
}

/** Closes whichever dialog is open; closing settings clears its theme note. */
export function closeDialog(): void {
  if (dialogs.getSnapshot().open === "settings") clearNote();
  dialogs.set({ open: null });
}

export function dialogOpen(): boolean {
  return dialogs.getSnapshot().open !== null;
}
