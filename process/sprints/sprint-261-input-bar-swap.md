---
id: 261
status: closed
phase: shell-to-react C1.3
pass_kind: functional
---

# Sprint 261 — the input bar swaps in

## scope

`reveal.html`'s two includes of the partial (the panes view with `o=pn`, the meta view with `o=fpRow`) become `<div data-app-mount="input-bar" data-pane-id=… data-view=…>`; `reveal.ts` registers the kind, one root per view and pane; `reveal_component.ts` loses `_barKey`, `_inputHint`, `_slashMenu`, `_slashHint`, `_clearPv`, `_vmSubmitFor`, the pane's prompt fields and `pv`, the meta view's unused `promptVal` and `inputHint`, and its copies of the notes (it imports them from `control_notes.ts`), and registers `setTitleOf`. The partial file stays until plan row E4 retires the partials.

Three files, one over the rule: the boot script's registration is one call. Recorded on BLACKBOARD.

## artifact contract

- Modified: `web/reveal.html` (no `include partials/input-bar.html`; contains `data-app-mount="input-bar"`), `web/reveal_component.ts` (no `_barKey`, `pv:`, `routerRows`, `INPUT_HINT`), `web/reveal.ts` (contains `name: "input-bar"`). `npm run build` 0; `npm run test:unit` 0.

## observation contract

`input_bar`, `slash_menu`, `slash_inline_hint`, `slash_choice_keys`, `slash_tab_complete`, `dialogs`, `escape_order`, `session_start_line`, `split_returns_to_panes`, `run_panes`, `controls_mid_session`, `find_counts_transcript`, `transcript_follow` exit 0; pixels equal `baseline-2026-11-05-b6`.

## result

Closed 2026-11-05 after sprint 264. First run: twelve of the thirteen gates 0 and pixels 28/28; `transcript_follow` failed its switch step (at the bottom before terminal → reveal → terminal, 184px from it after the next turn). Sprints 262–264 found and fixed the cause; then all thirteen 0 and `transcript_follow` 0 three runs in a row.

## Rubber Duck pass

`SLASH_ROUTED`, `TURN_SUBMITTED` fire from the gates' sends as before. Observation: timing surprise in the transcript's scroll restore, resolved in sprint 264.
