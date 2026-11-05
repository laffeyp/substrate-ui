---
id: 231
status: closed
phase: shell-to-react B3.3b
pass_kind: functional
---

# Sprint 231 — the top bar swaps in

## scope

`reveal.html`'s top bar becomes `<div data-app-mount="top-bar" style="flex:none;min-width:0">`. `reveal_component.ts` keeps computing the bar's values in `renderVals` (they read the panes, the open page and the view, which move in group E), collects them into `_topBarVals` and `_topBarActs` after the render, and writes them to the store in `componentDidMount` and `componentDidUpdate` (`_publishTopBar`); a write during the render would update another React root mid-render. `_finishEdit` ends the rename: it clears the pane's `editing` and, with a name, calls the controller's `nameSession`, as the template's `nameKey` did.

## artifact contract

- Modified: `web/reveal.html` (no `data-top-bar`; contains `data-app-mount="top-bar"`), `web/reveal_component.ts` (contains `_publishTopBar`, `_finishEdit`).
- `npm run build` 0; `npm run test:unit` 0.

## observation contract

`one_top_bar`, `naming_sessions`, `model_chip_indicator`, `driver_chip_on_resume`, `git_workspace_label`, `no_default_model`, `records_keys`, `escape_order`, `first_run_footer` exit 0; pixel captures equal `baseline-2026-11-05-b2`.

## result

Closed 2026-11-05. All nine gates 0; pixels 28/28 at 0 pixels; Axis C bugs 0 (after sprint 234).

## Rubber Duck pass

No signals of the bar's own. `naming_sessions` drives the rename end to end (bar, manifest, session list agree across a reload).
