---
id: 283
status: closed
phase: shell-to-react C5.2
pass_kind: functional
---

# Sprint 283 — the PanePicker component and its view store

## scope

`web/app/state/picker.ts` holds each unbound pane's picker view, rows and handlers included, which DCLogic writes after each render while it owns the picker's state (until plan group E). `web/app/PanePicker.tsx` draws the workspace column with each open row's sessions, the model column, the GUIDANCE, LENGTH and TONE lines (the `choice-line` partial's markup) and the typed-path box, with the template's styles and hooks (`data-ws-scroll`, `data-ws-lit`, `data-model-half`, `data-model-scroll`, `data-model-row`, `data-<line>-half`, `data-<line>-row`, `data-ws-input`). The box keeps its own copy of the text, which DCLogic's changes replace, so the caret stays where the user put it. Two hover rules join `hover.css`.

## artifact contract

- Created: `web/app/state/picker.ts` (store on `globalThis.__substratePicker`), `web/app/PanePicker.tsx`. Modified: `web/app/hover.css`. `npx tsc --noEmit` 0.

## result

Closed 2026-11-05.

## Rubber Duck pass

No signals.
