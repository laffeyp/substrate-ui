# Sprint 023 — depth cap refusal + fan-out walk

---
id: 023
epic: F — Delegate flow
status: closed
phase: 3
pass_kind: widening
spec_reference: signals/0.1.json § DELEGATE_DEPTH_CAP_REFUSED + FAN_OUT_INLINE_WALKED; delegate.py:436 guard :437-439 raise; D72
prerequisites: 022 closed
---

## scope

Depth-3 attempts refuse with DELEGATE_DEPTH_CAP_REFUSED (surfaces the delegate.py:436 guard). Fan-out (multiple parallel delegate calls in one turn) renders as a walked list; ↑↓ walks children, emitting FAN_OUT_INLINE_WALKED.

## signal contract

### Emits

- `DELEGATE_DEPTH_CAP_REFUSED` (`{pane_id, session_id, tool_call_id, depth: 2, attempted_depth: 3}`) — incident
- `FAN_OUT_INLINE_EXPANDED` (`{pane_id, session_id, tool_call_id, sibling_count}`) — the fan-out list opens
- `FAN_OUT_INLINE_WALKED` (`{pane_id, session_id, tool_call_id, index, sibling_count}`) — ↑↓ walk within the open list
- `FAN_OUT_INLINE_COLLAPSED` (`{pane_id, session_id, tool_call_id}`) — the fan-out list folds
- `TRANSCRIPT_FANOUT_LINE_RENDERED` (`{pane_id, session_id, tool_call_id, sibling_count}`) — the fan-out row itself renders (same-step with the first DelegateCall envelope in the fan-out batch)

### Consumes

Bridge DelegateDepthCapExceeded envelope.

## artifact contract

### Files

- `bridge/main.py` — surface delegate.py's raise as an envelope on the parent record
- `src/render/TranscriptDelegateRefused.tsx`
- `src/render/TranscriptFanOutList.tsx`
- `tests/harness/e2e_delegate_cap_fanout.js`

### Content assertions

- delegate.py:436 line-drift check runs in the harness (grep for `max_depth`)

### Command exit codes

- `node tests/harness/e2e_delegate_cap_fanout.js` returns 0

## observation contract

### Driving steps

1. Descend to depth 2; trigger a delegate at that depth; assert DELEGATE_DEPTH_CAP_REFUSED
2. Trigger a fan-out (multi-delegate in one turn); ↑↓ walks children; assert FAN_OUT_INLINE_WALKED per keystroke

### Three-channel agreement

- Structural: refused row shows "delegate refused (depth cap 2)"; fan-out list has N children
- Perceptual: no dedicated anchor per fan-out instance (walk aid, per Layer 6 note)
- Log ↔ signal: refused emit correlates to bridge.log delegate.py raise

## done criteria

Cap enforced; fan-out walk works. Epic F closes. Sprint 024 (inspector) dispatches next.
