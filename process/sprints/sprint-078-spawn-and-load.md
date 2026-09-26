# Sprint 078 — Electron spawn-and-load skeleton

```yaml
---
id: 078
status: closed
opened_at: 2026-09-24
closed_at: 2026-09-24
closed_by: agent
commit: 42e2429
phase: 9
pass_kind: implementation
---
```

## scope

Electron main process spawns `server.py`, polls health, opens a Chromium window pointed at the reveal shell. First runnable dev-`.app`.

## deliverables (from the commit)

- `electron/main.js` — new. `app.whenReady` spawns `uv run python server.py` with `{ detached: true, stdio: ['ignore','pipe','pipe'], env: PYTHONUNBUFFERED=1 }` from the substrate root. Polls `http://127.0.0.1:8765/` every 200 ms for 15 s until 200. Creates a `BrowserWindow` 1440×900, `titleBarStyle: 'hiddenInset'`, `trafficLightPosition {x:12, y:16}`, `backgroundColor #212327`, with `contextIsolation + sandbox + webSecurity + preload`. `loadURL`s `http://127.0.0.1:8765/?atom-transcript=1`. On `window-all-closed` and `before-quit`: `process.kill(-pid, 'SIGTERM')` against the process group, then SIGKILL after 3 s if anything survives. Matches the pattern at `harness/shakeout/lib/server.ts`.
- `electron/preload.js` — new, small. `contextBridge.exposeInMainWorld('native', { platform, isElectron: true })`. Imports only `electron`; nothing outside the sandboxed-preload allowlist. Sprint 080 grows this to carry menu-command events; Sprint 081 grows it to carry deep-link events.
- `package.json` — `"main": "electron/main.js"`, `"electron"` script `"electron ."`.
- `README.md` — new "As a desktop app (Electron)" section under Quickstart naming the `uv` + `substrate` prerequisites and the `npm run electron` command.
- `harness/_electron_sprint078_exit.ts` — Sprint 078's exit test. Kills any pre-existing :8765 listener, launches `electron .` via Playwright's `_electron.launch`, asserts URL loaded with `atom-transcript=1`, waits for `[data-vm-atom-root=terminal]` to appear, confirms :8765 listener during window, closes the window, asserts :8765 free within 3 s of app close. PASS on the first clean run.

## exit gates (verified by the commit)

- typecheck ✓
- lint ✓
- 14/14 unit ✓
- `[vm-vocab-parity] OK — vocabulary 0.1 (30 tags: 30 live + 0 retired, locked=true); code emits 30 distinct live tag(s), all locked.`
- smoke:vm 11/11 ✓

## follow-up

Sprint 079 removes the hard-coded 8765 with `--port 0` + readback so parallel Electron instances stop colliding.

## artifact

Commit `42e2429` (2026-09-24 16:57:11 -0700). Card is the retro-summary Peter asked for on 2026-09-25.
