# Sprint 033 — header popover mutex

---
id: 033
epic: I — Header & driver
status: closed
phase: 3
pass_kind: widening
spec_reference: signals/0.1.json § header_popover kind enum; Layer 5 exclusivity — Layer 1 v0.1 carries per-kind pairs (DRIVER_DROPDOWN_OPENED/CLOSED, WORKSPACE_POPOVER_OPENED/CLOSED) but no generic HEADER_POPOVER_*
prerequisites: 032 closed
---

## scope

Enforce mutex across the ratified per-kind popover tags: at most one of {DRIVER_DROPDOWN_OPENED, WORKSPACE_POPOVER_OPENED} carries an open state per pane at any time. Opening one same-step-closes any other. Bundle attach (Sprint 034), tools restrict (Sprint 035), and rename (Sprint 042) render as inline forms without their own open/close signal — those emit their action tag directly. Layer 1 v0.1 did not ratify a generic HEADER_POPOVER_* pair, so the mutex operates over the two ratified pairs only.

## signal contract

### Emits

No new tags. The mutex is a Layer 5 invariant over the pairs Sprints 031 and 032 already emit.

### Consumes

DRIVER_DROPDOWN_OPENED (Sprint 031); WORKSPACE_POPOVER_OPENED (Sprint 032).

## artifact contract

### Files

- `src/reducer/ShellReducer.ts` — mutex: opening one closes the other same-step
- `tests/harness/e2e_header_popover_mutex.js`

### Content assertions

- Reducer selector: `openHeaderPopover(paneId)` returns at most one of {"driver", "workspace"} per pane
- No new tag names appear in the emitted JSONL during the mutex flip (grep proof)

### Command exit codes

- `node tests/harness/e2e_header_popover_mutex.js` returns 0

## observation contract

### Driving steps

1. Click DriverChip; assert DRIVER_DROPDOWN_OPENED
2. Click WorkspaceChip; assert same-step DRIVER_DROPDOWN_CLOSED + WORKSPACE_POPOVER_OPENED (both within 16ms)
3. Click outside; assert WORKSPACE_POPOVER_CLOSED

### Three-channel agreement

- Structural: exactly one popover DOM element at any time
- Perceptual: the per-pane header_popover anchor (from Layer 7) encodes kind ordinal (0 closed, 32 driver, 64 workspace); flips 32 → 64 same-step at the swap
- Log ↔ signal: DROP CLOSE + WSP OPEN carry matching timestamps (Δt < 16ms)

## done criteria

Mutex holds under rapid clicks; no invented tags in the trace. Epic I closes. Sprint 034 (bundle attach) dispatches next.
