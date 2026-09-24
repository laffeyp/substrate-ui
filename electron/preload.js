// electron/preload.js
// Sprint 078 — tiny placeholder for the Electron wrapping's
// preload. Exposes window.native so the renderer can detect it is
// running inside Electron. Sprint 080 grows this to carry menu-
// command events; Sprint 081 grows it to carry deep-link events.
//
// Under sandbox: true (webPreferences), this file imports only
// `electron` and Electron's small sandboxed allowlist — nothing
// under node:fs, node:child_process, or the wider Node built-in
// set. contextBridge.exposeInMainWorld is the only way to reach
// the renderer.

const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("native", {
  platform: process.platform,
  isElectron: true,
});
