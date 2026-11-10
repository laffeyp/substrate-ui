// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// electron/preload.ts
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

import { contextBridge, ipcRenderer } from "electron";

// Menu-command dispatch. Every menu item in electron/menu.ts that
// carries a click handler calls webContents.send("menu:<command>",
// payload). The renderer subscribes via window.native.onMenuCommand.
// The wrapper delivers only the parsed command + payload; the raw
// IpcRendererEvent stays inside the preload per the Electron 44
// security guide's approved contextBridge pattern.
const menuListeners = new Set<any>();
const deepLinkListeners = new Set<any>();

ipcRenderer.on("menu:open-record", (_e, p) => dispatchMenu("open-record", p));
ipcRenderer.on("menu:open", (_e, p) => dispatchMenu("open", p));
ipcRenderer.on("menu:close-pane", (_e, p) => dispatchMenu("close-pane", p));
ipcRenderer.on("menu:save", (_e, p) => dispatchMenu("save", p));
ipcRenderer.on("menu:undo", (_e, p) => dispatchMenu("undo", p));
ipcRenderer.on("menu:redo", (_e, p) => dispatchMenu("redo", p));
ipcRenderer.on("menu:close-window", (_e, p) => dispatchMenu("close-window", p));
ipcRenderer.on("menu:toggle-meta", (_e, p) => dispatchMenu("toggle-meta", p));
ipcRenderer.on("menu:toggle-assays", (_e, p) => dispatchMenu("toggle-assays", p));
ipcRenderer.on("menu:toggle-editor", (_e, p) => dispatchMenu("toggle-editor", p));
ipcRenderer.on("menu:editor-dock", (_e, p) => dispatchMenu("editor-dock", p));
ipcRenderer.on("menu:editor-swap", (_e, p) => dispatchMenu("editor-swap", p));
ipcRenderer.on("menu:editor-focus", (_e, p) => dispatchMenu("editor-focus", p));
ipcRenderer.on("menu:settings", (_e, p) => dispatchMenu("settings", p));
ipcRenderer.on("deep-link", (_e, url) => dispatchDeepLink(url));

function dispatchMenu(command, payload) {
  for (const cb of menuListeners) {
    try { cb(command, payload); }
    catch (err) { console.error("[native] menu listener threw", err); }
  }
}

function dispatchDeepLink(url) {
  for (const cb of deepLinkListeners) {
    try { cb(url); }
    catch (err) { console.error("[native] deep-link listener threw", err); }
  }
}

contextBridge.exposeInMainWorld("native", {
  platform: process.platform,
  isElectron: true,
  onMenuCommand: (cb) => {
    menuListeners.add(cb);
    return () => menuListeners.delete(cb);
  },
  onDeepLink: (cb) => {
    deepLinkListeners.add(cb);
    return () => deepLinkListeners.delete(cb);
  },
  // Sprint 085 followup — renderer-triggered window close, used when
  // Cmd-W closes the last remaining pane and the app should exit.
  closeWindow: () => ipcRenderer.send("native:close-window"),
  // Sprint 086 — folder picker for "Add workspace" on the Records
  // surface. Returns the picked path or null on cancel.
  pickFolder: () => ipcRenderer.invoke("native:pick-folder"),
  openRecordDialog: () => ipcRenderer.invoke("native:open-record"),
  // The window's vocabulary records; main writes them to this launch's trace folder (window-<id>.jsonl).
  signal: (record) => ipcRenderer.send("native:signal", record),
});

