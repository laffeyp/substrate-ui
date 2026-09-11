# Sprint 038 — first-run open

---
id: 038
epic: L — First-run
status: pending
phase: 3
pass_kind: architecture
spec_reference: signals/0.1.json § first_run stratum FIRST_RUN_OPENED; D69 (probe walks all local drivers)
prerequisites: 037 closed
---

## scope

First launch (marker file `~/.substrate/first-run-complete` absent) opens the FirstRun screen — full-window, non-dismissable. Screen probes every known driver in parallel via Sprint 008's probe op; result table shows each driver's status.

## signal contract

### Emits

- `FIRST_RUN_OPENED` (`{}`)
- `PROBE_DRIVER_REQUESTED` — one per driver, in parallel

### Consumes

Marker file check; probe replies.

## artifact contract

### Files

- `src/render/FirstRun.tsx`
- `src/state/FirstRunState.ts` — marker check
- `tests/harness/e2e_first_run_open.js`

### Content assertions

- Known drivers list: deterministic, ollama:*, claude, gemini
- Layer 5: at most one first_run stratum in the app's life

### Command exit codes

- `node tests/harness/e2e_first_run_open.js` returns 0

## observation contract

### Driving steps

1. Delete marker; launch; assert FIRST_RUN_OPENED
2. Probe results populate the table within 10s
3. Relaunch with marker present; assert FIRST_RUN_OPENED does NOT fire

### Three-channel agreement

- Structural: FirstRun DOM subtree occupies the window; no pane grid
- Perceptual: `anchor-dialog` byte 128 (first_run kind)
- Log ↔ signal: exactly one FIRST_RUN_OPENED per marker-absent launch

## done criteria

First-run screen shows on marker-absent launch. Sprint 039 (pick driver + complete) dispatches next.
