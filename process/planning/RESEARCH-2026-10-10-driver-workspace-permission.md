# RESEARCH: the workspace permission step Substrate never shows

*2026-10-10.*

**Question.** Codex and cursor-agent fail in the installed app after a successful login. Is there one missing step behind both?

**Answer.** Yes. Each harness CLI asks, per folder, two things before it acts: may it work in this folder (trust), and may it change files there (write). In a terminal it asks the person. Substrate starts the CLI headless in a fresh session folder, nobody is asked, and the CLI's default answer is no. Substrate has a login step for each driver and no permission step.

## What the records show

| Driver | Session | What the record holds |
|---|---|---|
| cursor-agent | `s_96a5fa1e54ca4ba0997f834c` | Both turns end `Returned` with `CliResponder(cursor-agent) exit 1: ⚠ Workspace Trust Required … Do you trust the contents of this directory? /Users/peterlaffey/.substrate/sessions/s_96a5fa1e54ca4ba0997f834c/workspace`. No model reply. |
| codex | `s_a5f8ec2bdd124d4d80cde27f` | Before the `--skip-git-repo-check` fix: `Not inside a trusted directory`. After it: six replies, no `ToolCall`. Codex's own log of the write turn (`~/.codex/sessions/2026/10/10/rollout-2026-10-10T18-07-58-….jsonl`) records `sandbox_policy: {type: read-only}`, `approval_policy: never`, a file-system permission of `access="read"`, and its own `exec` tool failing `printf … > write-test-2026-10-10.md` with `zsh: operation not permitted`. |

## What each CLI's documentation says

| CLI | Trust (may it work here) | Write (may it change files) | Source |
|---|---|---|---|
| Codex 0.157.0 | "Codex requires commands to run inside a Git repository … Override this check with `codex exec --skip-git-repo-check`." | "By default, `codex exec` runs in a read-only sandbox." Edits: `codex exec --sandbox workspace-write`. | [Non-interactive mode](https://learn.chatgpt.com/docs/non-interactive-mode.md) |
| cursor-agent 2026.09.23 | `--trust`: "Trust the current workspace without prompting" (`cursor-agent --help`); headless only. | "Without --force, changes are only proposed, not applied." `--force` / `--yolo` applies them. | [Cursor headless docs](https://cursor.com/docs/cli/headless), `cursor-agent --help` |
| Claude Code 2.1.296 | A `claude -p` run in a plain folder worked today (`/tmp`, and session `s_808d893d2f07475192a0943f`); no trust stop seen. | `claude -p` starts in `default` mode, "Reads only", when it fetches feature flags; `--permission-mode acceptEdits` allows "file edits, and common filesystem commands". | [Permission modes](https://code.claude.com/docs/en/permission-modes.md) |

## What Substrate passes today (`server.py`, `KNOWN_CLI_ADAPTERS`)

- **codex:** `codex exec --skip-git-repo-check`. Trust answered since today's fix; write never answered.
- **cursor-agent:** `cursor-agent -p`. Neither answered.
- **claude:** `claude -p --tools "" --strict-mcp-config --setting-sources ""`. `--tools ""` was added today in U120 and switches off Claude Code's built-in tools, which the operator never asked for. That is a separate regression, listed here so it is not lost.

## Proposal: one permission step, beside login

1. **A profile field per driver,** `workspace_grant`, mapping the two answers to that CLI's own flags:
   - codex: trust `--skip-git-repo-check`, write `--sandbox workspace-write`;
   - cursor-agent: trust `--trust`, write `--force`;
   - claude: write `--permission-mode acceptEdits` (meaningful once its own tools are back on).
2. **The answer belongs to the session.** It is recorded on the manifest at session open, so the record says what the driver was allowed to do.
3. **The user sees it where the login card shows,** on the first turn of a session on a harness driver: "<driver> may work and write in <folder>", with *allow* and *read only*. The folder is the one picked in the workspace bar.
4. **A refusal the CLI still prints** (as cursor-agent's "Workspace Trust Required" does today) shows as that same card, not as a `model_error` line.

Open for the operator: whether *allow* is the default with *read only* as the choice, or the reverse.
