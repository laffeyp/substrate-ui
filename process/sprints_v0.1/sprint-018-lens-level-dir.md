# Sprint 018 — lens level + direction toggles

---
id: 018
epic: E — Reveal & lenses
status: pending
phase: 3
pass_kind: architecture
spec_reference: signals/0.1.json § lens STREAM_LEVEL_TOGGLED (all|app) + STREAM_DIR_TOGGLED (down|side)
prerequisites: 017 closed
---

## scope

Two lens sub-toggles. Level flips between "all" (every producer) and "app" (only app-level producers, filtering framework noise). Direction flips between "down" (parent → child, temporal) and "side" (peer-to-peer, structural).

## signal contract

### Emits

- `STREAM_LEVEL_TOGGLED` (`{pane_id, level: "all"|"app"}`)
- `STREAM_DIR_TOGGLED` (`{pane_id, dir: "down"|"side"}`)

### Consumes

Bridge record stream — filters applied client-side.

## artifact contract

### Files

- `src/render/RevealShell.tsx` — adds level + dir toggles
- `src/render/lens/filters.ts` — filter fns per level/dir
- `tests/harness/e2e_lens_level_dir.js`

### Content assertions

- app-level filter respects Producer.kind ∈ substrate's kernel constants set

### Command exit codes

- `node tests/harness/e2e_lens_level_dir.js` returns 0

## observation contract

### Driving steps

1. Reveal a run with mixed app/framework producers
2. Toggle level; assert STREAM_LEVEL_TOGGLED + DOM node count changes
3. Toggle dir; assert STREAM_DIR_TOGGLED + edge direction changes in the graph lens

### Three-channel agreement

- Structural: post-toggle DOM reflects filtered node set
- Perceptual: `anchor-pane-<id>-level` byte 0 (all) / 128 (app); `anchor-pane-<id>-dir` byte 0 (down) / 128 (side)
- Log ↔ signal: toggle count matches JSONL count

## done criteria

Level + direction toggles work. Sprint 019 (reveal focus) dispatches next.
