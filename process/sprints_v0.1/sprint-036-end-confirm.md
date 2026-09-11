# Sprint 036 — end confirm dialog

---
id: 036
epic: K — Session end lifecycle
status: pending
phase: 3
pass_kind: architecture
spec_reference: signals/0.1.json § dialog END_CONFIRM_OPENED/CLOSED/COMMITTED; Layer 5 pairing END_CONFIRM_COMMITTED → INTERRUPT_REQUESTED (if running) → SESSION_END_REQUESTED
prerequisites: 035 closed
---

## scope

Menu Session ▸ End Session opens a confirm dialog. Commit fires END_CONFIRM_COMMITTED → INTERRUPT (if running; Sprint 037) → SESSION_END_REQUESTED (Sprint 010). Escape closes without ending.

## signal contract

### Emits

- `END_CONFIRM_OPENED` (`{pane_id, session_id}`)
- `END_CONFIRM_CLOSED` (`{pane_id, committed: boolean}`)
- `END_CONFIRM_COMMITTED` (`{pane_id, session_id}`)

### Consumes

Menu Session ▸ End Session; slash `/end`.

## artifact contract

### Files

- `src/render/EndConfirmDialog.tsx`
- `src/reducer/ShellReducer.ts` — commit chain
- `tests/harness/e2e_end_confirm.js`

### Content assertions

- Layer 5 forced_next: END_CONFIRM_COMMITTED → INTERRUPT_REQUESTED (if status==running) OR SESSION_END_REQUESTED (else)

### Command exit codes

- `node tests/harness/e2e_end_confirm.js` returns 0

## observation contract

### Driving steps

1. Bind parked; ⌘E; assert END_CONFIRM_OPENED
2. Commit; assert END_CONFIRM_COMMITTED → SESSION_END_REQUESTED (no interrupt — parked)
3. Bind running; ⌘E; commit; assert INTERRUPT_REQUESTED → SESSION_END_REQUESTED

### Three-channel agreement

- Structural: `[data-testid="dialog-end-confirm"]` present when open
- Perceptual: `anchor-dialog` byte encodes kind (end_confirm=32)
- Log ↔ signal: chain order matches

## done criteria

Dialog + chain work. Sprint 037 (interrupt) dispatches next.
