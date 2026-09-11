# Sprint 046 — keyboard bindings

---
id: 046
epic: O — Menu bar & shortcuts
status: pending
phase: 3
pass_kind: architecture
spec_reference: Settings.bindings key (Sprint 040); Layer 1 v0.1 does not ratify a KEYBINDING_FIRED tag — like Sprint 045, the observation is the routed action's own tag
prerequisites: 045 closed
---

## scope

Keyboard shortcuts route through the bindings map (from Settings). Each keychord routes to the same shell action a menu item would, and the observation is the routed action's tag (⌘F → FIND_OPENED; ⌘, → SETTINGS_OPENED; ⌘W → PANE_CLOSED; ⌘D → PANE_SPLIT{axis:"col"}). Users can rebind in Settings.

## signal contract

### Emits

None new. Keyboard events route to the same reducer actions the menu bar hits.

### Consumes

Global keydown listener on document.

## artifact contract

### Files

- `src/observability/Bindings.ts` — bindings map, keydown dispatcher
- `src/state/Settings.ts` — extended with default bindings
- `tests/harness/e2e_bindings.js`

### Content assertions

- Default bindings: ⌘F=find_open, ⌘,=settings_open, ⌘W=pane_close, ⌘D=split_right, ⌘⇧D=split_down, ⌘E=end_confirm_open, ⌘R=surface_records_open, F2=session_rename_open, Esc=surface_close
- Rebind persists across launch (Settings.bindings key ships via Sprint 040's SETTING_CHANGED)

### Command exit codes

- `node tests/harness/e2e_bindings.js` returns 0

## observation contract

### Driving steps

1. ⌘F on a bound pane; assert FIND_OPENED fires (Sprint 028's tag)
2. Rebind find to ⌘/ in Settings via Sprint 040's SETTING_CHANGED{key:"bindings"}; ⌘/ fires FIND_OPENED after the rebind lands
3. Grep the trace for any invented input-layer tag; assert zero

### Three-channel agreement

- Structural: expected reducer action dispatched; the surface the binding opens mounts
- Perceptual: no dedicated anchor (input dispatch is transparent to paint)
- Log ↔ signal: every keychord's routed action emits its own tag; no KEYBINDING_FIRED tag appears

## done criteria

Bindings dispatch to routed actions; rebind persists; the trace stays clean. Epic O closes. Sprint 047 (anchor audit) dispatches next.
