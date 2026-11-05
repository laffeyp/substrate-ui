---
id: 292
status: closed
phase: shell-to-react D2.3
pass_kind: functional
---

# Sprint 292 — the stream lens's mount and hover rule

## scope

`web/reveal.ts` registers the `stream` mount, whose root takes no box, so the legend and the rows lay out in the stream's scroller as the template's did; `web/app/hover.css` gains the row's hover rule (the template's `style-hover="background:#26292e"`).

## artifact contract

- Modified: `web/reveal.ts`, `web/app/hover.css`. `npm run build` 0.

## result

Closed 2026-11-05.

## Rubber Duck pass

No signals.
