# Sprint 024 — terminal subsystem

```yaml
---
id: 024
status: closed
phase: 3
pass_kind: implementation
---
```

## scope

Six emit sites: `TERMINAL_OPENED` and `TERMINAL_CLOSED` from `termSetOpen(v)` (with `trigger` optionally tagged by the caller: toggle_button | ctrl_backtick | first_command); `CHAT_ENTERED` in the `chat`/`agent` command branch (with `reconnect` optional when picking up an existing conversation); `CHAT_EXITED` in the `exit` command branch (carries `turns_in_conversation`); `MODEL_SELECTED` from the picker `onchange` and from the `model` command (both paths route through one helper that carries `prior_model`); `PARAMS_CHANGED` from the `think`, `tokens`, and `timeout` command branches (field enum: think | tokens | timeout).

Grader extension: vocab invariant #7 verbatim — a `TURN_SUBMITTED` (Sprint 025) may only appear inside a `CHAT_ENTERED` → `CHAT_EXITED` window. Sprint 024 lands the check but Sprint 025 exercises it; the check is present and green in Sprint 024's fixture as a vacuous pass (zero TURN_SUBMITTED events).

Harness extension: after the Sprint 023 sequence, open the terminal, change the model picker, run `think on`, run `tokens 512`, run `timeout 60`, run `chat`, run `/exit`, close the terminal.

## context_files

- `signals/versions/0.1.json` (terminal category; invariant #7)
- `web/app.ts` (`termSetOpen`, the `chat`/`exit`/`model`/`think`/`tokens`/`timeout` command branches; the picker onchange)
- `tools/capture-grade.ts`
- `harness/capture_signals.js`

## artifact contract → Files created/modified

- `substrate-ui/web/app.ts` — six emit sites via a `_selectModel(next)` helper and a `_setParam(field, value)` helper so both the picker and the command paths funnel through one emit each.
- `substrate-ui/tools/capture-grade.ts` — TURN_SUBMITTED-inside-window check added (vacuous until Sprint 025); terminal + chat + params tags added to EXPECTED_ORDER.
- `substrate-ui/harness/capture_signals.js` — extended.
- `substrate-ui/captures/sprint-021/console.jsonl` — regenerated.
- `substrate-ui/sprints/sprint-024-terminal-subsystem.md` — this file.

## signal contract → Emits

`TERMINAL_OPENED`, `TERMINAL_CLOSED`, `CHAT_ENTERED`, `CHAT_EXITED`, `MODEL_SELECTED`, `PARAMS_CHANGED` all present.

## observation contract

- Harness: click #termOpen → wait TERMINAL_OPENED; change #agentmodel to a different option → wait MODEL_SELECTED; type `think on`, `tokens 512`, `timeout 60` into #terminput → wait three PARAMS_CHANGED; type `chat` → wait CHAT_ENTERED; type `/exit` → wait CHAT_EXITED; click #termClose → wait TERMINAL_CLOSED.
- Expected pairing: every `TURN_SUBMITTED` (none yet) must lie within a `CHAT_ENTERED` → `CHAT_EXITED` window.

## dual-contract close

Four gates: parity, build, e2e, grader.

## rubber duck pass

*Sequence narration:* the fixture now grows through TERMINAL_OPENED (trigger=toggle_button) → MODEL_SELECTED (deterministic → the first non-default option) → three PARAMS_CHANGED (think:false→true, tokens:0→512, timeout:300→60) → CHAT_ENTERED (no reconnect flag; the conversation is fresh) → CHAT_EXITED (turns_in_conversation=0) → TERMINAL_CLOSED → RECORDS_PRUNED → SESSION_ENDED. Fixture length: 310 signals (view-subsystem paints during the terminal steps still tick the pane-render tags in the background). Expected order now 24 tags, all in sequence.

*Observations:* missing pair — none; order — CHAT_EXITED strictly follows CHAT_ENTERED; TERMINAL_CLOSED strictly follows TERMINAL_OPENED; vocabulary gap — none (26 distinct emits, all locked); payload anomaly — none (MODEL_SELECTED thread prior_model correctly; PARAMS_CHANGED thread prior_value correctly per field; TERMINAL_OPENED carries trigger where the entry point supplied one; the keyboard-shortcut TERMINAL_OPENED carries trigger=ctrl_backtick but the fixture doesn't exercise that path — noted); timing surprise — none; tone trace — payloads structural.

*Adversarial pass:* the vocab invariant #7 (TURN_SUBMITTED only inside a chat window) is enforced but vacuous — no TURN_SUBMITTED events fire in this sprint. Sprint 025 exercises the check. A stronger Sprint 024 shape would also grade that CHAT_EXITED.turns_in_conversation matches the number of TURN_SUBMITTED events inside the window — deferred until Sprint 025 lands the emit. Zero halted, zero surfaced.

## follow-on

Sprint 025 — agent subsystem, 5 tags (TURN_SUBMITTED, AGENT_LAUNCH_REQUESTED, AGENT_LAUNCHED, AGENT_TURN_STREAMED, FINAL_ANSWER_RENDERED).

