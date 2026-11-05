---
id: 255
status: closed
phase: shell-to-react B5.3b
pass_kind: functional
---

# Sprint 255 — the assay page swaps in

## scope

`reveal.html`'s assay block keeps its `sc-if` and becomes `<div data-app-mount="assays">` with the page's scroll style. `reveal_component.ts` drops `arms`, `assaysEmpty`, `assaysAny` and the two unbound fields `openAssay` and `backToSession`.

## artifact contract

- Modified: `web/reveal.html` (no `assaysEmpty`, `EASY·8`), `web/reveal_component.ts` (no `assaysAny`, `openAssay`, `backToSession`). `npm run build` 0; `npm run test:unit` 0.

## result

Closed 2026-11-05. Build 0; unit 100/100.

## Rubber Duck pass

No signals.
