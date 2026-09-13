# PLAN — Presentation-Model extraction (2026-09-12)

## What this is

Two substrate-ui trees exist. The working one (branch
`working-terminal-sprint-051`, commit `a1829a8`) drives real substrate
sessions in a real browser against a real Python server; it looks
plain. The other (`main`, commit `9b7f704`) carries the prototype
visual design in `app/prototype-v7.html`; every interactive site in it
either shows scripted content or fails to bind. Both trees own their
own state model. Neither can adopt the other by patching alone.

The task is a **projection**: extract the working tree's state and
behavior into a framework-agnostic Presentation Model, then bind two
Views to it — the current classic shell and the prototype's dc-runtime
HTML. Both Views render the same controller. Correctness stays in one
place; the shell is a skin.

## The pattern

Presentation Model (Fowler, *PoEAA*, 2002). Same idea as MVVM
(Microsoft, 2005) and Humble View. At the whole-app scale it is
Cockburn's Hexagonal Architecture: the core has typed ports; each UI
adapts them. The View is thin, the ViewModel holds the logic, the
Model is substrate.

## Where the code lives

Work happens on branch `presentation-model-extract`, checked out in the
worktree `substrate-ui-working/`. `main` is not touched. The classic
shell stays on this branch; the prototype's HTML is copied in as a
second entry point.

## The phases

### Phase 0 — branch and workspace

Branch `presentation-model-extract` off `working-terminal-sprint-051`.
Worktree `substrate-ui-working/` switches to it. This document is the
first commit.

### Phase 1 — extract the Presentation Model

New directory `web/vm/`. Move state, actions, and the SSE reducer out
of `web/state.ts`, `web/terminal.ts`, and `web/rail.ts` into a
framework-free `SessionController` class. It exposes:

- `snapshot()` — the current state as a plain object.
- `subscribe(cb)` — the store subscription; `cb` fires on every change.
- Actions: `bindWorkspace(paneId, path)`, `submitTurn(sessionId, text)`,
  `endSession(sessionId)`, `pickDriver(paneId, driverName)`,
  `openRecord(sessionId)`, and every other verb the two shells need.
- A typed event stream (`onEvent(cb)`) for envelope-append and stream
  reconnect signals.

Takes a `SubstrateClient` port (a small interface: `fetch(url, opts)`
+ `stream(url, cb)`). This keeps the controller transport-agnostic;
an in-process Electron bridge can implement the same interface later
without touching the controller.

No DOM in this directory. No dc-runtime. No React. No Vite-only APIs.

### Phase 2 — rebind the classic shell

`web/app.ts` builds one `SessionController` at boot and hands it to
`terminal.ts`, `rail.ts`, and every module in `web/controls/`. Each of
those loses its private state and reads only from the controller's
snapshot. The classic shell looks identical after this phase. The
projection has an anchor: two shells reading the same source.

### Phase 3 — second shell entry

Copy `app/prototype-v7.html` from `main` into `web/reveal.html`. Add
`web/reveal.ts` that constructs the same `SessionController` and hands
it to the prototype's `Component` class. Strip the prototype's
scripted fields. Extend `server.py` to serve `/reveal` alongside `/`.

### Phase 4 — bind the prototype's template to the controller

One feature at a time, in this order, verified in a browser:

1. Driver picker.
2. Workspace picker.
3. Rail (session list + click-to-open).
4. Transcript rendering.
5. Prompt input + turn submit.
6. Records surface.
7. Studio surface.
8. Reveal-view transcript and prompt.

Each feature: open `/reveal`, use the interaction, watch the same
substrate call fire that the classic shell fires from `/`. A gap is a
template-binding fix, not a controller change.

### Phase 5 — SDD wrap

Lock the controller's vocabulary in `signals/`. Every action carries a
tag; every state-shape field is typed. One harness runs both shells
against the same driven sequence and grades identical emissions.
Drift between the shells becomes visible.

### Phase 6 — cut over

`/reveal` becomes `/`. The classic shell moves to `/classic` and stays
reachable. Whichever shell is retired later gets retired, not before.

## What SDD does here

Phase 1 writes the vocabulary. Phase 5 locks it. The vocabulary is
the ViewModel's contract expressed as typed emissions plus ordering
rules. The harness enforces both shells against one contract; a
future third shell (Electron in-process, a CLI, a test harness) reads
the same contract.

## What "done" looks like

- Both shells render every feature the sprint-051 tree renders today.
- The classic shell is unchanged in behavior; only its state source
  moves.
- The prototype shell drives real substrate sessions end-to-end. Type
  a prompt in the reveal view; the transcript grows; the rail
  updates; the record persists.
- One controller. One test surface. Two Views. Either can be
  retired without touching the other.

## What comes next

Wait for the word before starting Phase 1. When it comes, work
proceeds one phase at a time; each phase lands as its own commit and
is verified by opening the browser and using the app.
