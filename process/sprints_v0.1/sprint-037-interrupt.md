# Sprint 037 — interrupt

---
id: 037
epic: K — Session end lifecycle
status: pending
phase: 3
pass_kind: architecture
spec_reference: signals/0.1.json § bridge INTERRUPT_REQUESTED/ACKED; Layer 4 (2s timeout); session_registry.py interrupt at :912
prerequisites: 036 closed
---

## scope

Interrupt a running turn. Bridge op `interrupt` wraps SessionRegistry.interrupt at :912 (returns `dict[str, Any] | None`). Timeout 2s. On ack, session flips to interrupted; TRANSCRIPT_PARK_RENDERED{park_reason:interrupt} fires.

## signal contract

### Emits

- `INTERRUPT_REQUESTED` (`{request_id, session_id}`)
- `INTERRUPTED` (`{request_id, session_id, was_running: boolean}`) — Layer 1 v0.1 name; success reply

Failure paths do not fire a distinct tag in v0.1 — an interrupt that lands on a non-running session returns INTERRUPTED{was_running:false} (the interrupt is idempotent); a timeout is inferred from missing INTERRUPTED within Layer 4's 2s bridge budget and surfaces as an incident detected by the harness (no INTERRUPT_FAILED tag exists in v0.1).

### Consumes

END_CONFIRM_COMMITTED (Sprint 036); Ctrl-C keybinding.

## artifact contract

### Files

- `bridge/main.py` — op `interrupt`
- `src/reducer/ShellReducer.ts` — INTERRUPT action
- `tests/harness/e2e_interrupt.js`

### Content assertions

- 2s bridge timeout on interrupt (Layer 4)
- was_running False when the session parked before the request landed

### Command exit codes

- `node tests/harness/e2e_interrupt.js` returns 0

## observation contract

### Driving steps

1. Bind running (slow driver); Ctrl-C
2. Assert INTERRUPT_REQUESTED → INTERRUPTED{was_running:true} within 2s
3. Assert TRANSCRIPT_PARK_RENDERED{park_reason:"interrupt"} follows

### Three-channel agreement

- Structural: transcript renders "◐ parked — interrupted"
- Perceptual: status anchor byte 96 → 56 (interrupted)
- Log ↔ signal: bridge.log `[bridge] interrupt session_id=<id> was_running=<b>`

## done criteria

Interrupt fires and lands within 2s. Epic K closes. Sprint 038 (first-run open) dispatches next.
