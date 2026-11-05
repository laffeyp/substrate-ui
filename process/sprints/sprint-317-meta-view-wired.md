---
id: 317
status: closed
phase: shell-to-react D7.5
pass_kind: functional
---

# Sprint 317 — the template hosts the meta view; DCLogic keeps the transcript column

## scope

`web/reveal.html`: the machinery column and the gutter give way to `<div data-app-mount="meta" data-pane-id="{{ focusedId }}">`; the transcript column stays, its width from the meta store's split. `web/reveal_component.ts` drops `mode`, `dir`, `sel`, `level` and `revealL` from its state, the lens chips, the toggles' values, the stream's ref and scroll handler, the gutter's grab and its drag branch; `/language` opens the lens through `setMode` and `selectSeq`; the language keys read and write the meta store; DCLogic re-renders when the split changes.

## artifact contract

- Modified: `web/reveal.html` (no `modeChips`, `revealGrab`, `data-stream-scroll`), `web/reveal_component.ts` (no `revealL`, `state.mode`, `followBottom`). `npm run build` 0; lint 0.

## observation contract

Group D's close: every `gates:electron` script run alone exits 0; Axis C reports 0 bugs; pixels equal `baseline-2026-11-05-d2`.

## result

Closed 2026-11-05. 55 of 55 exit 0, `side_graph_scroll` among them (the link now in `MetaView`); Axis C bugs 0; pixels 28/28.

## Rubber Duck pass

No signals.
