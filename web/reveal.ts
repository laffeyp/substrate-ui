// web/reveal.ts — the prototype-v7 shell's boot script.
//
// dc-runtime + support.js mount the visible page from `<x-dc>` and the
// inline `<script type="text/x-dc">` Component. This module runs after
// that, builds one SessionController, hangs it on `window.__vm`, and
// keeps the DevTools console reachable. Phase 4 binds each of the
// prototype's template fields to controller state; Phase 3 only
// proves the two are alive in the same page.

import { SessionController, BrowserSubstrateClient } from "./vm";

const controller = new SessionController(new BrowserSubstrateClient());
(window as unknown as { __vm: SessionController }).__vm = controller;

controller.loadDriverRoster().catch(() => undefined);
controller.loadLiveSessions().catch(() => undefined);
controller.loadRecentWorkspaces().catch(() => undefined);

console.info(
  "[reveal] SessionController booted. Read window.__vm.snapshot() in DevTools.",
);
