---
id: 305
status: closed
phase: shell-to-react D5.3
pass_kind: functional
---

# Sprint 305 — `IoLens` and `SceneLens`

## scope

`web/app/IoLens.tsx` draws the documents with the template's styles; the head's first node is the title, and the seq is the span floated right, as the A10 gate reads it. `web/app/SceneLens.tsx` draws the grid (`data-scene-grid`), the over-the-limit line (`data-scene-large`) or the empty line. Both read the envelopes from the stream's store.

## artifact contract

- Created: `web/app/IoLens.tsx`, `web/app/SceneLens.tsx`. `npm run build` 0.

## result

Closed 2026-11-05.

## Rubber Duck pass

No signals.
