# Sprint 080 — native macOS menu bar + `window.native.onMenuCommand`

```yaml
---
id: 080
status: closed
opened_at: 2026-09-24
closed_at: 2026-09-24
closed_by: agent
commit: 9f8738d
phase: 9
pass_kind: implementation
---
```

## scope

First of the two OS-integration wire-up sites named in PLAN v2 §2.3. macOS menu bar drives shell actions through a `contextBridge`-safe channel.

## deliverables (from the commit)

- `electron/menu.js` — new. `Menu.buildFromTemplate` with:
  - App menu (macOS): about, services, hide, quit (Electron roles).
  - File: New Session (⌘N), Open Record… (⌘O), Close Window.
  - Edit: `editMenu` role.
  - View: Toggle Reveal (Ctrl-\`), zoom roles, reload, toggleDevTools.
  - Window: `windowMenu` role.
  - Help: About substrate.

  Every custom item carries an id (`menu-new-session` etc.) so Playwright can trigger via `Menu.getMenuItemById().click()`. Click handlers dispatch via `webContents.send("menu:<command>", payload)`.

- `electron/main.js` — imports `{ installMenu }` from `./menu` and calls it after `createWindow`, threading a `getWin` closure so the menu always dispatches at the current `mainWindow`.

- `electron/preload.js` — grew to carry menu-command events. Four `ipcRenderer.on` hooks (`menu:new-session`, `menu:open-record`, `menu:close-window`, `menu:toggle-reveal`) dispatch to a `Set` of listeners registered via `window.native.onMenuCommand(cb)`. The wrapper delivers only `command + payload`; the raw `IpcRendererEvent` stays inside the preload per the Electron 44 security guide's approved `contextBridge` pattern. Still under `sandbox: true`; only `electron` is imported.

- `web/reveal.ts` — first of the two OS-integration wire-up sites. If `window.native.onMenuCommand` exists, subscribe. `new-session` → `component._split('right')` then `_bindPane(newest.id, '~/.substrate/sandbox')` so the pane renders its transcript mount instead of the workspace picker. `toggle-reveal` → `component.setState({ revealed: !revealed, surface: null })`. `open-record` → `controller.attachRecordRoot(payload.path)`. `close-window` handled main-side. Optional-chain guards (`nativeBridge?.onMenuCommand`) so plain-browser tabs no-op.

- `harness/_electron_sprint080_exit.ts` — launches `electron .`, installs a `__menuLog` hook via the same `window.native.onMenuCommand` the shell uses, fires `menu-new-session` via `app.evaluate(Menu.getMenuItemById().click())`, asserts panes 1→2 within 3 s. Fires `menu-toggle-reveal` and asserts `state.revealed` false→true. Verifies both events appear in the renderer's menu log. PASS.

## exit gates (verified by the commit)

- typecheck ✓
- lint ✓
- 14/14 unit ✓
- `[vm-vocab-parity] OK — vocabulary 0.1 (30 tags: 30 live + 0 retired, locked=true); code emits 30 distinct live tag(s), all locked.`
- smoke:vm 11/11 ✓
- pixel:diff flag-on 12/12 clean under the same tolerances Phase 8 pinned; the `web/reveal.ts` addition is a guarded no-op in plain browsers.

## follow-up

Sprint 081: `substrate://` deep-link protocol handler + the second `web/reveal.ts` wire-up site.

## artifact

Commit `9f8738d` (2026-09-24 17:13:14 -0700). Card is the retro-summary Peter asked for on 2026-09-25.
