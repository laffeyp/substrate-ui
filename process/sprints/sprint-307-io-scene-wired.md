---
id: 307
status: closed
phase: shell-to-react D5.5
pass_kind: functional
---

# Sprint 307 — DCLogic drops the i/o and scene values

## scope

`web/reveal_component.ts` loses `_findGrid`, `SCENE_MAX_CELLS`, `graphGrid`, `ioDocs` and the `scene*` values. `harness/shakeout/meta_inspector_io_scene.ts`'s comment on the i/o head names the React lens instead of dc-runtime's spans.

## artifact contract

- Modified: `web/reveal_component.ts`, `harness/shakeout/meta_inspector_io_scene.ts`. `npm run build` 0.

## observation contract

`meta_inspector_io_scene` exits 0; pixels equal `baseline-2026-11-05-d2`.

## result

Closed 2026-11-05. Gate 0 (i/o 2 documents, seqs [17,22]; scene empty line); pixels 28/28. No gate draws a grid: no record in the harness carries one; the spec holds the grid's derivation.

## Rubber Duck pass

No signals.
