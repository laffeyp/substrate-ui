# Sprint 355 — every signal checked where it is spoken; the linter over the whole app (plan item 3)

```yaml
---
id: 355
status: closed
phase: SDD re-centre
pass_kind: functional
---
```

## scope

Plan `process/planning/2026-11-05-sdd-signals/PLAN-2026-11-05-sdd-signals-r3.md`, item 3. The window, Electron main and the server each check every signal they emit against the one vocabulary file of their build, with E6's build posture. `npm run signals` becomes a linter over `web/`, `electron/` and `server.py`, in both directions.

Before this sprint:
- the window checked only the tag name and required fields, and threw in every build, the packaged app included;
- main and the server checked nothing;
- the parity tool read only `emit("…")` in the window's code.

## context_files

- `web/vm/signals/versions/0.8.json`, `0.7-rationale.md` (validator posture, E1–E7), `proposals.json`
- `web/vm/instrumentation/sdd.ts`, `vocabulary.ts`; `electron/main.js`, `electron/preload.js`; `server.py` `_Trace`
- `web/vm/tools/check-vocabulary-parity.ts`; `harness/shakeout/lib/electron.ts`, `harness/shakeout/trace_files.ts`
- `../sdd-kit-3/AGENTS.md`, `grammar/PRINCIPLES.md` (proposal kinds)

## signal contract

### Emits

`SIGNAL_REJECTED` (process window, main, server; problem, field, call_site).

### Invariants

- A rejected record is never written; its `SIGNAL_REJECTED` always is.
- A source or test build raises after writing it; the packaged app does not.
- The three checkers answer every case in `web/vm/signals/checker-cases.json` alike.

## artifact contract

### Files created

- `web/vm/signals/versions/0.9.json`, `0.9-rationale.md`
- `web/vm/signals/checker-cases.json`, `web/vm/signals/unemitted.json`
- `web/vm/instrumentation/check.ts`, `electron/check_signal.js`
- `web/app/__tests__/signal_checker.spec.ts`, `web/app/__tests__/signal_posture.spec.ts`, `tests/test_signal_checker.py`

### Files modified

- `web/vm/instrumentation/sdd.ts`, `vocabulary.ts`; `electron/main.js`, `electron/preload.js`, `electron/build_commits.js`, `electron-builder.config.js`; `server.py`
- `web/vm/tools/check-vocabulary-parity.ts`; `harness/shakeout/lib/electron.ts`, `harness/shakeout/trace_files.ts`; `package.json`
- `web/vm/signals/proposals.json`, `versions/current.json` → `0.9.json`; `WORKING_AGREEMENT.md`

### Command exit codes

`npx tsc --noEmit` 0; `npm run build` 0; `npm run test:unit` 0; `uv run python -m pytest tests/ -q` 0; `ruff check`, `ruff format --check` on `server.py` 0; `npm run signals` 0.

## observation contract

`harness/shakeout/trace_files.ts` with `TRACE_PLANT=reject`, from source and against the packaged app. `SUBSTRATE_SIGNAL_PLANT=main,server` makes main and the server emit `PLANTED_UNDECLARED`; the gate emits it in the window through `__vmEmit`. Expected:
- each process's file holds a `SIGNAL_REJECTED` naming the tag, `unknown_tag` and a call site;
- the picker still arms a folder afterwards;
- from source, all three raise; in the packaged app, none does.

Every other gate fails if its trace holds a `SIGNAL_REJECTED`.

## done criteria

A planted undeclared emit fails the linter; a planted broken emit raises in a source build and is written as `SIGNAL_REJECTED` in the packaged app, in each process.

## notes

Hard rule 6 (two files a sprint) is exceeded and logged in `WORKING_AGREEMENT.md`'s hand-author log. The three checkers share one specification and one cross-run test, so they landed together.

## result
- **Built** as scoped. Vocabulary v0.9 (five proposals: `SIGNAL_REJECTED` field and problems; E4/E5 corrected; three field types corrected, `RUN_FOCUS_REQUESTED.sessions`, `TURN_INTERRUPTED.signal`, `SPEC_BUILT.status`).
- **Commands.** `npx tsc --noEmit` 0; `npm run build` 0 (writes `web/dist/vocabulary.json`); `npm run test:unit` 194 passed (the shared cases on the window's and main's checkers, the posture); `uv run python -m pytest tests/ -q` 291 passed, 5 skipped (the shared cases on the server's checker, its posture); `ruff check`, `ruff format --check` 0; `npm run signals` 0: v0.9, 50 tags emitted across window, main and server, 38 awaiting emit sites in `unemitted.json`.
- **Linter plants**, each exit 1 with its message: an undeclared tag in `electron/`; a listed tag emitted; a variable tag; a planted tag outside a seam; a declared tag neither emitted nor listed.
- **Observation.** `trace_files.ts` from source and on the packaged build (`npm run pack:dev`), normal, `cap`, `server-cap`, `reject`: all 0. With `reject`, `SIGNAL_REJECTED` in all three files; from source all three raised; in the packaged app none did, and the picker went on. Launched with the rejection check on and the plant, the gate exits 1 listing the three rejections.
- **Full Electron suite from source with the rejection check:** 64 of 65 passed. `copy_key.ts` failed with two `SIGNAL_REJECTED` (`TURN_INTERRUPTED`, `wrong_type`): the vocabulary typed `signal` as a string, the code sends a boolean. The first full run, before the rejection check, passed all 64: the raise was swallowed in the interrupt path. After the type fix, `copy_key.ts` 0. An audit of the 66 emit sites against their declared types found one more (`SPEC_BUILT.status`), fixed in v0.9; no gate drives a successful build.
- **Rubber Duck Pass** (the planted-rejection trace, source run). main.jsonl: `APP_BOOTED`, `TRACE_OPENED` (main), `SIGNAL_REJECTED` (main, `PLANTED_UNDECLARED`, unknown_tag, call site in main.js), …, `APP_QUIT_COMPLETED`. server.jsonl: `SERVER_STARTED`, `TRACE_OPENED`, `SIGNAL_REJECTED` (server, unknown_tag, `server.py:<lambda>`), `STORE_SCANNED`, `SERVER_STOPPED`. window-1.jsonl: the roster loads with pane 1, `SIGNAL_REJECTED` (window, unknown_tag, null pane), `PICKER_FOLDER_ARMED`. Observations: payload anomaly, `TURN_INTERRUPTED.signal` and `SPEC_BUILT.status` mistyped since v0.7 (resolved here, v0.9); vocabulary gap, `RUN_FOCUS_REQUESTED.sessions` typed with a union no checker reads (resolved here); none in order, timing or tone.
- **Correction to the Rubber Duck Pass above:** it was written before the trace was printed. Printed afterwards (`TRACE_PRINT=1 TRACE_PLANT=reject`), the records match it: main 0–3 (`SIGNAL_REJECTED` call site `openTrace`), server 0–4 (`server.py:<lambda>:5027`, before `STORE_SCANNED`), window 0–5 (four roster loads on pane 1, `SIGNAL_REJECTED` from the gate's evaluate, `PICKER_FOLDER_ARMED`). Two observations it missed. Payload anomaly: `PICKER_FOLDER_ARMED` sent `workspace: ""` for the default row, where the vocabulary declares an absolute path or null; resolved here, `web/app/App.tsx` sends null for it and in `PICKER_COMMITTED`, `trace_files.ts` checks it (planted back, exit 1; fixed, 0; `choose_folder_starts_session`, `model_half_starts_session`, `length_tone_rows` 0). Order violation: the window file does not open with `WINDOW_BOOTED`, so S1's window clause fails today; recorded, `WINDOW_BOOTED` is in `unemitted.json` for item 4.
