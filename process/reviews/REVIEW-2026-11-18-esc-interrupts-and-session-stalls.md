# Review — Esc interrupts, the quit kill, and session stalls on the installed builds

*2026-11-18. Scope: the installed Substrate (build 1794976292, sprint 517) and Substrate Next (build 1794902590, the 2026-11-15 roll-up); both apps' logs and launch traces under `~/Library/Logs/`; the session stores `~/.substrate/` (141 sessions) and `~/.substrate-next/` (25); the kernel at `8f4c4424` and substrate-ui at `3acf093`. Premise, stated by the Architect and examined here: sometimes Esc leaves a session that can never be reloaded, and running multiple sessions in the same folder seems to cause issues. Code line numbers cite the source tree at `3acf093`; the installed bundles carry a different `server.py` (the log tracebacks cite the bundled copy's lines). The review mutated nothing in either store except one POST that proved the 409 in §5.1; no turn was sent, no session resumed, no lock removed.*

---

## 0. Verdict

Two symptoms, two mechanisms, one amplifier.

The Esc symptom is real, but Esc is not the cause. Esc works when the turn's event loop is alive: the record of `s_cd9b4cbe` holds a clean `ProducerCancelled` from an Esc press (`cause=external`, `caller=daemon:interrupt-hard`, seq 5023) an hour after the stalls. The unloadable session comes from a stall upstream of Esc: the turn's event loop stops making progress between the model trigger and the model producer's first lifecycle frame. The record is cut at a bare `substrate.TriggerFired`. The per-session lock stays held by the dead turn. Every action on the session — a new turn, an end request, the shutdown sweep — queues behind that lock forever. The app's quit wedges on the same lock, and Electron SIGKILLs the backend 45 s in. The next boot marks the session `interrupted`. The session does reload and does resume — `s_cd9b4cbe` took a clean turn after two SIGKILLs — but nothing in the app says so, and the pane draws the session as `failed`.

Esc's own contribution is two false "no turn in flight" answers. During the resume bootstrap — 9.4 s measured on a 4 MB record — no producer is live to cancel, so `registry.interrupt` returns None. And when the loop is merely busy, `interrupt`'s one-second future times out and also returns None. Ten consecutive Esc presses on the wedged Next session, in eight seconds, all returned `landed=false`. The user pressed Esc, the app reported nothing happened, and the turn never came back.

The same-folder symptom is a `NameCollision`, verified live: `POST /api/session` with the name `agent-orchestration` on the running Next server returns 409, because `by-name.json` maps that name to the session interrupted since 11-14. The stalls are not a folder effect at all — the wedged main-store session ran in its own per-session sandbox under `~/.substrate/sessions/<id>/workspace`, not in the shared folder.

The amplifier is the quit race. Electron gives the backend 45 s (`electron/main.ts:342`, `KILL_GRACE_MS = 45_000`). Sprint 515's hard-exit timer gives the backend 60 s (`server.py:7139`, `_SHUTDOWN_HARD_DEADLINE_S = 60.0`, armed on the first `_claim_shutdown`). Under Electron the timer never fires; the parent kills first, 15 s before the server's own deadline. The sweep the 45 s was sized for cannot finish anyway: its 10 s per-session timeout bounds the run wait, not the lock wait (`session_registry.py:884`, a plain blocking `with`), so one stuck session wedges the sweep whatever the budget. Three boots died this way after sprint 515 shipped: main store 2026-11-18T04:32:59Z and 07:15:51Z, Next 2026-11-17T08:10:04Z.

---

## 1. Findings, ranked

| # | Finding | Evidence | Effect |
|---|---|---|---|
| 1 | The turn's event loop stalls between `TriggerFired` and the producer's first frame; the record is cut there | `s_cd9b4cbe` seq 5012 then nothing for 74 s to the SIGKILL; `s_7c1dab4e` seq 11881 then nothing, ten 1 s probes over 8 min all timed out | The session accepts no further action; the lock is held; the quit wedges; the SIGKILL lands |
| 2 | The quit race: the parent kills at 45 s, the server's own deadline is 60 s | `main.ts:342`; `server.py:7139`; three SIGKILL boots after 515 shipped | The sweep dies mid-pass; sessions in flight land `interrupted` |
| 3 | The sweep's per-session timeout does not bound its lock wait | `server.py:643` → `_interrupt_then_end` → `turn_sync`; `session_registry.py:884` | One stuck session wedges the whole sweep; the N×10 s sizing in `main.ts:338` does not hold |
| 4 | Esc reports false negatives two ways | Window trace 07:06:20.565Z and 07:06:21.916Z, both `was_interrupted=false`, turn accepted 07:06:11.291Z; `session_registry.py:1175` `fut.result(timeout=1.0)` → None | The user presses Esc, nothing reports, the turn is lost anyway |
| 5 | A folder's session name is blocked by the session holding it | Live 409 on port 63581; `by-name.json`; `session_registry.py:539` | New sessions of that name fail until the holder is renamed (`set_name`, `session_registry.py:558`) or deleted |
| 6 | The claude session is stranded twice | Four `ProducerFailed` envelopes on its record | It would attach; its next turn fails at the model — ~1,028,535 tokens against the 1,000,000 limit |
| 7 | The first turn after a boot took 4 min 1 s to accept, 104 s more to reach the record; the same record's next cold boot took 3.85 s end to end | Traces `20261118-071551-dae733` vs `20261118-072432-2ddd35` | Unexplained; this is the window in which Esc returns false negatives |
| 8 | An `interrupted` session reloads and resumes; the app does not say so | `s_cd9b4cbe` turn 46 ran clean after two SIGKILLs; pane drew `failed` on attach | The "never reloaded" experience is the wedge and the pane, not the record |
| 9 | The stale `.lock` files are harmless | `locking.py:39` flocks without reading the pid; both GETs succeeded on the live server | No repair needed; flock releases on process death |
| 10 | `BrokenPipeError` doubles every server error in the logs | Every traceback in both logs ends in it | The client never reads the real error body; the log shows a cascade, not the cause |

---

## 2. The stalls, envelope by envelope

### 2.1 Main store: `s_cd9b4cbe` ("compactionresearch", glm-5.2:cloud), turns 44 and 45

The session's record is 5,033 envelopes, 4.0 MB, in its own sandbox workspace. The night boot of 2026-11-18T04:32:59Z ran its turns 4 through 44 over two and a half hours.

Turn 44:

| Time (UTC) | Where | What |
|---|---|---|
| 07:06:11.215 | window | `TURN_SUBMITTED` turn_index 44 |
| 07:06:11.291 | server | `TURN_ACCEPTED` (emitted under the session lock) |
| 07:06:20.565 | window | Esc → `TURN_INTERRUPTED` `was_interrupted=false` — no live producer yet |
| 07:06:20.681 | record | seq 5011 `UserMessage` turn_index 44 — the resume bootstrap (record read + view fold) took 9.39 s |
| 07:06:20.731 | record | seq 5012 `substrate.TriggerFired` factory=model |
| 07:06:21.916 | window | Esc → `was_interrupted=false` again |
| 07:06:23.960 | window | Esc → `was_interrupted=true, landed=false` — the cancel reached a live model instance; no `ProducerCancelled` ever reached the record |
| 07:06:36.965 | window | `TURN_SUBMITTED` turn_index 45 — never accepted |
| 07:06:47.212 | window | `INVARIANT_BROKEN` rule T6: turn submitted, no ack, waited 10,246 ms |
| ~07:07:35 | log | quit → SIGTERM → `server still running 45000ms after SIGTERM; SIGKILL` (main log lines 3959–3960) |

No `ProducerStarted` frame exists for turn 44. The record stops at the `TriggerFired`.

The next boot, 07:15:51Z, scanned 136 manifests: 1 interrupted, 135 ended. The window attached `s_cd9b4cbe` at 07:17:35.820Z and the pane drew `turn_state: failed` (with a `parked` flicker). Turn 45, submitted 07:18:33.805Z, was accepted at 07:22:34.997Z — 4 min 1 s later, on a server four minutes old with the lock held by nothing visible. The user requested the session's end at 07:23:22.945Z and submitted turn 46 at 07:23:39.516Z; neither reached the kernel. Turn 45's bootstrap completed during the quit: `UserMessage` seq 5013 at 07:24:18.443Z, `TriggerFired` seq 5014 at 07:24:18.821Z — and the wedge re-formed, the same cut as turn 44, one hour later, on a different boot. The SIGTERM had already arrived; the sweep was already blocked on the lock turn 45 held; the SIGKILL cut both (main log lines 3974–3975).

### 2.2 Next store: `s_7c1dab4e` (kimi-k3:cloud), turn 19

The daily-driver boot of 2026-11-17T08:10:04Z (00:10 PST) served this session through the day. Turn 18 interrupted cleanly at 04:43:48Z (`was_interrupted=true, landed=true`). Turn 19:

| Time (UTC) | Where | What |
|---|---|---|
| 04:44:24.253 | window | `TURN_SUBMITTED` turn_index 19 |
| 04:44:34.992 | window | Esc → `was_interrupted=false` — bootstrap in progress |
| 04:44:37.369 | record | seq 11880 `UserMessage` turn_index 19, text: "no, you are updating the blackboard and writing too many sprints. Just addend the sprint and go." |
| 04:44:37.886 | record | seq 11881 `substrate.TriggerFired` factory=model — the last envelope |
| 04:44:50.450 | window | `TURN_SUBMITTED` turn_index 20 — never accepted |
| 04:51:37–04:51:45 | window | ten Esc presses, 400–2,500 ms apart, every one `was_interrupted=false, landed=false` |
| 04:51:51.455 | window | `SESSION_END_REQUESTED` reason user_close — queued behind the lock, never landed |
| 04:55:29.832 | window | re-attach: `STREAM_ATTACHED`, pane drew `turn_state: running` — the in-memory manifest still said RUNNING, truthfully; the turn was in flight and stalled |
| 05:00:40.073 | window | `SESSION_END_REQUESTED` again, user_close — the user gave up and moved to another session |

The record ends with the Architect's message and no reply. The session's `.lock` names pid 56200, start 2026-11-17 20:44:24 PST — the server itself, dead since its own quit. That quit wedged the same way and ended in SIGKILL (Next log lines 657–658): `SIGTERM received; ending sessions cleanly...` with no `shutdown:` line after it. The boot of 2026-11-18T17:09:04Z scanned the store: 1 parked, 2 interrupted, 19 ended. The two interrupted are this session and `s_52bd6e73`.

### 2.3 What the record proves about the stall

The model producer task existed in both stalls. The third Esc on turn 44 returned `was_interrupted=true`, which means `registry.interrupt`'s closure ran on the turn's event loop and found a live model instance in `kind_by_instance` — a table only `_flush_scheduled` populates, at task creation (`runtime.py:670–676`). The task's first statement is `inbox.put_nowait(_Lifecycle(PRODUCER_STARTED, ...))` (`runtime.py:688–689`), and the task was scheduled before the interrupt closure, so the frame was in the inbox by 07:06:23.9. The writer loop polls the inbox every 10 ms (`_QUIESCENCE_POLL_S = 0.01`, `runtime.py:66`); a healthy loop drains that frame in milliseconds — turn 46's `ProducerStarted` landed 687 ms after its `TriggerFired`, with `PromptComposed` 9 ms later. In turn 44 the frame sat in the inbox unwritten for the 74 seconds to the SIGKILL. On Next, the loop served the interrupt closure never again: ten probes over eight minutes, each `fut.result(timeout=1.0)` timing out.

So the loop thread served one callback — the cancel dispatch at 07:06:23.960 — and then made no further progress for the life of the process. The `ProducerCancelled` the cancel queued also never reached the record. The blocking code sits somewhere after that callback: in the model producer's synchronous stretch (prompt composition, responder construction) or in the writer's own append path (`RecordWriter.append`, fsync policy `Interval(100)`, `runtime.py:173` — one fsync every 100 ms, each capable of blocking the loop thread). Which of the two blocked is not determined; the responder and prompt-composition code was not read. The sharpest unexplained contrast: turn 44's composition never completed in 74 s, and turn 46's took 9 ms on a record two envelopes longer, same driver, same session.

### 2.4 The recovery that refutes "never be reloaded"

The boot of 07:24:32Z reattached `s_cd9b4cbe` (attach 07:24:50.755Z, `STREAM_ATTACHED`, connected). At 17:06:31Z the next day the user submitted turn 46. It ran end to end: `UserMessage` seq 5015 at 17:06:34.854Z — 3.85 s after submission, on a cold counter — then `ProducerStarted` 17:06:35.547, `PromptComposed` .556, a clean Esc (`ProducerCancelled` 17:07:22.699, `cause=external`, `caller=daemon:interrupt-hard`), `Returned reason=interrupted`, `TerminationMatched pause-await-input`, then `SessionEndRequested` → `SessionEnded` → `RunFinalised` at 17:07:26.722Z. The pane closed it as ended. The scans tell the same story: the 07:15:51Z boot found 1 interrupted; the 17:07:31Z boot found 0 interrupted, 136 ended. The 07:24:32Z boot itself shut down cleanly at its own quit — `shutdown: ended=1 skipped_ended=135 failed=0`, exit 0 — because no lock was held.

An `interrupted` session reloads, attaches, and resumes on the next turn. What the stalls actually cost is turns 44 and 45: their `UserMessage`s sit on the record with no reply. What the user saw is the wedge around the record: the pane drawing `failed` on attach, Esc answering nothing, turns and end requests queueing forever, and the quit needed to escape wedging itself into a SIGKILL.

---

## 3. The quit path

### 3.1 The 45 s / 60 s race

`electron/main.ts:342` sets `KILL_GRACE_MS = 45_000`; the comment at 338 sizes it for a sweep of N sessions at 10 s each. `server.py:7139` sets `_SHUTDOWN_HARD_DEADLINE_S = 60.0`, armed as a `threading.Timer(os._exit)` on the first `_claim_shutdown` — sprint 515's fix for the orphaned backend (pid 35270, 2026-11-14, which held a record lock, ignored SIGTERM, and took a SIGKILL by hand). Under Electron the timer is dead code: the parent kills the process group at 45 s, fifteen seconds before the timer fires. The timer only matters when no parent is coming — the orphan case it was built for. Substrate Next's installed build (1794902590, the 11-15 roll-up) predates sprint 515 and has no timer at all; it died the same way, because under Electron the parent's 45 s decides either way.

### 3.2 The sweep's unbounded lock wait

`_shutdown_all_sessions(per_session_timeout=10.0)` (`server.py:633`) skips every manifest already `ended` or `interrupted` (`server.py:680`, counted `skipped_ended`) and calls `_interrupt_then_end` on the rest. That helper interrupts a RUNNING manifest best-effort — `registry.interrupt` schedules the cancel on the turn's loop and waits one second — then calls `turn_sync`, which acquires the per-session `threading.Lock` with a plain blocking `with` (`session_registry.py:884`). The 10 s timeout bounds `done.wait()` inside the run, which happens after the lock. A stuck turn holds the lock; the sweep waits at line 884 forever; the "ending sessions cleanly" pass dies mid-sentence. Both SIGKILLed main boots show exactly that: `SIGTERM received; ending sessions cleanly...` and then no `shutdown:` line. The clean boots (07:24:32Z, 17:07:31Z, 17:08:56Z on main; 07:08:20Z on Next) all print the full `shutdown: ended=... failed=0` line and exit 0.

### 3.3 The boots that died

| Boot (UTC) | Store | Scan at boot | Death |
|---|---|---|---|
| 2026-11-17T08:10:04Z | Next | 16 manifests, 1 interrupted | SIGKILL at quit, no `shutdown:` line (log 657–658) |
| 2026-11-18T04:32:59Z | main | 131, 0 interrupted | SIGKILL at quit (log 3959–3960); next scan found 1 interrupted |
| 2026-11-18T07:15:51Z | main | 136, 1 interrupted | SIGKILL at quit (log 3974–3975); next scan found 1 interrupted |

The 07:15:51Z boot's window also attached two sessions created around 23:13 PST the night before — `s_41661eba` at 07:15:56.903Z and `s_77316527` at 07:16:33.700Z — each of which drew `turn_state: failed` within 120 ms of connecting and was ended locally. Four sessions carry that 23:13 timestamp (`s_41661eba`, `s_c1ae6b57`, `s_ee85a2ce`, `s_77316527`). Their manifests and records were not read; what they are is open (§8).

---

## 4. Esc's false negatives

Two independent paths return "no turn in flight" while a turn is very much in flight:

1. **The bootstrap window.** Between `TURN_ACCEPTED` and the `UserMessage` landing, the runtime is reading the record and folding views; `kind_by_instance` is empty until `_flush_scheduled` creates the producer task. `registry.interrupt` finds nothing and returns None. Measured: 9.39 s on the 4 MB record (turn 44), 104 s on the first turn after a reboot (turn 45). Both Esc presses inside that window returned `was_interrupted=false`.
2. **The one-second future.** `interrupt` schedules its closure with `loop.call_soon_threadsafe` and waits `fut.result(timeout=1.0)`; on timeout it returns None (`session_registry.py:1175–1180`), indistinguishable from an idle session. Ten consecutive presses on the wedged Next session all took this path.

The window's Esc handler itself dispatched every press — the trace shows `KEY_ROUTED action=interrupt` and a `TURN_INTERRUPTED` per press — so the loss is server-side, in what the interrupt seam can see and reach.

---

## 5. The same-folder symptom

### 5.1 NameCollision, verified live

`POST /api/session` to the running Next server (port 63581) with `{"driver": "claude", "name": "agent-orchestration", "workspace": ".../Agent Orchestration", "make_repository": false}` returned:

```
HTTP 409
{"error":"name already taken","existing_session_id":"s_52bd6e73d1224d5cb6d04830"}
```

The store was unchanged after it: 25 sessions, 3 names. `by-name.json` maps `agent-orchestration` to `s_52bd6e73`, the claude session interrupted since 11-14. `registry.create` raises `NameCollision` under the name-index flock (`session_registry.py:539`), and the name stays blocked until that session is renamed (`set_name`, `session_registry.py:558`) or deleted. Neither path was driven; both mutate the store.

The window does surface the refusal — `session_controller.ts:582–586` patches `lastError: "session_open: ..."` and emits `SESSION_OPEN_REFUSED`. The Next log shows a case where the client never read it: the 409's own response body died on `BrokenPipeError` because the client had disconnected (Next log, traceback before the 2026-11-17T07:08:20Z boot).

### 5.2 The claude session's second wall

`s_52bd6e73` would attach — the read API works (see §7) — but its own record names why its next turn fails. Four `substrate.ProducerFailed` envelopes:

- Twice: `HarnessStreamError: Prompt is too long · the request is ~1028535 tokens (limit 1000000) but this conversation is only ~591963 tokens — the rest is system prompt, tool definitions, and attachment content. A single-exchange conversation cannot be compacted; reduce attached files/tools or start with less`. The bulk is the 1,279 messages imported from the continued Claude Code session (sprint 494, kernel K351).
- Twice: `HarnessStreamError: You've hit your weekly limit · resets Nov 18 at 11am (America/Los_Angeles)`.

### 5.3 What the folder does not cause

The stalls are per-session and folder-independent: the wedged main-store session ran in its own sandbox, and the wedged Next session shared its folder with two sessions that kept working — `s_d087367e` (deepseek-v4-pro) parked cleanly beside it, its record ending in `TerminationMatched pause-await-input`, and took turns 3–5 while `s_7c1dab4e` sat wedged. One real folder cost shows in the trace: the file watch on Agent Orchestration opened truncated at 20,000 entries (`FILES_WATCH_OPENED files=20000 truncated=True`). The name collision is the one mechanism the shared folder itself creates.

---

## 6. Model-side failures on the record

Not crashes — recorded `ProducerFailed` envelopes. `s_7c1dab4e`: a 502 from ollama.com's upstream through the local proxy (`http://localhost:11434/api/chat`), then two 429s (`you (laffeypeter) have rea...` — the rate limit's own text). `s_52bd6e73`: the token-limit and weekly-limit pairs in §5.2. No server in either log died of anything but the SIGKILLs; every other traceback is the pipe cascade of §7.

---

## 7. The stale locks, the read path, and the log noise

The three `.lock` files in the Next store name dead pids — 35270 (the orphan killed by hand 11-16) and 56200 (the server that died at its quit). They block nothing: `acquire_lock` flocks the file and never reads the pid (`locking.py:39`), and flock releases when the holding process dies. The read path works right now: `GET /api/session/s_52bd6e73...` and `GET /api/session/s_7c1dab4e...` on the live server (port 63581) both returned full manifests, `status: interrupted`, `next_turn_index` 40 and 20.

Every traceback in both logs ends in `BrokenPipeError`. A client that disconnects before the response is written kills `_json`'s `sendall`; `_fault` then tries to write a 500 on the same dead pipe; the log shows a doubled cascade and the client never reads the real error body. The 2026-11-16T02:57Z Next traceback is a turn response whose client vanished — the turn itself may be intact on the record; the log cannot say.

---

## 8. What was not verified

- **The stall's mechanism.** Which synchronous stretch blocks the loop thread — the model producer's composition/responder or the writer's append/fsync. The responder and prompt-composition code (`session/model_class.py`, the responder classes, `session/__init__.py`'s model producer) was not read. The evidence bounds it: the loop served one callback three seconds after the `TriggerFired` and nothing after, and the producer's lifecycle frames sat in the inbox unwritten.
- **The 4 min 1 s acceptance gap** (turn 45, boot 07:15:51Z) and the **104 s bootstrap** the same turn paid — against 3.85 s end to end for turn 46 on the same record in the next boot. The index-derivation and tail-read candidates are excluded by the fast cold case; no cause is identified.
- **The window's rendering of the 409** — read in code (`session_controller.ts:582–586`), not driven in a window.
- **A live resume of `s_7c1dab4e`** — deliberately not driven; it would mutate the record and spend a model call. `s_cd9b4cbe`'s turn 46 stands as the proof that the resume path works.
- **The four sessions timestamped 2026-11-17 23:13 PST** (`s_41661eba`, `s_c1ae6b57`, `s_ee85a2ce`, `s_77316527`) — two attached, drew `failed` within 120 ms, and were ended locally. Their manifests and records were not read.
- **The current boot** (Next, 2026-11-18T17:09:04Z, this session `s_8fa76df0` on glm-5.3:cloud) shows none of this: turns 0–3 accepted and parked normally, two stream reconnects that reattached cleanly.

---

## 9. Sources

- Logs: `~/Library/Logs/Substrate/substrate.log` (SIGKILLs at lines 3959–3960, 3974–3975; boot scans throughout), `~/Library/Logs/Substrate Next/substrate.log` (SIGKILL at 657–658; the NameCollision traceback before the 2026-11-17T07:08:20Z boot; the 2026-11-16T02:57Z pipe traceback).
- Traces: `~/Library/Logs/Substrate/traces/20261118-{043259-1a113c,071551-dae733,072432-2ddd35}/` (main.jsonl, server.jsonl, window-1.jsonl each); `~/Library/Logs/Substrate Next/traces/20261117-081004-328460/` and `20261118-170904-88c703/`.
- Records, read with `substrate.api.read_record`: `~/.substrate/sessions/s_cd9b4cbead724e9ead15bcd4/record/` (5,033 envelopes; seqs 5009–5033 cited), `~/.substrate-next/sessions/{s_52bd6e73d1224d5cb6d04830,s_7c1dab4ee1fd4cc7bb41f2da,s_d087367e50c5492da9f77d95}/record/`. Manifests and `.lock` contents of the same. `by-name.json` of both stores.
- Live checks against the running Next server (port 63581): two `GET /api/session/<id>`, one `POST /api/session` (the 409), `ps`, `lsof` on both daemon sockets.
- Code: `electron/main.ts` (338–342, 466–488), `server.py` (429–452, 633–703, 4761+, 5590–5700, 7085–7230), `substrate/src/substrate/topologies/session_registry.py` (390–450, 500–560, 834–960, 1032–1180, 1460–1560, 1630–1680), `substrate/src/substrate/kernel/runtime.py` (66, 173, 236–241, 300–340, 534–580, 666–790, 790–860, 970–1030), `substrate/src/substrate/kernel/sequencer.py` (75–190), `substrate/src/substrate/record/locking.py`, `substrate/src/substrate/record/record.py` (45–80), `web/vm/session_controller.ts` (560–640).
- Prior record: BLACKBOARD entries 2026-11-14 through 2026-11-17 (sprint 515's cause and fix; the orphan 35270; the `SUBSTRATE_HOME` leak; sprint 501's Esc work), and `process/reviews/REVIEW-2026-09-28-packaging-vs-electron-standard.md` finding 9, which named the kill-grace mismatch first — at 3 s, in September.
