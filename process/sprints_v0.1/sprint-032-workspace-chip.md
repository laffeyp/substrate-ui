# Sprint 032 — workspace chip + popover

---
id: 032
epic: I — Header & driver
status: pending
phase: 3
pass_kind: architecture
spec_reference: signals/0.1.json § header WORKSPACE_POPOVER_OPENED; workspace immutability on bound session; D9c
prerequisites: 031 closed
---

## scope

WorkspaceChip shows the bound session's workspace path + shape. Click opens header_popover kind=workspace. The popover shows the path (read-only — workspace is immutable on a bound session per D9c) and the shape badge. Change is a create-new-session gesture, not a mutate.

## signal contract

### Emits

- `WORKSPACE_POPOVER_OPENED` (`{pane_id, session_id, workspace, workspace_shape}`)
- `WORKSPACE_POPOVER_CLOSED` (`{pane_id}`)

### Consumes

None.

## artifact contract

### Files

- `src/render/WorkspaceChip.tsx` + `WorkspacePopover.tsx`
- `tests/harness/e2e_workspace_chip.js`

### Content assertions

- No PATCH-workspace surface exists; grep the source

### Command exit codes

- `node tests/harness/e2e_workspace_chip.js` returns 0

## observation contract

### Driving steps

1. Bind flat workspace; click chip; assert WORKSPACE_POPOVER_OPENED; popover shows shape "flat"
2. Bind isolate workspace in another pane; assert shape "isolate"

### Three-channel agreement

- Structural: chip label matches manifest workspace_shape
- Perceptual: header_popover anchor (from Sprint 033) will encode the kind ordinal
- Log ↔ signal: OPEN/CLOSE symmetric

## done criteria

Workspace surfaces read-only in the header. Sprint 033 (header_popover mutex) dispatches next.
