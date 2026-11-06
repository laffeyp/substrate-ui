---
id: 319
status: closed
phase: shell-to-react E1.2
pass_kind: functional
---

# Sprint 319 — DCLogic's split, close and gutters use the pure functions

## scope

`web/reveal_component.ts`: `_split` builds the layout with `splitPane` (the new pane from `_newPane`, as before), `_closePane` with `closePane` after ending the pane's session, the gutter drag with `dragCols` and `dragRows`, and `paneCols`, `paneRows`, `colGutters`, `rowGutters` with `trackList` and `gutterStops`.

## artifact contract

- Modified: `web/reveal_component.ts`. `npm run build` 0; lint 0.

## observation contract

`split_returns_to_panes`, `menu_commands`, `run_panes`, `delegate_pane`, `new_window`, `naming_sessions`, `pane_grid` exit 0; pixels equal `baseline-2026-11-05-d2`.

## result

Closed 2026-11-05. All seven 0; pixels 28/28.

## Rubber Duck pass

No signals.
