---
id: 244
status: closed
phase: shell-to-react B6.3
pass_kind: functional
---

# Sprint 244 — the controller's validateSpec and buildSpec go

## scope

`session_controller.ts` loses `validateSpec` and `buildSpec`, which posted to the deleted `/api/validate` and `/api/build` and emitted the five `SPEC_*` tags; `pane_registry.ts` loses their two proxies. No caller is left in `web/`, `harness/`, `tests/` or `electron/`.

## artifact contract

- Modified: `web/vm/session_controller.ts`, `web/vm/pane_registry.ts` (no `validateSpec`, `buildSpec`, `SPEC_`). `npm run build` 0; `npm run signals` 0 (code emits 31 of 36 declared tags; the five are retired in 0.4, sprint 246).

## result

Closed 2026-11-05. Build 0; signals 0, 31 emitted.

## Rubber Duck pass

No signals. Observation: five declared tags no longer fire; vocabulary 0.4 retires them (recorded).
