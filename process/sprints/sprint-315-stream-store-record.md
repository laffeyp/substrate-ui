---
id: 315
status: closed
phase: shell-to-react D7.3
pass_kind: functional
---

# Sprint 315 — the stream store holds only the record

## scope

`web/app/state/stream.ts` keeps the focused session's envelopes, topology and language view; the selection, level, direction, the pick and select actions DCLogic registered, and the graph link go. `web/app/LanguageLens.tsx` reads the selection from the meta store.

## artifact contract

- Modified: `web/app/state/stream.ts`, `web/app/LanguageLens.tsx`. `npx tsc --noEmit` 0.

## result

Closed 2026-11-05.

## Rubber Duck pass

No signals.
