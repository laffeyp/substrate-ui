# Sprint 412 — the server reads a session's changes against main

```yaml
---
id: 412
status: closed
phase: code editor, phase 1 (round 6), R5
pass_kind: functional
---
```

## scope

`server.py`: `GET /api/session/<id>/diff` returns `{base, files: [{path, status}]}` for the session's workspace and writes DIFF_READ (session_id, base, files). Base: main's merge-base with HEAD; with no main, `origin/HEAD`'s; with neither, the first commit (the empty tree for a repository with none); `none` outside git. New files count (intent-to-add in a scratch index, as the kernel's `worktree_diff`; the workspace's own index is untouched); ignored files and renames' pairing are left out; paths are relative to the workspace. Refusals go under API_REFUSED area `files`. Tests: `tests/test_session_diff_412.py`, six, on real repositories.

## context_files

- `server.py` (`_session_workspace_root`, `_session_files`, the area table), `../substrate/src/substrate/topologies/workspace.py` (`worktree_diff`, `ensure_repository`), `tests/test_workspace_files_348.py`
- `web/vm/signals/versions/0.29.json` (DIFF_READ)
- Design: spec r6 §5 ("each hunk vs main"), §5.1 ("modified dots from the worktree diff"); D48

## artifact contract

- `uv run --project ../substrate python -m pytest tests/test_session_diff_412.py` 0 (6); `mypy server.py` clean; `ruff check` clean; the file API tests (348, 349, 387) unchanged and passing.
