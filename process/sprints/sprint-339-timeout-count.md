---
id: 339
status: closed
phase: shell-to-react F4
pass_kind: functional
---

# Sprint 339 — the timeout line names the responder's retry count (F340)

## scope

A fix. `summariseModelError` said "no response after 3 attempts" for every timeout; the responder's text carries its count ("failed after <max_retries> attempts", substrate adapters/models.py). The line reads that count; a timeout whose text has none reads as before. The wording is unchanged.

## artifact contract

- Modified: `web/vm/session_controller.ts` (exports `summariseModelError`). Created: `web/reveal/__tests__/model_error.spec.ts`. `npm run test:unit` 0.

## result

Closed 2026-11-05.

## Rubber Duck pass

No signals.
