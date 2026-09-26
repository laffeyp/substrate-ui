// electron/menu.js
// Sprint 080 — native macOS menu bar.
//
// Every menu item that carries a command (File · View items with an
// id starting with "menu-") dispatches to the renderer via
// webContents.send("menu:<command>", payload). The renderer's
// preload exposes window.native.onMenuCommand for the shell to
// subscribe. Standard Edit / Window / Help entries use Electron's
// built-in roles.

const { Menu, app, dialog } = require("electron");

function send(win, command, payload) {
  if (win && !win.isDestroyed()) win.webContents.send("menu:" + command, payload ?? null);
}

function buildTemplate(getWin) {
  const isMac = process.platform === "darwin";
  const appName = "substrate";
  return [
    ...(isMac ? [{
      label: appName,
      submenu: [
        { role: "about" },
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
          id: "menu-new-session",
          label: "New Session",
          accelerator: "CmdOrCtrl+N",
          click: () => send(getWin(), "new-session"),
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
          id: "menu-toggle-reveal",
          label: "Toggle Reveal",
          accelerator: "Ctrl+`",
          click: () => send(getWin(), "toggle-reveal"),
        },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "reload" },
        { role: "toggleDevTools" },
      ],
    },
    { role: "windowMenu" },
    {
      role: "help",
      submenu: [
        {
          label: "About substrate",
          click: () => app.showAboutPanel?.(),
        },
      ],
    },
  ];
}

function installMenu(getWin) {
  const template = buildTemplate(getWin);
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  return menu;
}

module.exports = { installMenu };
