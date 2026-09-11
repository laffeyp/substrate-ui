# Sprint 009 — session resume

---
id: 009
epic: C — Substrate binding
status: closed
phase: 2
pass_kind: architecture
spec_reference: signals/0.1.json § bridge SESSION_RESUME_*; session_registry.py resume path
prerequisites: 008 closed
---

## scope

Existing session (parked or interrupted) attaches to an unbound pane. Resume is not create — no new manifest; the pane picks up the last SessionStatus + last record_root. Torn-record failure surfaces typed.

## signal contract

### Emits

- `WORKSPACE_BOUND` (`{request_id, session_id, workspace_path, shape}`) — reused from Sprint 007
- `PANE_UNBOUND_BOUND` (`{pane_id, session_id, workspace_path, shape}`) — reused Layer 5 pairing
- `TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED` (`{pane_id, session_id}`) — fires only when the resumed session's `last_turn_index` is -1 (no prior turns)

Layer 1 v0.1 did not ratify a SESSION_RESUME_REQUESTED / SESSION_RESUMED / SESSION_RESUME_FAILED chain — the bridge round-trip is silent in the trace. The two ratified pairing tags above cover the observation contract: WORKSPACE_BOUND and PANE_UNBOUND_BOUND fire same-step on resume with matching session_id + workspace fields drawn from the manifest.

### Consumes

Selection from Records surface (Sprint 025 handoff) OR the unbound picker's "resume …" tab.

## artifact contract

### Files

- `bridge/main.py` — op `session_resume`; reads manifest.json under fcntl.flock
- `src/render/UnboundPanePicker.tsx` — new "resume" tab; lists parked sessions
- `tests/harness/e2e_session_resume.js`

### Content assertions

- TornRecordOnResume typed exception from substrate propagates as `reason:"torn_record"`

### Command exit codes

- `node tests/harness/e2e_session_resume.js` returns 0

## observation contract

### Driving steps

1. Create then end a session (via Sprint 010's chain later, or fake via direct SessionRegistry call)
2. Actually: create a session, park it (no turns), close its pane (leaves session parked)
3. Open new pane; resume by session_id; assert SESSION_RESUMED + PANE_UNBOUND_BOUND

### Three-channel agreement

- Structural: post-resume pane header shows session name matching manifest
- Perceptual: status anchor byte matches last SessionStatus (64 parked / 96 interrupted)
- Log ↔ signal: bridge.log `[bridge] session_resume session_id=<id> status=<s>`

## done criteria

Resume attaches parked and interrupted sessions; typed failures surface. Sprint 010 (end lifecycle) dispatches next.
