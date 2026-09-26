# CLI adapter login flow rendered inside Substrate — v2

| Field | Value |
| --- | --- |
| Opened | 2026-09-25 |
| Supersedes | `RESEARCH-2026-09-25-cli-adapter-auth-lifecycle.md` (v1). v1 studied API-key headless auth for CI. That scope was wrong. v1 stays on disk as audit trail; v2 is the correct read. |
| Motivation | When the user picks a CLI driver from Substrate's dropdown that is not authenticated, Substrate must display the CLI's own login flow — the URL, the one-time code, the prompt — inside the transcript, so the user completes login without leaving the app. |
| Scope | The interactive login command each CLI already ships. What it prints, whether the printed URL is stable and clickable, whether the command exits cleanly on success and failure. And the logout command for the "log out then log back in" test loop. |
| Later | A separate dropdown section will let the user paste an API key directly. That is future scope, not present scope. This document covers the login-command path only. |
| Verified against | Live invocations on peterlaffey@2026-09-25. Every quoted string came off a real run. |

---

## 1. The mechanism

Substrate spawns the CLI's own login command inside a pseudo-terminal. The pty's stdout streams into a new transcript card. The user's keystrokes on the card go back to the pty's stdin. The card closes when the CLI process exits. If the CLI's flow needs a browser (OAuth callback or device-code confirmation), Substrate does nothing special — the CLI already opens `~/.local/bin/open` (or platform equivalent), which routes to the OS's default browser outside Substrate. The URL is also visible in the card's text, so the user can copy it if the auto-open fails.

The card follows the shape the tool-card renderer already uses. One row kind — `AuthPromptCard` — with fields `{cli_name, live_stdout, live_stderr, is_running, exit_code}`.

No API keys anywhere in this path. The CLI's own OAuth or device-code flow is the source of authentication; Substrate is a transport for the CLI's prompt text.

---

## 2. Per-CLI login flow (verified on this box)

### 2.1 claude

**Login command.** `claude auth login`
- Default: `--claudeai` — browser OAuth against a Claude subscription account.
- `--console` — browser OAuth against an Anthropic Console account (API-billed).
- `--sso` — enterprise SSO.
- `--email <addr>` — pre-populates the email field.

**Logout.** `claude auth logout` — programmatic, clean exit.

**Status probe.** `claude auth status` — returns JSON. Live on this box: `{"loggedIn": true, "authMethod": "claude.ai", ...}`. Substrate can invoke this to detect authed state before spawning login.

**Cred storage.** `~/.claude/daemon-auth-status.json`.

**Substrate render fit.** Full. The login command prints its status to stdout as it walks the OAuth handshake. Not probed live because claude is currently authed on this box; deferring the live capture until a fresh login is warranted.

### 2.2 codex

**Login commands.**
- `codex login` — opens a local server on `http://localhost:1455`, opens the browser, waits for callback.
- `codex login --device-auth` — device-code flow. No local server. Best for the Substrate transcript.

**Live stdout captured on this box, `codex login`:**
```
Starting local login server on http://localhost:1455.
If your browser did not open, navigate to this URL to authenticate:

https://auth.openai.com/oauth/authorize?response_type=code&client_id=app_EMoamEEZ73f0CkXaXp7hrann&redirect_uri=http%3A%2F%2Flocalhost%3A1455%2Fauth%2Fcallback&code_challenge=…&scope=openid+profile+email+offline_access+api.connectors.read+api.connectors.invoke&…

On a remote or headless machine? Use `codex login --device-auth` instead.
```

**Live stdout captured on this box, `codex login --device-auth`:**
```
Welcome to Codex [v0.157.0]
OpenAI's command-line coding agent

Follow these steps to sign in with ChatGPT using device code authorization:

1. Open this link in your browser and sign in to your account
   https://auth.openai.com/codex/device

2. Enter this one-time code (expires in 15 minutes)
   Y5B1-8EZOH

Continue only if you started this login in Codex. If a website or another person gave you this code, cancel.
```

Both flows print the URL as a bare string that a URL-detecting renderer can turn into a click. `--device-auth` also prints a short one-time code — Substrate can render that as a copy-to-clipboard chip.

**Logout.** `codex logout` — programmatic.

**Status probe.** `codex login status` — one-line human-readable output. Live: `Not logged in`.

**Substrate render fit.** Full. `--device-auth` is the preferred flow for the transcript card — no local port needed, works when Substrate is in an Electron sandbox that can't bind ports.

### 2.3 aider

Aider has no login command and no stored credential state. Every invocation takes credentials via env or `--api-key PROVIDER=KEY`. Since this document's scope is login flows and aider does not participate, aider is excluded from Sprint 085's card rendering. The dropdown's future API-key section covers aider's real path.

### 2.4 cursor-agent

**Login command.** `cursor-agent login`. `NO_OPEN_BROWSER=1` disables the auto-open of the URL; the URL still prints to stdout.

**Live stdout captured on this box, `NO_OPEN_BROWSER=1 cursor-agent login`:**
```
Starting login process...
Authenticating with Cursor...
Waiting for browser authentication...
Open a browser and navigate to this link: https://cursor.com/loginDeepControl?challenge=trOSqd6vPL8_Ht9F9h5VyYvtKNK4gWmlt6VTy9Uxak4&uuid=660a1004-b903-486d-9a6b-217e595b7556&mode=login&redirectTarget=cli&supportsSelectedTeamLogin=true
```

Clean. Four lines. URL on the fourth line, ready for a URL-detecting renderer.

**Logout.** `cursor-agent logout` — programmatic.

**Cred storage.** `~/.cursor-agent/cli-config.json`.

**Substrate render fit.** Full. Substrate should set `NO_OPEN_BROWSER=1` in the pty environment so the URL always appears in the card text (the OS browser is the OS's job; the auto-open Cursor tries is not necessary when the URL is right there in the transcript).

### 2.5 opencode

**Login command.** `opencode auth login [-p provider]`. Prompt-driven walk.

**Live probe on this box.** `opencode auth login -p ollama` returned `Error: Unknown provider "ollama"` — opencode's registered provider set does not include Ollama by that name, which matches the observation that local Ollama needs no auth walk at all (opencode dispatches to it via the local HTTP endpoint without any stored credential). The full provider list surfaces via the bare `opencode auth login` walk; capture deferred until first real login.

**Logout.** `opencode auth logout <provider>` — per-provider, programmatic.

**Status probe.** `opencode auth list` — enumerates configured providers. Live: `0 credentials`.

**Cred storage.** `~/.local/share/opencode/auth.json` — one file, all providers.

**Substrate render fit.** Full for the prompt-driven walk (pty renders the prompts, user's keystrokes go back). Ollama needs no walk.

---

## 3. Shape of Sprint 085

**Catalog change.** `KNOWN_CLI_ADAPTERS` in `server.py` grows from `{name: [cmd, flag]}` to `{name: {command, login_command, logout_command, status_command}}` — every field verified in §2.

**Detection.** Substrate probes `<status_command>` when the user picks a driver. Authed → open the session as today. Not authed → open an `AuthPromptCard` in the transcript.

**AuthPromptCard.** New card kind in the transcript renderer. Spawns `<login_command>` in a pty. Streams stdout+stderr into the card. Wires the URL-detecting text renderer so the auth URL becomes a click. Forwards user keystrokes to the pty stdin. Closes when the process exits. On exit code 0, re-probes status and re-opens the session automatically. On non-zero, leaves the card in place with the error text and a retry affordance.

**Logout affordance.** A "log out" menu item on each authed CLI in the dropdown. Spawns `<logout_command>` and re-probes.

**Shakeout coverage.** `cli_discovery.ts` gains a `logout/login` sub-loop when `SHAKEOUT_CLI_LOGIN=1` is set, so a CI box can prove the full loop end-to-end. Off by default; the developer's own auth is not touched.

**Files in scope.** `server.py` (catalog, endpoints for status/login/logout PTY streams), `web/reveal_component.ts` (AuthPromptCard renderer), `web/reveal.html` (card template), `harness/shakeout/cli_discovery.ts` (opt-in loop). Under the four-file cap of sdd-kit-2 hard rule 6.

---

## 4. What still needs live capture

- **`claude auth login` stdout.** Deferred — the current auth on this box is load-bearing for Peter's daily work.
- **`opencode auth login` full walk.** Deferred until the first non-Ollama provider is added.
- **`cursor-agent login` success-callback stdout.** The captured output stops at "Waiting for browser authentication…" because the probe was time-bounded. Substrate will observe the full sequence in real use; the render is unaffected.

Each is a one-command probe when the moment comes; none blocks Sprint 085's design.

---

## 5. Future scope — API-key section

A second dropdown section will let the user paste an API key directly, per CLI or per provider. That section covers aider and every provider under opencode that opencode itself skips. Distinct from Sprint 085. Named here so the design of Sprint 085 leaves room for it (the AuthPromptCard is one row kind; a KeyEntryCard will be another; the dropdown's sections are the visible surface where the two live side by side).

---

*End of document.*
