---
id: 101
status: closed
class: H (new) — agent work modelled as a short request. Temporal activity timeouts and heartbeats; Google AIP-151; Harel 1987 statecharts, Binder's sneak paths. See process/planning/CLASS-2026-10-02-agent-work-modelled-as-a-short-request.md
---

# Sprint 101 — agent work is not a short request

## why

2026-10-02, session `s_74df6e70…`, turn 28: "turn refused: TimeoutError: SessionRegistry.turn_sync: resume … exceeded 600.0s and was cancelled". The status strip kept pulsing "turn 28 · Ns" under the red error. The Architect: "models can work for some time … Claude Code is basically the standard"; cancelling after a long stretch without progress is "a future decision".

The record showed what held the turn. The model's bash call `c5` started `node server.js &`; `kill %1` named no job in a non-interactive shell, the server kept the tool's stdout pipe open, and the tool's read loop had no deadline. The record ends mid-output at 01:51:17. The 600 s turn cap then cancelled a run whose tool thread could not be cancelled, and the server was still on :3001 afterwards. The bash card also showed a result from turn 9: call ids restart every turn.

## done

- **No default wall-clock limit on model work** (H1): `turn_sync`, `/turn`, the agent bridge, delegate children, the CLI's turn and topology waits, `OllamaResponder` (a 10 s connect limit stays; `/api/show` keeps 30 s), and `CliResponder`. Explicit timeouts still apply.
- **Output cap is the context window** (H1): `num_predict` defaults to `num_ctx`. The 16,384 cap from sprint 097 cut off reasoning models: Ollama counts thinking against `num_predict` (ollama #16583, #17561).
- **bash** (H2): a per-call `timeout_s` (default 120, max 600, Claude Code parity) over the whole command, its own process group killed at the deadline and on cancel, stdout and stderr on separate reader threads, and a background child that outlives the shell no longer blocks the result.
- **Failure states** (H3):
  - the manifest says `running` while a turn runs;
  - a failed turn takes its status and next turn index from the record;
  - a caller's timeout parks the turn through `cancel_producer(cause="timeout")` instead of killing the run task;
  - the shutdown sweep interrupts a running turn before ending its session;
  - the activity strip shows a failed or interrupted turn as ended, in red, without the pulse. The strip logic moved to `web/reveal/activity.ts` so it can be tested.
- **Call identity** (H4): tool calls are keyed `callId@seq` for result pairing, progress, card open-state and React keys.
- `npm run test:unit` now runs in `release.sh` stage 2; no gate ran the client specs before.
- Ops: the orphaned server (pid 45263 on :3001) was killed, as the model's own `kill %1` intended.

## checks (2026-10-02)

New tests:
- kernel `test_bash_deadline_101.py` (5): the background child, the deadline killing the group, timeout bounds, the 200 KB stderr deadlock, cancel by group kill;
- kernel `test_turn_failure_state_101.py` (2);
- UI `test_shutdown_interrupts_running_turn_101.py` (shutdown in 0.79 s behind a 30 s model call);
- `web/reveal/__tests__/turn_state.spec.ts` (6): live, failed, a new turn after a failure, parked, call ids reused across turns, `turnFailure` set on refusal.

Changed tests, each pinning an old default:
- the `/api/show` probe's 300 s is now 30 s (connect 10 s);
- `_agent_params` timeout default 300 is now none;
- `num_predict` equals `num_ctx`.

All tiers, after the last change:

| tier | result |
|---|---|
| kernel fast | 1,210 passed, 3 skipped |
| UI | 215 passed |
| client specs | 20/20 |
| ruff, mypy, tsc, eslint, `npm run build` | clean |
| realmodel | 40/41 |

The realmodel failure was `test_ensemble_real_disagreement_and_cancel`: three `llama3.2:1b` samples at temperature 0.9 all said "empathy.". That test sets `max_tokens=64` itself. It passed 5 of 5 on rerun; it measures sampling, and one run in six agreed.

## decided (Architect, 2026-10-02)

No turn is cancelled for lack of progress. A turn ends when it finishes or when the user interrupts it.

Committed: kernel `9dfa71d9`; substrate-ui in the commit carrying this card.
