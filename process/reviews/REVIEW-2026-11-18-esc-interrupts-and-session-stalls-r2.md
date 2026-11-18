# Review — Esc interrupts, the quit kill, and session stalls (round 2)

*2026-11-18. Round 2 of `REVIEW-2026-11-18-esc-interrupts-and-session-stalls.md` (round 1 committed at `498fb86` and left in place). This round completes the reading round 1 left open, corrects three of its claims, and records what the follow-on work found and built. Between the rounds the Architect stopped new development ("we need to stop new development and track these core bugs down first", BLACKBOARD 2026-11-18); `process/planning/2026-11-18-core-stalls/RESEARCH-2026-11-18-core-stalls.md` reproduced the stall's mechanism; `RESEARCH-2026-11-18-bootstrap-time.md` measured the slow bootstrap; `ROADMAP-2026-11-18-core-stalls-r1.md` ordered the fixes C1–C5; kernel sprints K354, K355, K356 (`7acfb030`, `67307698`, `4fe4947e`) and app sprints 518, 519 (`df472f7`, `9372554`) closed; sprint 520, the build that installs them, is active. Scope as round 1: the installed Substrate (build 1794976292) and Substrate Next (build 1794902590), both on kernel `8f4c4424` — each bundle's `Info.plist` `SubstrateKernelCommit`, read this round — so every fix this review names is in source and none is in an installed app. The mechanism's code cites are against the installed kernel `8f4c4424`, where the bug lives; the research cites the same commit. Where a line is quoted from the current tree (after K354–K356, 518, 519), the text says so. Premise, from the Architect: sometimes Esc leaves a session that can never be reloaded, and running multiple sessions in the same folder seems to cause issues. This round mutated nothing in either store; round 1's one POST (the 409 in §6.1) remains the only store contact.*

---

## 0. Verdict

The unloadable session is a race, and Esc triggers it without being its cause.

Every turn runs on a worker thread with its own event loop. Before the model producer starts, the runtime resumes the record synchronously: it reads every envelope, folds each through every view, appends the resume event and fires its triggers — measured at 9.39 s on a 4 MB record, 13.05 s on a 6.3 MB one, 103.4 s once under a quit. During that stretch the loop thread runs no callbacks. An Esc press in that window schedules its cancel callback onto the loop and gets no answer: the handler's one-second future times out and the window reports "no turn in flight". The callback stays queued.

When the bootstrap ends, the runtime creates the producer task — populating its instance tables and incrementing the in-flight count — and only then yields to the loop. The queued cancel callback runs before the task's first step. It finds the model instance in the tables and cancels a task that has never run. asyncio raises the CancelledError at the coroutine's entry; the body never executes, so neither `ProducerStarted` nor `ProducerCancelled` is ever submitted. The in-flight count was raised at scheduling and is lowered only by those frames. It leaks at 1. The writer loop waits on an inbox nothing will feed, the quiescence finaliser sees a producer that does not exist, the run never ends, and `turn_sync` holds the per-session lock until the process dies. Turns, end requests and the shutdown sweep queue behind that lock. The app's quit wedges in the sweep, and Electron SIGKILLs the backend 45 s in — fifteen seconds before the server's own 60 s deadline, which under Electron never fires. The record ends at a bare `TriggerFired`, and the next boot marks the session `interrupted`.

Round 1 left this mechanism open. The research reproduced it with no model, network or folder involved: a copy of `s_7c1dab4e`'s record, resumed on a deterministic stand-in model and interrupted 1.66 s in, hung to its 40 s limit and ended at exactly the field shape — `UserMessage`, `TriggerFired`, nothing after. Kernel K354 fixes it at the root: the task's done callback, finding the task cancelled with its body never begun, writes the two frames the body would have. The same reproduction now ends `Returned` `interrupted` in 7.6 s.

The record shows the race decided both ways — six cases, zero exceptions. A press after the producer started cancels it at its await and the pause is clean: turns 43 and 46 on the main store, turn 18 on Next. A press during the bootstrap kills the producer at entry and hangs the run: turn 44 on the main store, turn 19 on Next. The quit path runs the same race itself: the shutdown sweep's own interrupt, sent while turn 45 was 104 s into its bootstrap, killed turn 45's producer at entry, and the sweep then blocked on the lock that turn held. The killing press reported "no turn in flight" both times, because its future timed out before its callback ran.

Three round-1 claims do not survive. Finding 6 — "the claude session is stranded twice" — is wrong: the "prompt is too long" failures on its record predate kernel K352/K353 (committed and installed 11-14); after that install the session compacted eight times, ran through turn 39, and its only model-side wall was Claude's weekly limit. It is `interrupted` because the 11-16 quit's SIGKILL cut its `session_end` producer mid-start, not because of its size. Round 1's turn-44 timeline put the quit at ~07:07:35; the trace says 07:13:00.968Z — the user worked the dead session six more minutes first. And round 1 twice dated that session's interruption to 11-14; its record shows a live turn at 11-15 20:01 PST and the cut at 11-16 23:07:56 PST.

The same-folder symptom stands as round 1 verified it: a `NameCollision`. `POST /api/session` with the name `agent-orchestration` on the running Next server returns 409, because `by-name.json` maps that name to the interrupted claude session. The stalls are not a folder effect — the wedged main-store session ran in its own sandbox, and `s_d087367e` took turns 3–5 in the shared folder while `s_7c1dab4e` sat hung beside it.

"Never be reloaded" stays half wrong, and the half that is wrong matters: an `interrupted` session reloads, attaches and resumes. `s_cd9b4cbe` took a clean turn the day after two SIGKILLs. What the stalls cost is the turns that sat unanswered on the record, and what the user saw — a pane drawn as `failed`, Esc answering nothing, turns queueing forever, and a quit that had to be killed.

Nothing is installed. Both installed builds run kernel `8f4c4424`; the fixes live in kernel commits K354–K356 and app commits 518–519. Sprint 520 is the build that installs them.

---

## 1. Round 1's record, corrected and closed

| Round 1 said | This round |
|---|---|
| §8: the stall's mechanism open — "the loop thread served one callback and then made no further progress" | Reproduced: the cancel callback ran before the task's first step and killed it at entry (research §"The cause, reproduced"; §2 below) |
| Finding 6: the claude session stranded twice, its next turn fails at ~1,028,535 tokens | Wrong. The two "prompt is too long" failures are 11-14 20:03 PST, before K352/K353. After the 11-14 install: nine compactions, turns through 39, kept imported seq −1012 → −610; the only later failures are two weekly-limit refusals (§6.2) |
| §2.1: the turn-44 quit at ~07:07:35 | The trace: `APP_QUIT_REQUESTED` 07:13:00.968Z, SIGKILL 07:13:46.007Z; turns 46 and 47 submitted and refused in between (§3.2) |
| Verdict and §5.1: the claude session "interrupted since 11-14" | Its record shows a live turn at 11-15 20:01 PST and the cut at 11-16 23:07:56 PST (§6.2) |
| §8: the 4 min 1 s acceptance gap and the 104 s bootstrap unexplained | Still unexplained; the bootstrap research measured the same family's cost profile but did not profile this record (§8) |
| §8: the four sessions of 23:13 PST unread | All four created by the wedged session's own model inside its sandbox, 22:43–22:45 PST 11-17; all ended (§9) |
| §8: the window's rendering of the 409 not driven | Still not driven; the code path read (§6.1) |
| Findings 4, 5, 7, 9, 10 (the quit race, the sweep's lock wait, the name collision, the stale locks, the pipe noise) | Stand as written |

---

## 2. The mechanism, reproduced

### 2.1 The race on the turn's loop

Code at the installed kernel `8f4c4424`:

1. `turn_sync` (`session_registry.py:834`) takes the per-session `threading.Lock` (line 884) and starts a worker thread; `_run_resume_sync` (line 1516) creates the loop and sets `TurnHandle.loop` before the run begins.
2. `Runtime.resume` runs the bootstrap synchronously before any await: `recover_and_read` and `_resume_bootstrap` (`runtime.py:534`) read every envelope and fold each through every registered view, then cycle the resume event. The model trigger fires inside that cycle; its `input_builder` composes the prompt, and the composed fragments ride the `TriggerFired` frame; `_flush_scheduled` (`runtime.py:666`) creates the producer task, populating `kind_by_instance` and incrementing `st.inflight`, and only then does the runtime reach the writer loop's first `await` — the first point the loop can run queued callbacks.
3. An Esc during step 2 reaches `registry.interrupt` (`session_registry.py:1032`), which queues its cancel closure with `loop.call_soon_threadsafe` and waits `fut.result(timeout=1.0)` (line 1175). The loop thread is busy; the future times out; the handler answers `interrupted=false` — "no turn in flight". The closure stays queued.
4. The bootstrap ends. The ready queue runs in order: the cancel closure first (it entered the queue first), the task's first step second. The closure finds the model instance in the tables and calls `Runtime.cancel_producer` (`runtime.py:970`), which annotates the cancel reason and calls `task.cancel()` on a task that has not started.
5. asyncio throws the `CancelledError` into the not-yet-started coroutine at its entry. The body never executes. The body's first statement is `inbox.put_nowait(_Lifecycle(PRODUCER_STARTED, ...))` (`runtime.py:688–689`) and its `except asyncio.CancelledError` handler (`runtime.py:726–745`) is what submits `PRODUCER_CANCELLED`. Neither runs; neither frame is ever submitted.
6. `st.inflight` was raised at scheduling (`runtime.py:670`) and is lowered only by `_track_lifecycle` (`sequencer.py:300–310`) on the three end frames that never came. The task's done callback (`runtime.py:678–684`) pops the instance tables but does not touch `inflight`. The run state holds `inflight=1` with no live task.
7. The writer loop's idle path finalises only on quiescence — `inflight == 0 and inbox empty and no control` (`runtime.py:804`); the stuck-quiescence guard sits behind the same gate. The termination policy reads `running=st.inflight` (`runtime.py:873`). Both see a producer that does not exist. The writer polls `wait_for(inbox.get(), 0.01)` forever. The run never reaches `paused` or `finalised`; `run_until_complete` never returns; the lock stays held.

The queue-order claim is inferred from timestamps and frame absence, not observed directly. The research's reproduction is the direct evidence: the same record, the same interrupt timing, the same hung shape, deterministically.

### 2.2 The reproduction

The research resumed a copy of `s_7c1dab4e`'s record (11,882 envelopes) in a scratch store with one message on a deterministic stand-in model, through `SessionRegistry.turn_sync`:

| Case | Result |
|---|---|
| No interrupt | The turn finished in 8.0 s: `UserMessage`, `TriggerFired`, `ProducerStarted`, `TranscriptCompacted`, `PromptComposed`, `ModelReply`, the language measure, `Returned` `replied`, `TerminationMatched` |
| `registry.interrupt` from another thread 1.66 s in, during the bootstrap | `interrupt` returned `None`. The turn hung until its 40 s limit and 10 s grace; the record ends `UserMessage`, `TriggerFired`, and nothing after — the shape of every field stall |

No model call, network or folder is involved. The scratch copy and its script stayed outside the repo.

### 2.3 The field stalls, accounted

The research scanned every record in both stores for a `TriggerFired` whose producer never wrote `ProducerStarted`: four after 2026-09-14 (one 09-14 case has an end frame and is a different shape).

| When (PST) | Session | Trigger | What interrupted it |
|---|---|---|---|
| 11-16 23:07:56 | `s_52bd6e73` (claude) | `session_end` | Nothing — the quit's SIGKILL cut the producer mid-start. `SessionEndRequested` (source `daemon_shutdown`) at 07:07:56.426Z, `TriggerFired` at .428, nothing after; the Next log's SIGTERM before the 07:08:20Z boot has no `shutdown:` line; the next boot is 24 s later |
| 11-17 20:44:37 | `s_7c1dab4e` (kimi-k3:cloud) | `model` | Esc, press 04:44:33.798Z — 3.57 s before the `UserMessage` landed |
| 11-17 23:06:20 | `s_cd9b4cbe` (glm-5.2:cloud) | `model` | Esc, press 07:06:20.565Z — 116 ms before the `UserMessage` landed |
| 11-17 23:24:18 | `s_cd9b4cbe` | `model` | The quit's shutdown sweep: `_interrupt_then_end` interrupts every `running` manifest, and the turn had been bootstrapping 104 s |

Turn 46 of `s_cd9b4cbe`, interrupted after `ProducerStarted`, ended cleanly (`ProducerCancelled`, `Returned` `interrupted`): an interrupt after the producer starts works.

### 2.4 Six cases, one rule

| Case | Press position | Record signature | Outcome |
|---|---|---|---|
| `s_cd9b4cbe` turn 43 (main, glm-5.2:cloud) | After the `TriggerFired` (presses 07:05:56.726–58.603; `TriggerFired` 07:05:56.397) | `ProducerStarted` 07:06:00.303, `PromptComposed` .340, `ProducerCancelled` .341 (`cause=external`, `caller=daemon:interrupt-hard`), `Returned reason=interrupted`, clean pause | Clean |
| `s_cd9b4cbe` turn 44 (main) | Before the `TriggerFired` (press 07:06:20.565; `TriggerFired` 07:06:20.731) | Record ends at `TriggerFired` seq 5012; no `ProducerStarted`, no `ProducerCancelled`; a cancel was dispatched (the 07:06:23.960 row) | Hang, SIGKILL, `interrupted` |
| `s_cd9b4cbe` turn 45 (main, next boot) | No press; the sweep's interrupt (quit 07:23:44.258; `TriggerFired` 07:24:18.821) | Record ends at `TriggerFired` seq 5014; no `ProducerStarted` | Hang, SIGKILL, `interrupted` |
| `s_cd9b4cbe` turn 46 (main, next day) | Long after the start (`ProducerStarted` 17:06:35.547) | `ProducerCancelled` 17:07:22.699, `Returned`, pause, then a user end and `RunFinalised` | Clean |
| Next `s_7c1dab4e` turn 18 (kimi-k3:cloud) | After the start (press 04:43:47.879) | Row `landed=true` 04:43:48.068 | Clean |
| Next `s_7c1dab4e` turn 19 | Before the `TriggerFired` (press 04:44:33.798; `TriggerFired` 04:44:37.394) | Record ends at `TriggerFired` seq 11881; no `ProducerStarted`, no `ProducerCancelled` | Hang, SIGKILL, `interrupted` |

The rule: a cancel callback queued before the producer task's first step kills the task at entry and hangs the run; a cancel after the producer started lands at its await and the pause is clean. The queue order is set by when the press arrives relative to the bootstrap — the synchronous stretch in which the task does not yet exist.

---

## 3. The stalls, envelope by envelope

### 3.1 Main store, turn 43 — the clean contrast

The session `s_cd9b4cbe` ("compactionresearch", glm-5.2:cloud) holds 5,033 envelopes, 4.0 MB (3,809,144 bytes), in its own sandbox workspace under `~/.substrate/sessions/<id>/workspace`. The boot of 2026-11-18T04:32:59Z ran its turns 4 through 43 over two and a half hours.

Turn 43: `UserMessage` seq 5002 at 07:05:56.285, `TriggerFired` (factory=model) seq 5003 at 07:05:56.397. Three Esc presses at 07:05:56.726, 57.504 and 58.603 — each after the trigger. Each handler's future timed out: rows at 57.776, 58.537 and 59.639, each 1.03–1.05 s after its press, all `was_interrupted=false`. The loop thread was busy. The 3.91 s between the `TriggerFired` append and the `ProducerStarted` append (07:06:00.303) is a synchronous stretch inside the `TriggerFired` frame's own append cycle or the scheduling after it (§11 names what was read and what was not). When the loop freed, the queue ran in order: the producer task's first step put `ProducerStarted`; the producer composed its prompt (`PromptComposed` 07:06:00.340); the three queued cancel closures ran and the first cancelled the producer at its await; `ProducerCancelled` 07:06:00.341, `Returned reason=interrupted` turn 43, `TerminationMatched pause-await-input`. The user pressed Esc three times, saw three nothings, and the turn stopped anyway.

### 3.2 Turn 44 — the hang, with the six minutes round 1 missed

| Time (UTC) | Where | What |
|---|---|---|
| 07:06:11.215 | window | `TURN_SUBMITTED` turn 44 |
| 07:06:11.291 | server | `TURN_ACCEPTED` (under the session lock) |
| 07:06:20.565 | window | Esc — 116 ms before the `UserMessage`; the bootstrap had run 9.39 s |
| 07:06:20.681 | record | seq 5011 `UserMessage` turn 44 |
| 07:06:20.731 | record | seq 5012 `TriggerFired` factory=model — the last envelope |
| 07:06:21.916 | window | Esc |
| 07:06:21.943 | window | row `was_interrupted=false` — press 1's future timed out; its callback still queued. This press killed the turn |
| 07:06:23.960 | window | row `was_interrupted=true, landed=false` — a cancel reached a live instance; no `ProducerCancelled` ever reached the record (§11) |
| 07:06:36.965 | window | `TURN_SUBMITTED` turn 45 — queued on the lock, never accepted |
| 07:06:47.212 | window | `INVARIANT_BROKEN` T6, waited 10,246 ms |
| 07:12:42.160 | window | `TURN_SUBMITTED` turn 46 — never accepted |
| 07:12:52.397 | window | `INVARIANT_BROKEN` T6, waited 10,237 ms |
| 07:12:56.696 | window | `TURN_SUBMITTED` turn 47 — never accepted |
| 07:13:00.968 | main | `APP_QUIT_REQUESTED` |
| 07:13:46.007 | main | `SERVER_EXITED {signal: SIGKILL, expected: true}`; T3 waited 45,039 ms |

The user worked the dead session for six more minutes after the wedge — three turns submitted, none accepted — then quit. The sweep found the session RUNNING, interrupted best-effort (the dead task's done callback had already popped the instance tables; nothing to cancel), and blocked on the lock in `turn_sync`. The 45 s expired; the SIGKILL cut the sweep mid-sentence — `SIGTERM received; ending sessions cleanly...` with no `shutdown:` line after (main log lines 3959–3960).

### 3.3 Turn 45 — the sweep kills it itself

The next boot, 07:15:51Z, scanned 136 manifests: 1 interrupted, 135 ended. The window attached `s_cd9b4cbe` at 07:17:35.820Z; the pane drew `turn_state: failed` (with a `parked` flicker). Turn 45, submitted 07:18:33.805Z, was accepted at 07:22:34.997Z — 4 min 1 s on a server three minutes old with the lock free and the turn index already derived at attach; unexplained (§11). The user requested the session's end at 07:23:22.945Z and submitted turn 46 at 07:23:39.516Z. The quit came at 07:23:44.258Z. The SIGTERM reached the server mid-bootstrap of turn 45 — the sweep's interrupt went to a session whose producer task did not yet exist. The bootstrap finished at 07:24:18.443Z (`UserMessage` seq 5013, 103.4 s after acceptance) and 07:24:18.821Z (`TriggerFired` seq 5014), the task was created, and the sweep's queued closure — first in the queue since ~07:23:46 — cancelled it at entry. No `ProducerStarted`. Turn 45 hung holding the lock; the sweep's own `turn_sync` waited behind it; Electron's 45 s expired at 07:24:29.283Z. The server's 60 s timer, armed at the first claim (~07:23:46), would have fired at ~07:24:46 — 17 s too late, every time.

### 3.4 Next store, turn 19 — the same race on the daily driver

The daily-driver boot of 2026-11-17T08:10:04Z served `s_7c1dab4e` (kimi-k3:cloud, 11,882 envelopes, 6.3 MB) through the day. Turn 18 interrupted cleanly at 04:43:48Z (`was_interrupted=true, landed=true`). Turn 19:

| Time (UTC) | Where | What |
|---|---|---|
| 04:44:24.253 | window | `TURN_SUBMITTED` turn 19 |
| 04:44:24.322 | server | `TURN_ACCEPTED` |
| 04:44:33.798 | window | Esc — 3.57 s before the `UserMessage`, mid-bootstrap |
| 04:44:34.992 | window | row `was_interrupted=false` — the future timed out; the callback stayed queued. This press killed the session |
| 04:44:37.368 | record | seq 11880 `UserMessage` turn 19, text: "no, you are updating the blackboard and writing too many sprints. Just addend the sprint and go." |
| 04:44:37.394 | record | seq 11881 `TriggerFired` factory=model — the last envelope |
| 04:44:50.450 | window | `TURN_SUBMITTED` turn 20 — queued on the lock, never accepted |
| 04:51:37.534–04:51:45.391 | window | ten Esc presses in eight seconds — every row within 2–6 ms, all `was_interrupted=false`: the loop was free, the tables empty, nothing to cancel |
| 04:51:51.455 | window | `SESSION_END_REQUESTED` user_close — queued behind the lock, never landed |
| 04:55:29.832 | window | re-attach: `STREAM_ATTACHED`, pane drew `turn_state: running` — the manifest truthfully said RUNNING; the turn was in flight and hung |
| 04:56:04.664, 04:56:05.340 | window | two Ctrl+C — routed `action: none, target: none` |
| 04:56:06.289, 04:56:06.577 | window | two Esc — routed `action: interrupt` but no `TURN_INTERRUPTED` row at all (§5, path 4) |
| 05:00:40.073 | window | `SESSION_END_REQUESTED` again — the user gave up and moved on |

The record ends with the Architect's message and no reply. The session's `.lock` names pid 56200 — the server itself, dead since its own quit. That quit wedged the same way and ended in SIGKILL (Next log lines 657–658). The boot of 2026-11-18T17:09:04Z scanned the store: 1 parked, 2 interrupted, 19 ended.

The session's own model-side failures are on the record as `substrate.ProducerFailed`, not crashes: a 502 from ollama.com's upstream through the local proxy (`http://localhost:11434/api/chat`), then two 429s (`you (laffeypeter) have rea...` — the rate limit's own text).

### 3.5 The recovery that refutes "never be reloaded"

The boot of 07:24:32Z reattached `s_cd9b4cbe` (attach 07:24:50.755Z, `STREAM_ATTACHED`, connected) and shut down cleanly at its own quit — `shutdown: ended=1 skipped_ended=135 failed=0`, exit 0 — because no lock was held. The next day at 17:06:31Z the user submitted turn 46. It ran end to end: `UserMessage` seq 5015 at 17:06:34.854Z — 3.85 s after submission — then `ProducerStarted` 17:06:35.547, `PromptComposed` .556, a clean Esc (`ProducerCancelled` 17:07:22.699, `cause=external`, `caller=daemon:interrupt-hard`), `Returned reason=interrupted`, `TerminationMatched pause-await-input`, then `SessionEndRequested` → `SessionEnded` → `RunFinalised` at 17:07:26.722Z. The pane closed it as ended. The scans agree: the 07:15:51Z boot found 1 interrupted; the 17:07:31Z boot found 0.

An `interrupted` session reloads, attaches and resumes. What the stalls cost is turns 44 and 45 on the main store and turn 19 on Next: their `UserMessage`s sit on the record with no reply.

---

## 4. The quit path

### 4.1 The 45 s / 60 s race

`electron/main.ts:342` sets `KILL_GRACE_MS = 45_000`; the comment at 338 sizes it for a sweep of N sessions at 10 s each. `server.py:7139` sets `_SHUTDOWN_HARD_DEADLINE_S = 60.0`, armed as a `threading.Timer(os._exit)` on the first `_claim_shutdown` — sprint 515's fix for the orphaned backend (pid 35270, 2026-11-14, which held a record lock, ignored SIGTERM, and took a SIGKILL by hand). Under Electron the timer is dead code: the parent kills the process group at 45 s, fifteen seconds before the timer fires. The timer only matters when no parent is coming — the orphan case it was built for. Substrate Next's installed build (1794902590, the 11-15 roll-up) predates sprint 515 and has no timer at all; it died the same way, because under Electron the parent's 45 s decides either way.

### 4.2 The sweep's unbounded lock wait

`_shutdown_all_sessions(per_session_timeout=10.0)` (`server.py:633`) skips every manifest already `ended` or `interrupted` (`server.py:680`, counted `skipped_ended`) and calls `_interrupt_then_end` on the rest. That helper interrupts a RUNNING manifest best-effort — `registry.interrupt` schedules the cancel on the turn's loop and waits one second — then calls `turn_sync`, which acquires the per-session `threading.Lock` with a plain blocking `with` (`session_registry.py:884`). The 10 s timeout bounds `done.wait()` inside the run, which happens after the lock. A hung turn holds the lock; the sweep waits at line 884 forever; the "ending sessions cleanly" pass dies mid-sentence.

### 4.3 The boots that died

| Boot (UTC) | Store | Scan at boot | Death |
|---|---|---|---|
| 2026-11-17T08:10:04Z | Next | 16 manifests, 1 interrupted | SIGKILL at quit, no `shutdown:` line (log 657–658) |
| 2026-11-18T04:32:59Z | main | 131, 0 interrupted | SIGKILL at quit (log 3959–3960); next scan found 1 interrupted |
| 2026-11-18T07:15:51Z | main | 136, 1 interrupted | SIGKILL at quit (log 3974–3975); next scan found 1 interrupted |

The clean boots (07:24:32Z, 17:07:31Z, 17:08:56Z on main; 07:08:20Z on Next) all print the full `shutdown: ended=... failed=0` line and exit 0.

### 4.4 What sprint 519 changed

Sprint 519 (app, `9372554`) with kernel K356 (`4fe4947e`): the sweep stops starting sessions at 30 s, the server exits itself at 40 s, Electron's kill comes at 45 s — the server always ends itself before the parent's kill. Each session's end waits for its lock at most its share of the sweep; busy and deferred sessions are counted and named in the log. 3 tests; the mutant fails; `test:py` 443 passed. In source; not installed.

---

## 5. Esc's false negatives, and what K355 changed

Four paths return "no turn in flight" while a turn is very much in flight:

1. **The bootstrap window, harmless case.** A press whose callback runs before the task is created finds the tables empty and returns None. The turn proceeds normally.
2. **The one-second future — the killing press.** A press whose callback is still queued when the future times out reports `was_interrupted=false`. The callback runs later and kills the task at entry. Both hangs began with such a press: turn 44's first press (row 07:06:21.943), Next turn 19's press (row 04:44:34.992).
3. **After the hang.** The dead task's done callback has popped the tables; every press finds nothing and returns false within milliseconds. Ten presses on Next, ten instant nothings.
4. **The unanswered pair.** Next's two presses at 04:56:06.289 and .577 produced no `TURN_INTERRUPTED` row at all — the ten at 04:51 each produced one within 6 ms. `interruptTurn` appends a row on every completed path (`Interrupted` or `InterruptFailed`), so the call did not complete; whether the window suppressed it or the request hung is not in the trace. The two Ctrl+C presses before them routed `action: none`.

The window's Esc handler dispatched every press it recorded — the trace shows `KEY_ROUTED action=interrupt` and a row per press — so the loss is server-side, in what the interrupt seam can see and reach. The handler itself (`server.py:5590–5700` at the installed build) polls the record for up to 3 s for the `ProducerCancelled` frame when a cancel is dispatched; on turn 44 that poll ran out with the frame never written (`landed=false`).

Kernel K355 (`67307698`) with app sprint 518 (`df472f7`) fix the report in source: the endpoint answers `pending` when the turn's run is live but its loop has not yet served the cancel, and watches for any cancel landing after the request; the window reads "^C — interrupt taken; the turn stops when it finishes loading" (the `isPending` branch in `session_controller.ts`, current tree). 10 interrupt tests; 254 unit specs. In the installed builds none of this exists — the killing press still reads as a no-op there.

---

## 6. The same-folder symptom

### 6.1 NameCollision, verified live

`POST /api/session` to the running Next server (port 63581) with `{"driver": "claude", "name": "agent-orchestration", "workspace": ".../Agent Orchestration", "make_repository": false}` returned:

```
HTTP 409
{"error":"name already taken","existing_session_id":"s_52bd6e73d1224d5cb6d04830"}
```

The store was unchanged after it: 25 entries, 3 names. `by-name.json` maps `agent-orchestration` to `s_52bd6e73`. `registry.create` raises `NameCollision` under the name-index flock (`session_registry.py:539`), and the name stays blocked until that session is renamed (`set_name`, `session_registry.py:558`) or deleted. Neither path was driven; both mutate the store.

The window does surface the refusal — `session_controller.ts:582–586` patches `lastError: "session_open: ..."` and emits `SESSION_OPEN_REFUSED`. The Next log shows a case where the client never read it: the 409's own response body died on `BrokenPipeError` because the client had disconnected (the traceback before the 2026-11-17T07:08:20Z boot).

### 6.2 The claude session — round 1's finding 6, corrected

`s_52bd6e73` ("agent-orchestration", claude, 1,808 envelopes, 2.1 MB) would attach — the read API works (§7) — and round 1's claim that its next turn fails at ~1,028,535 tokens is wrong. Its record, read in full this round:

- The two `ProducerFailed` "Prompt is too long" entries (~1,028,535 and ~1,028,540 tokens against the 1,000,000 limit) are dated 11-15 04:03 and 04:04 UTC — 11-14 20:03 PST, before kernel K352/K353 (committed 21:42 PST, installed in Next build 1794724726 at 22:30).
- After that install the session ran on: nine `TranscriptCompacted` entries from 11-15 06:45 UTC to 11-16 04:01 UTC, `token_scale` 1.5, strategies `tool_output_cleared` then `rolling_window`, the oldest kept imported seq moving from −1012 to −610, `tokens_after` 518,599–598,744. Forty live turns, indices 0–39, the last at 11-16 04:01 UTC; the research dates turns 26–37 to after the install.
- The only failures after the install are two weekly-limit refusals: `HarnessStreamError: You've hit your weekly limit · resets Nov 18 at 11am (America/Los_Angeles)`, 11-16 04:00 and 04:01 UTC. Turn 39 ended `Returned reason=model_error` and the session parked cleanly.
- The session is `interrupted` because the 11-16 quit cut its end: `SessionEndRequested` (source `daemon_shutdown`) at 2026-11-17T07:07:56.426Z, `TriggerFired` factory=session_end at .428, nothing after — the SIGKILL arrived while the `session_end` producer was between its trigger and its first frame (§2.3, first row). The next boot is 24 s later.

So the session's walls are two, and neither is its size: the `interrupted` status (any resume clears it, as `s_cd9b4cbe`'s turn 46 proved), and Claude's weekly limit, which the record's own error text dates to 11-18 11am.

### 6.3 What the folder does not cause

The stalls are per-session and folder-independent. The wedged main-store session ran in its own sandbox. The wedged Next session shared its folder with two sessions that kept working: `s_d087367e` (deepseek-v4-pro) parked cleanly beside it — its record ends in `TerminationMatched pause-await-input` — and took turns 3–5 at 04:59–05:00Z while `s_7c1dab4e` sat hung. `s_3994b565` (flint:latest) ended cleanly the same evening. One real folder cost shows in the trace: the file watch on Agent Orchestration opened truncated at 20,000 entries (`FILES_WATCH_OPENED files=20000 truncated=True`). The name collision is the one mechanism the shared folder itself creates.

---

## 7. The stale locks, the read path, and the log noise

The three `.lock` files in the Next store name dead pids — 35270 (the orphan killed by hand 11-16) and 56200 (the server that died at its quit). They block nothing: `acquire_lock` flocks the file and never reads the pid (`locking.py:39`), and flock releases when the holding process dies. The read path works: `GET /api/session/s_52bd6e73...` and `GET /api/session/s_7c1dab4e...` on the live server both returned full manifests, `status: interrupted`, `next_turn_index` 40 and 20.

Every traceback in both logs ends in `BrokenPipeError`. A client that disconnects before the response is written kills `_json`'s `sendall`; `_fault` then tries to write a 500 on the same dead pipe; the log shows a doubled cascade and the client never reads the real error body. The 2026-11-16T02:57Z Next traceback is a turn response whose client vanished — the turn itself may be intact on the record; the log cannot say.

---

## 8. The slow bootstrap, measured

The bootstrap is the race's window, and its cost is now measured (research `RESEARCH-2026-11-18-bootstrap-time.md`, roadmap C4). A copy of `s_7c1dab4e`'s record (11,882 envelopes), resumed with one message on a deterministic stand-in model in one thread under `cProfile`: 8.84 s for the bootstrap and the turn. 5.35 s of it is `tokenizers.Tokenizer.encode`, 1,174 calls, all from the session's history view. Reading the record and decoding its frames takes most of the rest, about 2 s.

The cause: `TurnHistory.update` (`topologies/session/views.py`) runs for every event of a turn as the record is folded, and each call re-renders the turn so far and counts all of it — the cost of a turn of n events grows with the square of its length. Before kernel K352 the count was `len(text) // 4`, which cost nothing; since K352 it is a tokenizer pass over the whole turn, every event. The longer the bootstrap, the wider the window in which an Esc stranded the turn before K354.

The field measurements agree. Turn 44's bootstrap: 9.39 s on the 4 MB record. Next turn 19's: 13.05 s on the 6.3 MB record. Turn 45's: 103.4 s, under an arrived SIGTERM. Five T6 invariant breaks the same night — turns 7 (waited 10,215 ms), 24 (10,132), 25 (10,158), 26 (10,015), 35 (10,185) — say the submission-to-echo path exceeded 10 s all night on that record. Four T4 breaks at 06:44Z (stream envelope appends waited 1.0–1.2 s) mark the window side of the same slowness.

The planned fix (research, not yet built): count each event once, when it arrives — the view keeps the turn's running cost and savings and adds the new event's rendered lines, with the per-event render step shared by the renderer and the view so the count is of the same lines the prompt holds. The counts can differ from a whole-turn count by the few tokens a tokenizer merges across a line break; the plan stays a function of the record, the same live and on replay.

Not measured: turn 45's 4 min 1 s acceptance and 103.4 s bootstrap on a fresh boot. That record is 5,033 envelopes in 46 turns, so its turns are long and the quadratic cost grows with turn length, but it was not profiled.

---

## 9. The four sessions of 23:13 PST

Four main-store sessions carry the 11-17 night's timestamp: `s_41661eba` and `s_c1ae6b57` (created 22:45:24 PST), `s_ee85a2ce` and `s_77316527` (22:43:27 PST); their directories were last touched 23:13. All four are glm-5.2:cloud, all ended, and all were created inside the wedged session's own sandbox workspace (`.../s_cd9b4cbead724e9ead15bcd4/workspace`) — sessions the compaction-research model made itself. Two of them attached on the 07:15:51Z boot and drew `turn_state: failed` within 120 ms of connecting, then were ended locally. Why they drew failed — their records were not read — stays open (§11).

---

## 10. What was built on this review

The Architect stopped new development on 2026-11-18 until these bugs were tracked down. The roadmap `ROADMAP-2026-11-18-core-stalls-r1.md` ordered the fixes; this is where each stands:

| Item | Sprint | Commit | Status |
|---|---|---|---|
| C1: a producer cancelled before it starts is recorded, and its run goes on | kernel K354 | `7acfb030` | Closed. `RunState.began` tracks whether a task's body has begun; the done callback, finding the task cancelled and not begun, writes the `ProducerStarted` and `ProducerCancelled` (with the cancel's `cause` and `caller`) the body would have. 3 tests; the mutant fails 2; full suite 1,730 passed; the reproduction ends `Returned` `interrupted` in 7.6 s |
| C2: an interrupt during the bootstrap says so | kernel K355 + app 518 | `67307698`, `df472f7` | Closed. The endpoint reports `pending` and watches for the cancel landing; the window reads "^C — interrupt taken; the turn stops when it finishes loading". 10 interrupt tests; 254 unit specs |
| C3: the quit cannot wedge | kernel K356 + app 519 | `4fe4947e`, `9372554` | Closed. Sweep stops starting sessions at 30 s, the server exits itself at 40 s, Electron's kill comes at 45 s; each session's end waits for its lock at most its share; busy and deferred sessions counted and named. 3 tests; `test:py` 443 passed |
| The build that installs C1–C3 | app 520 | — | Active (`process/sprints/sprint-520-runtime-finds-compiled-packages.md`, depends on 508) |
| C4: why a bootstrap takes minutes | research | — | Measured (§8); fix planned, not built |
| C5: the pane names an interrupted session as it is | — | — | Not built; the pane still draws `failed` on attach |

Both installed builds run kernel `8f4c4424`, so none of the closed fixes is in an installed app; the field bugs live on there until sprint 520's build installs.

---

## 11. What remains open

- **The 3.91 s synchronous stretch** (turn 43) between the `TriggerFired` append and the producer's first step — against 687 ms for the same stretch on turn 46 the next day, same record, same driver. The frames are small (UserMessage 201–312 bytes, `TriggerFired` 462, `ProducerStarted` 236, `PromptComposed` 296), and the fsync policy is `Interval(100)` with plain `os.fsync` (`durable` defaults to false outside the `Always` policy), so the write is not the cost. The seat — a view update, route staging or trigger evaluation on the `TriggerFired` event, or the scheduling after it — is unnamed; the session view code was not profiled. This stretch is what makes the futures time out and widens the race window.
- **The 4 min 1 s acceptance gap and the 103.4 s bootstrap** of turn 45 — a fresh process, a free lock, the turn index already derived at attach. Not profiled; it ran under an arrived SIGTERM.
- **The row at 07:06:23.960** (`was_interrupted=true, landed=false`), 3.2 s after the `TriggerFired`. Under the reproduced mechanism the cancelled task and its table entries are gone within milliseconds; what live model instance that press found is not determined. The research flags it too.
- **The unanswered 04:56 pair** — window suppression or a hung request; the trace does not distinguish (§5, path 4).
- **Why the two model-created sessions drew `failed` within 120 ms** on attach (§9); their records were not read.
- **The window's rendering of the 409** — read in code (`session_controller.ts:582–586`), not driven in a window.
- **A live resume of `s_7c1dab4e`** — deliberately not driven; it would mutate the record and spend a model call. `s_cd9b4cbe`'s turn 46 stands as the proof that the resume path works.
- **The current boot** (Next, 2026-11-18T17:09:04Z, session `s_8fa76df0`, glm-5.3:cloud) shows none of this: turns 0–3 accepted and parked normally, two stream reconnects that reattached cleanly.

---

## 12. Sources

- Round 1: `process/reviews/REVIEW-2026-11-18-esc-interrupts-and-session-stalls.md` (committed `498fb86`), its §8 naming what this round closes.
- The follow-on record: `process/planning/2026-11-18-core-stalls/RESEARCH-2026-11-18-core-stalls.md` (the reproduction, the field-stall scan, the finding-6 correction), `RESEARCH-2026-11-18-bootstrap-time.md` (the profile, the quadratic cause, the planned fix), `ROADMAP-2026-11-18-core-stalls-r1.md` (C1–C5); kernel commits `7acfb030` (K354), `67307698` (K355), `4fe4947e` (K356); app commits `df472f7` (518), `9372554` (519); sprint cards 518, 519 (closed), 520 (active); BLACKBOARD entries 2026-11-14 through 2026-11-18.
- Logs: `~/Library/Logs/Substrate/substrate.log` (SIGKILLs at lines 3959–3960, 3974–3975; boot scans throughout), `~/Library/Logs/Substrate Next/substrate.log` (SIGKILL at 657–658; the SIGTERM with no `shutdown:` line before the 2026-11-17T07:08:20Z boot; the NameCollision traceback; the 2026-11-16T02:57Z pipe traceback).
- Traces: `~/Library/Logs/Substrate/traces/20261118-{043259-1a113c,071551-dae733,072432-2ddd35}/` (main.jsonl, server.jsonl, window-1.jsonl each; the T6/T4/T3 invariant payloads, the APP_QUIT/SERVER_EXITED lines, every Esc press and row); `~/Library/Logs/Substrate Next/traces/20261117-081004-328460/` and `20261118-170904-88c703/`.
- Records, read with `substrate.api.read_record`: `~/.substrate/sessions/s_cd9b4cbead724e9ead15bcd4/record/` (5,033 envelopes; seqs 5002–5033 with frame times; per-frame byte sizes), `~/.substrate-next/sessions/s_52bd6e73d1224d5cb6d04830/record/` (1,808 envelopes read in full: 40 live turns, 8 `TranscriptCompacted`, 4 `ProducerFailed`, the cut tail), `~/.substrate-next/sessions/{s_7c1dab4ee1fd4cc7bb41f2da,s_d087367e50c5492da9f77d95}/record/`. Manifests and `.lock` contents of the same; the four 22:43–22:45 PST manifests; `by-name.json` of both stores.
- Live checks against the running Next server (port 63581): two `GET /api/session/<id>`, one `POST /api/session` (the 409), `ps`, `lsof` on both daemon sockets; `defaults read` of both bundles' `CFBundleVersion` and `SubstrateKernelCommit`.
- Code at the installed kernel `8f4c4424` and substrate-ui `3acf093`: `electron/main.ts` (338–342, 466–488), `server.py` (429–452, 633–703, 4761+, 5590–5700, 7085–7230), `substrate/src/substrate/topologies/session_registry.py` (390–450, 500–560, 834–960, 1015–1030, 1032–1180, 1460–1560, 1630–1680), `substrate/src/substrate/kernel/runtime.py` (66, 173, 236–241, 300–340, 416–422, 534–580, 666–790, 790–875, 970–1030), `substrate/src/substrate/kernel/sequencer.py` (75–190, 300–310, 377–475), `substrate/src/substrate/record/record.py` (45–210), `substrate/src/substrate/record/locking.py`, `substrate/src/substrate/topologies/session/views.py` (`TurnHistory.update`). From the current tree (after 518): `web/vm/session_controller.ts` (560–640, 1371–1455, the `isPending` branch).
- Prior record: `process/reviews/REVIEW-2026-09-28-packaging-vs-electron-standard.md` finding 9, which named the kill-grace mismatch first — at 3 s, in September.
