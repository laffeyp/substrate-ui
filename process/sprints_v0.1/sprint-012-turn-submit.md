# Sprint 012 — turn submit round-trip

---
id: 012
epic: D — Turn flow
status: closed
phase: 3
pass_kind: architecture
spec_reference: signals/0.1.json § prompt + bridge TURN_SUBMIT_*; session_registry.py turn_sync + resume_event_builder :799; turn_queue_cap=4 :281
prerequisites: 011 closed
---

## scope

Enter (⌘⏎) submits. Shell fires PROMPT_SUBMITTED then TURN_SUBMIT_REQUESTED (bridge_request). Bridge calls `session_registry.turn_sync(...)` with the prompt; turn_index resolves under-lock via resume_event_builder. Ack returns TURN_SUBMITTED. Queue-cap-4 refusal returns typed reason. Prompt clears on ack.

## signal contract

### Emits

- `PROMPT_SUBMITTED` (`{pane_id, session_id, text_length}`) — text still absent
- `TURN_SUBMIT_REQUESTED` (`{request_id, session_id, timeout_seconds: 60}`)
- `TURN_SUBMITTED` (`{request_id, session_id, turn_index}`)
- `TURN_SUBMIT_FAILED` (`{request_id, reason: "queue_full"|"session_ended"|"fresh_session_requires_user_message"|"torn_record_on_resume"|"timeout"}`)

### Consumes

None (prompt state passed as bridge payload).

## artifact contract

### Files

- `bridge/main.py` — op `turn_submit`; ThreadPoolExecutor(16) LONG_OP; passes prompt text as first-message to turn_sync
- `src/reducer/ShellReducer.ts` — SUBMIT_TURN action; clears prompt on ack
- `tests/harness/e2e_turn_submit.js`

### Content assertions

- Prompt text arrives at the bridge but never enters the JSONL trace (grep proof in harness)
- Layer 5 pairing: TURN_SUBMIT_REQUESTED → TURN_SUBMITTED | TURN_SUBMIT_FAILED

### Command exit codes

- `node tests/harness/e2e_turn_submit.js` returns 0

## observation contract

### Driving steps

1. Bind a deterministic-driver session
2. Type "hello"; ⌘⏎; assert PROMPT_SUBMITTED → TURN_SUBMIT_REQUESTED → TURN_SUBMITTED
3. Submit five back-to-back turns; assert 5th returns TURN_SUBMIT_FAILED{reason:"queue_full"}
4. Grep JSONL for "hello" — zero

### Three-channel agreement

- Structural: prompt input clears on ack
- Perceptual: status anchor flips 64 (parked) → 96 (running) on TURN_SUBMITTED
- Log ↔ signal: bridge.log `[bridge] turn_submit session_id=<id> turn_index=<n>`

## done criteria

Submit round-trip works; queue_full refusal typed; privacy holds. Sprint 013 (fail path) dispatches next.
