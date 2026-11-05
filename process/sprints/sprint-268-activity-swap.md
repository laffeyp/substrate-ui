---
id: 268
status: closed
phase: shell-to-react C2.3b
pass_kind: functional
---

# Sprint 268 — the bar line and tasks swap in; the 500 ms tick goes

## scope

`reveal.html`'s activity and task blocks in the panes view and the meta view become four mount divs (`flex:none`). `reveal_component.ts` loses `_liveActivity`, `_tailSegs`, `_liveBindingsFor`, `_taskBindings`, their spreads, and the 500 ms `forceUpdate` interval, which only redrew the line's seconds (the component reads the clock nowhere else in its render).

## artifact contract

- Modified: `web/reveal.html` (no `activityShow`, `tasksShow`), `web/reveal_component.ts` (no `_activityTick`, `_liveBindingsFor`, `liveActivity`). `npm run build` 0; `npm run test:unit` 0.

## observation contract

`session_start_line`, `language_bar_line`, `controls_mid_session`, `tasks_gate`, `language_rule_ellipsis`, `escape_order`, `transcript_follow`, `input_bar`, `both_session_shapes`, `refused_turn` exit 0; pixels equal `baseline-2026-11-05-b6`.

## result

Closed 2026-11-05. All ten 0; unit 106/106; pixels 28/28.

## Rubber Duck pass

`TURN_SUBMITTED`, `TURN_PARKED` in the gates' turns as before. Observation: no gate covered a live turn's clock; sprint 269 adds one.
