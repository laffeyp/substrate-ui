---
id: 327
status: closed
phase: shell-to-react E3.3
pass_kind: functional
---

# Sprint 327 — DCLogic runs the keymap's actions; reveal.ts's Ctrl+C listener goes

## scope

`web/reveal_component.ts`'s keydown builds the keymap's context (the focus, what is open, the focused pane's state, the language lens's turns while it shows) and runs the action; an interrupt goes to the focused pane's controller, for Escape and Ctrl+C alike. `web/reveal.ts` loses its Ctrl+C listener. `harness/shakeout/escape_order.ts` records the focused pane's controller's interrupts instead of the registry's.

## artifact contract

- Modified: `web/reveal_component.ts`, `web/reveal.ts`, `harness/shakeout/escape_order.ts`. `npm run build` 0; lint 0.

## observation contract

`copy_key`, `escape_order`, `menu_commands`, `records_keys`, `language_lens_bars`, `language_bar_line`, `ws_input_caret`, `left_folds_parent`, `left_folds_workspace`, `model_down_drills`, `ws_column_opens_down`, `slash_choice_keys`, `input_bar`, `dialogs`, `find_counts_transcript`, `assay_page`, `split_returns_to_panes`, `tool_output_toggle` exit 0; pixels equal `baseline-2026-11-05-d2`.

## result

Closed 2026-11-05. First run: `escape_order` exit 1, `interrupt calls []`: it stubbed the registry's `interruptTurn`, which the keymap no longer calls. With the gate stubbing the focused pane's controller, all eighteen 0. Pixels 28/28. Three files (drift entry).

## Rubber Duck pass

No signals.
