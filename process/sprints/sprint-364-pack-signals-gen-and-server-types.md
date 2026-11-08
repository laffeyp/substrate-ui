# Sprint 364 — the packaged app carries `signals_gen.py`; the build type-checks `server.py`

```yaml
---
id: 364
status: closed
phase: SDD re-centre
pass_kind: architecture
---
```

## scope

The packaged build from sprint 363 (`ce3e66c`) does not start. Its server exits at import with `ModuleNotFoundError: No module named 'signals_gen'`, because `electron-builder.config.js` lists each Python file the server imports and sprint 363 did not add `signals_gen.py`. Main then logs `startup failed: port readback timed out after 5000ms` and opens no window, and `main_signals` fails against the package on `firstWindow`. The same build packed a stale `dist-main/check_signal.js`, because `tsc -p electron` writes into `dist-main/` without clearing it.

This sprint:

1. Adds `signals_gen.py` to `asarUnpack` and `files` in `electron-builder.config.js`.
2. Clears `dist-main/` before main's compile in `npm run build` and `npm run electron`.
3. Fixes mypy's 12 existing errors in `server.py`, each at its own line, with `typing.cast` or a narrowed local. No runtime path changes.
4. Adds `uv run --project ../substrate mypy server.py` to `npm run build`, so the server's `Signal` and `StrEnum` names are checked by a type checker, as the window's and main's names are by `tsc`.

## context_files

- `../sdd-kit-3/AGENTS.md`; `WORKING_AGREEMENT.md` (build commands)
- `process/sprints/sprint-363-vocabulary-names-typed.md` (its result: "No type checker runs on `server.py`")
- `electron-builder.config.js`, `package.json`, `server.py`

## signal contract

### Emits

No new tag. Boot's records are the ones sprint 363 declared: main's `APP_BOOTED` … `APP_QUIT_COMPLETED` and the server's `SERVER_STARTED` … `SERVER_STOPPED`, now from the packaged app.

### Invariants

- No behaviour, text or layout changes. The `server.py` diff holds only casts, one narrowed local and one widened parameter annotation.

## artifact contract

### Files modified

- `electron-builder.config.js`, `package.json`, `server.py`, `WORKING_AGREEMENT.md` (build line; prior copy in `process/archive/WORKING_AGREEMENT-2026-11-07-v0.16.md`)

Four files: two packaging files and the server's type fixes, one concept (the build checks and ships what sprint 363 generated). Hard rule 6 excess logged in the hand-author log.

### Command exit codes

`uv run --project ../substrate mypy server.py` 0; `npm run build` 0; `ruff check`, `ruff format --check` 0; `npm run test:unit` 0; `npm run test:py` 0; `npm run pack:dev` 0.

## observation contract

The six packaged gates against `dist-electron/mac-arm64/Substrate.app`: `main_signals`, `pane_signals`, `trace_files`, `lifecycle_gates`, `transcript_follow`, `run_panes`. Each exits 0. `app.asar` lists no `dist-main/check_signal.js`; `app.asar.unpacked/` holds `signals_gen.py`.

Plant: a type error in `server.py` (a `Signal` member that does not exist) fails `npm run build` at the mypy step.

## done criteria

The packaged app boots and passes its gates, and a wrong name in the server fails the build.

## result

- **Packaging.** `app.asar.unpacked/` now holds `signals_gen.py`. `app.asar` lists five files under `dist-main/` and no `check_signal.js`. The packaged `server.py` is byte-identical to the source (`cmp` 0).
- **Server types.** mypy found 12 errors in `server.py`, now 0. The fixes:
  - five `cast(SessionRegistry, ...)` calls, where the registry is set at startup;
  - one `cast(SessionManifest, ...)`;
  - two `cast(Any, manifest)` after an `isinstance(..., msgspec.Struct)` check;
  - one `cast(tuple[Any, ...], ...)` on the TCP server address;
  - one narrowed local in `_load_daemon_config`;
  - `_io`'s parameter annotated `list[dict[str, Any]]`.

  No runtime path changed.
- **Plant.** `Signal.TURN_ACCEPTD`, written at both `TURN_ACCEPTED` emits, fails `npm run build` at mypy (exit 1, two `attr-defined` errors). Restored, mypy exits 0.
- **Commands:** mypy 0; `npm run build` 0; `npm run test:unit` 147 passed; `npm run test:py` 297 passed, 5 skipped; `ruff check`, `ruff format --check` 0; `gen_signals.py --check` 0; `npm run pack:dev` 0.
- **Packaged gates:** `main_signals`, `pane_signals`, `trace_files`, `lifecycle_gates`, `transcript_follow`, `run_panes` all exit 0. The first two runs of `main_signals` against the sprint 363 package failed on `firstWindow`; the first also hung after its failure and was stopped.
- **Rubber Duck Pass**, on `trace_files`' packaged trace (boot `20261108-060739-2de367`):
  - main writes 9 records from `APP_BOOTED` to `APP_QUIT_COMPLETED`, and the server writes 6 from `SERVER_STARTED` to `SERVER_STOPPED`;
  - window 1 writes 118 records, including `PICKER_FOLDER_ARMED`;
  - session `s_b2fe7fd9fe3a4a288911514c` is created and acked, and turn 0 is accepted and acked;
  - 41 received entries are each drawn or skipped (T4);
  - `main_signals`' `SERVER_BOUND` port 61005 equals `SERVER_STARTED`'s.

  Observations: none in the six categories. Before this fix, a direct launch of the sprint 363 package logged the server's `ModuleNotFoundError` and `startup failed: port readback timed out after 5000ms`, and opened no window. Resolved here.
