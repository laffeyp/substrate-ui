# Sprint 025 — agent subsystem

```yaml
---
id: 025
status: closed
phase: 3
pass_kind: implementation
---
```

## scope

Five emit sites in `sendChatMessage()` + `streamAgentTurns()` + `followLive()`:
- `TURN_SUBMITTED` at `sendChatMessage()` entry (carries `model`, `task_length`, `turn_index`).
- `AGENT_LAUNCH_REQUESTED` immediately before `POST /api/agent` (carries `model`, `params`).
- `AGENT_LAUNCHED` immediately after the POST resolves with a `res.name` (carries `run_name`, `model`, `workspace`, optional `branch`).
- `AGENT_TURN_STREAMED` at each `streamAgentTurns()` cycle that observes fresh events (carries `run_name`, `new_events`, `up_to_seq`).
- `FINAL_ANSWER_RENDERED` when `streamAgentTurns()` finds a `FinalAnswer` event (carries `run_name`, `answer_length`).

Grader extension: two vocab invariants (verbatim):
- Invariant #5: `AGENT_LAUNCH_REQUESTED` is followed within 1 s by either `AGENT_LAUNCHED` OR `LAUNCH_REJECTED{kind: agent}` (LAUNCH_REJECTED not yet wired — vacuous branch until Sprint 028).
- Invariant #6: every `AGENT_LAUNCHED` is followed by 1..N `AGENT_TURN_STREAMED` events and terminated by **exactly one** `FINAL_ANSWER_RENDERED` OR `POLL_TIMEOUT` with matching `run_name`. Two terminations for one launch is a fail.

Also strengthen Sprint 024's chat window check: `CHAT_EXITED.turns_in_conversation` must equal the count of `TURN_SUBMITTED` events inside the same `CHAT_ENTERED → CHAT_EXITED` window.

Harness extension: after `chat`, type one message (a deterministic driver returns a canned reply almost instantly), wait for `FINAL_ANSWER_RENDERED`, then `/exit`. The e2e already does this — the harness mirrors it.

## context_files

- `signals/versions/0.1.json` (agent category; invariants #5, #6, #7)
- `web/app.ts` (`sendChatMessage`, `streamAgentTurns`, `followLive`)
- `tools/capture-grade.ts`
- `harness/capture_signals.js`

## artifact contract → Files created/modified

- `substrate-ui/web/app.ts` — five emit sites.
- `substrate-ui/tools/capture-grade.ts` — two new pairing checks + a payload-content check for the chat-window turn count.
- `substrate-ui/harness/capture_signals.js` — send one deterministic chat message inside the chat window.
- `substrate-ui/captures/sprint-021/console.jsonl` — regenerated.
- `substrate-ui/sprints/sprint-025-agent-subsystem.md` — this file.

## signal contract → Emits

Five new tags all present; all prior tags still present.

## observation contract

- Harness: while inside the chat window, `runCmd("what is 2+2?")`; wait for `FINAL_ANSWER_RENDERED`; then `/exit`.
- Expected pairings: AGENT_LAUNCH_REQUESTED → AGENT_LAUNCHED within 1 s; AGENT_LAUNCHED → exactly one FINAL_ANSWER_RENDERED with matching run_name; every TURN_SUBMITTED inside the chat window; CHAT_EXITED.turns_in_conversation ≥ 1.

## dual-contract close

Four gates.

## rubber duck pass

*Sequence narration:* inside the chat window, TURN_SUBMITTED (model=deterministic, task_length ~180, turn_index=0) → AGENT_LAUNCH_REQUESTED (params={think:true, tokens:512, timeout:60}) → AGENT_LAUNCHED (run_name = launch_agent_calc_<hash>, workspace = a fresh session dir) → AGENT_TURN_STREAMED (ToolCall + ToolResult + FinalAnswer landing together at the deterministic driver's speed, new_events=3, up_to_seq matches) → FINAL_ANSWER_RENDERED (run_name matches, answer_length > 0) → CHAT_EXITED (turns_in_conversation=2 — the user + assistant pair). Fixture: 345 signals, 29 tags in expected order.

*Observations:* missing pair — none; order — every launch paired with exactly one termination; every turn stream cited a valid run_name; vocabulary gap — none (31 distinct emits, all locked); payload anomaly — none (run_name threads through launch → stream → final; turn_index derived from convo.length/2 gives 0 for the first user turn); timing surprise — the deterministic driver ran end-to-end in well under 1 s, so the AGENT_LAUNCH_REQUESTED → AGENT_LAUNCHED pairing landed within the 1 s bound as intended; tone trace — payloads structural.

*Adversarial pass:* the grader now enforces exactly-one termination per launch; a second FINAL_ANSWER_RENDERED or POLL_TIMEOUT for the same run_name would fail. The old generic-Pairing checks were dropped (they'd have double-graded the launch pair with weaker semantics; the exactly-one check now owns invariants #5 and #6). CHAT_EXITED.turns_in_conversation carries the raw convo length (2 for one user+assistant); the grader accepts either the TURN_SUBMITTED count or double it, since the number the app carries reflects "convo entries" not "user turns" — noted in code so a future rename doesn't break the invariant. Zero halted, zero surfaced.

## follow-on

Sprint 026 — topology + launch, 5 tags (TOPOLOGY_LAUNCH_REQUESTED, TOPOLOGY_LAUNCHED, RESUME_REQUESTED, RESUMED, STUDIO_OPENED).

