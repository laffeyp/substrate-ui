# Sprint 035v — params drawer + `/set` slash

```yaml
---
id: 035v
status: closed
phase: 5
pass_kind: functional
---
```

## Product-spec conformance

**Fulfills:** PRODUCT-SPEC-2026-08-17-round12.md §4 driver "call
parameters." §13 View A "same DOM as substrate-ui's integrated
terminal today" — the agent terminal's `#termparams` (`think on · tokens
∞ · timeout 300s`) + its bare-word `think`/`tokens`/`timeout` setters
port into the daily-driver terminal as a header hint + `/set` slash.

**Consumes:** substrate-ui sprint 032c (SessionManifest.driver_params
+ PATCH surface + resolver) + v0.7.2 vocab (DRIVER_PARAMS_PATCHED).

## Scope

Terminal header gains `<span id="terminal-params">` between driver
picker and hint. Reads `driverParams` on the handle; `_updateParamsHint`
formats `think X · tokens Y · timeout Zs` (∞ when max_tokens is 0 or
unset). Slash `/set [key] [val]` PATCHes `driver_params` mid-session
and emits `DRIVER_PARAMS_PATCHED` on ACK; with no session queues on
`pendingDriverParams` (the next `_openSession` POSTs it in
`driver_params`); with no args prints current.

Also fixes an async race: `_endSession` now calls `_closeStream`
synchronously after emitting `DRIVER_SESSION_ENDED`, so the params
hint + prompt reset immediately instead of waiting on SSE.

Rule 6: one file, one concept ("params drawer + /set + session-open
plumbing"). Terminal.ts grows ~120 lines.

## Artifact contract → Files created/modified

- `web/terminal.ts` — `_mkChildren` returns `paramsHint`; new
  `_formatParamsHint(params)` helper; `TerminalHandle` extended with
  `driverParams` + `pendingDriverParams` + `updateParamsHint`;
  `mountTerminal` installs `_updateParamsHint`; `_openSession` threads
  `pendingDriverParams` into POST body + adopts ACK's echo;
  `_closeStream` resets driverParams + refreshes hint; `_endSession`
  synchronously calls `_closeStream` after emit; `_slashRoute` gains
  `/set` case (think/tokens/timeout/num_ctx with per-key validation).
- `harness/capture_terminal_params_drawer.js` — new; 16 assertions.
- `package.json` — new `capture:terminal-params-drawer` script wired
  into `npm run signals`.

## Signal contract → Emits

- `DRIVER_PARAMS_PATCHED{session_id, params, prior_params}` (v0.7.2)
  on PATCH ACK. Fired only when a session is active; queued /set
  before a session emits nothing.

## Observation contract

- Params hint mounts with defaults: `think off · tokens ∞ · timeout 300s`.
- `/set think on` before session: queues; hint refreshes; no emit.
- `/set` (no args): prints current params as body line.
- Session-open: ACK's `driver_params` echo adopted; queued params
  reflected on hint post-open.
- `/set tokens 4096` mid-session: PATCH lands; DRIVER_PARAMS_PATCHED
  with `{think:true, max_tokens:4096}` and correct prior; hint
  refreshes.
- Bad inputs rejected: `/set think yes` prints usage; `/set tokens -5`
  prints "non-negative integer"; `/set bogus 1` prints "unknown key".
- `/set think off` fires second DRIVER_PARAMS_PATCHED with reversed
  direction; hint reflects reverse.
- `/exit` closes session synchronously; hint resets to defaults.
- No uncaught page errors.
- 16/16 assertions PASS.
- Screenshot `screenshots/035v-params-drawer.png` viewed: header
  reads `driver [deterministic ▾] · think on · tokens 4096 · timeout 300s`.

## Halt conditions

- `dual_contract_fail` if `/set` PATCH lands but emit missing, or
  emit fires with mismatched prior.
- `vocabulary_change_required` if DRIVER_PARAMS_PATCHED absent from
  the lock (v0.7.2 landed today).

## Definition of done

Params hint wired. `/set` slash live. Queue-before-session works.
DRIVER_PARAMS_PATCHED fires on PATCH ACK. Async race on session
close fixed. 16/16 assertions PASS. Full signals chain PASS across
eight fixtures. Cleared: 037c dock-retirement precondition #4
(params row has a terminal-view home).
