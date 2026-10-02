---
id: 097
status: closed
class: G (Fowler, Continuous Integration "Fix Broken Builds Immediately"; Fowler, Eradicating Non-Determinism in Tests); B (Meszaros, Fresh Fixture)
---

# Sprint 097 — both suites green

## result (2026-10-01)

| suite | before | after |
|---|---|---|
| substrate-ui pytest | 18 failed, 188 passed | **213 passed, 0 failed** |
| kernel fast tier (no live models), `uv run` | 9 failed (after excluding a PATH artifact) | **1,190 passed, 4 skipped, 0 failed**, 4 min 31 s |
| kernel real-model tier | not run in a known state | 31 passed, 4 failed, 4 errors, 11 min 51 s (see open) |
| kernel ruff check / ruff format / mypy | format: 6 files | clean (298 files formatted; mypy 131 files) |
| substrate-ui ruff (CI scope) | 26 errors at HEAD | clean |

## fixed, by cause

- **6 tests read demo records from an untracked folder.** `gen_demo_records.py` wrote to `substrate-ui/runs/`, which the server stopped reading in Sprint 089 (F1). It now writes to `<state root>/runs`, and `tests/conftest.py` generates the records into each test run's own state root (Fresh Fixture).
- **4 tests asserted the pre-ruling ended-session contract** (410 / `SessionEndedMidTurn`). Rewritten to the Architect ruling of 2026-09-25: a turn on an ended session resumes it; the typed failure is for a vanished session.
- **F-API-6 boundary.** `server.py` and `session_registry.py` imported `substrate.bundles` and `substrate.kernel.runtime`. `list_bundles`, `load_bundle`, `find_active_runtime` now exported on `substrate.api`; the UI imports them from there.
- **7 tests asserted superseded contracts:** interrupt caller (tiered `daemon:interrupt-hard`), think default (`_model_supports_thinking`), PATCH deferred field (`bundle` became patchable; `seed` used), bundle default (`session`, sprint 054), `/` serves the reveal shell, models roster (CLIs under `cli`, checked against PATH instead of one machine's installs), SSE frame cap (30 cut off `ModelReply` once the default bundle added frames).
- **Kernel:** `delegate_schema_six_fields` predated sprint 245's `children`; `test_session_end_by_name` read `SessionStatus.ENDED` from the UI module's `Literal`; 14 `read_record` fakes widened for `resolve_blobs=`.
- **Kernel tests leaked into the real `~/.substrate`.** The real-model tier's `no_escape_guard` caught session dirs written to the user's home; 147 session dirs were created there on 2026-10-01 (provenance mixed with the Architect's own use). `substrate/tests/conftest.py` now sets a fresh `SUBSTRATE_HOME` at import; a full fast-tier run left the real session count unchanged (4,520 before and after). Five role-prompt tests that patch `Path.home` clear `SUBSTRATE_HOME` so the state root follows the patch.
- **`server.py` used `Callable` without importing it** (6 annotations). Python 3.14 defers annotations, so it imported; `typing.get_type_hints` raised `NameError`, and the 3.13 runtime the packaged app shipped before Sprint 089 would fail at import. Imported; type hints resolve for all 52 functions. 18 semicolon-joined statements split; unused imports removed. The UI's CI lint gate (`.github/workflows/ci.yml`) covers `server.py` and was red on these.

## open

- **Real-model tier** (live models, 11 min 51 s): `test_instrument_ablation_delta` timed out at 600 s; `test_grep_finds_pattern_in_workspace` (model omitted a required argument); `test_list_records_read_back_by_model` (count 0, expected 2); `test_write_file_absolute_escape_is_rejected` (the tool wrote to an absolute path under the pytest temp dir; whether that is outside the jail needs reading). The 4 errors were the home-directory leak, now fixed. Not re-run after the fix.
- **The coding-gate shells out `mypy` by PATH** (`assay/coding_problems.py`, `coding_flow/gate.py`): 78 tests fail when the venv's bin is not on PATH. Implicit dependency (Twelve-Factor II) — for the whole-project pass.
- **Two near-identical `session_registry.py` modules** (kernel 1,543 lines, UI 1,442) with different `SessionStatus` types — for the whole-project pass.
- **147 session dirs** created in the real `~/.substrate/sessions` on 2026-10-01; mixed provenance; left for the Architect.

- **Closed 2026-10-01.** Real-model tier 41/41 and the coding-gate PATH: `sprint-098a-open-items-closed.md`. The two `session_registry.py` modules: `sprint-099-one-session-registry.md`. The 147 session dirs stay with the Architect.
