---
id: 247
status: closed
phase: shell-to-react B5.1a
pass_kind: functional
---

# Sprint 247 — the controller reads assays

## scope

Plan row B5. `web/vm/types.ts` gains `AssayRow`, `AssayArm` and `AssayReport`, typed from the server's `_assays_index` and substrate's `ArmReport` and `Report`. `SessionController.loadAssays()` reads `/api/assays` and emits `ASSAYS_LOADED {count}`; `loadAssayReport(name)` reads `/api/assay/<name>` and emits `ASSAY_REPORT_LOADED {name, arms}`. Both return what they read; a failure sets `lastError` and emits nothing, as the other loads do.

## artifact contract

- Modified: `web/vm/types.ts` (contains `export interface AssayReport`), `web/vm/session_controller.ts` (contains `loadAssays`, `loadAssayReport`, `assayReportFrom`).
- `npx tsc --noEmit` 0; `npm run signals` 0.

## signal contract

Emits: `ASSAYS_LOADED`, `ASSAY_REPORT_LOADED` (vocabulary 0.4).

## result

Closed 2026-11-05. tsc 0; signals 0, code emits 33 of 33 live tags.

## Rubber Duck pass

`ASSAYS_LOADED (count)` — the listing was read; `ASSAY_REPORT_LOADED (name, arms)` — one assay's report was read. Both fire in sprint 248's spec and sprint 257's gate.
