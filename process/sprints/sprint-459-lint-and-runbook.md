# Sprint 459 — the build's lint steps pass, and the runbook names files that exist

```yaml
---
id: 459
status: closed
phase: code editor (roadmap r13), before E10.5
pass_kind: docs
---
```

## scope

A read of `RUNBOOK-2026-10-29-project-r6.md` on 2026-11-11 found two gaps. Under the Architect's rule that a gap found is fixed before the roadmap moves on, this sprint closes both:

1. **Lint.** The runbook's build steps 1 and 2 fail on today's tree. `ruff check .` reports 21 errors, all S101 in `process/planning/2026-11-09-code-editor/superseded/kernel-k345-set-aside/test_session_opened_k345.py`, a kernel test set aside in a planning folder and never run. `ruff format --check .` would reformat `server.py` and 11 tests written since the runbook's last check. `ruff.toml` excludes `process/` as it excludes `_deprecated/`, and `ruff format` formats the 12 files. The formatter writes the layout; no line is edited by hand.
2. **The runbook and the README.** Both name `electron/main.js` and `web/reveal_component.ts`, which no longer exist (Electron main is `electron/main.ts` since sprint 363; the window is `web/app/` since the move to React, sprints 199–345). The runbook's open folders, its known failures (dated 2026-10-29) and its startup list are out of date: `vm_smoke` now passes (12 of 12), and the index marks six folders open. A round 7 of the runbook replaces round 6, which goes to `process/archive/`. The README's install and architecture lines are corrected in place (a ground file).

One concept: the repo's own instructions match the repo.

## prerequisites

- none

## context_files

- `../sdd-kit-3/AGENTS.md`; `../sdd-kit-3/templates/SPRINT_CARD.md`
- `RUNBOOK-2026-10-29-project-r6.md`; `README.md`; `WORKING_AGREEMENT.md` (Documents: ground files; the canonical home registry; build commands)
- `ruff.toml`; `process/planning/README.md`
- `BLACKBOARD.md` decision entries; its tail

## signal contract

### Emits

None. No code path changes: the formatter changes layout only, and the docs change no behaviour.

### Consumes

- The tree as it stands at commit `55d9eff`.

### Invariants

- The vocabulary is not modified.
- `server.py`'s behaviour is unchanged: its tests, mypy and the signal parity check pass after the format.

## artifact contract

### Files created

- `RUNBOOK-2026-11-11-project-r7.md`
- `process/archive/RUNBOOK-2026-10-29-project-r6.md` (moved from the root)

### Files modified

- `ruff.toml` (`extend-exclude` gains `process`)
- `server.py` and 11 files under `tests/` (by `ruff format` only)
- `README.md` (install line, the runbook's name, the architecture table)

### Content assertions

- `ruff.toml` contains `extend-exclude = ["_deprecated", "process"]`.
- `RUNBOOK-2026-11-11-project-r7.md` names `electron/main.ts` and `web/app/`, never `electron/main.js`, and `reveal_component.ts` only in its change note, as gone.
- `README.md` contains neither `electron/main.js` nor `reveal_component.ts`, and names `RUNBOOK-2026-11-11-project-r7.md`.

### Command exit codes

- `uv run --project ../substrate ruff check .` returns 0
- `uv run --project ../substrate ruff format --check .` returns 0
- `npm run test:py` returns 0
- `npm run build` returns 0 (includes mypy on `server.py`)
- `npm run test:unit` returns 0
- `npx tsx harness/vm_smoke.ts` returns 0

## observation contract

Not required for `pass_kind: docs`. The format of `server.py` is checked by its tests over HTTP (`npm run test:py`), not by a gate.

## done criteria

The runbook's build steps 1 and 2 pass, and every file the runbook and the README name exists.

## notes

Steps 11–16 of the runbook's no-Apple chapter (the Axis A and C shakeouts, the lifecycle gates and three single gates against the bundle) are not rerun here; the full suites run once at E13, the editor's close (`feedback`: targeted tests per card, full suites at the end). The round 7 runbook says so where it lists known failures.

## self-review checklist

- [x] Scope is concrete and bounded: two verifiable properties (steps 1–2 exit 0; every named file exists).
- [x] context_files covers the runbook, the README, the agreement and the ruff config.
- [x] Signal contract: no tags; none needed.
- [x] Artifact contract is gradable: greps and exit codes.
- [x] pass_kind docs: observation contract not required; behaviour checked by `test:py`.
- [ ] ≤2 files: no. The format touches 12 files mechanically, and the docs are 3 files; logged as a bypass (hard rule 10).

## close

Content assertions hold: `ruff.toml` excludes `process`; round 7 names `electron/main.ts` and `web/app/`, never `electron/main.js`; the README names neither gone file and points at round 7. Command exit codes: `ruff check .` 0, `ruff format --check .` 0, `npm run test:py` 0 (386 passed, 5 skipped: the live-driver tests in `test_driver_profile_120.py`, run on demand), `npm run build` 0, `npm run test:unit` 0 (223 of 223), `vm_smoke` 0 (12 of 12). No tag fired; the Rubber Duck Pass has no trace to narrate. Nothing installed: the format changes no behaviour, and the next sprint's build carries it.
