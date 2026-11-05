---
id: 291
status: closed
phase: shell-to-react D2.2
pass_kind: functional
---

# Sprint 291 — `StreamLens` and its store

## scope

`web/app/state/stream.ts` holds what the lens draws from: the focused session's envelopes (the snapshot's own array, so a render that changes nothing notifies no one), the lit seq, the level and the direction, and the pick action DCLogic registers. `web/app/StreamLens.tsx` draws the lifelines' legend, the rows and, under the lit row, the inspector, with the template's styles; it reads find's query from `web/app/state/find.ts` and derives its rows with `derive/stream.ts`. The legend's colour test (`ld.kind === 'tool'`) never matched a lane kind, so every legend label drew `#82a5c8`; the lens writes that colour.

## artifact contract

- Created: `web/app/state/stream.ts`, `web/app/StreamLens.tsx`. `npm run build` 0.

## result

Closed 2026-11-05.

## Rubber Duck pass

No signals.
