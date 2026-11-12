# Sprint 474 — a file's comparison reads that file, not the whole workspace

```yaml
---
id: 474
status: closed
phase: code editor (roadmap r13), found in use 2026-11-11
pass_kind: functional
---
```

## scope

BLACKBOARD 2026-11-11 `surfaced` entries. `_workspace_hunks` (sprint 418) builds a scratch copy of git's index and runs `git add -A --intent-to-add .` over the whole workspace to compare one file, so that a new file reads as all added: 92 ms on this repository, about a second with 60,000 untracked files, 1–2 s in the Architect's workspace, on every open. The copy (`shutil.copyfile`) also gets a new modification time, which defeats git's racy-clean rule: a file rewritten in the same second as the index, at the same size, shows no hunk (1 run in 3). This sprint compares one file by itself: a file in the base is compared with `git diff <base> -- <path>` against the workspace's own index, read-only; a file not in the base reads as all added (`git diff --no-index` against nothing, through `_decoded_hunks`), unless git ignores it, when it has no hunk; a file not in plain UTF-8 is compared in its decoded text as before (sprint 466). The whole-workspace list of changed files (`_workspace_diff`, the tree's dots) keeps the scratch index, copied with its modification time kept (`shutil.copy2`), so git's racy-clean rule holds there too.

## prerequisites

- 466, 473.

## context_files

- `../sdd-kit-3/AGENTS.md`; `../sdd-kit-3/templates/SPRINT_CARD.md`
- `BLACKBOARD.md`: the entries of 2026-11-11 on the editor broken in use and the missed hunk
- `server.py` `_workspace_hunks`, `_decoded_hunks`, `_scratch_index`, `_workspace_diff`, `_diff_base`, `_git_out`, `_git_bytes`; `tests/test_session_hunks_418.py`, `tests/test_hunks_any_encoding_466.py`
- git-diff(1) (`<commit> -- <path>`, `--no-index`); gitrepository-layout / "racy git" (Documentation/technical/racy-git.txt): an entry whose mtime is not older than the index file's is checked by content

## signal contract

### Emits

No new tag. DIFF_READ as before.

### Consumes

- The file, its base blob, and the workspace's index, read-only.

### Invariants

- A file's hunks are git's own over its text, as before; a new file is all added; an ignored one has none.
- The workspace's own index is never written (test 418).
- No path or text in any payload (E1).

## artifact contract

### Files created

- `tests/test_compare_one_file_474.py`

### Files modified

- `server.py`
- `harness/shakeout/editor_open_speed.ts`: the comparisons bounded, and a same-second, same-size edit's hunk

### Content assertions

- `_workspace_hunks` calls no `_scratch_index`; `_scratch_index` copies with `shutil.copy2`.

### Command exit codes

- `uv run --project ../substrate python -m pytest tests/test_compare_one_file_474.py tests/test_session_hunks_418.py tests/test_hunks_any_encoding_466.py tests/test_session_diff_412.py` returns 0
- ruff, mypy on `server.py` return 0

## observation contract

### UI driving steps

Gate `editor_open_speed.ts`, from source and on the bundle, with its 60,000 untracked files: each per-file comparison lands within 300 ms of its read; c.ts, rewritten at the same size in the second it was committed, shows its hunk card in CHANGES.

### Expected runtime signals

- server.jsonl: DIFF_READ `hunks` 1 for a.ts and c.ts.

## done criteria

Opening a file compares that file only, in milliseconds, and never misses a change.

## notes

Measured before the change: `_workspace_hunks` 914 ms for one file with 60,000 untracked files.

## self-review checklist

Run 2026-11-11, before the work began.

- [x] Scope is concrete and bounded: one verifiable property (one file's comparison reads one file, and sees every change).
- [x] context_files cover the comparison, the index copy, git's racy rule, the tests.
- [x] No tag needed.
- [x] Artifact contract is gradable.
- [x] Observation contract present.
- [x] ≤2 files: `server.py` and its test; the gate's added checks are the observation.

## close

`server.py`: `_workspace_hunks` compares one file with `git diff -U0 <base> -- <path>` against the workspace's own index, read-only, and no scratch index; `_decoded_hunks` reads a file not in the base as all added in any encoding (an ignored one has none); `_scratch_index`, kept for the tree's whole-workspace list, copies the index with `shutil.copy2`.

The missed hunk's cause, measured: the first test ran each comparison in the same second as the edit, and a scratch copy made in that second still counted the entry as racily clean, so the mutant (the old copy) survived it. A loop with a 1.1 s pause between the edit and the comparison, as an editor's read comes later, showed the old copy missing the change in 8 of 8 repositories, in the one file's diff and in the tree's list; `copy2` and the own-index read missed it in 0 of 8. The test now pauses past the second, and the old-copy mutant fails it.

Test `test_compare_one_file_474.py`: the same-second, same-size edit seen in three repositories, in the one file's hunks and in the tree's list; one file's comparison with `_scratch_index` made to raise gives a changed file's hunk, a new file all added, an ignored file none, and leaves the workspace's index unchanged. Gate `editor_open_speed` from source and on the bundle (build 1794446713, packaged true): with 60,000 untracked files each per-file comparison landed in 63–86 ms (before: 1,023–3,805 ms); c.ts's same-second edit shows its card. Mutant: the whole-workspace scratch index rebuilt for one file fails the gate's 300 ms bound.

Command exit codes: tests 474, 418, 466, 412, 471, 19 passed; ruff check and format 0; mypy 0; build 0. Gates on the bundle: `editor_open_speed`, `editor_centre`, `editor_status`, `editor_inspector`, `editor_edit_any_file` 0.

Rubber Duck Pass (the gate's trace, as it reports it). FILE_READ then DIFF_READ for each file, DIFF_READ 63–86 ms later; EDITOR_FILE_SHOWN 13, 8, 1, 1, 1, 8. Observations: none.
