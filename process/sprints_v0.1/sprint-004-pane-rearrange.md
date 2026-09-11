# Sprint 004 — pane drag-to-rearrange

---
id: 004
epic: B — Pane grid
status: closed
phase: 2
pass_kind: architecture
spec_reference: signals/0.1.json § pane; PANE-MECHANICS §Drop zones (5 zones: w/e/n/s/c); D35
prerequisites: 003 closed
---

## scope

Grab a pane by its header handle; drag onto another pane; five drop zones (west, east, north, south, center) light up during hover; drop rearranges the split tree. Center-drop swaps content. Edge-drops carve a new split.

## signal contract

### Emits

- `DROP_HINT_SHOWN` (`{source_pane_id, target_pane_id}`) — first hint fires at drag begin
- `DROP_HINT_ZONE_CHANGED` (`{source_pane_id, target_pane_id, to_zone: "w"|"e"|"n"|"s"|"c"}`)
- `DROP_HINT_HIDDEN` (`{source_pane_id, committed: boolean}`) — hint clears at drag end
- `PANE_MOVED` (`{source_pane_id, target_pane_id, zone}`) — Layer 5 pins `zone` matches last DROP_HINT_ZONE_CHANGED

### Consumes

None.

## artifact contract

### Files

- `src/state/SplitTree.ts` — `move(sourceId, targetId, zone)` operation
- `src/render/DropOverlay.tsx` — five hit zones per hovered target pane
- `src/render/PaneHeader.tsx` — drag handle (skeleton; header build lands in Epic I)
- `tests/harness/e2e_pane_rearrange.js`

### Content assertions

- Five distinct hit regions per pane; zone enum matches Layer 2 payload
- Center-drop swaps `pane_id → session_id` bindings; edge-drops preserve them

### Command exit codes

- `npx tsc --noEmit` returns 0
- `node tests/harness/e2e_pane_rearrange.js` returns 0

## observation contract

### Driving steps

1. Split into three panes
2. Drag pane A onto pane B's east edge; drop
3. Drag pane C onto pane A center; drop
4. Verify final split tree matches expected shape via reducer state

### Three-channel agreement

- Structural: DropOverlay renders exactly 5 zones during drag; PANE_MOVED payload `zone` matches the last DROP_HINT_ZONE_CHANGED `to_zone`
- Perceptual: pane focus anchors update to reflect post-move focus
- Log ↔ signal: sequence DROP_HINT_SHOWN → DROP_HINT_ZONE_CHANGED* → PANE_MOVED → DROP_HINT_HIDDEN{committed:true}

## done criteria

Rearrange works for all five zones; Layer 5 exclusivity (zone matches hint) held across ten randomized drags in the harness. Sprint 005 (close + walked focus + window close) dispatches next.
