---
id: 191
status: closed
status_note: commit d4322e1; 206 of 206 tracked source files carry the header
phase: 10
pass_kind: functional
---

# Sprint 191 — SPDX headers on every source file

## scope

Add `SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0` plus a `Copyright (C) 2026 Peter Laffey` line to every source file under `substrate-ui/` outside `node_modules/`, `_deprecated/`, `dist-electron/`, `build/python*/`, `web/dist/`, `.pytest_cache/`, `runs/packaged/`, `captures/`. 217 files in scope today: 71 `.py`, 117 `.ts`, 6 `.tsx`, 6 `.js`, 2 `.mjs`, 3 `.sh`, 12 `.html`. Comment syntax follows the file's language. Shebang lines (`#!...`) and `<!DOCTYPE html>` stay on line 1; the header lands on line 2.

## prerequisites

- none

## context_files

- `../sdd-kit-4/AGENTS.md`
- `../substrate/src/substrate/kernel/runtime.py` (reference header shape)
- `../substrate/scripts/ci_local.sh` (reference header shape with shebang)
- `process/planning/open/ROADMAP-2026-10-28-spdx-headers.md`

## signal contract

### Emits

- none (static edit)

### Invariants

- No committed source file in scope lacks the header after the sprint.
- `tsc`, `eslint`, and `vite build` stay green.
- The pre-commit hook passes.

## artifact contract

### Files created

- `scripts/add_spdx_headers.py` — idempotent inserter.

### Files modified

- 217 source files under scope. The script edits in place.

### Content assertions

- `grep -rL "SPDX-License-Identifier" <in-scope paths>` returns zero lines.
- Every `.py`/`.sh` with a shebang keeps the shebang on line 1; the SPDX line sits on line 2.
- Every `.html` with `<!DOCTYPE html>` keeps the DOCTYPE on line 1; the SPDX line sits on line 2.

### Command exit codes

- `uv run --project ../substrate python scripts/add_spdx_headers.py` returns 0.
- `npm run build` returns 0.
- `uv run --project ../substrate python scripts/add_spdx_headers.py --check` returns 0 after the apply (idempotency gate).

## done criteria

Every in-scope source file carries the two-line header; `npm run build` passes; a second run of the script is a no-op.
