# Sprint 044 — Piece G close: the terminal view drives a real cloud model

```yaml
---
id: 044
status: closed
phase: G
pass_kind: functional + observation
---
```

*Piece G's stated bar was "type into the daily-driver terminal, real model
responds, session opens and ends cleanly." Everything on the way — the
picker, the slashes, the Ctrl+C interrupt, the SSE renderer, the /model
patch — had already landed in sprints 035–041. The only thing left was
that the terminal opened its first session against the deterministic
stand-in every time, so the daily driver was demonstrably driving
nothing. This sprint closes that gap and pins the observation.*

---

## scope

Three tiny edits and one new capture script.

- `web/app.ts:877` — drop the `driverDefault: "deterministic"` argument
  from the `mountTerminal(#view-terminal, …)` call so the terminal reads
  the server's default instead.
- `web/terminal.ts:469` — the empty-sentinel fallback for `driverName`.
  Also read a `?driver=<name>` URL query so a harness pinning a specific
  driver (e.g. the sprint 035 lifecycle test staying on `deterministic`)
  works without server env vars or a restart.
- `web/terminal.ts:175` (`_openSession`) — when neither `h.driverName`
  nor a visibly-bound picker has a value, fetch `/api/models` default
  and use it. `pickerSelect?.value` is treated as authoritative only
  when its parent is `offsetParent !== null` (visible), because the
  desktop picker is `display: none` pre-session and its first option
  is the literal `"deterministic"` (driver_picker.ts:52) — reading it
  otherwise would seed deterministic on every first open.
- `server.py:_agent_models` — refresh the `prefer` list against the
  live Ollama Cloud tags on this box (verified via `/api/tags` +
  a hi-in-three-words `/api/chat` probe): `kimi-k2.6` → `kimi-k2.7-code`
  and `glm-5.1` → `glm-5.2`. Order = preference.
- `harness/capture_terminal_daily_driver.js` — new. Playwright drives
  the real backend end-to-end: flip to terminal view, type
  "reply with the single word: hello", wait for `DRIVER_SESSION_STARTED`,
  assert its `driver_name !== "deterministic"`, wait for the ModelReply
  DOM row, `/exit`, assert `DRIVER_SESSION_ENDED`. Three screenshots
  at named anchors.
- `harness/capture_terminal_session.js` — one line: open the app URL
  with `?driver=deterministic` so this cost-sensitive lifecycle test
  stays token-neutral regardless of what `/api/models` defaults to.
- `package.json` — `capture:terminal-daily-driver` script added
  alongside the existing `capture:terminal-session`.

---

## observation contract

Structural (Playwright DOM + signals):
- `DRIVER_SESSION_STARTED{driver_name}` payload's driver_name is
  `!= "deterministic"` on a fresh open (piece G's whole point).
- A `.terminal-row.accent` element appears in `#terminal-body` within
  60s (real cloud round-trip ceiling), and its text is non-empty.
- `PARK_LANDED` fires after the ModelReply.
- `/exit` fires `DRIVER_SESSION_ENDED{reason}`.
- No uncaught page errors.

Perceptual (agent-viewed screenshots):
- `screenshots/44-terminal-session-opened.png` — driver picker shows
  the real cloud model tag; session-id line visible; body carries the
  user prompt row.
- `screenshots/44-terminal-model-reply-rendered.png` — reply text in
  accent colour, park line beneath.
- `screenshots/44-terminal-session-ended.png` — post-exit state.

Live run 2026-08-31 (this box, Ollama + kimi-k2.7-code:cloud reachable):

```
ok  session started: driver=kimi-k2.7-code:cloud tokens=262144
ok  daily driver resolved to real model: kimi-k2.7-code:cloud
ok  ModelReply rendered: "hello"
ok  PARK_LANDED — turn 1 complete
ok  DRIVER_SESSION_ENDED fired on /exit
Piece G daily-driver end-to-end PASS.
```

Sprint 035 lifecycle test re-run with `?driver=deterministic`:

```
Sprint 035 observation contract PASS.
```

---

## non-goals (kept for a later sprint)

- Wiring the daily-driver capture into the batched `signals` npm script
  (it requires live Ollama Cloud, which the GitHub runner doesn't have —
  it fits as a local-only smoke, not as CI).
- A visible in-terminal driver picker pre-session. The desktop picker
  binds post-session and works fine for changing driver mid-session;
  a pre-session picker is a UX polish, not a functional gate.
- Cost/token metering surfaced in the terminal header.
