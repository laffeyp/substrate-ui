# Class H — agent work modelled as a short request (v2)

*v2 replaces v1's "Open, for the Architect" section: the Architect had already decided against cancelling turns for lack of progress. v1 is `CLASS-2026-10-02-agent-work-modelled-as-a-short-request.md`.*

2026-10-02. Found from one turn: session `s_74df6e70…`, turn 28, which the daemon cancelled at 600 s and the UI kept showing as running. This adds an eighth class to `ROADMAP-2026-10-01-engineering-practice-classes.md` (A–G), with its primary sources.

## The class

The orchestration treated a turn as an RPC: send a request, expect an answer within a fixed time, fail the call if none comes. Agent work is not that. A turn runs as long as the model and its tools need: minutes, sometimes more. Its end states are not only "answered" and "timed out", and the person watching needs to see which one it reached. The reference implementation is Claude Code, which a small team built to this model:

- a turn has no wall-clock limit;
- the status line counts elapsed time while the model works;
- the user ends a turn with an interrupt;
- the Bash tool takes a per-call `timeout` (default 2 minutes, maximum 10) and a background mode.

Three published sources state the same model.

- **Temporal, "Detecting Activity failures"** (docs.temporal.io). The limit on an activity's total time, Schedule-To-Close, defaults to "∞ (infinity)". Long work is supervised by progress, not duration: "Heartbeating is best thought about not in terms of time, but in terms of 'How do you know you are making progress?'", and "For long-running Activities, we recommend using a relatively short Heartbeat Timeout and a frequent Heartbeat." A per-attempt limit, Start-To-Close, belongs on the single unit of work, not on the whole workflow.
- **Google AIP-151, Long-running operations.** "It is often a poor user experience to simply block while the task runs; rather, it is better to return some kind of promise to the user and allow the user to check back in later." Its rule of thumb for "long" is 10 seconds.
- **Harel, "Statecharts: A Visual Formalism for Complex Systems"** (*Science of Computer Programming*, 1987), with Binder's "sneak paths" (*Testing Object-Oriented Systems*, 1999): every state needs declared exits, failure among them. A transition no model declared is a defect.

## The instances found and fixed (UI sprint 101)

**H1 — fixed limits on open-ended work.** Each killed healthy work.

| where | limit | now |
|---|---|---|
| `SessionRegistry.turn_sync` default; `/api/session/<id>/turn`; the agent bridge | 600 s for the whole turn, then cancel | none; an explicit `timeout_seconds` from a caller still applies |
| `make_delegate` default `timeout_seconds` | 600 s per delegated child | none; the model may pass one |
| CLI `_daemon.session_turn`, `run_topology` | 600 s socket read | none |
| `OllamaResponder` | 300 s httpx timeout, covering the whole non-streamed reply | none by default (a 10 s connect limit remains); `driver_params.timeout` applies when set |
| `CliResponder` | 600 s per CLI call | none by default; explicit `timeout` applies |
| `OllamaResponder` `num_predict` default | 16,384 tokens (UI sprint 097). Ollama counts reasoning against it (ollama issues #16583, #17561), so a model that thought hard failed with `done_reason: "length"` and no answer | the request's own `num_ctx`: the context window, which no reply can outgrow |

The `/api/show` capability probe keeps a 30 s limit. It is a metadata lookup, not model work.

**H2 — a deadline on the wrong unit, and cancellation that never reached the work.** The bash tool's 60 s limit applied only after stdout closed, so `server &` kept the pipe open and the read loop waited forever. That is what actually held turn 28: the record ends mid-output at 01:51:17, and the server it started was still listening on :3001 after the turn was cancelled. Cancelling the turn could not stop it. The tool runs on a thread through `asyncio.to_thread`, and a running thread cannot be cancelled: `concurrent.futures.Future.cancel()` returns False for a call "currently being executed". Now:

- the command runs in its own process group under a per-call deadline (default 120 s, maximum 600 s, Claude Code parity) covering the whole command;
- `run_tool` kills the group on cancel;
- stdout and stderr are read on separate threads (stderr past 64 KB used to deadlock);
- a background child that outlives the shell no longer blocks the result.

**H3 — no exit from "running" on failure.**

- The activity strip called a turn live while no `Park` followed its `UserMessage`. A failed turn pulsed forever. It now shows the turn ended, in red, with the reason, using `turnFailure` from the failed request or from the server's status at attach.
- `turn_sync` left the manifest at the previous turn's status and the turn counter unadvanced when a turn raised. The next turn reused the failed turn's `turn_index`. Both now come from the record, and the manifest says `running` while a turn runs, which it never did.
- A timeout cancelled the whole run task, so the record stopped mid-turn with no word why. A caller's timeout now cancels the live producers the way ctrl+c does, and the turn parks with `ProducerCancelled(cause="timeout")` on the record.
- Quitting during a turn waited behind its lock until Electron's 45 s SIGKILL. The shutdown sweep now interrupts a running turn first.

**H4 — an identifier compared outside its scope.** The kernel numbers tool calls `c0, c1, …` per turn. The transcript paired results, progress text, card open-state and React keys by that id across the whole session. Turn 28's bash card showed turn 9's `aws` error, from 18:19 the day before. Calls are now keyed by `callId@seq`. This is the same shape as Sprint 099's two `SessionEndedMidTurn` classes and two BLACKBOARDs: a name assumed unique where it is not.

## Checked and left as they are

- `quiescence_with_watchdog(seconds)` finalises only when nothing runs (`quiescent and running == 0`); `seconds` is a poll interval. It never cuts a running call. Its name says "watchdog" for something that watches nothing; that is a naming finding for the whole-project terminology pass, not a defect in behaviour.
- `web_fetch`'s 20 s and the daemon's localhost probes (2–6 s) bound calls to other services, which is what a timeout is for.
- The registry's 30 s lock wait on `delete`, the 3 s interrupt acknowledgement and Electron's start/quit limits bound control operations, not work.

## Decided (Architect, 2026-10-02)

No turn is cancelled, by time or for lack of progress. A turn ends when it finishes or when the user interrupts it.

## How to find more of this class

- Grep for numeric `timeout`, `deadline`, `max_wait` and `watchdog`. Ask of each: does it bound a call to something that should answer quickly, or work whose length the model decides?
- For every state a UI or manifest shows, list its exits, and include failure.
- For every identifier used as a key, check its scope against the scope of the map it keys.
