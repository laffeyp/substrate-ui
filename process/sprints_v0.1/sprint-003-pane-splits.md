# Sprint 003 — pane splits

---
id: 003
epic: B — Pane grid
status: closed
phase: 2
pass_kind: architecture
spec_reference: signals/0.1.json § pane; PANE-MECHANICS §Splits; D35 (8-pane cap per window)
prerequisites: 002 closed
---

## scope

Two split gestures per D35 (split-right, split-down) produce a split tree. Split ratio starts at 0.5. Gutter drag adjusts ratio between siblings. Cap at 8 panes per window. Focus follows creation (the new pane focuses).

## signal contract

### Emits

- `PANE_SPLIT` (`{parent_pane_id, axis: "row"|"col", new_pane_id}`)
- `PANE_CREATED` (`{pane_id, window_id, parent_split_id, axis, ratio: 0.5}`) — same-step per Layer 4
- `PANE_FOCUSED` (`{pane_id, prior_pane_id}`) — same-step
- `GUTTER_DRAG_STARTED` (`{gutter_id, axis}`)
- `GUTTER_DRAG_STOPPED` (`{gutter_id, final_ratio}`) — the in-between motion is silent (Layer 1 v0.1 has no MOVED tag; the observation contract asserts the final_ratio matches expected)

The 9th split refuses in the UI (menu / shortcut disabled at the cap; no error banner, no incident tag — the design chooses quiet refusal over surfaced incident). Layer 1 v0.1 does not carry a PANE_SPLIT_CAP_REFUSED tag; the cap is enforced by the reducer.

### Consumes

None — user gesture.

## artifact contract

### Files created / modified

- `src/state/SplitTree.ts` — binary split tree; helpers `split(paneId, axis)`, `resize(gutterId, ratio)`, `paneCount(windowId)`
- `src/reducer/ShellReducer.ts` — SPLIT + RESIZE + CAP-REFUSED actions
- `src/render/WindowFrame.tsx` — CSS grid via split tree; gutters between siblings
- `src/render/Gutter.tsx` — drag handle; pointer-events for resize
- `tests/harness/e2e_pane_splits.js` — three-channel harness

### Content assertions

- `SplitTree.paneCount(windowId) <= 8` invariant asserted in reducer
- Split menu items + shortcuts disabled when window pane count === 8 (verified in the reducer selector; harness clicks the disabled menu and asserts no PANE_SPLIT emit)

### Command exit codes

- `npx tsc --noEmit` returns 0
- `node tests/harness/e2e_pane_splits.js` returns 0

## observation contract

### Driving steps

1. Split the initial pane right (⌘D or menu)
2. Split the new pane down (⌘⇧D)
3. Drag the horizontal gutter to ratio 0.3; verify GUTTER_DRAG_STARTED then GUTTER_DRAG_STOPPED{final_ratio:0.3}
4. Attempt splits until 8 panes; verify the 9th split gesture is inert (no PANE_SPLIT emit, split menu items greyed)

### Three-channel agreement

- Structural: `WindowFrame` renders three panes with two gutters (one row-axis, one col-axis)
- Perceptual: each of the three panes' `anchor-pane-<id>-focus` byte matches focus flag (255 focused, 128 blurred)
- Log ↔ signal: JSONL sequence PANE_SPLIT → PANE_CREATED → PANE_FOCUSED same-step (Δt < 16ms) for both splits; GUTTER_DRAG_STARTED → GUTTER_DRAG_STOPPED bracketed correctly with final_ratio matching the drag; 9th split gesture produces zero PANE_SPLIT emits

## done criteria

Splits work up to eight panes; gutters resize; cap refusal fires. Sprint 004 (drag+drop rearrange) dispatches next.
