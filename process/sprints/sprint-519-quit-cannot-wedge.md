# Sprint 519 — The quit cannot wedge

```yaml
---
id: 519
status: closed
phase: core stalls (roadmap 2026-11-18-core-stalls r1, C3)
pass_kind: functional
depends_on: [kernel 356]
plan: process/planning/2026-11-18-core-stalls/ROADMAP-2026-11-18-core-stalls-r1.md
---
```

## scope

The review of 2026-11-18 (§ 3): Electron kills the backend at 45 s (`electron/main.ts`, `KILL_GRACE_MS`); sprint 515's hard exit came at 60 s, so under Electron it never fired; and the sweep waited for each session's lock with no limit, so one stuck turn held the whole quit into the kill. The clocks now run in order and live in one place: the sweep stops starting sessions at `SHUTDOWN_SWEEP_DEADLINE_S` (30 s), the server exits itself at `SHUTDOWN_HARD_DEADLINE_S` (40 s), Electron's kill comes at 45 s. Each session's end waits for its lock at most its share of the sweep (kernel K356's `lock_timeout_seconds`); a busy session is logged and counted `busy`, one the deadline leaves unreached `deferred`. One verifiable property: a sweep over a session whose lock is held ends the other sessions and returns within its bound.

## context_files

- `server.py` (`_interrupt_then_end`, `_shutdown_all_sessions`, `_shutdown_sequence`, `_claim_shutdown`), `electron/main.ts` (`KILL_GRACE_MS`)
- `tests/test_server_daemon_shutdown.py`, `tests/test_server_shutdown_skips_fresh_sessions.py`, `tests/test_shutdown_interrupts_running_turn_101.py`

## signal contract

### Emits

- `SERVER_STOPPED`: its `failed` counts every session not ended cleanly (failed, busy, deferred). No vocabulary change.
- The log's `shutdown:` line adds `busy=` and `deferred=`; a `[shutdown] busy <id>` or `[shutdown] deferred <id>` line names each.

## artifact contract

### Files modified

- `server.py`, `electron/main.ts`, `tests/test_server_daemon_shutdown.py`, `tests/test_server_shutdown_skips_fresh_sessions.py`

### Files created

- `tests/test_quit_clocks_519.py`

### Command exit codes

- `npm run build` and `npm run test:py` return 0.

## close

`server.py`: `SHUTDOWN_SWEEP_DEADLINE_S` 30.0 and `SHUTDOWN_HARD_DEADLINE_S` 40.0 at module level, the latter arming sprint 515's timer; `_shutdown_all_sessions(deadline_s=)` gives each session `min(per_session_timeout, remaining)` for both its end turn and its lock wait, counts `busy` (`SessionBusy`) and `deferred`, and names each in the log; `_interrupt_then_end` passes `lock_timeout_seconds`. `electron/main.ts`: `KILL_GRACE_MS` stays 45,000 and names the server's two clocks.

- `tests/test_quit_clocks_519.py`: 3 passed. The clocks' order read from both files (30 < 40 < 45); a sweep with one session's lock held counts it `busy`, ends the other, and returns in under 8 s; a deadline of 0 defers every session.
- The two shutdown tests that compare the whole result take `busy: 0, deferred: 0`.
- Mutant (the sweep's lock limit dropped): the held-lock test fails at its 20 s limit.
- `npm run build` 0; `npm run test:py` 443 passed, 5 skipped (live drivers).

Rubber Duck Pass: `SERVER_STOPPED` keeps its payload shape; `failed` now counts busy and deferred sessions as not ended cleanly, which is what the field named. No observations.
