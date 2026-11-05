---
id: 300
status: closed
phase: shell-to-react D4.1
pass_kind: functional
---

# Sprint 300 — the structure lens's lists as pure functions

## scope

Plan row D4. `web/app/derive/structure.ts`: `STRUCTURE_DEFS` (moved from the component's top), `isLifecycleKind` (the kernel's namespace marks the runtime's kinds), `kindLabel` (a break point after the namespace, for display), and `structureView`: producers with their initial, instrument and deterministic tags; triggers with their subscribed kinds; views; ends; routes; the run's vocab version, exports and baseline; and every event kind the topology emits, subscribes to or takes from outside, the topology's first, with who emits each and what it fires.

## artifact contract

- Created: `web/app/derive/structure.ts`, `web/app/__tests__/structure.spec.ts`. `npm run test:unit` 0.

## result

Closed 2026-11-05. Unit 128/128. The lint rule caught a raw `substrate.RunStarted` in the spec's first draft; the spec checks the label of `EnvelopeKind.ProducerCompleted` instead.

## Rubber Duck pass

No signals.
