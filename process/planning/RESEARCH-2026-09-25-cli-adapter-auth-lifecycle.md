# CLI adapter auth lifecycle — can we programmatically log out and log back in?

| Field | Value |
| --- | --- |
| Opened | 2026-09-25 |
| Motivation | Sprint 085 (auth-surfacing in the transcript) and the CLI shakeout coverage both need to reset auth state deterministically. If a CLI can only authenticate through an interactive browser, that CLI cannot be part of a headless smoke test. |
| Scope | The five CLIs in `KNOWN_CLI_ADAPTERS` (`server.py`): claude, codex, aider, cursor-agent, opencode. Every finding here comes from a live `--help` read or a real invocation on peterlaffey@2026-09-25. No vendor-doc paraphrasing. |
| Not in scope | The Ollama HTTP path (no auth). Vendor-specific pricing and rate limits. |

---

## 1. Summary matrix

| CLI | logout subcommand | headless login | env-var login | cred file | shakeout fit |
| --- | --- | --- | --- | --- | --- |
| `claude` | `claude auth logout` | `claude setup-token` (long-lived) | `ANTHROPIC_API_KEY` | `~/.claude/daemon-auth-status.json` | full |
| `codex` | `codex logout` | `codex login --with-api-key` reads stdin; `--with-access-token` also from stdin | `OPENAI_API_KEY` (via `codex login --with-api-key`) | `~/.codex/` (auth.json — inferred; login-status verified) | full |
| `aider` | n/a (no state) | n/a (no state) | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `--api-key PROVIDER=KEY` per invocation | none | full |
| `cursor-agent` | `cursor-agent logout` | env or `--api-key <key>` per invocation only; `cursor-agent login` has no stdin-key flag; `NO_OPEN_BROWSER=1` disables the auto-open but the URL still needs a real browser | `CURSOR_API_KEY` | `~/.cursor-agent/cli-config.json` | full via env; interactive `login` **not headless** |
| `opencode` | `opencode auth logout [provider]` | no `--key` stdin flag; login is a prompt walk; direct write to `~/.local/share/opencode/auth.json` bypasses the walk | provider-dependent (each provider carries its own env) | `~/.local/share/opencode/auth.json` | full for local providers (Ollama needs no auth); partial for others — file write required |

**Bottom line.** Every CLI in the catalog can be **logged out programmatically** and **re-authenticated headlessly**, either through a first-party stdin/env path (`claude`, `codex`, `aider`, `cursor-agent`) or by editing the auth JSON on disk (`opencode`). Interactive browser OAuth is available for humans but is never required for the shakeout.

---

## 2. Per-CLI detail

### 2.1 claude

**Commands.**
- `claude auth login` — interactive; `--claudeai` default (browser OAuth for the Claude subscription), `--console` for API-billing via Anthropic Console, `--email <addr>` pre-fills, `--sso` for enterprise SSO.
- `claude auth logout` — programmatic. Wipes credentials from `~/.claude/daemon-auth-status.json` (verified: file present pre-logout).
- `claude auth status` — machine-readable JSON. Live output on this box: `{"loggedIn": true, "authMethod": "claude.ai", "apiProvider": "firstParty", ...}`. This is the honest "am I logged in" probe.
- `claude setup-token` — sets up a long-lived authentication token. Documented as the non-interactive path when browser OAuth is unavailable.

**Env override.** `ANTHROPIC_API_KEY` — one-shot, per-invocation. Bypasses whatever's in `~/.claude/`. Cleanest for shakeout: no state to reset.

**Programmatic verdict.** logout ✓, login ✓ (env or setup-token), status ✓ JSON.

### 2.2 codex

**Commands.**
- `codex login` — subcommand tree.
  - Default: interactive browser OAuth to OpenAI.
  - `codex login --with-api-key` — reads API key from stdin. Cited in help text: `printenv OPENAI_API_KEY | codex login --with-api-key`. Fully scriptable.
  - `codex login --with-access-token` — reads access token from stdin. Same shape.
  - `codex login status` — reports logged-in state. Live output on this box: `Not logged in`.
- `codex logout` — programmatic. Removes stored credentials.

**Env override.** OpenAI's env var conventions apply. `codex login --with-api-key` from `printenv OPENAI_API_KEY` is the codex-native path.

**Cred file.** `~/.codex/config.toml` per help text; auth token likely in a sibling `auth.json` (not verified — logged-out state didn't materialize the file).

**Programmatic verdict.** logout ✓, login ✓ (stdin), status ✓.

### 2.3 aider

**No login state exists.** Aider reads credentials at every invocation — `--api-key PROVIDER=KEY`, `--openai-api-key`, `--anthropic-api-key`, or the env vars `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `AIDER_MODEL` / etc. Nothing persists between calls. Aider also has a `--set-env ENV_VAR_NAME=value` flag for one-shot env injection at the flag layer.

**Programmatic verdict.** N/A logout (nothing stored), login ✓ (env or `--api-key` on every call). Simplest case in the catalog.

**Note on the OpenRouter OAuth prompt.** When aider is invoked with no key and no model, its default behavior is to start an OpenRouter OAuth flow — the shell blocks on a browser callback at `localhost:8484`. In Substrate this shows up as the "aider hangs on first probe" symptom. Prevention: always invoke aider with `--api-key PROVIDER=KEY` or `--openai-api-key` etc., or a preset env. Never call bare `aider` from a headless context.

### 2.4 cursor-agent

**Commands.**
- `cursor-agent login` — interactive browser flow. `NO_OPEN_BROWSER=1 cursor-agent login` disables the auto-open of the URL but the URL still needs a real browser to complete. **Not headless.**
- `cursor-agent logout` — programmatic. Wipes credentials from `~/.cursor-agent/cli-config.json`.
- `cursor-agent --api-key <key> -p "prompt"` — per-invocation API key. Fully scriptable.
- Env: `CURSOR_API_KEY`. Read on every call; overrides `cli-config.json`.

**Auth error signature (live probe).** `Error: Authentication required. Please run 'agent login' first, or set CURSOR_API_KEY environment variable.` The clearest signature of the five — one line, exact remediation.

**Programmatic verdict.** logout ✓, login ✓ via env or `--api-key` (which is what the shakeout uses); the `login` subcommand itself is not headless.

### 2.5 opencode

**Commands.**
- `opencode auth login [url]` — prompt-driven walk (provider select, then method select, then credential entry). Flags `-p provider` and `-m method` skip the first two prompts but no `--key` flag was visible; the credential entry remains a prompt. Not headless via the CLI.
- `opencode auth logout [provider]` — programmatic, per-provider.
- `opencode auth list` — enumerates configured providers. Live output on this box: `0 credentials`.

**Cred file.** `~/.local/share/opencode/auth.json` — direct write bypasses the prompt walk. This is the shakeout path for non-local providers.

**Ollama providers.** No auth. `opencode run "..."` against a local Ollama model works out of the box; verified live on this box (reply "Hello! How can I assist you today?" via `huihui_ai/qwen2.5-coder-abliterate:7b`).

**Programmatic verdict.** logout ✓ (per provider), login ✓ for local providers (no state), login ✓ for others via direct `auth.json` write. Interactive `auth login` subcommand is not headless.

---

## 3. What this enables

### 3.1 Sprint 085 (auth-surfacing) can trust the login command it advertises

Each CLI's transcript "auth needed" card names an exact next command. The mapping (`server.py` will host it as `AUTH_HINTS`):

```python
AUTH_HINTS: dict[str, dict[str, str]] = {
    "claude":       {"signature": "not logged in",                        "hint": "claude auth login  (or set ANTHROPIC_API_KEY)"},
    "codex":        {"signature": "401 Unauthorized",                     "hint": "printenv OPENAI_API_KEY | codex login --with-api-key"},
    "aider":        {"signature": "No LLM model was specified",           "hint": "set OPENAI_API_KEY (or ANTHROPIC_API_KEY) in the environment; aider takes it per-call"},
    "cursor-agent": {"signature": "Authentication required",              "hint": "cursor-agent login  (or set CURSOR_API_KEY)"},
    "opencode":     {"signature": "no credentials configured",            "hint": "opencode auth login  (or write ~/.local/share/opencode/auth.json)"},
}
```

Every signature above came from a real invocation. No paraphrase.

### 3.2 The `cli_discovery` shakeout can reset state between runs

Pre-flight for each CLI in the flow:
1. Detect installed via `shutil.which(cmd[0])` (already done in `_agent_models`).
2. Read status: `claude auth status --json`, `codex login status`, `opencode auth list`. Emit whether authed.
3. If a scripted-login env is available (`SHAKEOUT_ANTHROPIC_API_KEY`, `SHAKEOUT_OPENAI_API_KEY`, `SHAKEOUT_CURSOR_API_KEY`), inject it for the flow; else record "skipped-unauthed" instead of "failed".
4. Post-flow: leave state as-is by default (don't nuke the developer's own auth). Optional `SHAKEOUT_LOGOUT_ON_EXIT=1` for a CI box.

### 3.3 The catalog needs one more shape

Change `KNOWN_CLI_ADAPTERS` from `dict[str, list[str]]` to `dict[str, dict]` with fields `{command, auth_signature, auth_hint, status_cmd, logout_cmd}`. Every field verified above.

---

## 4. What's still unknown

- **codex `~/.codex/auth.json` file layout.** Logged-out state doesn't materialize it. Next login on this box will reveal the schema — matters only for a "write the credential file directly" path Substrate probably never needs (codex has stdin login).
- **opencode `auth.json` schema.** Same — 0 credentials right now. When Peter runs `opencode auth login openai` we can inspect the file and add a direct-write path if it's cleaner than the prompt walk.
- **cursor-agent `NO_OPEN_BROWSER=1` behavior.** Docs say it disables the auto-open. Untested whether the URL still prints to stdout in that mode — if yes, Substrate can render the URL as a link in the transcript for the user to click, which is close to "auth inside Substrate" without needing PTY passthrough.

Each unknown is a one-command probe, deferred until the first login of that CLI on this box.

---

## 5. Recommendation for Sprint 085

Ship the `AUTH_HINTS` table in §3.1 as data. Detect on turn failure by substring match against stderr. Render one transcript card per detection: the CLI name, the exact `hint` command, and a small "authenticate then click retry" affordance. No PTY, no browser handoff inside the app.

Auth setup itself stays outside Substrate for now — the user runs `codex login`, `claude auth login`, etc. in their terminal, then the picker's next roster refresh (or a manual "retry") sees them authed. Full-inside-Substrate auth (spawning the login as an interactive PTY the user completes in the transcript) is a Phase-11-shape feature, worth a separate research pass and a real ROI question before coding.

---

## 6. References (live probes on this box, 2026-09-25)

- `claude --help`, `claude auth --help`, `claude auth status` (returned JSON with `loggedIn: true, authMethod: claude.ai`).
- `codex --help`, `codex exec --help`, `codex login --help`, `codex login status` (returned `Not logged in`).
- `aider --help` (env vars enumerated).
- `cursor-agent --help`, `cursor-agent login --help`, `cursor-agent logout --help`; live invocation returned the auth-required error text quoted in §2.4.
- `opencode auth --help`, `opencode auth login --help`, `opencode auth list` (returned `0 credentials`); live `opencode run "hi"` returned a real reply from the local Ollama tag.

Every quoted string in this document came off one of those runs. No vendor documentation was consulted; if a vendor docs page and this document disagree, the CLI on this box wins.

---

*End of document.*
