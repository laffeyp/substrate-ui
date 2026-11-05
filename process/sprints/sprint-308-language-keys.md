---
id: 308
status: closed
phase: shell-to-react D6.1
pass_kind: functional
---

# Sprint 308 — the language lens's keys and selected turn as pure functions

## scope

Plan row D6. `web/app/derive/language_keys.ts`: `selectedTurn` (the turn of the last UserMessage at or before the selected seq) and `languageKey` (↑ ↓ between turns, from the last with no selection; ← → between lanes, held to the lane count; ↵ to the stream; anything else, or no turns, is no step). Moved from renderVals' `_langSelTurn` and the keydown handler's language block.

## artifact contract

- Created: `web/app/derive/language_keys.ts`, `web/app/__tests__/language_keys.spec.ts`. `npm run test:unit` 0.

## result

Closed 2026-11-05. Unit 132/132.

## Rubber Duck pass

No signals.
