---
id: 265
status: closed
phase: shell-to-react C2.1
pass_kind: functional
---

# Sprint 265 — the activity scan runs once per snapshot (F350)

## scope

`liveActivity(snap)` scanned every envelope on each call, and the component called it on a 500 ms tick for every pane. `web/reveal/activity.ts` now caches the scan per snapshot object (snapshots are replaced, never changed, on each controller patch) and takes the time as an argument (`nowSec`, default now); only a live turn's seconds read the clock. A user message with no time still reads as sent now, so it is never the failed turn, as before.

## artifact contract

- Modified: `web/reveal/activity.ts` (contains `const scans = new WeakMap`), `web/reveal/__tests__/activity_harness_tools.spec.ts` (a scan-once test). `npm run test:unit` 0.

## observation contract

The new test fails with the cache removed (planted) and passes with it.

## result

Closed 2026-11-05. Spec 3/3; planted: fail.

## Rubber Duck pass

No signals.
