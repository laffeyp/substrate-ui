# Sprint 043 — collection persist

---
id: 043
epic: N — Collections
status: pending
phase: 3
pass_kind: architecture
spec_reference: signals/0.1.json § summary COLLECTION_PERSISTED; D68 (ephemeral collections + SQLite whole-state); Layer 4 (throttle 1/5s)
prerequisites: 042 closed
---

## scope

Menu Collection ▸ Save persists the app's whole state (window tree, pane tree, per-pane sessions, per-pane lens/reveal/surface/find state) as one SQLite blob at `~/.substrate/collections/<name>.sqlite`. Throttled to one COLLECTION_PERSISTED per 5s.

## signal contract

### Emits

- `COLLECTION_PERSISTED` (`{collection_name, pane_count, session_count, size_bytes}`)

### Consumes

Menu Collection ▸ Save; ⌘⇧S.

## artifact contract

### Files

- `bridge/main.py` — op `collection_save`; serialises reducer state; writes SQLite via sqlite3 stdlib
- `src/render/CollectionSaveDialog.tsx`
- `src/observability/CollectionThrottle.ts` — 5s throttle
- `tests/harness/e2e_collection_persist.js`

### Content assertions

- Layer 4 throttle: 10 saves in 5s produce ≤2 COLLECTION_PERSISTED
- ShellReducer.emits owns COLLECTION_PERSISTED (Layer 6 O1 fix)

### Command exit codes

- `node tests/harness/e2e_collection_persist.js` returns 0

## observation contract

### Driving steps

1. Open 3 panes with 3 sessions; save collection "work"
2. Assert SQLite file at ~/.substrate/collections/work.sqlite
3. Assert COLLECTION_PERSISTED payload matches

### Three-channel agreement

- Structural: dialog reports success
- Perceptual: no dedicated anchor (summary tag; ephemeral)
- Log ↔ signal: throttle observed

## done criteria

Save writes SQLite; throttle holds. Sprint 044 (restore) dispatches next.
