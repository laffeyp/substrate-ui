---
id: 275
status: closed
phase: shell-to-react C4.2
pass_kind: functional
---

# Sprint 275 — DCLogic's picker uses the pure functions

## scope

`reveal_component.ts`: `_wsPickerRows` maps `workspaceRows` to the template's fields; the workspace half of `_wsKey` takes `treeKey`'s step and `tabFill`; the guidance, length and tone lines take `lineStep` in one loop; `_bindPane` takes `paneShape`; `_treeKey` and the sandbox literals go. The template is unchanged.

## artifact contract

- Modified: `web/reveal_component.ts` (no `_treeKey`, no `'~/.substrate/sandbox'`; contains `workspaceRows(`, `lineStep(`). `npm run build` 0.

## observation contract

`ws_column_opens_down`, `left_folds_parent`, `left_folds_workspace`, `model_down_drills`, `model_half_starts_session`, `length_tone_rows`, `no_default_model`, `git_workspace_label`, `session_start_line`, `split_returns_to_panes` exit 0; pixels equal `baseline-2026-11-05-b6`.

## result

Closed 2026-11-05. All ten 0; pixels 28/28 (see sprint 279 for one intermittent capture).

## Rubber Duck pass

`DRIVER_PICKED`, `BUNDLE_PICKED`, `SESSION_OPEN_REQUESTED` and `SESSION_OPEN_ACKED` in the bind gates as before.
