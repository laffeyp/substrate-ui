// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// electron/menu.ts
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
// One owner per key. The renderer's keydown owns ⌘M, ⌘, ⌘D, ⌘E, ⌘F and ⌘3;
// the menu owns ⌘N, ⌘O, ⌘S, ⌘W, ⇧⌘W, ⌘Z, ⇧⌘Z and ⌃⌘F. Meta, Assays and Settings… carry no
// accelerator: on macOS Electron cannot show a key without registering
// it (registerAccelerator is Linux/Windows only), and a registered one
// would compete with the renderer's handler for the same press.

import { Menu } from "electron";

// onSent(command, win): main writes MENU_COMMAND_SENT for each command a window is sent (v0.7).
let onSent: (command: string, win: any) => void = () => {};

function send(win, command, payload?) {
  if (win && !win.isDestroyed()) {
    win.webContents.send("menu:" + command, payload ?? null);
    onSent(command, win);
  }
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
          // F362: the pane picker's "choose folder…" row names ⌘O. The window decides: with the
          // focused pane's picker showing, ⌘O opens the folder chooser; anywhere else it opens
          // this dialog, as before (native:open-record in main.ts).
          click: () => send(getWin(), "open"),
        },
        {
          // Sprint 425 (roadmap r8 E4, the key table): saves the editor's open file; the window refuses it,
          // and writes the refusal, outside the editor.
          id: "menu-save",
          label: "Save",
          accelerator: "CmdOrCtrl+S",
          click: () => send(getWin(), "save"),
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
    // Sprint 426 (roadmap r8, the key table): Undo and Redo send to the window, which routes them: in the
    // editor, the buffer's undo while it has unsaved changes, then HISTORY's step back; elsewhere the page's
    // undo. The rest is what the editMenu role built on macOS (read from the running app, sprint 426).
    {
      label: "Edit",
      submenu: [
        { id: "menu-undo", label: "Undo", accelerator: "CmdOrCtrl+Z", click: () => send(getWin(), "undo") },
        { id: "menu-redo", label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", click: () => send(getWin(), "redo") },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "pasteAndMatchStyle" },
        { role: "delete" },
        { role: "selectAll" },
        { type: "separator" },
        { label: "Substitutions", submenu: [{ role: "showSubstitutions" }, { type: "separator" }, { role: "toggleSmartQuotes" }, { role: "toggleSmartDashes" }, { role: "toggleTextReplacement" }] },
        { label: "Speech", submenu: [{ role: "startSpeaking" }, { role: "stopSpeaking" }] },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          id: "menu-toggle-meta",
          label: "Meta",
          click: () => send(getWin(), "toggle-meta"),
        },
        // The assays page (design D86: ⌘3, which the renderer's keydown owns; sprint 249).
        {
          id: "menu-toggle-assays",
          label: "Assays",
          click: () => send(getWin(), "toggle-assays"),
        },
        // The editor view (sprints 407, 416; spec r6 §4, §5.1; D63): ⌘⇧E belongs to the renderer's
        // keydown, so the item carries no accelerator (the rule above). The three layout items act
        // while the editor is open.
        {
          id: "menu-toggle-editor",
          label: "Editor",
          click: () => send(getWin(), "toggle-editor"),
        },
        { id: "menu-editor-dock", label: "Dock Terminal Right", click: () => send(getWin(), "editor-dock") },
        { id: "menu-editor-swap", label: "Swap Sides", click: () => send(getWin(), "editor-swap") },
        { id: "menu-editor-focus", label: "Focus", click: () => send(getWin(), "editor-focus") },
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

function installMenu(getWin, newWindow, sent) {
  if (sent) onSent = sent;
  const template = buildTemplate(getWin, newWindow);
  const menu = Menu.buildFromTemplate(template as any);
  Menu.setApplicationMenu(menu);
  return menu;
}

export { installMenu };
