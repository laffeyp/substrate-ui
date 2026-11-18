# Sprint 518 — The window says an Esc was taken while the turn was loading

```yaml
---
id: 518
status: closed
phase: core stalls (roadmap 2026-11-18-core-stalls r1, C2)
pass_kind: functional
depends_on: [kernel 354, kernel 355]
plan: process/planning/2026-11-18-core-stalls/ROADMAP-2026-11-18-core-stalls-r1.md
---
```

## scope

Kernel K355's `SessionRegistry.interrupt` answers `{"kind": "pending", ...}` when the turn is in flight but its loop cannot take the cancel yet (a bootstrap), and the cancel runs once the loop frees. `POST /api/session/<id>/interrupt` mapped every non-None answer to "interrupted" and polled for a `ProducerCancelled` naming the answer's instance, which a pending answer has none of. It now answers `"pending": true` and, for a pending answer, polls for any `ProducerCancelled` that lands after the request. The window's text for a pending Esc that has not landed reads "^C — interrupt taken; the turn stops when it finishes loading"; landed, it reads as any hard interrupt. One verifiable property: a pending interrupt answers `interrupted: true, pending: true`.

## context_files

- `server.py` (`_session_interrupt`), `web/vm/session_controller.ts` (the interrupt's text)
- `tests/test_server_session_interrupt.py`

## signal contract

### Emits

- `TURN_INTERRUPTED` as before: `was_interrupted` true, `landed` as observed. No vocabulary change.

## artifact contract

### Files modified

- `server.py`, `web/vm/session_controller.ts`, `tests/test_server_session_interrupt.py`

### Command exit codes

- `tests/test_server_session_interrupt.py`, `npm run build`, `npm run test:unit` return 0.

## observation contract

The installed Substrate Next: an Esc in the first seconds after sending a message to a session with a long record draws the pending text, and the turn ends interrupted.

## close

`server.py`: `_session_interrupt` counts the record's `ProducerCancelled` frames before dispatching; a pending answer polls for one more, any other polls for its own instance as before; the response carries `pending`. `web/vm/session_controller.ts`: a pending interrupt not yet landed reads "^C — interrupt taken; the turn stops when it finishes loading".

- `tests/test_server_session_interrupt.py` with the end and shutdown interrupt tests: 10 passed; the new case answers `interrupted: true, pending: true, landed: false`.
- `npm run build` 0; `npm run test:unit` 254 of 254.
- The observation contract's Esc in the installed build waits for the next Substrate Next install (roadmap C3 follows first).

Rubber Duck Pass: `TURN_INTERRUPTED` keeps its payload (`was_interrupted` true, `landed` as observed); no vocabulary change. No observations.
