# Sprint 031 — driver chip + change round-trip

---
id: 031
epic: I — Header & driver
status: pending
phase: 3
pass_kind: architecture
spec_reference: signals/0.1.json § header DRIVER_PICKED + bridge DRIVER_CHANGE_*; session_registry.py set_driver at 693
prerequisites: 030 closed
---

## scope

DriverChip in the header shows current driver. Click opens header_popover kind=driver (Sprint 033 codifies the mutex). Selection fires DRIVER_PICKED then DRIVER_CHANGE_REQUESTED (bridge, 5s). Ack updates manifest; failure surfaces typed.

## signal contract

### Emits

- `DRIVER_DROPDOWN_OPENED` (`{pane_id, session_id}`) — the dropdown mount
- `DRIVER_PICKED` (`{pane_id, session_id, driver_name, driver_params}`) — driver_params secret-stripped
- `DRIVER_CHANGE_REQUESTED` (`{request_id, session_id, driver_name, driver_params}`)
- `DRIVER_CHANGED` (`{request_id, session_id, driver_name}`) — the success reply (Layer 1 v0.1 name; no `_ACKED` suffix)
- `DRIVER_CHANGE_FAILED` (`{request_id, reason: "driver_unavailable"|"registry_error"|"timeout"}`)
- `DRIVER_DROPDOWN_CLOSED` (`{pane_id, committed: boolean}`)

### Consumes

None.

## artifact contract

### Files

- `bridge/main.py` — op `driver_change`; wraps SessionRegistry.set_driver at :693
- `src/render/DriverChip.tsx` + `DriverPopover.tsx`
- `tests/harness/e2e_driver_change.js`

### Content assertions

- Layer 4: 5s timeout on DRIVER_CHANGE
- Layer 7 secret-stripping applies

### Command exit codes

- `node tests/harness/e2e_driver_change.js` returns 0

## observation contract

### Driving steps

1. Bind deterministic
2. Click DriverChip; pick ollama:llama3.2:1b; assert DRIVER_DROPDOWN_OPENED → DRIVER_PICKED → DRIVER_CHANGE_REQUESTED → DRIVER_CHANGED → DRIVER_DROPDOWN_CLOSED{committed:true}
3. Force a fail (probe fails); assert DRIVER_CHANGE_FAILED{reason:"driver_unavailable"} then DRIVER_DROPDOWN_CLOSED{committed:false}

### Three-channel agreement

- Structural: DriverChip label reflects post-ack driver
- Perceptual: no dedicated anchor for the chip (header_popover anchor covers the popover phase)
- Log ↔ signal: bridge.log `[bridge] driver_change session_id=<id> driver=<n>`

## done criteria

Driver change works both success + fail. Sprint 032 (WorkspaceChip) dispatches next.
