---
id: 316
status: closed
phase: shell-to-react D7.4
pass_kind: functional
---

# Sprint 316 — `MetaView`: the lens chips, the toggles, the scroller and the gutter

## scope

`web/app/MetaView.tsx` draws the machinery column for its pane: the lens chips (picking language asks the controller to measure the record again, as before), the all/app and down/side toggles in the stream, the side graph, the scroller (it follows the bottom; it sets find's scope to the stream on a click; in the side direction it and the graph scroll in proportion), the lens on show, and the gutter, whose drag moves the split. `web/reveal.ts` registers the `meta` mount keyed by the focused pane, in place of the six lens mounts. D81: no lens reads the window's width; the meta view reads it only to scale the gutter's drag.

## artifact contract

- Created: `web/app/MetaView.tsx`. Modified: `web/reveal.ts`. `npm run build` 0.

## result

Closed 2026-11-05.

## Rubber Duck pass

No signals.
