# Sprint 115 — Every CLI call runs in its own folder

```yaml
---
id: 115
status: closed
opened_at: 2026-10-09
closed_at: 2026-10-09
phase: 1
pass_kind: functional
---
```

## why

Sprint 114 gave a session's CLI driver the session's workspace and left two callers on the server's directory. Both were reported as open; they are the same bug and close here.

1. Delegate. `_default_child_factory` (`substrate/src/substrate/topologies/tool_loop/delegate.py`) runs the child on the responder it is handed. Path 4 (fresh child) hands it the parent's responder, so a `claude` child runs in the parent's workspace, not its own `delegate-runs/d1-cN/workspace`. Path 2 (`model=`) hands it `model_resolver(name)`, which the server builds with no workspace, so a `claude` child runs in the server's directory: the kernel repo under the source build, the app bundle under the installed app.
2. Delegate, nested. `_default_child_factory` builds a nested `make_delegate` without `model_resolver`, so a depth-2 `delegate(model="claude")` falls to `_default_model_resolver` and builds `OllamaResponder("claude")`.
3. One-shot applications (`server.py` `_APP_BUILDERS`: code_review, best_of_n_verified, research_sweep) resolve every role with no workspace, so a CLI role runs in the server's directory and reads that repo's files and git state as its project.

## scope

- Kernel: `CliResponder.at(cwd)` returns the same CLI with another directory. `_default_child_factory` creates the child workspace and runs the child on `_in_workspace(responder, workspace_root)`; a CLI responder is rebound there, any other responder is used as is. The nested delegate receives `model_resolver`.
- UI server: an application builder takes the run's folder. code_review's roles run in `repo`; best_of_n_verified and research_sweep roles run in a temp folder the launcher creates per run and removes when the run ends.

## prerequisites

- UI 114 (`CliResponder(cwd=)`; `_daemon_driver_resolver(workspace=)`).

## context_files

- `sdd-kit-2/AGENTS.md`; `substrate-ui/BLACKBOARD.md`
- `substrate/src/substrate/adapters/models.py` (`CliResponder`)
- `substrate/src/substrate/topologies/tool_loop/delegate.py`
- `substrate-ui/server.py` (`_APP_BUILDERS`, `_topology_run`)

## signal contract

### Emits

None new.

### Invariants

- No new envelope kind; the locked UI vocabulary is unchanged.
- A non-CLI responder reaches the child unchanged (same object).
- A cached responder is never mutated: `at()` returns a new instance.

## artifact contract

### Files modified

- `substrate/src/substrate/adapters/models.py`
- `substrate/src/substrate/topologies/tool_loop/delegate.py`
- `substrate-ui/server.py`

### Files created

- `substrate/tests/test_delegate_cli_workspace_115.py`
- `substrate-ui/tests/test_app_cli_folder_115.py`

### Command exit codes

- Both new test files return 0, and non-zero on the code before the change.
- Kernel fast suite, ruff, format, mypy --strict, lint-imports return 0; UI suite returns 0.

## observation contract

### Driving steps

- Kernel: a parent on a pwd-printing CLI delegates (path 4, path 2, and depth 2 with `model=`); each child's reply names its own `delegate-runs/.../workspace`.
- UI: a code_review build's CLI role prints `repo`; a best_of_n_verified build's CLI role prints the run folder, and the folder is gone after the run.
- Live: a `claude` session delegates to a `claude` child asked for its working directory; the answer names the child workspace.

## done criteria

No CLI subprocess the server starts runs in the server's own directory.

## result

- `CliResponder.at(cwd)` returns the same CLI in another directory. `_default_child_factory` creates the child workspace and runs a CLI responder there; a non-CLI responder passes through unchanged. Nested delegates receive `model_resolver`.
- Application builders take the run folder: code_review's roles run in `repo`; best_of_n_verified and research_sweep roles run in a `tempfile.mkdtemp` folder the launcher removes when the run ends (both the blocking and background paths, and on a builder error).
- Red before the change: the fresh child answered with the parent's directory; the `model=` child answered with the kernel repo; `at` and the resolver hand-down did not exist; the app builders took no folder and the best_of_n roles had none.
- Live, with the real `claude -p` driving `delegate` directly: the fresh child answered `.../parent/delegate-runs/d1-c0/workspace`, the `model="claude"` child `.../parent/delegate-runs/d1-c1/workspace`.
- Gates: kernel ruff, format, mypy --strict (138 files), lint-imports clean; kernel fast suite 1,328 passed / 5 skipped; UI 215 passed.
- The live in-app step (a `claude` session choosing to call `delegate`) was replaced by driving the delegate tool directly with the real CLI; the model's choice to delegate is not what this sprint changed.
