---
id: 295
status: closed
phase: shell-to-react D3.1
pass_kind: functional
---

# Sprint 295 — the side graph's axis and segment boxes as pure functions

## scope

Plan row D3. `web/app/derive/stream.ts`: `sideAxis` (the first row's seq to the last's, at least one apart; 0 to 1 with no rows) and `segBox` (a segment's left edge and width as percentages to one decimal), moved from renderVals' `pct` and `segOf`.

## artifact contract

- Modified: `web/app/derive/stream.ts`, `web/app/__tests__/stream.spec.ts`. `npm run test:unit` 0.

## result

Closed 2026-11-05. Unit 125/125.

## Rubber Duck pass

No signals.
