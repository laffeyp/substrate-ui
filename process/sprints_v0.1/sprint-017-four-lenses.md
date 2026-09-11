# Sprint 017 — four lenses

---
id: 017
epic: E — Reveal & lenses
status: closed
phase: 3
pass_kind: architecture
spec_reference: signals/0.1.json § lens LENS_SWITCHED; D10/D20 (four lenses); v7 Structure lens 298-312; FUNCTIONALITY
prerequisites: 016 closed
---

## scope

Reveal renders one of four lenses on the current pane's session: stream+graph, i/o, structure, scene. Lens tabs at the top of the reveal view. Structure lens shows the topology entities (Trigger, View, Route, TerminationPolicy). Scene renders the run's spatial layout.

## signal contract

### Emits

- `LENS_SWITCHED` (`{pane_id, lens: "stream+graph"|"i/o"|"structure"|"scene", prior_lens}`)

### Consumes

Bridge record stream (from Sprint 014) — each lens is a distinct read over the same envelopes.

## artifact contract

### Files

- `src/render/RevealShell.tsx` — lens tabs
- `src/render/lens/StreamGraphLens.tsx` — envelope stream + graph adjacency
- `src/render/lens/IOLens.tsx` — Producer inputs/outputs table
- `src/render/lens/StructureLens.tsx` — Trigger/View/Route/TerminationPolicy tree per topology_graph
- `src/render/lens/SceneLens.tsx` — spatial run rendering
- `tests/harness/e2e_lenses.js`

### Content assertions

- Every lens enum value has a component; the switch is exhaustive

### Command exit codes

- `node tests/harness/e2e_lenses.js` returns 0

## observation contract

### Driving steps

1. Bind, submit a turn, reveal
2. Cycle through the four lenses; assert LENS_SWITCHED per click
3. Assert each lens' distinct DOM footprint

### Three-channel agreement

- Structural: `[data-testid="lens-<name>"]` present per active lens
- Perceptual: `anchor-pane-<id>-lens` byte encodes lens ordinal (0..3)
- Log ↔ signal: LENS_SWITCHED sequence matches click sequence; prior_lens correct

## done criteria

Four lenses render; anchor tracks active lens. Sprint 018 (level + direction toggles) dispatches next.
