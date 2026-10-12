# Sprint 159 — An old session's `~` workspace resolves before a turn

```yaml
---
id: 159
status: closed
closed_at: 2026-10-12
phase: 1
pass_kind: functional
asked: 2026-10-12 (Architect, from the installed app: a 14-day-old claude session answers every message with "model_error: FileNotFoundError(2, 'No such file or directory')")
context_files:
  - server.py
---
```

## scope

Session `s_86c1522d…` (claude, `driver_version: opus-4-5`) stores its workspace as the literal `~/.substrate/sandbox`: it was opened before `_resolve_workspace_arg` expanded workspaces at open (lens audit F002, F375). Since UI sprint 114 a CLI driver runs its subprocess in the session's workspace, and `_build_session_topology_from_manifest` passes `manifest.workspace` unexpanded as that `cwd`; `subprocess.run(..., cwd='~/.substrate/sandbox')` raises exactly `FileNotFoundError(2, 'No such file or directory')`. The same raw string reaches the MCP config, the delegate tool's root and the session's tools. Three of the user's manifests hold `~/.substrate/sandbox` (one claude, two kimi-k2; Ollama drivers take no `cwd`, so only the claude one fails at the driver).

After: `_build_session_topology_from_manifest` resolves the workspace once with `_resolve_workspace_arg` (the one rule: `~/.substrate/sandbox` is this daemon's `substrate_home()/sandbox`; any other `~` is the user's home) and every use in the turn reads the resolved path. The manifest on disk is not rewritten; the record never changes.

## signal contract

No controller tags change.

## observation contract

`tests/test_old_tilde_workspace_159.py`: a `claude` manifest whose workspace is `~/.substrate/sandbox`; the turn builder's responder, with a stand-in CLI that prints its working directory, runs and answers `substrate_home()/sandbox`. Red on the current code with the user's exact error.

## checks

- The test red, then green; the UI Python suite.

## result

- **Built** (`server.py` `_build_session_topology_from_manifest`): a manifest workspace starting with `~` is replaced, for this turn, by `_resolve_workspace_arg`'s path (`msgspec.structs.replace`); every use below (the driver's `cwd`, the MCP config, the delegate tool's root, the session tools) reads it. The manifest on disk is unchanged.
- **Test** `tests/test_old_tilde_workspace_159.py`: red on the old code with the user's exact `FileNotFoundError`, green after (the stand-in CLI reports `substrate_home()/sandbox`). `test_app_cli_folder_115` passes; the UI Python suite was 245 passed with only this test failing before the fix.
- **Live, and a mistake.** A copy of `s_86c1522d…` was resumed on the installed app with the real claude CLI. The copy's manifest carries `record_root` as an absolute path into `~/.substrate`, so the throwaway daemon appended to the user's real record: seq 72–124, three test messages ("Reply with the single word ok.") and four `SessionEnded (daemon_shutdown)`. The record is append-only and was not edited. Those events also show the fix: turn 6 (seq 109–117) ran claude `opus-4-5` in the resolved sandbox and it replied "ok"; turns 4 and 5 failed only because the throwaway home had no `sandbox` folder yet. The user's `~/.substrate/sandbox` exists.
- **Found.** A resolved workspace that does not exist fails with the same opaque `FileNotFoundError(2, ...)`, with no path named.
- **Rubber Duck Pass.** No controller tag moved; the record's `ProducerFailed` → `ModelReply` at turn 6 is the observation.
