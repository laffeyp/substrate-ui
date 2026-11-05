---
id: 269
status: closed
phase: shell-to-react C2 gate
pass_kind: functional
---

# Sprint 269 — gate: a live turn's clock counts

## scope

`harness/shakeout/activity_clock.ts`: after a turn the line reads the recap without the pulse; with a UserMessage sent 5s ago added to the snapshot, the line pulses, reads at least 5s, and within 3s reads more with no controller event; a Returned after it brings back the recap without the pulse. `gates:electron` runs it (53 scripts).

## artifact contract

- Created: `harness/shakeout/activity_clock.ts` (no `waitForTimeout`). Modified: `package.json`. `npx tsc -p harness` 0.

## observation contract

The gate exits 0; with the clock's interval removed it exits 1.

## result

Closed 2026-11-05. Gate 0 ("live: pulse, 5s then 6s with no event between"); planted: exit 1, "the clock did not move past 5s". Restored and rebuilt.

## Rubber Duck pass

No signals from the patched snapshot (the gate writes it directly). Observations: none.
