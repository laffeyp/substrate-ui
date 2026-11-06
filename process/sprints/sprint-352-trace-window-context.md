# Sprint 352 — the trace on disk: the window's record context

```yaml
---
id: 352
status: closed
phase: SDD re-centre
pass_kind: functional
---
```

## scope

The window stamps its part of the v0.7 record context on every record: `proc_seq` (its own order from 0) and `pane_id` (the pane whose controller emitted it; null for window-level code). A `native.signal` send that throws is counted, and the next send that works is followed by `TRACE_LOST` with the count. Plan `process/planning/2026-11-05-sdd-signals/PLAN-2026-11-05-sdd-signals-r3.md`, item 2, second of three. Files: `web/vm/instrumentation/sdd.ts`, `web/vm/session_controller.ts` (a `paneId` field its emit wrapper stamps), and one line in `web/vm/pane_registry.ts` that sets it (three files, past the two-file rule: the controller cannot know its pane without the registry telling it).

## signal contract

Emits: every existing window tag, now with `proc_seq` and `pane_id`; `TRACE_LOST` (process window) after a refused send.

## artifact contract

- `sdd.ts` record type has `proc_seq` and `pane_id`; `emit` takes a context argument.
- `session_controller.ts` has `paneId` and passes it; `pane_registry.ts` sets it in `spawn`.
- `npx tsc --noEmit` 0; `npm run build` 0; `npm run test:unit` 0; `npx tsx harness/vm_smoke.ts` 0.

## observation contract

`harness/shakeout/trace_files.ts`: in `window-<id>.jsonl`, the controller's four roster records carry `pane_id` 1; `PICKER_FOLDER_ARMED` carries `pane_id` null in its context and 1 in its payload; `proc_seq` runs 0…n. Planted: without the registry's `controller.paneId = paneId`, the gate fails naming the four records.

## result

- **Built** as scoped. Gate extended.
- **Commands.** tsc 0; build 0; unit 143 passed; `vm_smoke` 0; gates `trace_files` 0 and planted 1 (as meant), `TRACE_PLANT=cap trace_files` 0, `model_half_starts_session` 0, `split_returns_to_panes` 0, `slash_inline_hint` 0.
- **Rubber Duck Pass.** The window file read: `SESSIONS_LOADED`, `WORKSPACES_LOADED`, `BUNDLE_ROSTER_LOADED`, `DRIVER_ROSTER_LOADED` from pane 1's controller (pane_id 1), then `PICKER_FOLDER_ARMED` from the window (context pane_id null, payload pane_id 1), proc_seq 0–4. Observation: the window's send-loss path has no planted fault (the preload's `native` object is frozen by `contextBridge`, so a test cannot make `signal` throw); recorded, the main-side cap plant covers the window file's losses, and the window-side count is read by its code path alone. No order or timing violation.
