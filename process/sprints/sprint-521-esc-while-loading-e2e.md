# Sprint 521 — End to end: Esc while a long session's turn is loading

```yaml
---
id: 521
status: closed
phase: core stalls (roadmap 2026-11-18-core-stalls r1; observation for C1–C3)
pass_kind: observation
depends_on: [kernel 354, kernel 355, kernel 357, 518, 519]
plan: process/planning/2026-11-18-core-stalls/ROADMAP-2026-11-18-core-stalls-r1.md
---
```

## scope

The tests of kernel 354 and 355 drive `SessionRegistry.turn_sync` and force the timing by patching the kernel (`_flush_scheduled`, `_resume_bootstrap`); app 518's replaces `registry.interrupt`. None goes the path the stall of 2026-11-17 took. This test does, with nothing patched: a session continued through `POST /api/session` from a hand-written Claude Code session file of 2,500 exchanges (over 10,000 envelopes once imported), a turn sent with `POST /turn`, and `POST /interrupt` sent the moment `GET /api/session/<id>` reads `running`, while the turn is still loading the record. One verifiable property: the turn comes back interrupted, and it does not without kernel 354.

## artifact contract

### Files created

- `tests/test_esc_while_a_long_session_loads.py`

### Command exit codes

- The test returns 0; with kernel 354's fix removed it fails.

## close

- The test: 1 passed, three runs, 10.0–10.1 s each. It checks that the interrupt answers `interrupted` and `landed`; that the turn's events hold one `ProducerCancelled` (`caller` `daemon:interrupt-hard`) for the model, with no `PromptComposed` between that model's `ProducerStarted` and its cancel — the model never ran, the condition that stranded turns — and that the turn ends `Returned` `interrupted`, the session `parked`; that the next turn replies at turn 2; and that the quit's sweep ends the session (`ended` 1, `busy` 0, `deferred` 0).
- With kernel 354's done-callback frames removed (`if False:`), the test fails after 243.6 s: "the turn never came back", the stall as it was found.
- Not shown by this test: the pending answer (kernel 355, app 518). Since kernel 357 the 10,000-envelope load ends inside the interrupt's one-second wait, so the cancel runs within it and answers with the model's reference; the pending path is covered by kernel 355's tests and app 518's server test.

Rubber Duck Pass: the turn's frames run `UserMessage`, `TriggerFired`, `ProducerStarted` and `ProducerCancelled` for the model, `TriggerFired` `return-on-interrupt`, `ProducerStarted`, `Returned` `interrupted`, `TerminationMatched`: every started producer has one end frame. No observations.
