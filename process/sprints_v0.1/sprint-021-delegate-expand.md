# Sprint 021 — delegate expand

---
id: 021
epic: F — Delegate flow
status: closed
phase: 3
pass_kind: architecture
spec_reference: signals/0.1.json § transcript DELEGATE_INLINE_EXPANDED / DELEGATE_CALL_FOLDED
prerequisites: 020 closed
---

## scope

Click the ↳ on a delegate row to expand inline. Renders the child record's transcript indented under the parent. Click again to fold. Multiple expands per turn allowed.

## signal contract

### Emits

- `DELEGATE_INLINE_EXPANDED` (`{pane_id, session_id, tool_call_id}`)
- `DELEGATE_INLINE_COLLAPSED` (`{pane_id, session_id, tool_call_id}`) — the fold path
- `DELEGATE_CALL_FOLDED` (`{pane_id, session_id, tool_call_id}`) — Layer 5 terminal for the whole delegate flow (fires when the parent turn resumes past the delegate; distinct from inline collapse)

### Consumes

Bridge subscribes to `child_record_root/events-*.jsonl` while expanded.

## artifact contract

### Files

- `src/render/TranscriptDelegateExpanded.tsx`
- `bridge/main.py` — extends `subscribe_record` to accept child record root
- `tests/harness/e2e_delegate_expand.js`

### Content assertions

- Expand instance is scoped to tool_call_id, not session_id; multiple concurrent expands allowed

### Command exit codes

- `node tests/harness/e2e_delegate_expand.js` returns 0

## observation contract

### Driving steps

1. Trigger delegate; expand
2. Assert DELEGATE_INLINE_EXPANDED + child record rows render
3. Fold; assert DELEGATE_CALL_FOLDED and rows disappear

### Three-channel agreement

- Structural: expanded state adds child transcript rows under the delegate row
- Perceptual: no dedicated anchor (per-instance)
- Log ↔ signal: EXPANDED count === FOLDED count (over a completed session)

## done criteria

Expand + fold work. Sprint 022 (descent) dispatches next.
