---
id: 318
status: closed
phase: shell-to-react E1.1
pass_kind: functional
---

# Sprint 318 — the pane grid as pure functions

## scope

Plan row E1. `web/app/derive/panes.ts`: `splitPane` (the focused pane halves along one axis, every track on that axis doubling first when its span is one; at most eight panes), `closePane` (one pane left takes the whole grid; otherwise the neighbour sharing the closed pane's whole edge grows over it, and with none the space stays empty; the first pane left takes the focus), `dragCols` and `dragRows` (the two tracks beside a gutter trade weight, columns by the drag's share of the window, rows by its share of 600px, floors 0.25 and 0.3), `trackList` and `gutterStops`.

## artifact contract

- Created: `web/app/derive/panes.ts`, `web/app/__tests__/panes.spec.ts`. `npm run test:unit` 0.

## result

Closed 2026-11-05. Unit 139/139.

## Rubber Duck pass

No signals.
