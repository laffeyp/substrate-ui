---
id: 320
status: closed
phase: shell-to-react E1.3
pass_kind: functional
---

# Sprint 320 — gate: the pane grid's splits, gutter drag and closes

## scope

`harness/shakeout/pane_grid.ts`, written before E2 moves the panes: in a 1200×800 window ⌘D and ⌘⇧D tile three panes; a 120px drag of the column gutter puts pane 1 at the share `dragCols` gives; Close Pane on pane 3 gives pane 2 the full height; a second Close Pane closes pane 1, which a close focuses, and leaves pane 2 the grid and no gutter. `package.json` runs it in `gates:electron` (56 scripts).

## artifact contract

- Created: `harness/shakeout/pane_grid.ts`. Modified: `package.json`.

## observation contract

The gate exits 0; with `closePane` handing the space to no neighbour it exits 1 at the close; with the column drag wired at half its distance it exits 1 at the drag.

## result

Closed 2026-11-05. 0: pane 1 at 0.599 of the grid after the drag, the rule's 0.600. Planted, no neighbour grows: exit 1, pane 2 at height 0.499. Planted, half the drag: exit 1, pane 1 at 0.5495. Two first drafts of the gate were wrong, not the app: the column gutter's midpoint lies under the row gutter, which spans the grid's whole width, so a grab there took the row gutter; and a close focuses the first pane left, not the neighbour that grew, so the second close removes pane 1.

## Rubber Duck pass

No signals.
