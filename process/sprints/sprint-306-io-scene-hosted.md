---
id: 306
status: closed
phase: shell-to-react D5.4
pass_kind: functional
---

# Sprint 306 — the template hosts the i/o and scene lenses

## scope

`web/reveal.html`: the i/o and scene blocks give way to `<div data-app-mount="io">` and `<div data-app-mount="scene">`; `web/reveal.ts` registers both mounts, whose roots take no box.

## artifact contract

- Modified: `web/reveal.html` (no `ioDocs`, `sceneCells`), `web/reveal.ts`. `npm run build` 0.

## result

Closed 2026-11-05.

## Rubber Duck pass

No signals.
