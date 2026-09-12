# Sprint 025 — records surface

---
id: 025
epic: G — Surfaces
status: closed
phase: 3
pass_kind: architecture
spec_reference: signals/0.1.json § surface SURFACE_OPENED/CLOSED kind=records; D5 (summoned surfaces)
prerequisites: 024 closed
---

## scope

Cmd-R (or menu Records) opens the Records surface as a pane-scoped view over `~/.substrate/sessions/`. Lists all sessions (name, status, workspace, last touched). Enter on a row primes Sprint 009's resume flow.

## signal contract

### Emits

- `SURFACE_OPENED` (`{pane_id, kind: "records"}`)
- `SURFACE_CLOSED` (`{pane_id, kind: "records"}`)

### Consumes

Bridge op `list_sessions` (reads manifest.json under fcntl.flock per session_registry.py).

## artifact contract

### Files

- `bridge/main.py` — op `list_sessions` returning `[{session_id, name, status, workspace, last_touched}]`
- `src/render/RecordsSurface.tsx` — list + filters
- `tests/harness/e2e_records_surface.js`

### Content assertions

- kind enum ∈ {records, assay, studio} (Layer 2 payload)
- Layer 5 mutex: at most one surface per pane

### Command exit codes

- `node tests/harness/e2e_records_surface.js` returns 0

## observation contract

### Driving steps

1. Cmd-R; assert SURFACE_OPENED{kind:"records"}; list renders
2. Esc; assert SURFACE_CLOSED
3. Cmd-R; Enter on a row; verify Sprint 009 resume fires

### Three-channel agreement

- Structural: `[data-testid="surface-records"]` present when open
- Perceptual: `anchor-pane-<id>-surface` byte encodes kind ordinal (records=64)
- Log ↔ signal: OPEN/CLOSE symmetric

## done criteria

Records surface lists real sessions; resume handoff works. Sprint 026 (assay surface) dispatches next.
