# Research — why a session stalls after Esc

*2026-11-18. Follows `process/reviews/REVIEW-2026-11-18-esc-interrupts-and-session-stalls.md`, which left the stall's mechanism open (its § 8). The Architect, 2026-11-18: "we need to stop new development and track these core bugs down first." The installed builds run kernel `8f4c4424`; code cited at that commit.*

## The cause, reproduced

An interrupt that reaches a turn while the turn is still loading its record cancels the model producer before the producer's first step. A task cancelled before it starts never runs its body, so it writes neither `ProducerStarted` nor `ProducerCancelled`. The run counts that producer in flight (`runtime.py:670`, `st.inflight += 1` at task creation) and lowers the count only when a recorded end frame passes through the sequencer (`sequencer.py:310`). No end frame comes, so `inflight` stays 1: the run never goes quiet, no termination decision runs, the turn's `Runtime.resume` never returns, and `turn_sync` holds the session's `threading.Lock` until the process dies.

The order on the turn's event loop makes the race certain whenever an interrupt lands during the bootstrap:

1. `turn_sync` starts the worker thread; `TurnHandle.loop` is set before the run begins (`session_registry.py:1546–1549`).
2. `Runtime._drive` reads and folds the record synchronously (`recover_and_read`, `_resume_bootstrap`), appends the resume event, cycles its triggers (`TriggerFired` for the model), and creates the model task (`_flush_scheduled`, `runtime.py:666–675`), which records the instance in `kind_by_instance` at once.
3. An Esc during step 2 calls `registry.interrupt`, which queues `_do_cancel` with `loop.call_soon_threadsafe` and waits one second (`session_registry.py:1159–1165`). The loop is busy in step 2's synchronous code, so the wait times out: the app hears `None`, "no turn in flight".
4. The queued `_do_cancel` still runs, at the loop's first free moment — after step 2, ahead of the new task's first step, because it entered the ready queue first. It finds the model instance and calls `task.cancel()` on a task that has not started.

## The reproduction

A copy of `s_7c1dab4e`'s record (11,882 envelopes, from `~/.substrate-next`), resumed in a scratch store with one message on a deterministic stand-in model, through `SessionRegistry.turn_sync`:

| Case | Result |
|---|---|
| No interrupt | The turn finished in 8.0 s: `UserMessage`, `TriggerFired`, `ProducerStarted`, `TranscriptCompacted`, `PromptComposed`, `ModelReply`, the language measure, `Returned` `replied`, `TerminationMatched`. |
| `registry.interrupt` from another thread 1.66 s in, during the bootstrap | `interrupt` returned `None`. The turn hung until its 40 s limit and 10 s grace; the record ends `UserMessage` seq 11882, `TriggerFired` `model-on-user-message` seq 11883, and nothing after: the shape of every stall in the field. |

No model call, network or folder is involved. The scratch copy and its script stay outside the repo (the record is from this machine).

## The field stalls, accounted for

A scan of every record in both stores for a `TriggerFired` whose producer never wrote `ProducerStarted` finds four after 2026-09-14 (one older case on 09-14 has an end frame and is a different shape):

| When (PST) | Session | Trigger | Interrupt during the bootstrap |
|---|---|---|---|
| 11-16 23:07:56 | `s_52bd6e73` (claude) | `end-on-end-request` | none: the quit's SIGKILL cut it. The log's SIGTERM at line 583 has no `shutdown:` line after it, and the next boot is 24 s later; the sweep was already wedged on another session's lock when it reached this one. |
| 11-17 20:44:37 | `s_7c1dab4e` (kimi-k3:cloud) | `model-on-user-message` | Esc at 04:44:34.992Z, 2.4 s before the `UserMessage` landed |
| 11-17 23:06:20 | `s_cd9b4cbe` (glm-5.2:cloud) | `model-on-user-message` | Esc at 07:06:20.565Z, 0.1 s before the `UserMessage` landed |
| 11-17 23:24:18 | `s_cd9b4cbe` | `model-on-user-message` | the quit's shutdown sweep: it interrupts every `running` manifest (`_interrupt_then_end`) and the turn had been bootstrapping 104 s |

Turn 46 of `s_cd9b4cbe`, interrupted after `ProducerStarted`, ended cleanly (`ProducerCancelled`, `Returned` `interrupted`): an interrupt after the producer starts works.

## What follows from the cause

- **The quit wedge.** The shutdown sweep interrupts every running session, then calls `turn_sync`, which waits on the session lock with no limit (`session_registry.py:876`). A stalled turn holds that lock, so the sweep never finishes, and Electron kills the backend at 45 s (`electron/main.ts:342`) — before sprint 515's own 60 s deadline (`server.py:7139`). The sweep's own interrupt can cause the stall it then waits on: the 23:24:18 case.
- **Esc's two false negatives** (review § 4). Both are the one-second wait timing out on a busy loop; the cancel itself is not lost, it runs later, and that late cancel is what stalls the turn.
- **The stuck session's later life.** The record ends at a bare `TriggerFired`; the next boot marks it `interrupted`; a later turn resumes it normally (review § 2.4).
- **The same-folder symptom** (review § 5.1). The name `agent-orchestration` is held by `s_52bd6e73`, interrupted since the 11-16 quit cut it. Names are unique by design (`NameCollision`, `session_registry.py:539`); the session holding it is stranded only because the stall stranded it.

## The review's finding 6 is wrong

The installed Substrate Next (build 1794902590) runs kernel `8f4c4424`, which holds sprints K352 (tokens counted) and K353 (the conversation brought in as history). The `ProducerFailed` "prompt is too long" entries the review cites are from 2026-11-14, before them. After the 11-14 install `s_52bd6e73` ran turns 26–37: each compacted at scale 1.5, Claude Code's first-call counts ran 518,422 to 594,637 tokens, and the oldest kept imported seq moved from -1012 to -610. Its next failures were two weekly-limit refusals on 11-15.

## Open, not explained by the cause

- **The slow bootstrap.** Turn 44's bootstrap took 9.4 s on a 4 MB record; turn 45's first turn after a boot took 4 min 1 s to be accepted and 104 s to bootstrap; turn 46 on the next boot took 3.85 s end to end (review § 2.1, § 8). The longer the bootstrap, the wider the window in which an Esc stalls the turn.
- **Turn 44's third Esc** reported `was_interrupted=true` at 07:06:23.960Z, 3.2 s after the `TriggerFired`. Under the cause above the cancelled-before-start task is gone by then; what live model instance that press found is not determined.
- **The pane draws an `interrupted` session as `failed`** on attach (review § 2.1), and the `BrokenPipeError` cascade hides error bodies (review § 7).
