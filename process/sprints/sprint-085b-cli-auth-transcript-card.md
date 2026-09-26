# Sprint 085b — CLI auth transcript card (client)

```yaml
---
id: 085b
status: closed
opened_at: 2026-09-25
closed_at: 2026-09-25
closed_by: agent
phase: 9
pass_kind: implementation
---
```

## scope

The user-visible half of Sprint 085. Picking a CLI driver that
isn't authed opens a live card in the transcript that streams the
CLI's own login command (URL, one-time code, prompts) so the user
completes login without leaving Substrate.

## deliverables

- `web/reveal/transcript/AuthPromptCard.tsx` — new. Takes `cli` as
  prop. On mount:
  - `POST /api/cli/<cli>/pty/start` → `{sid}`.
  - Opens an `EventSource` on `/api/cli/<cli>/pty/stream/<sid>`.
  - Each `data:` frame is base64-decoded and appended to the output
    pane after `stripAnsi` (login CLIs use colour + cursor moves
    freely; the card is not a terminal emulator).
  - URLs (`https?://…`) render as `<a target="_blank" href>` links.
  - `event: exit` flips the card into a done state; auto-reprobes
    `GET /api/cli/<cli>/status` to update the "authenticated" badge.
  - Textarea input `POST`s to `/api/cli/<cli>/pty/stdin/<sid>`.
  - Cancel button `POST`s to `/api/cli/<cli>/pty/close/<sid>`.
  - Retry after exit re-runs the whole start/stream cycle.

- `web/reveal/transcript/Row.tsx` — dispatches on
  `row.role === "system" && row.kind === "AuthPrompt"` to render
  `<AuthPromptCard cli={row.text} />`. `text` carries the CLI name.

- `web/vm/session_controller.ts`
  - `pickDriver(name)` — after emitting `DRIVER_PICKED`, look up the
    driver in `driverGroups.cli`. If it belongs there, fire
    `maybeOpenAuthPrompt(name)`.
  - `maybeOpenAuthPrompt(cli)` — fire-and-forget `GET /api/cli/<cli>/status`.
    `authed:false` → `openAuthPrompt(cli)`; other outcomes leave the
    transcript alone.
  - `openAuthPrompt(cli)` — appends a transcript row
    `{seq: -now-7, kind: "AuthPrompt", role: "system", text: cli}`.
    Negative seq keeps the card above any envelope rows.

- `server.py` — one bugfix uncovered while wiring the card:
  `_agent_models` still called `cmd[0]` on the widened dict entries
  (Sprint 085a widened `KNOWN_CLI_ADAPTERS[<name>]` from a list to a
  `{command, ...}` dict). `_agent_models` now iterates
  `for name, entry in ...` and reads `entry.get("command")`. `/api/models`
  restored — the roster returns the three groups again.

## exit gates

- `npm run typecheck` — 0.
- `npm run lint` — 0.
- `npm run build` — 0. `dist/reveal.html` 43.23 kB gzipped (unchanged);
  JS bundle 15.16 kB gzipped (+1.4 kB over Sprint 085a for
  `AuthPromptCard`).
- Server parses.

## behavior gate — live on this box

Fresh Electron under Playwright:
- `loadDriverRoster()` → `driverGroups` has three sections (`cli
  agents`, `ollama · cloud`, `ollama · local`).
- `pickDriver("codex")` → transcript grows a row
  `{kind:"AuthPrompt", role:"system", text:"codex"}`.
- Within 5.5s the card is in the DOM. Assertions all true:
  `hasLoginBadge`, `hasCliLabel: "codex"`, `hasDeviceUrl:
  "auth.openai.com/codex/device"`, `hasCodePattern: /[A-Z0-9]{4}-[A-Z0-9]{4,5}/`.
- Screenshot at `/tmp/sprint-085b-authcard.png` shows the card with
  codex's welcome, the numbered instructions, the clickable URL,
  the one-time code `Y73D-W0ACQ`, the input textarea, and cancel.

## rubber duck pass

*Sequence narration.* Roster GET returns groups. UI renders sectioned
dropdown. User clicks `codex`. `pickDriver("codex")` fires;
`DRIVER_PICKED` emits. `maybeOpenAuthPrompt` probes `/api/cli/codex/status`
→ `{authed:false}`. `openAuthPrompt("codex")` appends the AuthPrompt
row. Transcript component re-renders. `Row.tsx` dispatches to
`AuthPromptCard`. Card `useEffect` fires `pty/start`; server spawns
`codex login --device-auth` in a pty, returns `{sid}`. Card opens
`EventSource` on `pty/stream/<sid>`. Server drain thread reads pty
stdout into a rolling buffer; SSE emits base64 frames. Card decodes,
`stripAnsi`, appends to state. React renders the login prompt with
URL linkified. User clicks the URL → OS browser opens OpenAI's
device page → completes auth → codex process exits. Server emits
`event: exit` → card flips to "authenticated" badge → session is
now openable on the codex driver.

*Observations, six.* Missing pair — none. Order violation — none.
Vocabulary gap — none (`signals/0.1.json` untouched; "AuthPrompt"
is a transcript-row kind alongside SlashHelp/SlashUnknown/Interrupted).
Payload anomaly — none. Timing surprise — the card takes ~4-5s to
show output because codex's OAuth server startup is slow; that's
codex, not Substrate. Tone trace — card labels lowercase, plain
register ("login inside substrate", "waiting", "authenticated").

*Dispositions.* Clean. Zero halted.

## follow-ups

- **Log-out affordance.** The dropdown could carry a "log out"
  chip on each authed CLI that calls `POST /api/cli/<name>/logout`.
  Deferred.
- **Shakeout of the full loop.** `cli_discovery.ts` gets a
  `SHAKEOUT_LOGIN_LOOP=1` mode that runs logout → status:false →
  pty/start → observe URL in stream → pty/close per CLI (skipping
  `claude` on this box because its auth is load-bearing).
  Deferred.
- **API-key dropdown section.** Peter named a second dropdown
  section (aider, opencode-per-provider) that takes API keys
  directly. Distinct from the login-flow path. Future scope.

## files

- `web/reveal/transcript/AuthPromptCard.tsx`
- `web/reveal/transcript/Row.tsx`
- `web/vm/session_controller.ts`
- `server.py`
- `process/sprints/sprint-085b-cli-auth-transcript-card.md`
