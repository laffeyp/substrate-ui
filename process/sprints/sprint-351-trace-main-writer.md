# Sprint 351 — the trace on disk: main's writer

```yaml
---
id: 351
status: closed
phase: SDD re-centre
pass_kind: functional
---
```

## scope

Electron main writes the trace of each launch (plan `process/planning/2026-11-05-sdd-signals/PLAN-2026-11-05-sdd-signals-r3.md`, item 2, first of three sprints). At launch main mints a boot id and makes `<logs>/traces/<boot_id>/`. It writes its own records to `main.jsonl`, opened by `APP_BOOTED` and `TRACE_OPENED`, and closed by `APP_QUIT_COMPLETED` with the counts. It writes each window's records, received over `native:signal`, to `window-<window_id>.jsonl`. Every line carries the record context main knows: `boot_id`, `process`, `proc_seq`, `wall`, `window_id`. A line that cannot be written is counted, and the next write emits `TRACE_LOST`. A file stops at 50 MB and counts what it drops. The last 20 launch folders are kept. The server gets the folder and boot id in its environment. Two files: `electron/main.js`, `electron/preload.js`. This replaces the uncommitted single-file sink.

## context_files

- `web/vm/signals/versions/0.7.json` (`APP_BOOTED`, `TRACE_OPENED`, `TRACE_LOST`, `APP_QUIT_COMPLETED`, `record_context`)
- `electron/main.js`, `electron/preload.js`; `WORKING_AGREEMENT.md` registry

## signal contract

### Emits

`APP_BOOTED`, `TRACE_OPENED` (process main), `TRACE_LOST` (on a write failure), `APP_QUIT_COMPLETED`.

### Invariants

S1: `APP_BOOTED` is the first line of `main.jsonl`. S2: `APP_QUIT_COMPLETED` is its last line on a clean quit. No payload holds content (E1).

## artifact contract

- `electron/main.js` contains `traces`, `APP_BOOTED`, `TRACE_LOST`, `SUBSTRATE_TRACE_DIR`.
- `electron/preload.js` exposes `signal`.
- `npm run build` 0; `npm run test:unit` 0.

## observation contract

Launch the source app (`npm run electron` with an isolated `SUBSTRATE_HOME` and user-data dir, through the gates' `launchArgs`). Open a pane, let the window emit, then quit. Read `<logs>/traces/<boot_id>/`:
- `main.jsonl`: first line `APP_BOOTED` with the build fields; a `TRACE_OPENED`; last line `APP_QUIT_COMPLETED` with `signals_lost` 0.
- `window-<id>.jsonl`: the window's records in `proc_seq` order, each with `boot_id` and `window_id`.
- Planted fault: make the folder unwritable after boot, and the next good write carries the loss as `TRACE_LOST`.

## result

- **Built.** `electron/main.js`: the boot id, `<logs>/traces/<boot_id>/`, `main.jsonl` (`APP_BOOTED`, `TRACE_OPENED`, `APP_QUIT_COMPLETED` at `will-quit`), `window-<id>.jsonl` from `native:signal`, the record context main knows (`boot_id`, `process`, `proc_seq`, `wall`, `window_id`), synchronous appends with every failure counted, `TRACE_LOST` (a file's first loss at once, later ones as one count on its next good write), a 50 MB cap per file (`SUBSTRATE_TRACE_CAP` overrides it for tests), the last 20 launch folders kept, `SUBSTRATE_BOOT_ID` and `SUBSTRATE_TRACE_DIR` passed to the server. The uncommitted single-file sink is gone. `electron/preload.js`: `native.signal`. `web/vm/instrumentation/sdd.ts`: the window hands each record to `native.signal` (a third file, past the two-file rule: the window's half of the hand-off, without which the window file is empty; its own stamping is sprint 352). Gate `harness/shakeout/trace_files.ts`, in `gates:electron`, normal and planted.
- **Commands.** `npm run build` 0; `npm run test:unit` 143 passed; gates `trace_files` 0, `TRACE_PLANT=cap trace_files` 0, `model_half_starts_session` 0, `choose_folder_starts_session` 0, `lifecycle_gates` 0.
- **Planted faults.** A folder made read-only after boot proved nothing (an open descriptor keeps writing on macOS), so it was replaced by the cap seam. The cap run then showed the first design reporting each dropped line as its own `TRACE_LOST`; fixed to one report per loss run. Final: one `TRACE_LOST` for the window, `signals_lost` 6.
- **Rubber Duck Pass** (on the printed trace of one run). `APP_BOOTED` (app 1.1.0, app commit `ae4295383134`, kernel `5f96b0a7b4b1`, vocab 0.7, source mode, store from the environment) opened the launch; `TRACE_OPENED` for main; the window wrote `SESSIONS_LOADED`, `WORKSPACES_LOADED`, `BUNDLE_ROSTER_LOADED`, `DRIVER_ROSTER_LOADED` (count 0: the gate's offline roster) and `PICKER_FOLDER_ARMED` (pane 1, the default sandbox, from a row), proc_seq 0–4; `APP_QUIT_COMPLETED` (server exit 0, one window, 7 written, 0 lost) closed it. Observations: payload anomaly, the window's records carry no `pane_id` in their context (sprint 352); payload anomaly, they also carry the emitter's own `ts`, `category` and `stratum` beside the context (recorded: harmless, and the reader can use `category`); `app_commit` names HEAD while the tree held uncommitted edits (deferred: the build's dirty state is item 2's next sprint to record). No order or timing violation.
