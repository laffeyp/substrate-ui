# Sprint 116 — An answer reaches the next prompt once

```yaml
---
id: 116
status: closed
opened_at: 2026-10-09
closed_at: 2026-10-09
phase: 1
pass_kind: functional
---
```

## why

On session `s_6aa52a8f0e3b436c8092fd21` (driver `claude`, 2026-10-09) the model reported that every earlier reply in its transcript appeared twice, once as MODEL and once as FINAL. A plain-text reply writes a `ModelReply` and a `FinalAnswer` with the same text, and `_render` (`substrate/src/substrate/topologies/session/transcript.py`) wrote a line for each. Every past answer cost its tokens twice in each prompt.

## scope

- `_render` keeps the turn's last `ModelReply` text and skips a `FinalAnswer` line with the same text. A `FinalAnswer` that differs (pulled out of a structured reply) still renders.

## signal contract

### Emits

None new; the record is unchanged. Only the prompt string changes.

### Invariants

- No envelope kind, payload or locked vocabulary changes.

## artifact contract

### Files modified

- `substrate/src/substrate/topologies/session/transcript.py`

### Files created

- `substrate/tests/test_transcript_final_once_116.py`

### Command exit codes

- The new test returns 0, and non-zero before the change.
- Kernel fast suite, ruff, format, mypy --strict, lint-imports return 0; UI suite returns 0.

## observation contract

### Driving steps

- The test renders a turn with a plain reply and asserts its text appears once; a turn whose FinalAnswer differs from its ModelReply keeps the `FINAL:` line.

## done criteria

A plain answer appears once in the next prompt.

## result

- `_render` keeps the turn's last ModelReply text and skips a FinalAnswer line that repeats it; a differing FinalAnswer keeps its `FINAL:` line. No other code reads `FINAL:` lines.
- Red before: the plain-answer test rendered `MODEL: hi there` and `FINAL: hi there`.
- Gates: kernel ruff, format, mypy --strict (138 files), lint-imports clean; UI 215 passed. Kernel fast suite 1,329 passed, 1 failed: `test_realmodel_background_bash_103` (a real Ollama model) fails under full-suite load and passes alone (8.1 s), as recorded before this sprint.
