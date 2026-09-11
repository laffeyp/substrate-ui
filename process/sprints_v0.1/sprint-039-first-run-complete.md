# Sprint 039 — first-run pick + complete

---
id: 039
epic: L — First-run
status: pending
phase: 3
pass_kind: architecture
spec_reference: signals/0.1.json § first_run FIRST_RUN_DRIVER_PICKED + FIRST_RUN_COMPLETED
prerequisites: 038 closed
---

## scope

FirstRun's "Choose a default driver" enter fires FIRST_RUN_DRIVER_PICKED, writes marker file with the choice, then FIRST_RUN_COMPLETED closes the screen. The app opens a first pane bound to the picked driver via Sprint 007.

## signal contract

### Emits

- `FIRST_RUN_DRIVER_PICKED` (`{driver_name, driver_params}`) — secret-stripped
- `FIRST_RUN_COMPLETED` (`{})`

### Consumes

FirstRun choice.

## artifact contract

### Files

- `src/render/FirstRun.tsx` — extended
- `~/.substrate/first-run-complete` — written on completion, JSON `{driver: ..., completed_at: ...}`
- `tests/harness/e2e_first_run_complete.js`

### Content assertions

- Marker file readable JSON; driver key present

### Command exit codes

- `node tests/harness/e2e_first_run_complete.js` returns 0

## observation contract

### Driving steps

1. Fresh first-run; pick deterministic; assert PICKED → COMPLETED
2. Assert marker file on disk; assert app opens pane grid
3. Relaunch; assert no FirstRun

### Three-channel agreement

- Structural: FirstRun DOM unmounts; pane grid mounts
- Perceptual: dialog anchor byte 128 → 0
- Log ↔ signal: PICKED → COMPLETED within 100ms

## done criteria

First-run completes end-to-end. Epic L closes. Sprint 040 (settings) dispatches next.
