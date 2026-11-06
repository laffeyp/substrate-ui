---
id: 344
status: closed
phase: shell-to-react, fix
pass_kind: functional
---

# Sprint 344 — the window's views are built from committed state (the missed model pick)

## scope

A fix to a fault sprint 328 introduced. `App.render` built the views the other areas draw (the pane pickers', the stream's record, the panes view, the top bar's fields and actions, find's match count) into instance fields, and `componentDidUpdate` published them. React 18's concurrent root can call `render` for an update that commits later or not at all, so a commit could publish views another render built. The trace in `bindPaneAsUser` (sprint 335) caught it in `slash_inline_hint`: the page had not reloaded; the folder read armed at 221 ms, un-armed at 249 ms and armed again at 893 ms with no input between; the click at 283 ms landed on the model row while the published view was un-armed, so its pick did nothing. dc-runtime rendered synchronously, so the old component never met it. `computeViews`, called by `publish` from `componentDidMount` and `componentDidUpdate`, builds them from the committed state and props; `render` only draws. The registry's `setActive` moves from `render` to `computeViews` with them.

## artifact contract

- Modified: `web/app/App.tsx`. `npm run build` 0; `npm run test:unit` 0.

## observation contract

`slash_inline_hint` and `model_half_starts_session` (the second failure of the same run, "pane 2's bar does not list the folder") exit 0; every `gates:electron` script run alone exits 0.

## result

Closed 2026-11-05. Both 0; the full run 60 of 60, Axis C bugs 0. The trace stays in the helper: one clean run does not prove a rare fault gone.

## Rubber Duck pass

No signals change.
