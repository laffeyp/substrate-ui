# Sprint 356 — Electron main speaks: server, windows, quit, menus, dialogs, links (plan item 4, first area)

```yaml
---
id: 356
status: closed
phase: SDD re-centre
pass_kind: functional
---
```

## scope

Plan item 4, area "main's windows, dialogs, menus". Emit sites for the ten main tags on `web/vm/signals/unemitted.json`:
- `SERVER_SPAWNED`, `SERVER_BOUND`, `SERVER_EXITED`;
- `WINDOW_OPENED`, `WINDOW_CLOSED`;
- `APP_QUIT_REQUESTED`;
- `NAVIGATION_BLOCKED`, `DEEP_LINK_RECEIVED`;
- `MENU_COMMAND_SENT`, `NATIVE_DIALOG_CLOSED`.

Main's records gain a window id in the record context. Files: `electron/main.js`, `electron/menu.js`. Vocabulary v0.10 corrects two causes.

## signal contract

### Emits

The ten tags above.

### Invariants

- S2: `APP_QUIT_COMPLETED` is main's last record on every quit path, `app.exit` included.
- `APP_QUIT_REQUESTED` is written once per launch.
- Window-scoped records carry their window's id.
- T1: `SERVER_BOUND.ms` is at most 5,000.

## observation contract

- `harness/shakeout/main_signals.ts`, the normal rows: boot, three dialogs, two menu commands, a deep link, a blocked navigation, New Window and its close, quit, in order in `main.jsonl`.
- `harness/shakeout/lifecycle_gates.ts`, the failure rows:
  - F8, the backend killed: `SERVER_EXITED expected false`, `APP_QUIT_REQUESTED backend_died`, a `WINDOW_CLOSED` per window, then `APP_QUIT_COMPLETED`;
  - F9 (new), a planted `msgspec.py` on `PYTHONPATH` breaks the server's import: `SERVER_SPAWNED`, no `SERVER_BOUND`, `SERVER_EXITED expected false`, `APP_QUIT_REQUESTED startup_failed`, `APP_QUIT_COMPLETED`.

## done criteria

Every row fires in the packaged app's trace, the normal rows on a normal run and the failure rows under F8 and F9.

## result

- **Built.**
  - `electron/main.js`: the ten emits; `mainRecord` and `traceEmit` take a window id; `closeTrace()` for both quit paths; quit causes.
  - `electron/menu.js`: an `onSent` callback.
  - Vocabulary v0.10 (`0.10.json`, `0.10-rationale.md`, two proposals); `unemitted.json` 38 → 28.
- **Found and fixed while emitting:**
  - The backend-death path (`app.exit`) wrote no `APP_QUIT_COMPLETED`, so S2 failed whenever the backend died.
  - With the closing record added, the window's `WINDOW_CLOSED` was lost after it, and the record still said nothing was lost. The windows now close first, and a record after the close is said on stderr.
- **Commands.** `node --check` 0; `npx tsc -p harness --noEmit` 0; `npm run build` 0; `npm run test:unit` 194 passed; `npm run signals` 0 (v0.10; 60 emitted, 28 pending).
- **Gates.**
  - From source: `main_signals` 0; `lifecycle_gates` 0 (F5–F9); `new_window`, `menu_commands`, `dialogs`, `trace_files`, `choose_folder_starts_session`, `electron_menu`, `electron_deeplink` 0.
  - Packaged (`npm run pack:dev`): `main_signals`, `lifecycle_gates`, `trace_files` 0.
- **Plants**, each exit 1:
  - no closing record on backend death: F8 fails twice;
  - no `startup_failed` cause: F9 fails, with cause `app`;
  - the windows not closed before the record: F8 fails, with no `WINDOW_CLOSED`.
- **Rubber Duck Pass** (`main_signals`, printed). `APP_BOOTED` (vocab 0.10); `TRACE_OPENED`; `SERVER_SPAWNED` (pid 40924); `SERVER_BOUND` (port 61541, 110 ms, within T1's 5 s); `WINDOW_OPENED` boot on window 1; `NATIVE_DIALOG_CLOSED` pick_folder picked, pick_folder cancelled, open_record cancelled, all window 1; `MENU_COMMAND_SENT` toggle-meta twice; `DEEP_LINK_RECEIVED` record, with no window; `NAVIGATION_BLOCKED` external on window 1; `WINDOW_OPENED` menu and `WINDOW_CLOSED` on window 2; `APP_QUIT_REQUESTED` app; `SERVER_EXITED` code 0, expected; `WINDOW_CLOSED` window 1; `APP_QUIT_COMPLETED` (two windows opened, 27 written, 0 lost).
- **Observations:**
  - Order: S2 failed on the backend-death path (resolved here).
  - Payload anomaly: two cause enums named events main cannot know or that cannot happen (resolved, v0.10).
  - A spawn that fails with no pid (`uv` missing in a source run) emits an `error` event that `main.js` does not handle. Recorded; it is behaviour, not instrumentation, and is logged for its own change.
  - No timing or tone anomalies.
