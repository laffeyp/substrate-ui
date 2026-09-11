# Sprint 015 — park rendering + await-first-message

---
id: 015
epic: D — Turn flow
status: pending
phase: 3
pass_kind: architecture
spec_reference: signals/0.1.json § TRANSCRIPT_PARK_RENDERED (3 park_reasons) + TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED (v7:543); ParkReason enum (FINAL_ANSWER/MODEL_ERROR/INTERRUPT)
prerequisites: 014 closed
---

## scope

Park special-shape rows. Three park reasons from substrate's ParkReason surface as distinct row shapes: final_answer (◐ green), model_error (◐ amber), interrupt (◐ dashed). Pre-first-turn state (bound but no PROMPT_SUBMITTED yet) renders TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED per v7:543 — a shell-owned row, not a substrate park event.

## signal contract

### Emits

- `TRANSCRIPT_PARK_RENDERED` (`{pane_id, session_id, park_reason: "final_answer"|"model_error"|"interrupt", turn_index}`)
- `TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED` (`{pane_id, session_id}`) — shell-owned; fires after PANE_UNBOUND_BOUND, before first PROMPT_SUBMITTED
- `TRANSCRIPT_COMPACTED_RENDERED` (`{pane_id, session_id, before_turn_count, after_turn_count}`) — fires when substrate compacts the transcript
- `TRANSCRIPT_RATE_LIMITED_RENDERED` (`{pane_id, session_id, wait_seconds}`) — fires when a driver returns rate-limit; RateLimitedWaiting derived from SessionWarning

### Consumes

Bridge Park envelope; PANE_UNBOUND_BOUND for the await row.

## artifact contract

### Files

- `src/render/TranscriptParkRow.tsx` — three variants
- `src/render/TranscriptAwaitingRow.tsx`
- `src/reducer/ShellReducer.ts` — await row fires ONCE per binding
- `tests/harness/e2e_park_render.js`

### Content assertions

- Layer 2: park_reason enum has three values (no `session_open`; that value was retired at Layer 2 review)
- Await row lives in ShellReducer.emits, not RecordSubscriber (Layer 6 O2 fix)

### Command exit codes

- `node tests/harness/e2e_park_render.js` returns 0

## observation contract

### Driving steps

1. Bind fresh; assert TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED fires once
2. Submit turn; assert await row disappears; ModelReply lands; TRANSCRIPT_PARK_RENDERED{final_answer}
3. Force model_error via deterministic-fail driver; assert park_reason:model_error
4. Interrupt mid-turn (Sprint 037 preview); assert park_reason:interrupt

### Three-channel agreement

- Structural: await row DOM disappears at PROMPT_SUBMITTED
- Perceptual: status anchor byte mirrors park reason (final=64, model_error=48, interrupt=56)
- Log ↔ signal: exactly one AWAITING per binding; PARK count matches Park envelope count

## done criteria

Park rendering complete; H10 await-row shipped. Epic D closes. Sprint 016 (reveal toggle) dispatches next.
