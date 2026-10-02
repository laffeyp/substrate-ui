---
id: 094
status: closed (source mode); packaged parity waits on sprint 098
class: D (Twelve-Factor IX; Python signal and socketserver docs; Electron single-instance example)
---

# Sprint 094 — graceful shutdown and fast startup

## scope

The backend exits promptly on quit, on SIGTERM, and when the app that started it dies; a second app instance starts no backend; startup time is measured under real use against real-size state.

## done

1. **Shutdown off the serving thread.** `srv.shutdown()` runs in `_shutdown_sequence`, never on the thread inside `serve_forever()` (Python socketserver docs: otherwise "it will deadlock").
2. **No locks in the signal handler.** `_sigterm_handler` writes one byte to a self-pipe; a `shutdown-waiter` thread started at boot reads it and runs the shutdown. Python signal docs: "Synchronization primitives such as threading.Lock should not be used within signal handlers. Doing so can lead to unexpected deadlocks." The interim handler (Event.set + Thread.start) deadlocked on 2 of 9 runs: native sample showed the main thread parked in the handler's lock wait.
3. **Watchdog watches the app.** `electron/main.js` passes `SUBSTRATE_PARENT_PID`; `_app_alive()` checks it (source mode puts `uv` between app and backend, so ppid never changed).
4. **Single instance.** `whenReady` returns when the lock was not acquired.
5. **Boot scan does no record reads.** `next_turn_index` derives a session's index on first use; boot no longer scans every record. Test: `tests/test_boot_scan_lazy_turn_index_094.py`.

## measurements (2026-10-01, source mode, clone of real state: 3,079 sessions)

| | before | after |
|---|---|---|
| boot scan | 6.87–8.12 s | 0.20–0.22 s |
| session list complete | 7.5–9.1 s | 0.78–0.79 s |
| prompt visible (open-and-quit harness) | 0.79–1.34 s | 0.74–0.89 s |
| SIGTERM to exit, 0 sessions | > 31 s (hung) | 0.20–0.92 s |
| SIGTERM to exit, 5 parked real-model sessions | — | 0.95 s |
| app quit to backend gone | 45 s on 2 of 9 runs | 0.50–0.93 s, 6 of 6 |
| backend after app death (uv in between) | never exits | ~3 s |
| second instance | — | exits in 124–143 ms, 0 extra backends |

Real-use flow (`harness/shakeout/packaged_app_smoke.ts`, `SMOKE_TARGET=source SMOKE_STATE=<clone>`), two runs: window 0.72–0.79 s; prompt 1.10–1.18 s; real `kimi-k2.7-code:cloud` turn parked 1.0–1.4 s after send; Structure graph populated at park; quit with the session live to backend gone 0.85–0.87 s.

Harnesses: `harness/startup_timing.ts` (open-and-quit stages, second-instance check, `STARTUP_LOG`), `packaged_app_smoke.ts` (real-use stages, `timing` JSON line, state isolation via `SMOKE_STATE`).

## open

- Packaged target not measured: no signed build of current code exists (sprint 098).
- PATH probe costs 0.38 s before the server spawns (blocking `spawnSync`); not changed.
