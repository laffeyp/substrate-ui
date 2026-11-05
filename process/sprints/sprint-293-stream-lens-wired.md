---
id: 293
status: closed
phase: shell-to-react D2.4
pass_kind: functional
---

# Sprint 293 — the template hosts the stream lens

## scope

`web/reveal.html`: inside the stream's scroller, the legend, the rows and the inspector give way to `<div data-app-mount="stream">`; the scroller, its follow-the-bottom ref and its scroll sync with the side graph stay. `web/reveal_component.ts` writes the stream's view after each render and registers the pick action; the row, connector, legend and inspector values go from renderVals, with the inspector's `selContent` loop, which only ever drew an empty list. Find's match count uses `findText`.

## artifact contract

- Modified: `web/reveal.html` (no `INSPECT`, no `{{ events }}`), `web/reveal_component.ts` (no `selPayload`, `laneLegend`, `FSTREAM`). `npm run build` 0.

## observation contract

`meta_inspector_io_scene`, `stream_follows_bottom`, `app_view_delegate_lane`, `graph_model_lane_on_resume`, `structure_lists_producers`, `find_counts_transcript`, `language_lens_turns`, `delegate_pane`, `run_panes` exit 0; pixels equal the baseline but for the inspector's payload.

## result

Closed 2026-11-05. All nine 0. Pixels 26/28 against `baseline-2026-11-05-b6`: both `meta-inspector` captures differ, and only where the payload's `"kind": "first_message"` and `"instance"` lines were and the rows below them, which sit two lines higher. Those captures are the new baseline, `baseline-2026-11-05-d2`. A first edit matched the template's earlier `isStream` block and dropped the side graph and the scroller; the probe found no `[data-stream-scroll]`, and the template was restored from git and edited at the right block before any gate counted.

## Rubber Duck pass

No signals of its own.
