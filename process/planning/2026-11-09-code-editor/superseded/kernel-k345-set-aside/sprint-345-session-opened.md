# Sprint 345 — An ended session opens again without a message

```yaml
---
id: 345
status: pending
phase: substrate-ui code editor, roadmap r9 E14
pass_kind: functional
depends_on: [340]
plan: ../substrate-ui/process/planning/2026-11-09-code-editor/ROADMAP-2026-11-09-code-editor-r9.md
---
```

## scope

The Architect, 2026-11-09 (substrate-ui BLACKBOARD `user` entries): an ended session restarts when its pane reattaches and when editing starts, as a message restarts it; no file is read-only. Today only a message reopens an ended session (`turn_sync`, the ruling of 2026-09-25), and a view's edit cannot: `append_at_rest` refuses a record that ends in RunFinalised, and a resume on any event but a UserMessage never pauses, since the session topology pauses only on Returned, so the run would finalise as `stuck_quiescent` (`kernel/policies.py`).

This sprint adds one session event and one registry call:

- `SessionOpened(session_id, source)`, source `reattach` (the app came back up and its pane took the session again) or `edit` (a view started editing a file in it): session vocabulary v0.19, § AD.
- The session topology's pause also matches `SessionOpened`, as it matches Returned; `resume_condition` stays `UserMessage`.
- `SessionRegistry.open_session(session_id, source)`: an ended session's record resumes on `SessionOpened` under the per-session lock and pauses at once; the manifest goes to `parked`; the turn index does not advance. A parked, running or interrupted session is returned as it is. The resume steps `turn_sync` and `open_session` share move into one helper, unchanged for `turn_sync`.

A session with no record yet is sprint 346.

## context_files

- `src/substrate/topologies/session_registry.py` (`turn_sync`, `append_event`, `_record_state`, `_scan_record_status`)
- `src/substrate/topologies/session/__init__.py` (the termination at line ~1702; `SessionEndRequested`, `FileWritten`)
- `src/substrate/topologies/session/vocabulary.py`
- `src/substrate/kernel/runtime.py` (`Runtime.resume`, `append_at_rest`), `src/substrate/kernel/policies.py` (`pause_await_input`)
- `process/signals/session-vocabulary.md` (§ AB), `tests/test_append_at_rest_k340.py`
- substrate-ui `process/planning/2026-11-09-code-editor/INVESTIGATION-2026-11-09-editor-and-the-session.md`

## signal contract

Emits (record kinds): `SessionOpened` (new, session vocabulary v0.19); `substrate.TerminationMatched` with decision `pause-await-input` right after it.

## artifact contract

- `session/__init__.py`: `class SessionOpened`; the termination's pause matches it.
- `session/vocabulary.py`: `SESSION_OPENED` in the session kinds; `SessionOpenedSource` (`reattach`, `edit`).
- `session_registry.py`: `def open_session`.
- `process/signals/session-vocabulary.md`: § AD and its status line; `process/signals/proposals.json`: `P-SESSION-OPENED`, ratified.
- `tests/test_session_opened_k345.py`.

Command exit codes: `uv run ruff check src` 0; `uv run ruff format --check src` 0; `uv run mypy src` 0; `uv run python -m pytest tests/test_session_opened_k345.py tests/test_append_at_rest_k340.py` 0, and the session registry's own tests.

## observation contract

Behaviour is the record, read back by the tests:
- A session that took a turn and ended (`SessionEndRequested`, RunFinalised) opens: the record gains `SessionOpened` then `TerminationMatched` pause, on one dense sequence; the manifest reads `parked`; the boot scan reads `parked`; the turn index is the one before the open.
- After the open, `append_event(FileWritten)` appends at rest (the edit the investigation found refused).
- After the open, a turn runs with the next turn index, and the model's prompt holds the earlier turn.
- A parked session is returned unchanged, its record not written.
- Planted fault: the pause's match on `SessionOpened` removed fails the open test (the run finalises `stuck_quiescent` or does not pause).
