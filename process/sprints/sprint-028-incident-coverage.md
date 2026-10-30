# Sprint 028 — incident coverage

```yaml
---
id: 028
status: closed
phase: 3
pass_kind: implementation
---
```

## scope

Three emit sites, all on error paths:
- `FETCH_FAILED` — wrap the `api(p)` helper so every failed fetch (network error OR non-2xx) emits `{endpoint, status_or_error}`. Callers keep their existing catch behavior; the emit is additive at the seam.
- `LAUNCH_REJECTED` — extend `#launchbtn.onclick`, `#resumebtn.onclick`, and `sendChatMessage()`'s launch failure branch to emit `{kind, reason}` with kind ∈ {agent, topology, resume} on server error responses.
- `POLL_TIMEOUT` — extend `followLive()` and `streamAgentTurns()` polling with an elapsed-time ceiling (default 60 s per agent turn); emit `{run_name, elapsed_ms}` when the ceiling is hit without a FINAL_ANSWER_RENDERED for the run.

Grader extension: vocab § invariant #11 (payload-content, per Layer 7) — every `FETCH_FAILED` carries non-empty `endpoint` and non-empty `status_or_error`; every `LAUNCH_REJECTED` carries `kind ∈ {agent, topology, resume}` and non-empty `reason`; every `POLL_TIMEOUT` carries non-empty `run_name` and `elapsed_ms > 0`.

Harness extension: after the deterministic chat turn resolves, use `/api/records/DOES_NOT_EXIST` (via the terminal `cat` command or a direct evaluate) to trigger a FETCH_FAILED — vocab requires the payload shape only, not that the failure comes from a particular UI action. LAUNCH_REJECTED + POLL_TIMEOUT are structurally-covered (the emits exist and grade if fired) but exercised opportunistically — if a launch to a bogus topology name is possible, the harness fires it too.

## context_files

- `signals/versions/0.1.json`
- `web/app.ts` (`api()`, `#launchbtn`, `#resumebtn`, `sendChatMessage`, `followLive`, `streamAgentTurns`)
- `tools/capture-grade.ts`
- `harness/capture_signals.js`

## artifact contract → Files created/modified

- `substrate-ui/web/app.ts` — `api()` wrap; error-branch emits.
- `substrate-ui/tools/capture-grade.ts` — payload-content checks for the three incident tags.
- `substrate-ui/harness/capture_signals.js` — trigger a bogus fetch + a bogus launch.
- `substrate-ui/captures/sprint-021/console.jsonl` — regenerated.
- `substrate-ui/sprints/sprint-028-incident-coverage.md` — this file.

## signal contract → Emits

FETCH_FAILED + LAUNCH_REJECTED at minimum in the fixture; POLL_TIMEOUT emitted opportunistically (the deterministic driver finishes fast; the ceiling isn't reached in a normal run).

## dual-contract close

Four gates.

## rubber duck pass

*Sequence narration:* the `api()` seam now wraps every fetch; a non-2xx response or a network throw both emit FETCH_FAILED at the seam. LAUNCH_REJECTED fires on any launch/resume/agent response carrying an `error` field, with `kind` typed by call site. POLL_TIMEOUT fires when `followLive()` exceeds `STATE.term.params.timeout` seconds (clamped to [30 s, 10 min]) without a terminal. Harness triggers LAUNCH_REJECTED by appending a bogus `does_not_exist` option to `#launchsel` and clicking launch — server rejects with an error → emit fires. Then triggers FETCH_FAILED by calling `window.api("/api/records/DOES_NOT_EXIST")` — 404 → emit fires. POLL_TIMEOUT stays vacuous in this fixture (deterministic driver finishes fast).

*Observations:* missing pair — none; order — 37/37 in sequence; vocabulary gap — none (44 distinct emits, all locked — full vocabulary coverage); payload anomaly — none (endpoint + status_or_error non-empty; kind ∈ {agent,topology,resume}; reason non-empty); timing surprise — the initial grader run failed the topology-launch pairing because a later LAUNCH_REJECTED{topology} at ts=~13 s counted against an earlier successful launch at ts=~1.5 s despite being 12 s apart — root cause: the pairing check used a 5 s window from the request but didn't bound at the NEXT request. Fix: window ends at `min(request.ts + 5s, next_request.ts)`. Same shape as the RECORD_SELECTED staleness-drop check; consistent pattern; tone trace — payloads structural.

*Adversarial pass:* the `api()` wrap fires FETCH_FAILED on every failing endpoint the app already tolerates with `.catch()` (assays returns [] if 404, models returns default, etc.). In a production environment where those endpoints exist and succeed, the incident tag stays at 0 fires unless a real error occurs. In this fixture, `/api/records/DOES_NOT_EXIST` is a synthetic bad-name; the emit is real and payload-valid. Zero halted, zero surfaced.

## follow-on

Sprint 029 — harness integration + Wave close. Fold the capture pattern into the standing e2e harnesses per the arc plan.

