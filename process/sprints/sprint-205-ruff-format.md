---
id: 205
status: closed
phase: fix found before the shell-to-react push
pass_kind: functional
---

# Sprint 205 — the Python files CI's format check rejects

## scope

CI's lint job runs `uvx ruff@0.15.17 format --check .` and has failed on it for the last three pushes to `main` (run 41950688632, 2026-11-05; 40993574882 and 40988717209, 2026-10-30), naming 10 files: `harness/shakeout/fixtures/write_session_shapes.py`, `harness/shakeout/lib/prompt_after_change.py`, `scripts/add_spdx_headers.py`, and seven files under `tests/` (`test_cli_adapter_discovery_133.py`, `test_daemon_uses_standard_121.py`, `test_dellm_slash_122.py`, `test_driver_slash_pass_through_123.py`, `test_language_shift_route_172.py`, `test_run_routes_182.py`, `test_session_patch_fields_parity_162.py`). `ruff format` rewrites them; nothing else changes. One concept, ten files of formatting only, written by the formatter: a recorded exception to hard rule 6's file count.

## artifact contract

- `uvx ruff@0.15.17 format --check .` 0; `uvx ruff@0.15.17 check .` 0.
- `uv run python -m pytest ../substrate-ui/tests -q` (from `../substrate`): 257 passed, 5 skipped, as before.

## result

Closed 2026-11-05. `ruff format` reformatted the 10 files (110 insertions, 39 deletions, whitespace and line breaks only). Format check 0 ("72 files already formatted"); ruff check 0; Python tests 257 passed, 5 skipped.

## Rubber Duck pass

No signals. Observations: none. Disposition: none needed.
