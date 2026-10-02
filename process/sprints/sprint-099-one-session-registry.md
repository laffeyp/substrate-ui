---
id: 099
status: closed
class: A (DRY / single source of truth; Seemann, composition root) and the dependency rule (UI depends on the kernel, never the reverse)
---

# Sprint 099 — one session registry

## why

Two `session_registry.py` files existed: the kernel's (`substrate/src/substrate/session_registry.py`, 1,543 lines) and a private copy in substrate-ui (1,442 lines). A diff on 2026-10-01 found 33 hunks of drift:

- The UI copy let an ended session take another turn (Architect ruling 2026-09-25); the kernel copy still raised `SessionEndedMidTurn`.
- The UI copy accepted `driver_version` (UI sprint 087c); the kernel rejected it as an unknown key.
- The UI copy derived turn indexes lazily (sprint 094, 7.1 s → 0.79 s boot); the kernel read every record at boot.
- The kernel's `delegate.py` caught the kernel's `SessionEndedMidTurn`, but the daemon passed it a UI registry that raised the UI's class of the same name. The `except` could never match.
- The kernel's `pair_coding_composite.py` imported the bare `session_registry` module, which only resolved when substrate-ui happened to be on `sys.path`: a kernel module depending on the app.

## done

- Kernel `session_registry.py` takes the three UI behaviours: ended → parked under the turn lock (once, inside the lock; the UI copy also flipped it outside), `DriverParamKey.DRIVER_VERSION` (`str`), lazy `next_turn_index`.
- `substrate.api` exports the ten registry names through a PEP 562 module `__getattr__`. An eager import cycles: `session_registry` imports `api`, so whichever module loaded first saw the other half-initialised (reproduced, `ImportError` on `from substrate.session_registry import ...` run first). A `TYPE_CHECKING` import keeps mypy's view typed.
- substrate-ui `server.py` and `session_errors.py` import from `substrate.api` (the sanctioned surface `test_ui_imports_only_sanctioned_substrate_surfaces` enforces). 40 UI test files and 4 kernel CLI tests import `substrate.session_registry`; `STATUS_*` constants became `SessionStatus` members.
- The UI copy moved to `_deprecated/session_registry-ui-copy-2026-10-01.py`; `electron-builder.config.js` and `packaged_app_smoke.ts` no longer list it. The kernel `pyproject.toml` mypy override for a bare `session_registry` module came out.
- The kernel's `SessionManifest.seed` `DeprecationWarning` claimed seed had no consumer. `render_transcript` puts the seed in every session prompt (`transcript.py` `_render`), and `pair_coding_composite` writes the builder's instructions there. The warning came out; `test_seed_reaches_the_model_prompt` pins the consumer.
- Tried and reverted: each session prompt carries the current user message twice, once in the `PromptComposed` text (the `user_message` fragment, ahead of the transcript) and once as the transcript's last `USER:` line. Dropping the transcript copy made `test_inspect_record_summary_read_back_by_model` fail 2 of 2 runs (`qwen2.5:7b-instruct`, temperature 0, dropped 14 characters from a 128-character path); restoring it passed 2 of 2. The trailing copy is the only one after the history, next to where the model generates. The change came out whole.
- `inspect_record` on a path with no record returned `ok: true, total_events: 0, finalised: false`; a model that mistyped a path then reported a finished record as unfinished. It now raises `no record at <path>` for every format (`test_missing_record_is_an_error_not_an_empty_record`, 4 formats × 2 paths). The realmodel test judges the first successful `inspect_record` result.
- `code_review` judge: it called the model, discarded the reply, and decided from severity, which is `sum(bytes) % 5 + 1` of the critique text, so a walkthrough verdict was a hash. The judge prompt now asks for a closing verdict word and `_decision_in` reads it; the severity rule decides only when no model ran or the reply names none (`test_judge_decision_comes_from_the_model_reply`, 3 cases). Committed CI records for `code_review` and `fanout_review` regenerated (the judge prompt's token count changed); the other 16 kept their committed bytes.
- Token caps that loud truncation (sprint 097) turned into failures: `reference/walkthrough.py` 12/16/24 → 64 and 160 → 1024; `test_realmodel_demos.py` eight caps (12–160) → 64/256/1024. The code_review judge failed at its 40-token cap in the realmodel run.

## checks

`tests/test_session_registry_consolidated_099.py` (kernel): seed reaches the prompt; ended session takes a turn and the parked status is on disk; `driver_version` accepted, a bool rejected; boot scan reads no record, first `next_turn_index` reads one; `api` and the module export identical objects.

Kernel: `test_missing_record_is_an_error_not_an_empty_record` (8 cases), `test_judge_decision_comes_from_the_model_reply` (3 cases).

All tiers, 2026-10-01, after the last code change:

- kernel fast (`-m "not realmodel and not swebench_harness"`): 1,203 passed, 3 skipped. Two skips are by design (`swebench_repair` has non-deterministic producers; the throughput floor is opt-in); the floor passes with `SUBSTRATE_PERF_GATE=1` (2 passed).
- substrate-ui: 214 passed.
- realmodel: 41/41. swebench_harness with `SWEBENCH_HARNESS_ENABLE=1`: 2/2 (Docker, 73 s).
- ruff, ruff format, mypy (131 files), lint-imports (1 contract kept); UI ruff (new `ruff.toml` excludes `_deprecated/`), eslint, tsc, `gen_kinds --check`, `npm run build`.
- Signed verification bundle from a wheel of the final source (`SUBSTRATE_WHEEL`, notarization off): `codesign --verify --deep --strict` before and after the gates; lifecycle gates 9/9; packaged smoke ok on `kimi-k2.7-code:cloud` (window 0.94 s, prompt 1.29 s, turn parked 3.57 s, backend gone 0.83 s after quit); Axis-A shakeout 17/17 flows, 81 tags green, 0 bugs. `ruff format` later rewrote whitespace in `session_registry.py` and `walkthrough.py`; their ASTs match the wheel's copies.

