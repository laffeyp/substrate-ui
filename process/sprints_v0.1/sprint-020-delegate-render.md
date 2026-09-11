# Sprint 020 — delegate call line render

---
id: 020
epic: F — Delegate flow
status: closed
phase: 3
pass_kind: architecture
spec_reference: signals/0.1.json § transcript DELEGATE_CALL_RENDERED; D70 (delegate descend + depth-hue accent); topologies/tool_loop/delegate.py
prerequisites: 019 closed
---

## scope

When a tool_loop turn emits a `delegate` tool call, the transcript renders a "reviewer-a … ↳" line with depth accent. Same-step pairing with TRANSCRIPT_DELEGATE_LINE_RENDERED (Layer 4). No expand yet — just the line.

## signal contract

### Emits

- `DELEGATE_CALL_RENDERED` (`{pane_id, session_id, tool_call_id, depth, child_record_root, talkable: boolean}`)
- `TRANSCRIPT_DELEGATE_LINE_RENDERED` (`{pane_id, session_id, tool_call_id}`) — same-step

### Consumes

Bridge record stream — DelegateCall envelope from `topologies/tool_loop/delegate.py`.

## artifact contract

### Files

- `src/render/TranscriptDelegateRow.tsx`
- `src/lib/depthAccent.ts` — hue per depth (1 = teal, 2 = amber per D70)
- `tests/harness/e2e_delegate_render.js`

### Content assertions

- depth ∈ {1, 2} enforced (delegate.py:353 max_depth=2)

### Command exit codes

- `node tests/harness/e2e_delegate_render.js` returns 0

## observation contract

### Driving steps

1. Bind a tool_loop session with a delegate tool
2. Submit a prompt that triggers delegate
3. Assert DELEGATE_CALL_RENDERED + TRANSCRIPT_DELEGATE_LINE_RENDERED same-step; depth accent visible

### Three-channel agreement

- Structural: delegate row DOM carries `data-depth="1"` and depth-hue CSS variable
- Perceptual: no dedicated anchor (delegate_flow stratum instances distinguished by tool_call_id in JSONL, not a per-instance anchor — Layer 6 E2 note)
- Log ↔ signal: both tags share tool_call_id and turn_index

## done criteria

Delegate line renders with depth accent. Sprint 021 (expand) dispatches next.
