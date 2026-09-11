# Sprint 010 — session end

---
id: 010
epic: C — Substrate binding
status: pending
phase: 2
pass_kind: architecture
spec_reference: signals/0.1.json § bridge SESSION_END_*; SESSION_ENDED_ACK terminal; session_registry.py end path; Layer 5 SessionEndedMidTurn
prerequisites: 009 closed
---

## scope

End session (menu Session ▸ End Session, or slash-router `/end`). Wraps `SessionRegistry.turn_sync(END_ON_EXIT_SENTINEL)` via bridge — the sentinel at `topologies/session/vocabulary.py:69` records a SessionEnded envelope and flips manifest status to `ended`. Distinct from `SessionRegistry.delete` at `session_registry.py:993`, which removes the manifest entirely (deferred to v0.2 per Layer 2/3 review §gap #5). Interrupt-if-running then end. TRANSCRIPT_SESSION_ENDED_RENDERED closes the transcript. Pane returns to unbound on ack.

## signal contract

### Emits

- `SESSION_END_REQUESTED` (`{request_id, session_id, reason: "user_end"|"user_exit"|"timeout"|"daemon_shutdown"}`)
- `SESSION_ENDED_ACK` (`{request_id, session_id, end_reason}`) — Layer 5 terminal
- `TRANSCRIPT_SESSION_ENDED_RENDERED` (`{pane_id, session_id, end_reason}`) — Layer 4 eventually_must

Layer 1 v0.1 has no SESSION_END_FAILED tag — the SessionEnded write via turn_sync is virtually infallible after interrupt lands. Any bridge-level failure (e.g., timeout) surfaces as no SESSION_ENDED_ACK within 5s; the harness detects that as an incident.

### Consumes

Menu bar activation, slash router `/end`, EndConfirm dialog commit (Sprint 036).

## artifact contract

### Files

- `bridge/main.py` — op `session_end`; wraps `turn_sync` with `END_ON_EXIT_SENTINEL` (vocabulary.py:69)
- `src/reducer/ShellReducer.ts` — END_SESSION action; terminal rule on session_id
- `src/render/Transcript.tsx` — SessionEnded special-shape row
- `tests/harness/e2e_session_end.js`

### Content assertions

- Layer 5 forbidden-after: no shell-emit tags carrying that session_id fire after SESSION_ENDED_ACK

### Command exit codes

- `node tests/harness/e2e_session_end.js` returns 0

## observation contract

### Driving steps

1. Bind, submit one turn, end
2. Assert SESSION_END_REQUESTED → SESSION_ENDED_ACK → TRANSCRIPT_SESSION_ENDED_RENDERED
3. Attempt to submit a turn on the ended session; assert typed refusal

### Three-channel agreement

- Structural: transcript renders "session ended (user_end)" row; pane rebinds to unbound
- Perceptual: status anchor byte flips to 32 (ended)
- Log ↔ signal: bridge.log `[bridge] session_end session_id=<id> reason=<r>`

## done criteria

End works clean; terminal semantics hold. Epic C closes. Sprint 011 (prompt editor) dispatches next.
