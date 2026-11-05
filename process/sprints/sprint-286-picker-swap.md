---
id: 286
status: closed
phase: shell-to-react C5.3b
pass_kind: functional
---

# Sprint 286 — the picker swaps in

## scope

`reveal.html`'s picker block inside the unbound pane, with its three `choice-line` includes, becomes `<div data-app-mount="picker" data-pane-id=… style="display:contents">`. `reveal_component.ts` collects each unbound pane's view from its pane rows after the render and writes it to the picker store in `componentDidMount` and `componentDidUpdate`. The two partials (`input-bar.html`, `choice-line.html`) are now included nowhere; plan row E4 retires them with the include plugin. (Sprint 285 was not used.)

## artifact contract

- Modified: `web/reveal.html` (no `include partials/choice-line.html`; contains `data-app-mount="picker"`), `web/reveal_component.ts` (contains `_pickerViews`). `npm run build` 0; `npm run test:unit` 0.

## observation contract

`ws_column_opens_down`, `left_folds_parent`, `left_folds_workspace`, `model_down_drills`, `model_half_starts_session`, `length_tone_rows`, `no_default_model`, `git_workspace_label`, `cli_version_picker`, `records_box_width`, `missing_workspace_named`, `split_returns_to_panes`, `new_window`, `first_run_footer`, `workspace_card`, `naming_sessions` exit 0; pixels equal `baseline-2026-11-05-b6`.

## result

Closed 2026-11-05. All sixteen 0; unit 0; pixels 28/28, `panes-picker` included.

## Rubber Duck pass

`DRIVER_PICKED`, `BUNDLE_PICKED`, `SESSION_OPEN_REQUESTED`, `SESSION_OPEN_ACKED` in the bind gates as before.
