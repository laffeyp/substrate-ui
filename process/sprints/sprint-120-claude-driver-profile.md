# Sprint 120 — The Claude driver profile

```yaml
---
id: 120
status: closed
closed_at: 2026-10-10
phase: 1
pass_kind: functional
roadmap: substrate/process/planning/ROADMAP-2026-10-10-default-guidance.md
asked: 2026-10-10 (Architect)
---
```

## why

`claude -p` loads the operator's CLAUDE.md, hook, style, MCP servers and its own tools (research D3).

## scope

- `KNOWN_CLI_ADAPTERS["claude"]`: `--tools "" --strict-mcp-config --setting-sources ""`, `--system-prompt` as the system flag, env `CLAUDE_CODE_DISABLE_GIT_INSTRUCTIONS=1`.
- `SessionStarted` records the flags.
- Gate: no e-mail pattern or attribution string in Substrate's texts or code; a commit through the Claude driver carries no trailer.

- `slash_commands = true` in the profile, for U123; `--disable-slash-commands` stays off because it blocks `/context`.

## design as built (written before the run, 2026-10-10)

- **The profile is the catalog entry.** `KNOWN_CLI_ADAPTERS["claude"]` gains four fields, each read by name:
  - `isolation_flags`: `--tools ""`, `--strict-mcp-config`, `--setting-sources ""`;
  - `system_flag`: `["--system-prompt"]`;
  - `env`: `{"CLAUDE_CODE_DISABLE_GIT_INSTRUCTIONS": "1"}`;
  - `slash_commands`: `true`, for U123.

  `_cli_command` returns the command, then the isolation flags, then the version pin. `_daemon_driver_resolver` passes `system_flag` and `env` to `CliResponder`. Codex and Cursor get no profile fields until K279.
- **`CliResponder` takes `env`** (kernel). It is merged over the daemon's environment for the subprocess and carried by `at()`.
- **The record names the command.** § P.8: `SessionStarted.driver_command: tuple[str, ...]`, the argv before the system text and prompt, empty for a non-CLI driver. `session_topology(driver_command=…)` passes it through; the daemon fills it from the responder.
- **The gate**, in `substrate-ui/tests/test_driver_profile_120.py`:
  - No e-mail-shaped string and no attribution string (`Co-Authored-By`, `Generated with`, `noreply@anthropic.com`, `noreply@openai.com`) in `substrate/src`, `server.py` or the UI's `web/vm` and `web/reveal`. None exist today.
  - The Claude profile carries every isolation flag and the git-instructions switch.
  - Live, marked real-model: `/context` through the profile's argv lists no memory files, skills, MCP tools or custom agents.
  - Live: in a scratch git repo, the driver is asked to commit through Substrate's `bash` tool, and the commit message has no trailer.

## checks

- A live session's driver quotes no CLAUDE.md, hook, style or skill text.
- The gate passes.

## result

- **Built as designed.**
  - `KNOWN_CLI_ADAPTERS["claude"]` carries `isolation_flags`, `system_flag`, `env` and `slash_commands`.
  - `_cli_command` returns the command, the isolation flags, then the version pin.
  - The resolver passes `system_flag` and `env` to `CliResponder`.
  - `CliResponder` gained `env` and a `command` property; `SessionStarted.driver_command` (§ P.8) reads `command` from the driver.
- **Found and fixed during the run.**
  - **An empty system part let Claude Code's own prompt back in.** `CliResponder` sent its system flag only when there was system text. With none, `claude -p` loaded Claude Code's 2.5k-token system prompt. Measured: `--system-prompt ""` leaves Claude with no system prompt at all, so a CLI with a flag now always sends it. K272's argv test changed with it.
  - **`claude` waited on an open stdin.** `CliResponder` left stdin inherited; under the UI suite `claude` printed "no stdin data received in 3s" and exited 1. Both calls now pass `stdin=DEVNULL`.
  - **Failures printed on stdout were lost.** `claude -p` prints some failures, such as "Not logged in", on stdout with empty stderr, so the error read only `exit 1:`. The error now falls back to stdout.
- **Gate:** `substrate-ui/tests/test_driver_profile_120.py`, 5 tests.
  - No e-mail-shaped string and no attribution string in `substrate/src`, `server.py`, `web/vm` or `web/reveal`.
  - The profile's flags and env.
  - The daemon builds `claude` with them.
  - Live: `/context` through the profile shows 0 tokens, with no memory files, skills, MCP tools, custom agents or system prompt.
  - Live: a real Claude turn through a Substrate session staged and committed a file in a scratch repo with the `bash` tool. The message carries no trailer, and `SessionStarted.driver_command` begins with the five isolation arguments. The UI conftest gives every test a temp `HOME` where `claude` is logged out, so this test sets the real `HOME` for itself.
- **Checks.**
  - Kernel suite: 1,364 passed, 5 named skips, 4 failures, then fixed:
    - the `session` and `daily` records gained `driver_command: []` (not predicted). Regenerated; with ids and times masked, that and K272's `system` are the only changes.
    - `test_realmodel_background_bash_103.py` failed in the run and passed alone (6 s). It is a live-model test; one run is one sample.
  - UI suite: 220 passed. ruff, `mypy --strict` and `tsc` are clean.
- **Installed app.**
  - Rebuilt from the working tree: signed with Developer ID, not notarized, marked VERIFICATION BUILD because the kernel is uncommitted. Installed at `/Applications/Substrate.app`; the previous bundle is in the session scratchpad.
  - All eleven Electron gates pass. `session_prompt_once_across_restart` shows three session-open fragments: role, methodology, tools.
  - Through the installed app's own daemon (port 50977), a `claude` session on `harness` (`s_b7b6b579b72140d3a231843a`) recorded `driver_command` as `claude -p --tools "" --strict-mcp-config --setting-sources "" --model claude-opus-5-5`. Asked whether it saw instructions from a CLAUDE.md file, an output style or a hook, Claude answered "No", naming only the session's prompt and the account context Claude Code attaches itself.
