# Sprint 497 — A session's workspace can stay a plain folder

```yaml
---
id: 497
status: closed
phase: continuing a session (roadmap 2026-11-12-continue-a-session r2, E7)
pass_kind: functional
---
```

## scope

`POST /api/session` takes `make_repository` (bool, default true) and passes it to the kernel's `create` (K349). `false` leaves a workspace that is not inside a repository a plain folder, for the folder holding `substrate/` and `substrate-ui/`. A non-bool is a 400 and no session. One verifiable property: a session created with `make_repository: false` in a folder of repositories runs a turn, and the folder has no `.git`.

## prerequisites

- Kernel sprint 349.

## context_files

- `server.py` (`_session_create`)
- `../substrate/src/substrate/topologies/session_registry.py` (`create`)

## signal contract

### Emits

No new tag. `SESSION_CREATED` as before (`workspace_shape` `flat`); a bad value writes `API_REFUSED`.

### Invariants

- A create without `make_repository` does what it did.

## artifact contract

### Files modified

- `server.py`

### Files created

- `tests/test_plain_folder_497.py`

### Command exit codes

- `uv run --project ../substrate python -m pytest tests/test_plain_folder_497.py` returns 0.

## observation contract

Through the route: create with `make_repository: false` in a folder holding a repository, run one turn, read the folder: no `.git`, the same entries.

## done criteria

A session can be opened on a folder of repositories without making it one.

## self-review checklist

- [x] Scope is concrete and bounded.
- [x] One source file.
- [x] No tag change.
- [x] Artifact contract is gradable.
- [x] Observation contract present.

## close

- `tests/test_plain_folder_497.py`: 3 passed (plain folder kept through a turn; default still a repository; a non-bool refused). With sprint 494's: 11 passed. Every server test file that creates a session: 291 passed, 5 skipped. ruff clean; mypy clean.
- Mutant (the route not passing the option): 1 of 3 fails.

Rubber Duck Pass: no events change. No observations.
