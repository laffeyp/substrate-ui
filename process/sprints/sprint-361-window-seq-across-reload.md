# Sprint 361 — the window's record number goes on across a reload (a fault found by sprint 360)

```yaml
---
id: 361
status: closed
phase: SDD re-centre
pass_kind: functional
---
```

## scope

A window reload started `proc_seq` again at 0 in the same `window-<id>.jsonl`. The boot and the file go on, so two records shared each order key in one file. The record context calls `proc_seq` "this process's record number within the boot, from 0; the order key". One file: `web/vm/instrumentation/sdd.ts`. The counter now starts from the value kept in `sessionStorage`, which lives as long as the window, not the page, and writes it back on each record. Without `sessionStorage` (node tests) it starts at 0 as before. The vocabulary does not change: the code now does what the record context already said.

## signal contract

### Emits

None new. Every window record's `proc_seq`.

### Invariants

`proc_seq` rises through a window file, across reloads.

## artifact contract

Files modified: `web/vm/instrumentation/sdd.ts`; `harness/shakeout/pane_signals.ts` (the check). Commands: `npx tsc --noEmit` 0; `npm run lint` 0; `npm run build` 0; `npm run test:unit` 0.

## observation contract

`pane_signals.ts` reloads the window with `?session=`. It now fails when any record's `proc_seq` is not above the one before it in `window-1.jsonl`.

Planted: the committed emitter, without the carry-over. The gate must fail at the reload.

## result

- **Commands.** `npx tsc --noEmit` 0; `npm run lint` 0; `npm run build` 0; `npm run test:unit` 194 passed.
- **Gates from source**, all exit 0:
  - `pane_signals`;
  - every gate that reloads the window or reads `proc_seq`: `csp_holds`, `dialogs`, `driver_chip_on_resume`, `graph_model_lane_on_resume`, `main_signals`, `naming_sessions`, `resume_after_two_ends`, `transcript_follow`;
  - `trace_files` in all four modes.
- **Packaged** (`npm run pack:dev`): `pane_signals`, `trace_files` 0.
- **Plant.** The committed `sdd.ts` was built with exit 0 read, and the gate exited 1: "proc_seq goes back in window-1.jsonl: 39 STREAM_CLOSED, then 0 WINDOW_BOOTED". Restored (`cmp` equal), rebuilt, gate 0.
- **Rubber Duck Pass** (`TRACE_PRINT=1`, source). The first page writes 0 `WINDOW_BOOTED` through 39 `STREAM_CLOSED`. The reloaded page opens with 40 `WINDOW_BOOTED`, and the numbers rise to the file's end.

  Observations:
  - Order violation: resolved here.
  - Missing pair, payload, timing, tone: none.
  - Recorded: `ts`, milliseconds since the page began, still starts again on a reload. It is not the order key; `wall` and `proc_seq` order the file.
