# Phase-4 progress — 2026-09-13

Snapshot against `PLAN-2026-09-12-presentation-model-extract.md`.
Branch `presentation-model-extract`, worktree
`substrate-ui-working/`, main untouched.

## Phases landed

- **Phase 1** — `SessionController` in `web/vm/`. `client.ts` +
  `types.ts` + `session_controller.ts` + `index.ts`. Framework-free,
  transport-swappable. `harness/vm_smoke.ts` exercises it end-to-end
  against the live server: 6 of 6 pass (`npm run smoke:vm`).
- **Phase 2a** — controller boots alongside the classic shell.
  `window.__vm.snapshot()` reachable in DevTools on `/`.
- **Phase 3** — prototype shell mounted at `/reveal.html`.
  `web/reveal.html` + `web/reveal.ts` + `web/public/support.js`.
  Second `SessionController` instance owns the DevTools handle on
  that page.
- **Phase 4a** — driver picker binds to `snapshot.driverRoster`. Both
  the per-pane chip and the reveal-view header chip read the real
  Ollama + cloud + CLI roster from `/api/models`.
- **Phase 4b** — transcript body + prompt input bind to the
  controller. Type in either the terminal-view prompt or the
  reveal-view prompt; the controller opens a session, submits the
  turn, and folds the SSE envelope stream into the visible
  transcript. The scripted "fix-race-in-metering" narrative auto-
  hides the moment a real session is bound.
- **Phase 4c** — workspace picker + records list bind to
  `/api/workspaces` and `snapshot.liveSessions`. Server gained
  `GET /api/workspaces` (reads `~/.substrate/recent-workspaces.json`
  when present, else derives distinct workspace paths across live
  session manifests, always appends `~/.substrate/sandbox`).
- **Phase 4d** — records surface renders workspace-grouped live
  sessions. Each row: name, driver, status glyph, session-id short.
  An `(other)` group catches sessions in workspaces outside the
  recent list.
- **Phase 4e** — assay surface shows an honest empty state until a
  substrate-side projection endpoint lands.

## Phase-4 features still open

- **Studio surface (feature 7)** — the topology-authoring form. Needs
  server-side `POST /api/topology/validate` and `POST /api/topology/build`.
  Not on the daily-driver path.
- **Structure and scene lenses** — fake in the prototype today.
  Real data lives at `/api/records/<name>/graph` and
  `/api/records/<name>/scene`; the controller has no `loadGraph`
  or `loadScene` yet.
- **Slash commands** — `/exit`, `/model`, `/tools`, `/bundle`,
  `/context`, `/diff`, `/inspect`, etc. The classic shell routes
  them via `web/terminal/slash/*.ts`. The reveal shell drops every
  slash line silently.
- **Split panes with independent sessions** — the prototype models a
  multi-pane grid; the controller handles one session. Multi-session
  is a real design choice, not a binding gap.

## Phase 2b (classic-shell rewire) not started

`terminal.ts` and `rail.ts` still hold their own state. Phase 2a
proved the controller runs alongside them; Phase 2b would move the
classic shell to source its state from the controller too. Deferred
because Phase 4 landed the more visible win first.

## Phases 5 and 6 not started

- **Phase 5** — lock the controller vocabulary in `signals/` and
  build the two-shell parity harness.
- **Phase 6** — cut `/reveal.html` over to `/`, move the classic
  shell to `/classic`.

Cut-over is premature: the reveal shell has no slash-command
handling and no split-pane sessions. Landing them first, then
cutting over, is the honest order.
