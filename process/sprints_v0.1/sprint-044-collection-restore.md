# Sprint 044 — collection restore

---
id: 044
epic: N — Collections
status: pending
phase: 3
pass_kind: architecture
spec_reference: signals/0.1.json § summary COLLECTION_RESTORED
prerequisites: 043 closed
---

## scope

Menu Collection ▸ Open reads a saved SQLite blob and restores the reducer state: windows, panes, per-pane sessions, per-pane view state. Sessions are resumed (Sprint 009). Non-existent session_ids (ended between save and restore) surface as unbound panes with a hint row.

## signal contract

### Emits

- `COLLECTION_OPENED` (`{collection_name}`) — fires when the user picks a collection file (pre-restore)
- `COLLECTION_RESTORED` (`{window_count, pane_count, bound_session_count}`) — Layer 2 payload verbatim (three fields)

Sessions that no longer exist between save and restore surface as unbound panes; `bound_session_count` reflects only the sessions that resumed cleanly, so a partial restore (some sessions gone) reports a lower `bound_session_count` than the collection originally held.

### Consumes

Menu Collection ▸ Open.

## artifact contract

### Files

- `bridge/main.py` — op `collection_load`
- `src/render/CollectionOpenDialog.tsx`
- `src/reducer/ShellReducer.ts` — RESTORE_COLLECTION action; batches resume ops
- `tests/harness/e2e_collection_restore.js`

### Content assertions

- ShellReducer.emits owns COLLECTION_RESTORED (Layer 6 O1 fix)

### Command exit codes

- `node tests/harness/e2e_collection_restore.js` returns 0

## observation contract

### Driving steps

1. Save collection "work"; quit; relaunch; Open "work"
2. Assert pane grid reconstructs; sessions resume
3. Delete a session_id between save/restore; assert one unbound pane with hint

### Three-channel agreement

- Structural: pane count matches saved count
- Perceptual: each restored pane's status anchor matches manifest status
- Log ↔ signal: COLLECTION_OPENED fires before COLLECTION_RESTORED; the payload's three counts match reducer state post-restore

## done criteria

Round-trip save/restore preserves state. Epic N closes. Sprint 045 (menu bar) dispatches next.
