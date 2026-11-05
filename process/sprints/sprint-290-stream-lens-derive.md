---
id: 290
status: closed
phase: shell-to-react D2.1
pass_kind: functional
---

# Sprint 290 — the stream lens's rows and the inspector as pure functions (F328)

## scope

Plan row D2. `web/app/derive/stream.ts`: a row keeps the record's payload as it arrived (`record`) beside the merged one the lanes read; `findText` (kind, producer and gist, lowercased); `lensRows` (the `app` level's filter, the lit row, find's matches lit and the rest at 0.3, each row's time, lane cells and arrow); `inspectorView` (kind, seq, colour, schema, time, producer, and the record's payload as JSON). F328 for the inspector: it showed the payload with the producer's `kind` and `instance` merged in.

## artifact contract

- Modified: `web/app/derive/stream.ts`, `web/app/__tests__/stream.spec.ts`. `npm run test:unit` 0.

## result

Closed 2026-11-05. Unit 124/124.

## Rubber Duck pass

No signals.
