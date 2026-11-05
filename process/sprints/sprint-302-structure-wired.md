---
id: 302
status: closed
phase: shell-to-react D4.3
pass_kind: functional
---

# Sprint 302 — the template hosts the structure lens

## scope

`web/reveal.html`: the structure block gives way to `<div data-app-mount="structure">` under `isStructure`, and the helmet loses the `.st` rules. `web/reveal.ts` registers the mount. `web/reveal_component.ts` writes the topology into the stream's view and drops the `topo*` values and `STRUCTURE_DEFS`.

## artifact contract

- Modified: `web/reveal.html` (no `topo`, no `.st{`), `web/reveal.ts`, `web/reveal_component.ts` (no `topoProducerRows`, `STRUCTURE_DEFS`). `npm run build` 0.

## observation contract

`structure_lists_producers` exits 0; pixels equal `baseline-2026-11-05-d2`, the 900px structure capture drawing the stacked rows.

## result

Closed 2026-11-05. Gate 0: 24 events, 10 producers, 20 triggers, 7 views, matching the record. Pixels 28/28. Three files (drift entry).

## Rubber Duck pass

No signals.
