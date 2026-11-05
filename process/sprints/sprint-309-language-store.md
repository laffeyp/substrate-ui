---
id: 309
status: closed
phase: shell-to-react D6.2
pass_kind: functional
---

# Sprint 309 — the language lens's choices in a store

## scope

`web/app/state/language.ts` holds the lens's stream, view and focused lane, moved from DCLogic's state (`langStream`, `langView`, `langLane`); another stream starts at lane 0, as before. `web/app/state/stream.ts` gains the focused session's `language` view and the `selectSeq` action (a language row lights its turn's seq; a stream row toggles).

## artifact contract

- Created: `web/app/state/language.ts`. Modified: `web/app/state/stream.ts`. `npm run build` 0.

## result

Closed 2026-11-05.

## Rubber Duck pass

No signals.
