# Sprint 013 — turn submit fail paths

---
id: 013
epic: D — Turn flow
status: closed
phase: 3
pass_kind: widening
spec_reference: signals/0.1.json § bridge TURN_SUBMIT_FAILED enum; session_registry.py:164-204 typed exceptions
prerequisites: 012 closed
---

## scope

Exercise the four non-queue TURN_SUBMIT_FAILED reasons: session_ended (SessionEndedMidTurn), fresh_session_requires_user_message (FreshSessionRequiresUserMessage), torn_record_on_resume (TornRecordOnResume), timeout (60s exceeded). Each surfaces as a typed error row in the transcript; the pane stays bound.

## signal contract

### Emits

- `TURN_SUBMIT_FAILED` — four new triggering paths (queue_full already covered)
- `TRANSCRIPT_ROW_RENDERED` (`{pane_id, session_id, kind: "error", turn_index, error_reason}`) — error row shape

### Consumes

`TURN_SUBMIT_FAILED` (drives the transcript row).

## artifact contract

### Files

- `bridge/main.py` — catch each typed exception; map to reason string
- `src/render/TranscriptErrorRow.tsx`
- `tests/harness/e2e_turn_fail.js`

### Content assertions

- Every reason string in the enum is reachable by a test path

### Command exit codes

- `node tests/harness/e2e_turn_fail.js` returns 0

## observation contract

### Driving steps

1. End session mid-turn (concurrent with submit); assert session_ended
2. Attempt submit-nothing (empty prompt) as first turn on resumed session; assert fresh_session_requires_user_message
3. Simulate torn record via bridge fault-inject; assert torn_record_on_resume
4. Submit with `timeout_seconds:1` against a slow driver; assert timeout

### Three-channel agreement

- Structural: transcript renders four distinct error rows across the four cases
- Perceptual: `anchor-pane-<id>-status` byte reflects post-failure status (parked or ended)
- Log ↔ signal: each failure path names the same reason in bridge.log and JSONL

## done criteria

All four typed reasons exercised; transcript renders them. Sprint 014 (record subscribe) dispatches next.
