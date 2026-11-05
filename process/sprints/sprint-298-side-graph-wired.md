---
id: 298
status: closed
phase: shell-to-react D3.4
pass_kind: functional
---

# Sprint 298 — the template hosts the side graph

## scope

`web/reveal.html`: the side block gives way to `<div data-app-mount="side-graph">` under `isSide`. `web/reveal_component.ts` registers the graph link in componentDidMount (the graph's element; its scroll moves the stream in proportion) and drops `segOf`, `pct`, `sideLanes`, `sideAxisA`, `sideAxisB`, `graphRef` and `onGraphScroll` from renderVals; the stream's scroll still moves the graph.

## artifact contract

- Modified: `web/reveal.html` (no `sideLanes`, `graphRef`), `web/reveal_component.ts` (no `segOf`, `streamSideLanes`). `npm run build` 0.

## observation contract

`graph_model_lane_on_resume`, `both_session_shapes` (both read the side graph's lanes), `meta_inspector_io_scene`, `stream_follows_bottom`, `app_view_delegate_lane` exit 0; pixels equal `baseline-2026-11-05-d2`.

## result

Closed 2026-11-05. All five 0; pixels 28/28.

## Rubber Duck pass

No signals.
