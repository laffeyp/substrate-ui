# Sprint 357 — the server speaks its domain: sessions created, turns accepted, refusals, faults (plan item 4)

```yaml
---
id: 357
status: closed
phase: SDD re-centre
pass_kind: functional
---
```

## scope

Plan item 4, area "server routes as domain events": `SESSION_CREATED`, `TURN_ACCEPTED`, `API_REFUSED`, `SERVER_FAULTED` in `server.py`. The Python tests run with the server's trace on, so every request they make runs the checker in raise mode. Files: `server.py`, `tests/conftest.py`; the test `tests/test_server_signals.py`; vocabulary v0.11.

## signal contract

### Emits

`SESSION_CREATED`, `TURN_ACCEPTED`, `API_REFUSED`, `SERVER_FAULTED`.

### Invariants

- S7: each `SESSION_CREATED` pairs with one window `SESSION_OPEN_ACKED` on its session id.
- S8: each `TURN_ACCEPTED` pairs with one window `TURN_ACK` on its session id.
- No request content in any payload (E1).

## observation contract

- `tests/test_server_signals.py`:
  - the area of every route, with `/api/validate` and `/api/build` as `unrouted`;
  - an isolated create (`isolate`), turn 0 accepted;
  - three refusals: unrouted 404 at `do_POST`, unknown session 404 at `_session_turn`, and the planted fault's 500;
  - `SERVER_FAULTED` from a `RuntimeError` planted in the registry's turn;
  - neither message text reaches the trace.
- `tests/conftest.py`: the whole Python suite with the trace on; the session fails on any `SIGNAL_REJECTED`.
- `harness/shakeout/trace_files.ts`, normal run: the full picker, then "hello"; S7 and S8 across `server.jsonl` and the window file.

## result

- **Built** as scoped; vocabulary v0.11 (three proposals); `unemitted.json` 28 → 24.
- **Found by the checks:**
  - **Workspace shapes.** `SESSION_CREATED.workspace_shape` named shapes the kernel does not have (fixed, v0.11).
  - **Stale vocabulary.** Main and the server read `web/dist/vocabulary.json` even in a source tree, so they checked against the last build's vocabulary. They now read `current.json` where the source tree has it, and the built copy only in the packaged app.
  - **Studio's routes.** Studio's Validate and Build call `/api/validate` and `/api/build`, deleted from the server on 2026-10-08 (`1e326db`); both have answered 404 since. This is a behaviour fault, recorded and left for its own change (plan rule: instrumentation changes no behaviour).
  - **Test cap.** Sprint 356's extra main records pushed `main.jsonl` past the 1,500-byte cap, so the cap run lost the closing record. Sprint 356 did not run that mode. The cap now binds window files only.
- **Commands.** `ruff check`, `ruff format --check` 0; `npm run test:unit` 194 passed; `uv run python -m pytest tests/ -q` 321 passed, 5 skipped, trace on, no rejection; `npm run signals` 0 (v0.11; 64 emitted, 24 pending).
- **What the Python suite drove:** `API_REFUSED` 76, `SESSION_CREATED` 143, `TURN_ACCEPTED` 109 (`TRACE_PRINT=1`). `SERVER_FAULTED` comes from the new test only.
- **Plants**, each failing:
  - `API_REFUSED.cause` sent as a number: the test session fails on the rejection;
  - the `SERVER_FAULTED` emit removed: `test_server_signals` fails.
- **Gates.**
  - From source: `trace_files` (normal, cap, server-cap, reject), `main_signals`, `choose_folder_starts_session` 0.
  - Packaged: `trace_files` all four modes and `main_signals` 0.
- **Rubber Duck Pass** (the hello run, three files merged by wall time):
  - **Launch:** main boots, spawns the server, which binds port 63835 in 110 ms; the server starts, opens its trace and scans an empty store; the window opens.
  - **Window:** the four roster loads on pane 1; the picker arms the default row (workspace null), picks deterministic, guidance, length, tone, commits.
  - **Session and turn:** `SESSION_OPEN_REQUESTED`; the server's `SESSION_CREATED` (`s_b0527…`, flat) 62 ms later; `SESSION_OPEN_ACKED` 1 ms after that. `TURN_SUBMITTED` (turn 0, 5 characters), the server's `TURN_ACCEPTED` (turn 0), `STREAM_ATTACHED`, `TURN_ACK`.
  - **Quit and record:** quit requested; the server stops, ending one session; the window receives seq 0–40, `UserMessage` at 17 and `ModelReply` at 22, parks on "replied", ends locally (daemon_shutdown), closes the stream; the server exits as expected; the window closes; main closes with 70 written and 0 lost.
- **Observations:**
  - Missing pair: `ModelReply` (seq 22) reached the window, but no tag says it was drawn. `TRANSCRIPT_ROW_DRAWN` is pending and is the next area.
  - Order, timing, tone: none.
