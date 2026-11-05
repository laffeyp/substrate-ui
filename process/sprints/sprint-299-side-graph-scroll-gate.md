---
id: 299
status: closed
phase: shell-to-react D3.5
pass_kind: functional
---

# Sprint 299 — gate: the side graph and the stream scroll together

## scope

`harness/shakeout/side_graph_scroll.ts`: in a 900px window, with the stream over by 300px or more and the side graph's track overflowing, the stream at its top puts the graph at its left edge and at its bottom at its right edge; the graph at its left edge puts the stream at its top and at half its width at half its height. Each step waits for the other side's position, within 1.5px. No gate held this link before D3 moved it. `package.json` runs it in `gates:electron` (55 scripts).

## artifact contract

- Created: `harness/shakeout/side_graph_scroll.ts`. Modified: `package.json`.

## observation contract

The gate exits 0; with the graph's scroll handler removed it exits 1 at the graph-to-stream step; with its element not registered it exits 1 at the stream-to-graph step.

## result

Closed 2026-11-05. 0: stream over by 546px, graph by 153px; graph at half its width put the stream at 0.500. Handler removed: exit 1, `graph at its left edge, the stream not at its top: {"down":1,…,"across":0,…}`. Element not registered: exit 1, `stream at its bottom, the graph not at its right edge`. The stream-at-top step passes on its own whenever the graph starts at its left edge; the three steps after it each move the other side from where it was.

## Rubber Duck pass

No signals.
