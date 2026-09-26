# Sprint 085a — CLI auth server-side PTY endpoints + status probe

```yaml
---
id: 085a
status: closed
opened_at: 2026-09-25
closed_at: 2026-09-25
closed_by: agent
phase: 9
pass_kind: implementation
---
```

## scope

Server-side plumbing for the auth-in-transcript feature Peter asked
for. The client-side card that consumes these endpoints lands as
Sprint 085b. This half proves the pty transport works end-to-end
against real CLIs on the box before any renderer code touches it.

## deliverables

- `server.py`
  - `KNOWN_CLI_ADAPTERS` widened from `dict[str, list]` to
    `dict[str, dict]` with fields `{command, login_command,
    logout_command, status_command}`. Every value verified live on
    peterlaffey@2026-09-25 (research doc §2). `_cli_command(name)`
    helper unwraps `command` for the existing `CliResponder` sites.
  - `_cli_status(name, timeout=5.0)` — probes the CLI's status_command,
    returns `{authed: bool|None, raw: str, detail?: str}`. Per-CLI
    parse: claude reads its JSON `loggedIn` field; codex checks for
    "Not logged in"; opencode checks for "0 credentials". CLIs
    without a status_command (aider, cursor-agent) return
    `authed: null`.
  - `_cli_pty_start(name)` — `pty.openpty()` + non-blocking master;
    `subprocess.Popen(login_command, stdin=slave, stdout=slave,
    stderr=slave, start_new_session=True)`. Sets `NO_OPEN_BROWSER=1`
    in the child env for cursor-agent. A background drain thread
    reads the master fd into a rolling `bytearray` capped at 512 KB.
    Returns a session id.
  - `_cli_pty_write(sid, data)` — writes bytes to the master fd
    (user keystrokes routed back to the pty).
  - `_cli_pty_close(sid)` — `os.killpg(getpgid(pid), SIGTERM)`,
    falls back to `proc.terminate()`.
  - Six HTTP endpoints:
    - `GET /api/cli/<name>/status` — reads `_cli_status`.
    - `POST /api/cli/<name>/pty/start` — spawns, returns `{sid, cli}`.
    - `GET /api/cli/<name>/pty/stream/<sid>` — SSE. Each `data:` frame
      is base64-encoded raw pty output. On process exit an
      `event: exit` frame with `{exit_code}` closes the stream.
    - `POST /api/cli/<name>/pty/stdin/<sid>` — writes the raw body to
      the pty stdin. Returns `{ok, wrote}`.
    - `POST /api/cli/<name>/pty/close/<sid>` — kills the pty.
    - `POST /api/cli/<name>/logout` — runs `logout_command`, returns
      `{ok, exit_code, stdout, stderr}`.

- `harness/shakeout/cli_discovery.ts` — before driving a turn per
  detected CLI, probe `/api/cli/<name>/status`. `authed:false` →
  skip the turn drive; emit `DRIVER_ROSTER_LOADED` with
  `{driver, skipped: "auth_required"}` and continue. Boxes with
  most CLIs unauthed no longer report false-positive failures.

## exit gates verified

- `npm run typecheck` — 0 errors.
- `npm run lint` — 0 errors.
- `npm run build` — 0 errors. `dist/reveal.html` 43.23 kB gzipped
  (no client-side change this sprint).
- `python3 -c "import ast; ast.parse(open('server.py').read())"` — clean.

## behavior gate — live probes on this box

`/api/cli/<name>/status`:
```
codex    → {"authed":false, "raw":"Not logged in"}
opencode → {"authed":false, "raw":"...0 credentials..."}
claude   → {"authed":true,  "raw":"{loggedIn:true, authMethod:claude.ai, ...}"}
```

`/api/cli/codex/pty/start` → `{"sid":"50e4e1abbe114bd7b3dd6126dfae6f15","cli":"codex"}`.
`GET /api/cli/codex/pty/stream/<sid>` SSE frames decoded to full
`codex login --device-auth` prompt including URL
(`https://auth.openai.com/codex/device`) and one-time code
(`Y6S6-QV3C7`). `POST /api/cli/codex/pty/close/<sid>` → `{"ok":true}`.

## follow-ups

- Sprint 085b — client-side `AuthPromptCard.tsx`, row-dispatch in
  `Row.tsx`, transcript row wiring in `session_controller.ts`.
  Auto-triggers on driver-pick when the server reports
  `authed:false`.
- Future — extend the `SHAKEOUT_LOGIN_LOOP=1` mode to run the full
  logout → status:false → pty/start → pty/close cycle for every
  detected CLI (skips `claude` on this box because its auth is
  load-bearing for the developer).

## notes

The five CLIs on this box are claude/codex/aider/cursor-agent/
opencode. Auth state at close of 085a: claude authed; codex, aider,
cursor-agent, opencode unauthed. Sprint 085b will let the user
authenticate any of those inside Substrate's transcript.
