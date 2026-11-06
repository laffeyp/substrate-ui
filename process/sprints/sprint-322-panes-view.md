---
id: 322
status: closed
phase: shell-to-react E2.2
pass_kind: functional
---

# Sprint 322 — `PanesView`, `Pane`, `PaneSession`, the gutters

## scope

`web/app/PanesView.tsx` draws the grid with the template's styles: each `Pane` (`data-pane`), a bound one's `PaneSession` (find, the transcript scroller with its `data-vm-transcript-mount` and `data-vm-atom-root` hooks and the `Transcript` itself as a child, the bar line, the task rows, the input bar), an unbound one's `PanePicker`, and the column and row gutters. F361: the transcript is no longer a root reveal.ts re-attaches.

## artifact contract

- Created: `web/app/PanesView.tsx`. `npx tsc --noEmit` 0.

## result

Closed 2026-11-05.

## Rubber Duck pass

No signals.
