---
id: 324
status: closed
phase: shell-to-react E2.4
pass_kind: functional
---

# Sprint 324 — gate: a pane's transcript keeps its element (F361)

## scope

`harness/shakeout/transcript_root_kept.ts`: pane 1's transcript root and first row stay in the page across a turn and a split with no new mount; pane 2's stay when pane 1 closes and pane 2 takes the grid. `package.json` runs it in `gates:electron` (57 scripts).

## artifact contract

- Created: `harness/shakeout/transcript_root_kept.ts`. Modified: `package.json`.

## observation contract

The gate exits 0 on the panes view and 1 on the tree before sprint 323.

## result

Closed 2026-11-05. 0 on the new tree. On the old tree (the three files of sprint 323 stashed) its first draft, a turn and a split only, also exited 0: dc-runtime did not redraw the mount div in those steps, so the draft could not tell the trees apart. The close step was added; on the old tree it exits 1, `after pane 1 closed: pane 2's transcript root replaced, its first row replaced`.

## Rubber Duck pass

No signals.
