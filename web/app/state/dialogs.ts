// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Which dialog the window shows (sprint 214; plan PLAN-2026-11-04-shell-to-react-r5.md, B1).
//
// One dialog at a time: settings, or the end-session confirm for a named session. App opens them
// (⌘,, the menu's Settings…, /exit) and reads `dialogOpen()` for the Escape order and the keys it
// leaves alone while a dialog is up; web/app/Dialogs.tsx draws them and closes them.
// The export dialog (19f) is drawn as the old page drew it; nothing in the window opens it, as before.
// Sprint 216 had dropped it, which a refactor may not do; sprint 334 restored it (BLACKBOARD, 2026-11-05
// failure entry).

import { createStore } from "../store";
import { clearNote } from "./settings";
import { emit } from "../../vm/instrumentation/sdd";
import { DialogClosedOutcome, Signal } from "../../vm/signals.gen";

export type DialogState =
  | { open: null }
  | { open: "settings" }
  | { open: "export" }
  /** `title` is the session's name as the pane header shows it. */
  | { open: "end-session"; title: string };

// One instance per window, as in shell.ts and settings.ts (sprints 212, 213).
const KEY = "__substrateDialogs";
const scope = globalThis as unknown as Record<string, ReturnType<typeof createStore<DialogState>> | undefined>;
export const dialogs = scope[KEY] ?? (scope[KEY] = createStore<DialogState>({ open: null }));

// Sprint 365: each open and close is written, DIALOG_OPENED and DIALOG_CLOSED, with the dialog's id.
function open(next: Exclude<DialogState, { open: null }>): void {
  dialogs.set(next);
  emit(Signal.DIALOG_OPENED, { dialog: next.open });
}

export function openSettings(): void {
  open({ open: "settings" });
}

/** The export dialog's flag, held as the dc-runtime template (`web/reveal.html` at `d4322e1`) held it;
 *  no control sets it. */
export function openExport(): void {
  open({ open: "export" });
}

export function openEndSession(title: string): void {
  open({ open: "end-session", title });
}

/** Closes whichever dialog is open; closing settings clears its theme note. `outcome` is how it
 *  closed: its confirm control, a cancel or close control or the backdrop, or Escape. */
export function closeDialog(outcome: DialogClosedOutcome): void {
  const was = dialogs.getSnapshot().open;
  if (was === "settings") clearNote();
  dialogs.set({ open: null });
  if (was !== null) emit(Signal.DIALOG_CLOSED, { dialog: was, outcome });
}

export function dialogOpen(): boolean {
  return dialogs.getSnapshot().open !== null;
}
