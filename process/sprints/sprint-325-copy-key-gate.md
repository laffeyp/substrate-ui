---
id: 325
status: closed
phase: shell-to-react E3.1
pass_kind: functional
---

# Sprint 325 — gate: ⌘C copies; Ctrl+C interrupts the focused pane (F336)

## scope

Plan row E3; the plan has this gate written first, red on the old code. `harness/shakeout/copy_key.ts` counts the POSTs to `/api/session/<id>/interrupt`: in pane 1's empty prompt ⌘C then Ctrl+C give one interrupt, for pane 1's session; ⌘C on selected text puts it on the clipboard and sends none; after a split, Ctrl+C in pane 2's prompt interrupts pane 2's session. `package.json` runs it in `gates:electron` (58 scripts).

## artifact contract

- Created: `harness/shakeout/copy_key.ts`. Modified: `package.json`.

## observation contract

Exit 1 on the old tree; exit 0 after sprint 327; exit 1 with the interrupt sent to pane 1.

## result

Closed 2026-11-05. Old tree: exit 1, `⌘C then Ctrl+C in pane 1's empty prompt sent [s_654d…, s_654d…]; expected one interrupt`. After sprint 327: exit 0. Planted, the interrupt to pane 1: exit 1, `Ctrl+C in pane 2's prompt interrupted s_d8dc…; pane 2's session is s_24fd…`. The old tree also sent Ctrl+C's interrupt to pane 1 from any pane: reveal.ts held pane 1's controller.

## Rubber Duck pass

No signals.
