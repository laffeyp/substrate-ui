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

const { contextBridge, ipcRenderer } = require("electron");

// Menu-command dispatch. Every menu item in electron/menu.js that
// carries a click handler calls webContents.send("menu:<command>",
// payload). The renderer subscribes via window.native.onMenuCommand.
// The wrapper delivers only the parsed command + payload; the raw
// IpcRendererEvent stays inside the preload per the Electron 44
// security guide's approved contextBridge pattern.
const menuListeners = new Set();
const deepLinkListeners = new Set();

ipcRenderer.on("menu:new-session", (_e, p) => dispatchMenu("new-session", p));
ipcRenderer.on("menu:open-record", (_e, p) => dispatchMenu("open-record", p));
ipcRenderer.on("menu:close-window", (_e, p) => dispatchMenu("close-window", p));
ipcRenderer.on("menu:toggle-reveal", (_e, p) => dispatchMenu("toggle-reveal", p));
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
});

