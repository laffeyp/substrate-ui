# Sprint 040b — extract `web/console/transport.ts`

```yaml
---
id: 040b
status: closed-2026-08-29
phase: 6
pass_kind: refactor
---
```

## Scope

Extract cursor bar (#seq, #toStart, #play, #toEnd, #speedsel) plus
the play/pause rAF loop from `web/app.ts` into
`web/console/transport.ts`. New module exports
`mountTransport({state, render}) → TransportHandle`; the handle
exposes `stopPlay()` for the two external callers (selectAssay,
selectRecord) that stop replay on record-switch.

## What passed

- Zero tsc errors on `web/console/transport.ts`.
- Total tsc error count dropped 441 → 399 (-42).
- app.ts shed 68 lines.
- Full `npm run signals` chain PASS across seventeen JS fixtures
  + 10 pytest parity cases + 1 session grader.

## Definition of done — satisfied

Transport wired via `mountTransport`. `stopPlay()` call sites at
lines 150 + 354 route through `_transportHandle?.stopPlay()`.
Behavior preserved (PLAY_STARTED/STOPPED/CURSOR_MOVED/SPEED_CHANGED
emit at the same points).
