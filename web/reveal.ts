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

function boot(): void {
  const registry = new PaneRegistry({ makeClient: () => new BrowserSubstrateClient() });
  const controller = registry.spawn(1); // pane 1 is the initial view
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

  // Sprint 083 — Electron top-bar cooperation. `?electron=1` (set by
  // electron/main.js loadURL) flips body[data-electron="1"]. A single
  // scoped stylesheet then hides the decorative dot triads (Chromium
  // draws the real traffic-lights over that same inset under
  // titleBarStyle:'hiddenInset'), left-pads the top bar
  // by 78px to yield the inset, and marks the bar draggable while
  // keeping interactive descendants no-drag (the name renames on double-click, which a drag
  // region would take as a window zoom).
  if (params.get("electron") === "1") {
    document.body.setAttribute("data-electron", "1");
    const style = document.createElement("style");
    style.setAttribute("data-electron-shell", "1");
    style.textContent = [
      'body[data-electron="1"] [data-fake-lights]{display:none!important}',
      'body[data-electron="1"] [data-top-bar]{padding-left:78px!important;min-height:38px!important;box-sizing:border-box!important;-webkit-app-region:drag}',
      'body[data-electron="1"] [data-top-bar] input,',
      'body[data-electron="1"] [data-top-bar] button,',
      'body[data-electron="1"] [data-top-bar] [style*="cursor:pointer"],',
      'body[data-electron="1"] [data-top-bar] [style*="cursor: pointer"],',
      // React writes inline styles with a space after the colon ("cursor: text"); the crumb's
      // double-click rename needs it out of the drag region (sprint 227).
      'body[data-electron="1"] [data-top-bar] [style*="cursor:text"],',
      'body[data-electron="1"] [data-top-bar] [style*="cursor: text"]{-webkit-app-region:no-drag}',
    ].join("\n");
    document.head.appendChild(style);
  }

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
      if (command === "toggle-meta" || command === "toggle-assays" || command === "settings" || command === "close-pane") {
        sendCommand(command);
      } else if (command === "open-record") {
        const rec = payload as { path?: string } | null;
        if (rec?.path) controller.attachRecordRoot(rec.path).catch(() => undefined);
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
      controller.attachRecordRoot(recordRoot).catch(() => undefined);
    });
  }

  console.info("[reveal] window rendered. Read window.__vm.snapshot() in DevTools.");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
