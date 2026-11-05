---
id: 288
status: closed
phase: shell-to-react D1.1
pass_kind: functional
---

# Sprint 288 — meta's stream and graph as pure functions (F333)

## scope

Plan row D1. `web/app/derive/stream.ts`: `streamRows` (each envelope's prod column, gist and lanes, with the producer's kind and instance merged into the payload, as before), `streamSpans` (the model's span per stretch the session was open; each producer from start to end and each tool call to its result on the delegate lifeline; the wait from the trigger that starts the return producer to the next message), `laneOf`, `connector`, `laneCells`, `sideLanes`, `KIND_COLOR` and `PLUMBING`. F333: every comparison is against the wire kind and `EnvelopeKind`; the component had stripped the `substrate.` prefix and compared bare names, which the lint rule cannot see, and its one enum comparison (`RunFinalised`) never matched a stripped kind. A row keeps the stripped name as `kind` for display, so the inspector and the lenses read as before.

## artifact contract

- Created: `web/app/derive/stream.ts` (no bare kind literal; the lint rule passes on it), `web/app/__tests__/stream.spec.ts`. `npm run test:unit` 0.

## result

Closed 2026-11-05. Spec 4/4. The lint rule also caught bare kind strings in the spec's first table; it checks rows by `EnvelopeKind` instead.

## Rubber Duck pass

No signals.
