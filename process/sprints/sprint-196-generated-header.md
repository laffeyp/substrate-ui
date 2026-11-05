---
id: 196
status: closed
phase: fix found by the shell-to-react baseline (sprint 195)
pass_kind: functional
---

# Sprint 196 — the generator writes the SPDX header

## scope

`scripts/gen_kinds.py` writes the four `web/vm/*.gen.ts` files without the SPDX header that sprint 191 (`d4322e1`) added to them, so `gen_kinds.py --check` (run by CI) and four tests in `tests/test_envelope_kinds_generated_096.py` read every file as stale. The generator puts the same two header lines first in each file. The generated files do not change.

## artifact contract

- Modified: `scripts/gen_kinds.py` (an `SPDX_HEADER` list, spread first into each of the four writers).
- `uv run --project ../substrate python scripts/gen_kinds.py --check` returns 0.
- `pytest tests/test_envelope_kinds_generated_096.py` returns 0.
- `git diff web/vm/` is empty after regeneration.
- `ruff check` and `ruff format --check` on the script return 0.

## signal contract

None: a build script; no app signals.

## result

Closed 2026-11-04. `--check` exit 0; 5 passed; `web/vm/` unchanged; ruff clean. CI's generated-file step passes again, red since 2026-10-27.

## Rubber Duck pass

No signals. One observation: sprint 191 edited generated files without their generator, a copy of one fact in two places (the header in the file and none in its writer); resolved here.
