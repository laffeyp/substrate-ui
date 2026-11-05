---
id: 259
status: closed
phase: shell-to-react C1.2a
pass_kind: functional
---

# Sprint 259 — the input bar's state and keys, per pane

## scope

`web/app/state/input_bar.ts`: each pane's draft, lit choice, sent lines and history position, and the bar's keys (↵ sends, ⇧↵ and ⌥↵ new line, composition passes, ↑ ↓ walk the sent lines, Tab completes, ↑ ↓ ↵ Escape in a command's choices), moved from `_barKey` and the pane's `pv`, `slashSel`, `hist`, `histAt`, `histDraft`. Keyed by pane, not by place in the template (design D90). `/exit` from the menu opens the end-session confirm with the pane's title, which DCLogic resolves (`setTitleOf`) while it names the panes.

## artifact contract

- Created: `web/app/state/input_bar.ts` (store on `globalThis.__substrateInputBar`; contains `barKey`, `pickRow`, `setText`, `setTitleOf`). `npx tsc --noEmit` 0.

## result

Closed 2026-11-05.

## Rubber Duck pass

No signals of its own; a sent line reaches the controller's `submitLine`, which emits `TURN_SUBMITTED` or `SLASH_ROUTED` as before.
