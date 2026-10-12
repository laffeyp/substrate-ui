// electron/menu.js
// Sprint 080 — native macOS menu bar.
//
// Every menu item that carries a command (File · View items with an
// id starting with "menu-") dispatches to the focused window's renderer
// via webContents.send("menu:<command>", payload). The renderer's
// preload exposes window.native.onMenuCommand for the shell to
// subscribe. Standard Edit / Window / Help entries use Electron's
// built-in roles. UI sprint 147 checked the bar against Apple's HIG
// ("The menu bar", "Keyboards"); the card lists each item and the
// deviations kept (⌘M toggles meta, not Minimize).
//
// One owner per key. The renderer's keydown owns ⌘M, ⌘, ⌘D, ⌘E and ⌘F;
// the menu owns ⌘N, ⌘O, ⌘W, ⇧⌘W and ⌃⌘F. Meta and Settings… carry no
// accelerator: on macOS Electron cannot show a key without registering
// it (registerAccelerator is Linux/Windows only), and a registered one
// would compete with the renderer's handler for the same press.

const { Menu, dialog } = require("electron");

function send(win, command, payload) {
  if (win && !win.isDestroyed()) win.webContents.send("menu:" + command, payload ?? null);
}

function buildTemplate(getWin, newWindow) {
  const isMac = process.platform === "darwin";
  const appName = "substrate";
  return [
    ...(isMac ? [{
      label: appName,
      submenu: [
        { role: "about" },
        { type: "separator" },
        {
          id: "menu-settings",
          label: "Settings…",
          click: () => send(getWin(), "settings"),
        },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    }] : []),
    {
      label: "File",
      submenu: [
        {
          id: "menu-new-window",
          label: "New Window",
          accelerator: "CmdOrCtrl+N",
          click: () => newWindow(),
        },
        {
          id: "menu-open-record",
          label: "Open Record…",
          accelerator: "CmdOrCtrl+O",
          click: async () => {
            const win = getWin();
            const r = await dialog.showOpenDialog(win, {
              title: "Open Record",
              properties: ["openDirectory"],
              buttonLabel: "Open",
            });
            if (r.canceled || r.filePaths.length === 0) return;
            send(win, "open-record", { path: r.filePaths[0] });
          },
        },
        { type: "separator" },
        {
          // Sprint 085 followup — Cmd-W closes the focused PANE, not
          // the window (standard tab-close convention). The renderer
          // ends the pane's session (like /exit) then removes the pane
          // from the layout; if it was the last pane it falls back to
          // closing the window.
          id: "menu-close-pane",
          label: "Close Pane",
          accelerator: "CmdOrCtrl+W",
          click: () => send(getWin(), "close-pane"),
        },
        {
          id: "menu-close-window",
          label: "Close Window",
          accelerator: "CmdOrCtrl+Shift+W",
          click: () => { const win = getWin(); if (win) win.close(); },
        },
      ],
    },
    { role: "editMenu" },
    {
      label: "View",
      submenu: [
        {
          id: "menu-toggle-meta",
          label: "Meta",
          click: () => send(getWin(), "toggle-meta"),
        },
        { type: "separator" },
        { role: "togglefullscreen" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "reload" },
        { role: "toggleDevTools" },
      ],
    },
    // The Window menu without Minimize's ⌘M: ⌘M toggles meta and panes (renderer keydown).
    // Minimize stays here, by click.
    {
      role: "window",
      submenu: [
        { label: "Minimize", click: () => { const w = getWin(); if (w && !w.isDestroyed()) w.minimize(); } },
        { role: "zoom" },
        { type: "separator" },
        { role: "front" },
      ],
    },
    // About lives in the app menu only; macOS adds the search field here.
    { role: "help", submenu: [] },
  ];
}

function installMenu(getWin, newWindow) {
  const template = buildTemplate(getWin, newWindow);
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  return menu;
}

module.exports = { installMenu };
