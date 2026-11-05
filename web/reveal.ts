// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// web/reveal.ts — the prototype-v7 shell's boot script.
//
// Runs after dc-runtime + support.js render the page from `<x-dc>`.
// Builds the pane registry, exposes it as `window.__vm`, and hands each
// pane controller's snapshot and the menu's commands to the window
// through web/app/state/shell.ts, which the component subscribes to
// (sprints 211-212; it reached the component's React fiber before).

import * as React from "react";
import * as ReactDOMClient from "react-dom/client";
import { BrowserSubstrateClient, PaneRegistry } from "./vm";
import { Transcript } from "./reveal/transcript";
import { mirrorSnapshot, sendCommand } from "./app/state/shell";
import { createMountRegistry } from "./app/mount";
import { Dialogs } from "./app/Dialogs";
import { FirstRun } from "./app/FirstRun";
import { Footer } from "./app/Footer";
import { TopBar } from "./app/TopBar";
import { RecordsPage } from "./app/RecordsPage";
import { AssayPage } from "./app/AssayPage";
import { InputBar } from "./app/InputBar";
import { FindBar } from "./app/FindBar";
import { PanePicker } from "./app/PanePicker";
import { StreamLens } from "./app/StreamLens";
import { SideGraph } from "./app/SideGraph";
import { StructureLens } from "./app/StructureLens";
import { ActivityLine, TaskRows, type PaneView } from "./app/ActivityLine";

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

  // Ctrl+C over a prompt input interrupts the in-flight turn, matching
  // the classic shell's behavior. A selection in the input still gets
  // native copy — only a caret-only Ctrl+C fires the interrupt.
  window.addEventListener("keydown", (ev) => {
    if (ev.key !== "c" && ev.key !== "C") return;
    if (!(ev.ctrlKey || ev.metaKey)) return;
    const active = document.activeElement;
    if (!active || (active.tagName !== "INPUT" && active.tagName !== "TEXTAREA")) return;
    const input = active as HTMLInputElement | HTMLTextAreaElement;
    if (typeof input.selectionStart === "number"
      && typeof input.selectionEnd === "number"
      && input.selectionStart !== input.selectionEnd) return;
    ev.preventDefault();
    controller.interruptTurn();
  });

  // Atom-transcript mount, per pane, per view. dc-runtime iterates
  // <sc-for panes> to emit one <div data-vm-transcript-mount> per pane;
  // reveal.ts iterates every match, and every match receives its own
  // React root bound to that pane's controller. dc-runtime's own
  // reconciler treats the mount div as an empty leaf and clears its
  // children on each commit, so a MutationObserver on document.body
  // watches for those clears and re-attaches the nested atom root.
  interface Attached { host: HTMLElement; root: ReactDOMClient.Root; inner: HTMLElement; paneId: number; view: "terminal" | "reveal"; }
  const attached = new Map<string, Attached>();
  const keyFor = (view: "terminal" | "reveal", paneId: number) => `${view}:${paneId}`;
  const readPaneId = (host: HTMLElement): number => {
    const raw = host.getAttribute("data-pane-id");
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : 1;
  };
  const attachOne = (host: HTMLElement, view: "terminal" | "reveal") => {
    const paneId = readPaneId(host);
    const key = keyFor(view, paneId);
    const existing = attached.get(key);
    if (existing && existing.host === host && host.contains(existing.inner)) return;
    if (existing) {
      try { existing.root.unmount(); } catch (_) { /* already gone */ }
    }
    const inner = document.createElement("div");
    inner.setAttribute("data-vm-atom-root", view);
    inner.setAttribute("data-pane-id", String(paneId));
    host.appendChild(inner);
    const root = ReactDOMClient.createRoot(inner);
    root.render(React.createElement(Transcript, { paneId, view }));
    attached.set(key, { host, root, inner, paneId, view });
    console.info(`[reveal] transcript root mounted (${view}, pane ${paneId})`);
  };
  const check = () => {
    const seen = new Set<string>();
    const terms = document.querySelectorAll<HTMLElement>('[data-vm-transcript-mount="terminal"]');
    terms.forEach((host) => { seen.add(keyFor("terminal", readPaneId(host))); attachOne(host, "terminal"); });
    const revs = document.querySelectorAll<HTMLElement>('[data-vm-transcript-mount="reveal"]');
    revs.forEach((host) => { seen.add(keyFor("reveal", readPaneId(host))); attachOne(host, "reveal"); });
    // Retire roots for panes that no longer have a mount in the DOM.
    for (const [key, rec] of attached) {
      if (!seen.has(key)) {
        try { rec.root.unmount(); } catch (_) { /* already gone */ }
        attached.delete(key);
      }
    }
  };
  check();
  const observer = new MutationObserver(check);
  observer.observe(document.body, { childList: true, subtree: true });

  // Areas moved to React mount through the registry (web/app/mount.ts; sprint 215). A host is a
  // `data-app-mount` div in reveal.html; a kind whose host is not on the page mounts nothing.
  const mounts = createMountRegistry(document);
  // 13px is the transcript's default size, the template's `transcriptFontSize` default.
  mounts.register({ name: "dialogs", selector: '[data-app-mount="dialogs"]', key: () => "window",
    render: () => React.createElement(Dialogs, { defaultFontSize: 13 }) });
  mounts.register({ name: "top-bar", selector: '[data-app-mount="top-bar"]', key: () => "window",
    render: () => React.createElement(TopBar) });
  mounts.register({ name: "records", selector: '[data-app-mount="records"]', key: () => "window",
    render: () => React.createElement(RecordsPage) });
  mounts.register({ name: "assays", selector: '[data-app-mount="assays"]', key: () => "window",
    render: () => React.createElement(AssayPage) });
  // One input bar per pane and view; the bar keeps each pane's draft in its store (sprint 261).
  mounts.register({ name: "input-bar", selector: '[data-app-mount="input-bar"]',
    key: (host) => (host.getAttribute("data-view") ?? "") + ":" + (host.getAttribute("data-pane-id") ?? ""),
    render: (host) => React.createElement(InputBar, { paneId: Number(host.getAttribute("data-pane-id")) }) });
  // The bar line and the task rows, per pane and view (sprint 268).
  const paneView = (host: HTMLElement) => ({ paneId: Number(host.getAttribute("data-pane-id")), view: (host.getAttribute("data-view") === "meta" ? "meta" : "panes") as PaneView });
  const paneViewKey = (host: HTMLElement) => (host.getAttribute("data-view") ?? "") + ":" + (host.getAttribute("data-pane-id") ?? "");
  mounts.register({ name: "activity", selector: '[data-app-mount="activity"]', key: paneViewKey, render: (host) => React.createElement(ActivityLine, paneView(host)) });
  mounts.register({ name: "tasks", selector: '[data-app-mount="tasks"]', key: paneViewKey, render: (host) => React.createElement(TaskRows, paneView(host)) });
  mounts.register({ name: "find", selector: '[data-app-mount="find"]', key: paneViewKey, render: (host) => React.createElement(FindBar, { view: paneView(host).view }) });
  // The pane picker lays itself out in its pane's flex column, so its root takes no box (sprint 286).
  mounts.register({ name: "picker", selector: '[data-app-mount="picker"]', key: (host) => host.getAttribute("data-pane-id") ?? "", contents: true,
    render: (host) => React.createElement(PanePicker, { paneId: Number(host.getAttribute("data-pane-id")) }) });
  // Meta's stream lens draws its legend and rows in the stream's scroller (sprint 292).
  mounts.register({ name: "stream", selector: '[data-app-mount="stream"]', key: () => "window", contents: true,
    render: () => React.createElement(StreamLens) });
  // Meta's side graph sits above the stream's scroller in meta's column (sprint 297).
  mounts.register({ name: "side-graph", selector: '[data-app-mount="side-graph"]', key: () => "window", contents: true,
    render: () => React.createElement(SideGraph) });
  // Meta's structure lens draws in the stream's scroller in its mode (sprint 302).
  mounts.register({ name: "structure", selector: '[data-app-mount="structure"]', key: () => "window", contents: true,
    render: () => React.createElement(StructureLens) });
  mounts.register({ name: "footer", selector: '[data-app-mount="footer"]', key: () => "window",
    render: () => React.createElement(Footer) });
  mounts.register({ name: "first-run", selector: '[data-app-mount="first-run"]', key: () => "window",
    render: () => React.createElement(FirstRun) });
  mounts.start();

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

  console.info("[reveal] SessionController booted. Read window.__vm.snapshot() in DevTools.");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
