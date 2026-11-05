---
id: 248
status: closed
phase: shell-to-react B5.1b
pass_kind: functional
---

# Sprint 248 — the registry proxies the assay loads; their spec

## scope

`PaneRegistry` forwards `loadAssays` and `loadAssayReport` to the focused pane's controller. `web/reveal/__tests__/assay_loads.spec.ts` feeds the controller the server's bodies for a two-arm coding fixture (read through substrate's `report_from_cells`) and checks the mapping, the tags and a refused read.

## artifact contract

- Modified: `web/vm/pane_registry.ts`. Created: `web/reveal/__tests__/assay_loads.spec.ts`.
- `npm run test:unit` 0.

## result

Closed 2026-11-05. Spec 3/3.

## Rubber Duck pass

`ASSAYS_LOADED {count: 1}` and `ASSAY_REPORT_LOADED {name: coding-fixture, arms: 2}` in the spec's trace; none on the refused read.
