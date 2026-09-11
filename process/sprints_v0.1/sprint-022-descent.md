# Sprint 022 — descent into child record

---
id: 022
epic: F — Delegate flow
status: closed
phase: 3
pass_kind: architecture
spec_reference: signals/0.1.json § descent DESCENT_ENTERED/EXITED; D70 (nested descent); depth 1..2
prerequisites: 021 closed
---

## scope

Alt-click a delegate row (or menu Descend) to descend the pane INTO the child record. The pane rebinds to the child session (temporary; ⌫ or Esc exits). Descent stratum tracks depth (1..2).

## signal contract

### Emits

- `DESCENT_ENTERED` (`{pane_id, from_session_id, into_session_id, depth, child_record_root, talkable}`)
- `DESCENT_EXITED` (`{pane_id, depth}`)

### Consumes

None (gesture-driven).

## artifact contract

### Files

- `src/reducer/ShellReducer.ts` — DESCENT_ENTER / DESCENT_EXIT actions; depth guard
- `src/render/PaneHeader.tsx` — breadcrumb showing descent depth
- `tests/harness/e2e_descent.js`

### Content assertions

- depth in {1, 2}; depth === 3 rejected (Sprint 023 handles the refusal path)

### Command exit codes

- `node tests/harness/e2e_descent.js` returns 0

## observation contract

### Driving steps

1. Trigger delegate; alt-click to descend; assert DESCENT_ENTERED{depth:1}
2. From within, trigger another delegate; descend; assert DESCENT_ENTERED{depth:2}
3. Esc twice; assert DESCENT_EXITED × 2

### Three-channel agreement

- Structural: pane header shows breadcrumb "parent ▸ child ▸ grandchild"
- Perceptual: `anchor-pane-<id>-descent` byte encodes depth (0 base, 128 d=1, 255 d=2)
- Log ↔ signal: ENTER count === EXIT count over a session

## done criteria

Descent to depth 2 works. Sprint 023 (cap refusal + fan-out walk) dispatches next.
