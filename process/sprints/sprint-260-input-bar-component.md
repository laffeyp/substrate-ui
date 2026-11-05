---
id: 260
status: closed
phase: shell-to-react C1.2b
pass_kind: functional
---

# Sprint 260 — the InputBar component

## scope

`web/app/InputBar.tsx` takes `paneId` and draws the slash menu over the bar, the bar, the hint behind the textarea and the textarea, with the partial's styles (`web/partials/input-bar.html`) and hooks (`data-input-bar`, `data-slash-row`, `data-current`, `data-lit`, `data-slash-hint`). The placeholder is the pane's `viewOnly` reason or the hint. The menu row's hover rule joins `hover.css`.

## artifact contract

- Created: `web/app/InputBar.tsx`. Modified: `web/app/hover.css` (`.hover-slash-row`). `npx tsc --noEmit` 0.

## result

Closed 2026-11-05.

## Rubber Duck pass

No signals.
