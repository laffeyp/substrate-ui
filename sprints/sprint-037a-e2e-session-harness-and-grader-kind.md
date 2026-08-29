# Sprint 037a — `harness/e2e_session.js` + fourth grader kind

```yaml
---
id: 037a
status: pending
phase: 5
pass_kind: functional
---
```

## scope

The behavioral driver harness for the full session flow, plus the
`session` fixture kind in the grader. No perceptual capture yet
(037b), no legacy dock removal yet (037c).

Two files. One concept: the driver + its grader kind.

## prerequisites

- 033, 034b, 035, 036a-e, 036f all closed.

## context_files

- `process/HARNESS-CATALOG.md` § "How to write a piece-G harness" —
  the seven adoption points.
- `harness/e2e_console.js` — the shape to mirror.
- `tools/capture-grade.ts` — existing three fixture kinds
  (console/studio/assay/delegate).

## artifact contract → Files created/modified

- `substrate-ui/harness/e2e_session.js` — new. Full session flow:
  open `/`; assert desktop view; `+ session` with `deterministic`;
  assert `DRIVER_SESSION_STARTED`; send two UserMessages via terminal;
  flip views mid-session; `/exit`; assert `DRIVER_SESSION_ENDED`.
- `substrate-ui/tools/capture-grade.ts` — `session` fixture kind
  added (`--kind session`) with its own `EXPECTED_ORDER` and the
  `checkDriverSessionBookends` invariant from sprint 035.
- `substrate-ui/package.json` — new script `e2e:session`.

## signal contract → Emits

No new emits; asserts against the trace prior sprints already emit.

## observation contract

- `npm run e2e:session` exit 0.
- `npm run grade:signals` green for the session fixture (the fixture
  is written by 037b; 037a's e2e run is enough to verify the
  harness + grader kind close their invariants against runtime state).
- Full trace order verified:
  `SESSION_INIT → PANE_SWITCHED × 2+ → DRIVER_SESSION_STARTED →
   USER_MESSAGE_INJECTED × 2 → PARK_LANDED × 2 → DRIVER_SESSION_ENDED
   → SESSION_ENDED`.

## halt conditions

- `dual_contract_fail` if the harness runs green but the grader kind
  rejects the trace, or vice versa.

## definition of done

Harness on disk; grader kind wired; e2e:session exit 0.
