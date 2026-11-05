---
id: 304
status: closed
phase: shell-to-react D5.2
pass_kind: functional
---

# Sprint 304 — the scene lens's grid as a pure function

## scope

`web/app/derive/scene.ts`: `sceneOf`, the latest payload whose `grid`, `cells` or `matrix` is a grid, every row an array of numbers of one length; a payload that throws on access counts as none. Over `SCENE_MAX_CELLS` (400) the lens now says a grid of that size is on the record and too large to draw; before, it said the record had no 2-D grid. A ragged grid, which the component drew with cells out of place (it checked only the first value), is no grid.

## artifact contract

- Created: `web/app/derive/scene.ts`. `npm run test:unit` 0.

## result

Closed 2026-11-05. The spec's scene test covers the latest grid, ragged and non-numeric rows, a 21×20 grid over the limit, and a throwing payload.

## Rubber Duck pass

No signals.
