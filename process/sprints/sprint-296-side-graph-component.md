---
id: 296
status: closed
phase: shell-to-react D3.2
pass_kind: functional
---

# Sprint 296 — `SideGraph` and its scroll link

## scope

`web/app/SideGraph.tsx` draws the side graph from the stream's store: the seq axis, the lanes (`sideLanes`), each segment boxed by `segBox` and lit when its seq is, the lane names hidden in the track and drawn again over it at the left. Its scroller carries `data-side-scroll`. `web/app/state/stream.ts` gains the graph link DCLogic registers (the scroller's element and its scroll), since the stream's scroller and the scroll sync stay in DCLogic until plan row D7.

## artifact contract

- Created: `web/app/SideGraph.tsx`. Modified: `web/app/state/stream.ts`. `npm run build` 0.

## result

Closed 2026-11-05.

## Rubber Duck pass

No signals.
