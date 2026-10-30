# Phase 5 + Phase 6 landed — 2026-09-13

Snapshot against `PLAN-2026-09-12-presentation-model-extract.md`.
Branch `presentation-model-extract`; twenty-one commits since the
plan.

## The state

- `main` untouched at commit `9b7f704` (the port branch's head).
- `working-terminal-sprint-051` untouched at `a1829a8` (the working
  daily-driver point).
- `presentation-model-extract` carries the projection.
- The server serves the reveal shell at `/` and the classic shell at
  `/classic` (both reachable, side-by-side).
- The smoke harness passes 11 of 11 (`npm run smoke:vm`).

## Phase 1 — SessionController extracted

`web/vm/` holds the Presentation Model:
`SessionController`, `BrowserSubstrateClient`, typed `Snapshot`.
Framework-free, transport-swappable, one file per concern.

## Phase 2a — controller boots alongside classic shell

`web/app.ts` builds one `SessionController` at boot and exposes it as
`window.__vm`. The classic shell keeps its own state; the controller
runs alongside so a shared instance is available.

## Phase 2b — deferred

Classic shell rewire is optional and unstarted; the classic shell
keeps its own state today and works fine.

## Phase 3 — reveal shell mounted at /reveal.html

`web/reveal.html` (copy of `handoff_latest/prototypes/Substrate
Prototype v7.dc.html`) is the second View. `web/reveal.ts` builds a
`SessionController`, exposes it as `window.__vm`, and mirrors every
snapshot into the DC component's state via a React fiber walk.

## Phase 4 — bindings

- `4a` — driver picker (real /api/models roster, real default).
- `4b` — transcript + prompt (real turns, real SSE stream).
- `4c` — workspace picker + records list (real /api/workspaces).
- `4d` — records surface renders workspace-grouped live sessions.
- `4e` — assay surface: honest empty state.
- `4f` — /exit /model /help /clear slashes routed.
- `4g` — driver dropdown clickable (drop draggable=true from header).
- `4h` — dropdown visible below header (overflow:visible, z-index).
- `4i` — fake defaults purged (later corrected in 4j).
- `4j` — pane driver defaults to /api/models real default.
- `4k` — records rows clickable → attachExisting streams from seq 0.
- `4l` — /interrupt slash + Ctrl+C hotkey.
- `4m` — /name /list slashes + controller.renameSession.
- `4n` — transcript renders RateLimitedWaiting + TranscriptCompacted.
- `4o` — records: include ended, sort by createdAt, cap 8/group,
  drop misleading empty line.
- `4p` — end-session confirm dialog wired to controller.endSession.
- `4q` — records rows show relative time (5m ago, 3d ago).
- `4r` — structure lens loads real /api/records/<name>/topology_graph.
- `4s` — openSession awaits driver roster; transcript autoscrolls.
- `4t` — bookmarkable sessions: ?session=<id> attaches on load, URL
  follows the current session.

## Phase 4 — still open

- Studio surface — authoring, no server-side validate/build endpoint.
- Scene lens — client-side; needs to detect a 2D-array-shaped payload
  in the record's envelope stream.
- Slash router UI — the prototype's inline slash suggestions.
- Split-pane multi-session — the controller holds one session; a
  `PaneController` layer would carry per-pane state.
- Bundle picker.
- Studio "build & launch" — needs server-side topology endpoints.

## Phase 5 — vocabulary landed as proposal + emit primitives

`process/planning/PROPOSAL-2026-09-13-controller-vocabulary.md` names
the 13-tag surface. `SessionController` grew `emit(tag, payload)` and
`onEvent(cb)`; every declared tag fires at exactly one call site.
`window.__vmTape` is a ring buffer the parity harness reads. The
smoke test asserts every declared tag arrives in one driven turn.

The formal `signals/versions/0.8.json` lock is the Architect's
ratification step; the tags are ready to consume as soon as it lands.

## Phase 6 — cut over

`http://127.0.0.1:8765/` serves the reveal shell.
`http://127.0.0.1:8765/classic` serves the sprint-051 shell.
Both reachable, no data loss, `main` still holds the previous
port work if a reversion is ever needed.

## What "done" looks like

- ✅ Both shells render every feature the daily-driver flow needs.
- ✅ The classic shell is unchanged in behavior.
- ✅ The reveal shell drives real substrate sessions end-to-end.
- ✅ One controller. Both Views subscribe.
- ✅ Retire either View by removing the entry point; the controller
  keeps running.
