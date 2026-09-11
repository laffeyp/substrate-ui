# Sprint 014 — transcript renders record events

---
id: 014
epic: D — Turn flow
status: pending
phase: 3
pass_kind: architecture
spec_reference: signals/0.1.json § transcript TRANSCRIPT_ROW_RENDERED; session vocabulary UserMessage/ModelReply; Layer 6 RecordSubscriber
prerequisites: 013 closed
---

## scope

Bind pane subscribes to the session record's `events-*.jsonl` files via bridge stream. Every UserMessage / ModelReply envelope renders a transcript row. TAG cadence is event-per-envelope (Layer 4 pins `TRANSCRIPT_ROW_RENDERED` at event-cadence, not sampled — one emit per arriving envelope). PAINT batching uses rAF: RecordSubscriber commits K envelopes to the DOM in one animation frame while still firing K distinct `TRANSCRIPT_ROW_RENDERED` tags — one signal per envelope, one paint per frame.

## signal contract

### Emits

- `TRANSCRIPT_ROW_RENDERED` (`{pane_id, session_id, kind: "user"|"model"|"tool"|"error", turn_index, envelope_seq, envelope_kind}`)

### Consumes

Bridge stream `record_events` (op returning JSONL-lines subscription).

## artifact contract

### Files

- `bridge/main.py` — op `subscribe_record`; watchfiles on record_root's events-*.jsonl; streams envelopes
- `src/observability/RecordSubscriber.ts`
- `src/render/Transcript.tsx` — virtualized list; row-per-envelope
- `tests/harness/e2e_transcript_render.js`

### Content assertions

- envelope_kind ∈ substrate's kernel + session vocab (grep against substrate source)

### Command exit codes

- `node tests/harness/e2e_transcript_render.js` returns 0

## observation contract

### Driving steps

1. Bind deterministic session; submit turn "hello"
2. Assert two TRANSCRIPT_ROW_RENDERED (user + model) with matching turn_index
3. Assert row DOM count === envelope count

### Three-channel agreement

- Structural: transcript rows === TRANSCRIPT_ROW_RENDERED events
- Perceptual: `anchor-pane-<id>-status` flips 96 (running) → 64 (parked-final_answer) on ModelReply
- Log ↔ signal: envelope_seq monotonic per session

## done criteria

Transcript renders real record events. Sprint 015 (park + first-message-awaiting) dispatches next.
