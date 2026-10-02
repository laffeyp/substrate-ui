---
id: 093
status: closed
phase: 10
pass_kind: architecture
class: A + B (ROADMAP-2026-10-01-engineering-practice-classes.md)
---

# Sprint 093 — state root resolved at use time; hermetic tests

## scope

Every substrate-ui path under the state root resolves from `api.substrate_home()` at the moment it is used, never at module import. Import of `server` or `session_registry` writes nothing to disk. The test suite sets `SUBSTRATE_HOME` before any test module imports `server`. A full test run under a throwaway `HOME` leaves `$HOME/.substrate` absent.

Chain (one concept, three links, each ≤2 source files):

- **093a** — `server.py`, `session_registry.py`: replace `RUNS`, `_SESSIONS_BASE`, `_SESSIONS_BASE_DEFAULT` with `_runs_dir()` / `_sessions_base()` and a construction-time default in `SessionRegistry.__init__`; drop the import-time `RUNS.mkdir`; create `runs/` where a record is written.
- **093b** — `tests/conftest.py` + the five test files that monkeypatch `server._SESSIONS_BASE`: set `SUBSTRATE_HOME` at conftest import; tests override with `monkeypatch.setenv`.
- **093c** — `server.py` `_remember_workspace`: refuse temp-directory paths by shape (`$TMPDIR`, `/private/var/folders`, `/tmp`, `/private/tmp`, any `pytest-of-*` component); one-time purge of such rows from the live `recent-workspaces.json`.

## class and source

- Twelve-Factor §III Config: config read from the environment; Seemann, *Composition Root*: compose at the entry point, not at import.
- Meszaros, *xUnit Test Patterns*, Interacting Tests: tests must not share state with each other or with production.

## context_files

- `server.py` lines 515–525, 1492–1610, 1944–1952, 2722–2745, 2924–2930, 3180–3300, 3340–3465
- `session_registry.py` lines 66–74, 250–258
- `tests/conftest.py`, `tests/test_server_session_isolate.py`, `tests/test_server_topology_run_225a.py`, `tests/test_pair_coding_composite_225c.py`, `tests/test_server_topology_status_225d.py`, `tests/test_server.py:348`

## signal contract

Emits: none (no vocabulary tags touched). Invariant: `web/vm/signals/versions/0.1.json` unchanged.

## artifact contract

- `grep -nE "^(RUNS|_SESSIONS_BASE|_SESSIONS_BASE_DEFAULT) *=" server.py session_registry.py` returns nothing.
- `grep -n "substrate_home()" server.py session_registry.py` shows no call at module level (column 0 assignment).
- Test suite under a throwaway `HOME`: failure set identical to the 18 classified on 2026-10-01 (no new failures).

## observation contract

- `env -u SUBSTRATE_HOME HOME=<tmp> python -m pytest tests/` → `<tmp>/.substrate` does not exist afterwards. Baseline before this sprint: 30 session dirs + 1 run record.
- `SUBSTRATE_HOME=<tmp2> python server.py --port 0`, `POST /api/launch?topology=game_of_life` → record lands under `<tmp2>/runs/`.
- After 093c: `_remember_workspace("/private/var/folders/x/T/pytest-of-u/pytest-1/t0")` leaves `recent-workspaces.json` unchanged; the live file holds 0 pytest rows.

## self-review

- [x] Scope names verifiable properties.
- [x] Chain split; each link ≤2 source files except 093b's mechanical test edits (same concept).
- [x] Observation contract present (behavior-touching: where state is written).
