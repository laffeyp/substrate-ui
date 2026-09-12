# Sprint 026 — assay surface

---
id: 026
epic: G — Surfaces
status: closed
phase: 3
pass_kind: architecture
spec_reference: signals/0.1.json § surface kind=assay; D5
prerequisites: 025 closed
---

## scope

Assay surface renders the substrate assay grid — a table view over records by topology + trial + score. The drill-in path (ASSAY_ARM_INSPECTED / ASSAY_CELL_OPENED) is deferred to v0.2 (Layer 1 review §6 defer note). This sprint ships the grid and the open/close pair.

## signal contract

### Emits

- `SURFACE_OPENED` (`{pane_id, kind: "assay"}`)
- `SURFACE_CLOSED` (`{pane_id, kind: "assay"}`)

### Consumes

Bridge op `list_assays` returning rows across records.

## artifact contract

### Files

- `bridge/main.py` — op `list_assays`
- `src/render/AssaySurface.tsx` — grid renderer (rows × arms)
- `tests/harness/e2e_assay_surface.js`

### Content assertions

- Drill-in defer note documented in the source

### Command exit codes

- `node tests/harness/e2e_assay_surface.js` returns 0

## observation contract

### Driving steps

1. Cmd-A; assert SURFACE_OPENED{kind:"assay"}
2. Grid renders ≥0 rows; no crash on empty
3. Esc; SURFACE_CLOSED

### Three-channel agreement

- Structural: `[data-testid="surface-assay"]` present
- Perceptual: surface anchor byte encodes assay ordinal (assay=128)
- Log ↔ signal: symmetric

## done criteria

Assay grid renders. Sprint 027 (Studio) dispatches next.
