# Sprint 450 — the editor's text is not blue in a repository without main

```yaml
---
id: 450
status: closed
phase: code editor (roadmap r13), the diff base (E2)
pass_kind: functional
---
```

## scope

`server.py` `_diff_base` picks the base the editor compares a file with. Today:
- A repository with no commit gets git's empty tree.
- A repository with commits but no `main` and no `origin/HEAD` gets its first commit.

Either way most lines read as added, and the centre paints added lines teal over the syntax colours. In the installed app, workspaces inside a repository with no commit drew every line blue (BLACKBOARD 2026-11-10, the user entry).

After this sprint:
- No commit: base `no_commit`, no hunks, no changed dots.
- Commits but no main or default branch: base `head`, the last commit.
- `main` and `origin/HEAD` behave as before.

Files: `server.py`; `tests/test_session_diff_412.py`; the vocabulary files; gate `editor_base_colours.ts` (new).

Found while closing the sprint, and fixed in it:
- The status line read "vs no_commit". `editor/Centre.tsx` now keeps no base text for `no_commit`, as for `none`, using the generated `DiffReadBase` and no retyped literal.
- The inspector's changes header read a fixed "vs main". `editor/Inspector.tsx` now names the base the status line uses, or "no base".

## context_files

- BLACKBOARD 2026-11-10: the user entry (blue text) and the agent-resolved entry (the base without main).
- `server.py` `_diff_base`, `_workspace_diff`, `_workspace_hunks`, `_EMPTY_TREE`.
- `web/app/editor/Centre.tsx` THEME (`.cm-added`); `tests/test_session_diff_412.py`; vocabulary 0.53 DIFF_READ.
- Design spec r6 §5; D6; git-diff(1).

## signal contract

Vocabulary v0.54, P-0.54-DIFF-BASE: DIFF_READ.base gains `head` and `no_commit`; `first_commit` is retired (no longer written; the note says so).

## artifact contract

- `_diff_base` returns NO_COMMIT for a repository with no commit, and HEAD's commit for one without main or a default branch.
- `_EMPTY_TREE` is gone.
- The 412 tests:
  - a branch `trunk` with two commits and one uncommitted edit lists only the edited file, base `head`;
  - a repository with no commit lists nothing, base `no_commit`.
- Commands: `pytest tests/test_session_diff_412.py tests/test_session_hunks_*.py tests/test_server_signals.py tests/test_signals_generated.py` 0; mypy 0; ruff 0; build 0.

## observation contract

`editor_base_colours`, from source and on the bundle.

Two repositories:
- (a) `git init` with no commit and one file.
- (b) branch `trunk`, one commit, then one line changed.

Opening each file in the editor:
- (a) no `.cm-added` line; the first line's colour is not teal; DIFF_READ base no_commit; no tree dot.
- (b) exactly the changed line is `.cm-added`; DIFF_READ base head.
- A screenshot of each, read beside frame 24a.

## done criteria

A file the person has not changed draws in its syntax colours, never all teal.
