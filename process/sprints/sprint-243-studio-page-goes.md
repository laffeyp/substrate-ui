---
id: 243
status: closed
phase: shell-to-react B6.2
pass_kind: functional
---

# Sprint 243 — Studio's page and its component code go

## scope

`reveal.html` loses the Studio block (its comment named `web/studio.html`, which does not exist: F355). `reveal_component.ts` loses Studio's state (the sample topology, `studioView`, `studioOut`, the canvas card positions), `_buildStudioSpec` (its comment named `web/studio.ts`, which does not exist: F338), `_validate`, `_upd`, `_rm`, the card-drag handlers `_mm` and `_mu`, the Studio render fields, the crumb's "› studio" branch and the top bar's Studio fields.

## artifact contract

- Modified: `web/reveal.html`, `web/reveal_component.ts` (neither contains `studio`, case-insensitive). `npm run build` 0.

## result

Closed 2026-11-05; checked with sprint 245.

## Rubber Duck pass

No signals.
