// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// web/reveal.ts — the window's one module (sprint 329; plan PLAN-2026-11-04-shell-to-react-r5.md, E4).
//
// Builds the pane registry, exposes it as `window.__vm`, hands each pane controller's snapshot and
// the menu's commands to the window through web/app/state/shell.ts, and renders the window
// (web/app/App.tsx) into #root. Before sprint 329 dc-runtime (support.js) drew the page from a
// template, evaluated the shell's class from a string, and this script attached React roots to the
// template's divs.

import * as React from "react";
import * as ReactDOMClient from "react-dom/client";
import { BrowserSubstrateClient, PaneRegistry } from "./vm";
import { mirrorSnapshot, sendCommand } from "./app/state/shell";
import { App } from "./app/App";
import { emit as emitSignal, VOCAB_VERSION } from "./vm/instrumentation/sdd";
import { PaneOpenedCause, RecordOpenedHow, Signal, WindowFaultedSource } from "./vm/signals.gen";

/** The class of what was thrown: an Error's name, or non-error (a thrown string, a rejection with no Error). */
function errorClass(err: unknown): string {
  return err instanceof Error ? err.name || "Error" : "non-error";
}

function boot(): void {
  // The window's first record (S1): before the registry and pane 1's controller can write any.
  emitSignal(Signal.WINDOW_BOOTED, { vocab_version: VOCAB_VERSION });
  // Errors that escape the window's code (v0.24, P-0.24-FAULTS), after WINDOW_BOOTED (S1). React 18
  // rethrows a render error no boundary catches, so it reaches the error event too. The listeners only
  // read: the browser still logs each error as before. No message text (E1).
  window.addEventListener("error", (ev) => {
    const file = ev.filename ? ev.filename.split("?")[0].split("/").pop() : "";
    emitSignal(Signal.WINDOW_FAULTED, { error_type: errorClass(ev.error), source: WindowFaultedSource.ERROR, where: file ? file + ":" + ev.lineno : "unknown" });
  });
  window.addEventListener("unhandledrejection", (ev) => {
    emitSignal(Signal.WINDOW_FAULTED, { error_type: errorClass(ev.reason), source: WindowFaultedSource.REJECTION, where: "unknown" });
  });
  const registry = new PaneRegistry({ makeClient: () => new BrowserSubstrateClient() });
  const controller = registry.spawn(1); // pane 1 is the initial view
  // Pane 1 is created here, before the App draws it, so its PANE_OPENED is written here (sprint 377): a
  // reload's attach below is pane 1's session, and its record must come after the pane's (Layer 3).
  emitSignal(Signal.PANE_OPENED, { pane_id: 1, cause: PaneOpenedCause.START }, { pane_id: 1 });
  (window as unknown as { __vm: PaneRegistry }).__vm = registry;

  // Ring-buffer every pane's typed events. The parity harness reads
  // this to compare vocabulary; a developer inspecting DevTools sees
  // the last 500 tags with paneId attached so bleed shows up.
  interface TapeEntry { paneId: number; tag: string; payload: Record<string, unknown>; at: number; }
  const tape: TapeEntry[] = [];
  (window as unknown as { __vmTape: TapeEntry[] }).__vmTape = tape;
  registry.onEvent((ev) => {
    tape.push(ev);
    if (tape.length > 500) tape.splice(0, tape.length - 500);
  });

  controller.loadDriverRoster().catch(() => undefined);
  controller.loadLiveSessions().catch(() => undefined);
  controller.loadRecentWorkspaces().catch(() => undefined);
  controller.loadBundleRoster().catch(() => undefined);

  // Bookmarkable sessions: /?session=<id> attaches on load. The URL
  // stays put; hitting refresh continues on the same record.
  const params = new URLSearchParams(window.location.search);
  const attachId = params.get("session");
  if (attachId) {
    controller.attachExisting(attachId).catch(() => undefined);
  }

  // Sprint 083 — Electron top-bar cooperation. `?electron=1` (set by electron/main.ts loadURL)
  // flips body[data-electron="1"]. Rules scoped to it then hide the decorative dot triads (Chromium
  // draws the real traffic-lights over that same inset under titleBarStyle:'hiddenInset'),
  // left-pads the top bar by 78px to yield the inset, and marks the bar draggable while keeping
  // interactive descendants no-drag (the name renames on double-click, which a drag region would
  // take as a window zoom). The rules it turns on are in web/app/window.css (sprint 332: a <style>
  // element written here would break the page's Content-Security-Policy, style-src 'self').
  if (params.get("electron") === "1") document.body.setAttribute("data-electron", "1");

  // Every pane controller's snapshot goes to the window's store; the component reads it there.
  registry.subscribe((paneId, snap) => mirrorSnapshot(paneId, snap));

  // The window's keys, Ctrl+C's interrupt among them, are web/app/keymap.ts (sprint 327).

  const host = document.getElementById("root");
  if (!host) throw new Error("reveal.html has no #root");
  ReactDOMClient.createRoot(host).render(React.createElement(App));

  // Sprint 080 — native menu wire-up. Only present when running
  // inside Electron. In a plain Chrome tab window.native is
  // undefined and the block no-ops. The two OS-integration touch
  // points named in PLAN v2 §2.3 land here (menu) and in the deep-
  // link addition Sprint 081 makes.
  interface NativeBridge {
    isElectron?: boolean;
    onMenuCommand?: (cb: (command: string, payload: unknown) => void) => (() => void);
    onDeepLink?: (cb: (url: string) => void) => (() => void);
  }
  const nativeBridge = (window as unknown as { native?: NativeBridge }).native;
  if (nativeBridge?.onMenuCommand) {
    nativeBridge.onMenuCommand((command, payload) => {
      // Commands sent before the component mounts wait in the channel for it.
      if (command === "toggle-meta" || command === "toggle-assays" || command === "settings" || command === "close-pane" || command === "open") {
        sendCommand(command);
      } else if (command === "open-record") {
        const rec = payload as { path?: string } | null;
        if (rec?.path) controller.attachRecordRoot(rec.path, RecordOpenedHow.OPEN_RECORD).catch(() => undefined);
      } else if (command === "close-window") {
        // Handled main-side; nothing renderer needs to do.
      }
    });
  }

  // Sprint 081 — deep-link wire-up. The second of the two OS-
  // integration touch points named in PLAN v2 §2.3. Guarded so
  // plain-browser tabs no-op.
  if (nativeBridge?.onDeepLink) {
    nativeBridge.onDeepLink((url) => {
      const match = url.match(/^substrate:\/\/record\/(.+)$/);
      if (!match) return;
      const recordRoot = decodeURIComponent(match[1]);
      controller.attachRecordRoot(recordRoot, RecordOpenedHow.DEEP_LINK).catch(() => undefined);
    });
  }

  console.info("[reveal] window rendered. Read window.__vm.snapshot() in DevTools.");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
