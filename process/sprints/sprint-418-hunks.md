# Sprint 418 — one file's hunks on the server

```yaml
---
id: 418
status: closed
phase: code editor, the rest (roadmap r8), E2
pass_kind: functional
---
```

## scope

`server.py`: `GET /api/session/<id>/diff?path=<rel>` returns `{base, path, hunks: [{old_start, old_count, new_start, new_count, lines}]}` from `git diff -U0` against the base the workspace read uses (`_diff_base`, shared), with the same scratch index (`_scratch_index`, shared), so a new file reads as all added; outside git, base `none` and no hunks; a path outside the workspace is 400. DIFF_READ gains optional `hunks` (vocabulary v0.31, P-0.31-DIFF-READ-HUNKS). Tests `tests/test_session_hunks_418.py`; gate `harness/shakeout/session_hunks.ts`.

## context_files

- spec r6 §5 ("each hunk vs main"; "+2 −1 vs main"); frame 24a; roadmap r8 E2; review of r7, finding 2
- `server.py` (`_workspace_diff`, `_workspace_target`), `tests/test_session_diff_412.py`
