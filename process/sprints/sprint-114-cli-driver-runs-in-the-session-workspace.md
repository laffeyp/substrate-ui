# Sprint 114 — A CLI driver runs in the session's workspace

```yaml
---
id: 114
status: closed
opened_at: 2026-10-09
closed_at: 2026-10-09
phase: 1
pass_kind: functional
---
```

## why

A session on a CLI driver (`claude`, `codex`, `cursor-agent`) runs the CLI as a subprocess, and the subprocess starts in the server's working directory, not the session's workspace. `CliResponder.respond` (`substrate/src/substrate/adapters/models.py:452`) and `arespond` (`:472`) pass the command and the prompt and no `cwd`.

Observed 2026-10-08 on session `s_6aa52a8f0e3b436c8092fd21` (driver `claude`, workspace `~/.substrate/sessions/s_6aa52a8f…/workspace`). Asked where it ran, the model named `/Applications/Substrate.app/Contents/Resources` under the installed app, and the `substrate` repo (branch `main`, commit `00b46881`, two uncommitted files) under the source build. The workspace folder is empty. Any file the CLI writes lands in the server's directory: inside the app bundle, or in the kernel repo.

The server caches CLI responders by `(driver, params)` (`server.py` `_daemon_driver_resolver`, F13), so every session on one CLI driver shares one responder. A per-session directory cannot ride on a shared instance.

## scope

- Kernel: `CliResponder(command, *, cwd=None, ...)` starts both subprocesses in `cwd`. `None` keeps today's behaviour for callers with no workspace (assays, the CLI's own model calls).
- UI server: `_daemon_driver_resolver(app, name, params, *, workspace=None)` builds a CLI responder with `cwd=workspace`, and the cache key carries the workspace for the CLI branch. `_build_session_topology_from_manifest` passes `manifest.workspace`. Ollama and deterministic responders ignore it; their cache key is unchanged.

Out of scope, recorded: a delegate child's CLI responder (`model_resolver` in the same factory) and the topology launcher's role resolvers keep the server's directory; a delegate child has its own workspace under the parent's, and wiring it belongs with delegate.

## prerequisites

- UI 111 (the App composition root; `app.responder_cache`).

## context_files

- `sdd-kit-2/AGENTS.md`; `substrate-ui/BLACKBOARD.md`; `substrate-ui/WORKING_AGREEMENT.md`
- `substrate/src/substrate/adapters/models.py` (`CliResponder`)
- `substrate-ui/server.py` (`_daemon_driver_resolver`, `_build_session_topology_from_manifest`)

## signal contract

### Emits

None new. The record is unchanged: `ModelReply`, `FinalAnswer` and `Park` as today.

### Invariants

- No new envelope kind; no change to the locked UI vocabulary (`web/vm/signals/versions/0.1.json`).
- A responder built without a workspace behaves as before (same argv, no `cwd`).

## artifact contract

### Files modified

- `substrate/src/substrate/adapters/models.py`
- `substrate-ui/server.py`

### Files created

- `substrate/tests/test_cli_responder_cwd_114.py`
- `substrate-ui/tests/test_cli_driver_workspace_114.py`

### Content assertions

- `CliResponder.__init__` accepts `cwd`; `subprocess.run(... cwd=...)` and `create_subprocess_exec(... cwd=...)` both pass it.
- `_daemon_driver_resolver` accepts `workspace`; its CLI-branch cache key contains it.

### Command exit codes

- `uv run python -m pytest tests/test_cli_responder_cwd_114.py` (kernel) returns 0, and returns non-zero on HEAD without the change.
- `uv run --project ../substrate python -m pytest tests/` (UI) returns 0.
- Kernel ruff, format, mypy --strict and lint-imports return 0.

## observation contract

### Driving steps

- The kernel test runs a CLI command that prints its working directory, through `respond` and `arespond`, with `cwd` set and unset.
- The UI test builds two sessions on one CLI driver with different workspaces through the server's own factory, and asserts each responder prints its own session's workspace.
- Live: in the app, a `claude` session in the per-session sandbox is asked to run `pwd` and to write a file; the reply names the session workspace, and the file appears in `~/.substrate/sessions/<id>/workspace`.

### Expected runtime signals

- The live turn's `ModelReply` text names `~/.substrate/sessions/<id>/workspace`.

## done criteria

A CLI-driven session's subprocess starts in that session's workspace; two sessions on the same CLI driver run in two different directories; nothing else changes.

## result

- `CliResponder(cwd=...)` starts both subprocesses in the given directory; without one it runs where the caller runs, as before. `_daemon_driver_resolver(..., workspace=)` hands a CLI driver the session's workspace and keys the cache on it; the session factory passes `manifest.workspace`.
- Red before the change: the kernel test failed on HEAD (`cwd` rejected); the server test showed both sessions answering with the server's directory (`substrate-ui`).
- Live, on an isolated server with the real `claude -p`: a per-session-sandbox session asked for its working directory answered `<home>/sessions/s_407ed728d369456f89e23631/workspace`.
- Two test fakes of `_daemon_driver_resolver` took the new keyword.
- Gates: kernel ruff, format, mypy --strict (138 files), lint-imports clean; kernel fast suite 1,324 passed / 5 skipped; UI 213 passed.
- Not covered, as scoped: a delegate child's CLI responder and the topology launcher's role resolvers still start in the server's directory.
