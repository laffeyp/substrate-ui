# Sprint 483 — changes against the branch's own last commit

```yaml
---
id: 483
status: closed
phase: code editor (roadmap r20), E22
pass_kind: functional
---
```

## scope

The Architect, 2026-11-11: "The marks should always use their own branch because that's what Git is … You're changing against whatever branch you're on … Main is just a branch."

`server.py` `_diff_base` compared with main's merge-base, then the default branch's, then HEAD, so a branch's committed work stayed marked until it was merged. It now compares with HEAD, the branch's last commit, on any branch, as `git diff HEAD` does; a commit clears the marks. `no_commit` and `none` are unchanged, and untracked files still count as new (as `git add -N` shows them).

DIFF_READ.base writes `head`, `no_commit` or `none`. `main` and `default_branch` are no longer written (vocabulary v0.66, P-0.66-BASE-HEAD).

One verifiable property: a change committed on the branch is not marked, and an uncommitted one is.

## prerequisites

- 482.

## context_files

- `../sdd-kit-3/AGENTS.md`, `../sdd-kit-3/grammar/PRINCIPLES.md` (the proposal kinds)
- `server.py` (`_diff_base`, `_workspace_diff`, `_workspace_hunks`); `tests/test_session_diff_412.py`, `tests/test_session_hunks_418.py`, `tests/test_hunks_any_encoding_466.py`
- `web/vm/signals/versions/0.65.json` (DIFF_READ); `web/vm/signals/proposals.json`
- the seven gates that compared with main: `editor_centre`, `editor_status`, `session_hunks`, `editor_inspector`, `editor_dots`, `editor_quick_open`, `editor_changes_unsaved`

## signal contract

### Emits

- DIFF_READ (`base` head, no_commit or none).

### Consumes

- git, in the session's workspace.

### Invariants

- The workspace's own git index is never written.

## artifact contract

### Files created

- `web/vm/signals/versions/0.66.json`, `0.66-rationale.md`

### Files modified

- `server.py` (`_diff_base`, `_workspace_diff`'s docstring)
- `tests/test_session_diff_412.py` (a branch lists only its uncommitted changes; a commit clears them), `tests/test_session_hunks_418.py`, `tests/test_hunks_any_encoding_466.py` (base `head`)
- `web/vm/signals/proposals.json`, `current.json` → 0.66, the generated signal files
- the seven gates: each writes its change uncommitted into the session's workspace (the session's worktree is made from HEAD), with `git diff HEAD` as truth and `vs head` as the status text

### Content assertions

- `_diff_base` holds no `merge-base`.

### Command exit codes

- `npm run test:py` returns 0
- `npm run build`, `npm run test:unit`, `npm run signals` return 0

## observation contract

### UI driving steps

The seven gates, from source and on the bundle. `editor_dots` keeps its commit on the branch: `src/menu.ts`, committed, gets no dot; an edit and a new file give two.

### Expected runtime signals

- DIFF_READ base `head`.

## done criteria

The marks, dots and counts show what `git diff HEAD` shows, on any branch.

## notes

The gates had committed their changes on a branch, because the session's workspace is a worktree made from the repository's HEAD. Under this sprint a committed change is no change, so each gate now writes its change into the session's workspace after it exists. The inspector gate's third author, "unattributed", is now a write to disk by neither the session nor the editor.

## self-review checklist

Run 2026-11-11, before the work began.

- [x] Scope is concrete and bounded.
- [x] context_files cover the base, its tests, the vocabulary, the gates.
- [x] The tag's payload change goes through a proposal and a version bump.
- [x] Artifact contract is gradable.
- [x] Observation contract present.
- [x] One product file (`server.py`); the vocabulary, tests and gates follow.

## close

`_diff_base` returns HEAD on any branch (`no_commit` and `none` as before); vocabulary v0.66 (P-0.66-BASE-HEAD).

Server tests: 25 comparison tests pass, and the full suite (`npm run test:py`) passes 423, with 5 live-driver skips. Mutant: the main merge-base put back fails 4 of the 7 tests in `test_session_diff_412.py`, among them "a commit clears the changes".

**Gates.** All seven write their change uncommitted into the session's workspace. On the bundle (build 1794460977, packaged true): `editor_centre`, `editor_status` (`+2 −1 vs head`, `+4 −2 vs head`, both equal to git), `session_hunks` (`head:2 head:1`), `editor_dots` (the branch's committed menu.ts undotted; an edit and a new file, 2 dots), `editor_quick_open`, `editor_changes_unsaved`, `editor_base_colours` 0. `editor_inspector` with kimi-k3:cloud: three authors, matching git and the record.

**Found and fixed on the way: T6, vocabulary v0.67 (P-0.67-TURN-ACK).** `editor_follow` with kimi-k2.7-code:cloud broke invariant T6 on a 13-second turn.

- **Cause.** The window wrote TURN_ACK when `/turn`'s POST returned, and the server returns it at the turn's end (`turn_sync`), so any turn over 10 s broke the rule.
- **Fix.** TURN_ACK is now written when the turn's UserMessage reaches the stream, or when the POST returns if that comes first, once per turn (`session_controller.ts`).
- **Evidence.** `vm_smoke` 12/12; `trace_files` (S8: TURN_ACCEPTED against TURN_ACK) 0; `editor_follow` 0 from source and on the bundle with kimi-k3:cloud, with 4 live edits marked and resolved.

**Two model faults, recorded here, not in the app.**

- kimi-k2.7-code:cloud answered turn 2 by claiming a bash call and an edit it never made: no ToolCall on the record.
- qwen3-coder:480b-cloud is retired: Ollama answers 410 with "retired on July 15, 2026".

The gates use kimi-k3:cloud.

Rubber Duck Pass: DIFF_READ base head throughout; TURN_SUBMITTED, then TURN_ACK when the turn's UserMessage arrives (an order fixed here); no INVARIANT_BROKEN.

Installed: CFBundleVersion 1794460977.
