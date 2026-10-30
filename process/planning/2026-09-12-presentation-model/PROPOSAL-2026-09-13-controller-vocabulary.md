# Proposal — SessionController vocabulary (2026-09-13)

## Purpose

The Presentation Model — `SessionController` in `web/vm/` — is the seam
both the classic shell (`/classic`) and the reveal shell (`/`) drive
through. Phase 5 of `PLAN-2026-09-12-presentation-model-extract.md`
says: lock the controller's vocabulary in `signals/` so a shared
harness can grade both shells against the same emissions.

This is the draft for that lock. The names are chosen against the
grammar already in place: `<UPPER_SNAKE>_TAG` verbs at ratified sites,
present-tense on the source of truth. Every tag is required to fire
at exactly one call site inside `SessionController`.

## Tags

### Session lifecycle

- `SESSION_OPEN_REQUESTED` — `SessionController.openSession()` entry.
  Payload: `{driver, workspace, workspace_shape, bundle, tools}`.
- `SESSION_OPEN_ACKED` — the server returned a `session_id` on
  `POST /api/session`. Payload: `{session_id, name, driver}`.
- `SESSION_OPEN_REFUSED` — the server refused. Payload:
  `{failure_class, detail}`.
- `SESSION_ATTACH_STARTED` — `attachExisting(sessionId)` began.
- `SESSION_END_REQUESTED` — `endSession(reason)` entry.
- `SESSION_ENDED_LOCAL` — a `SessionEnded` envelope reached the
  controller; snapshot flipped to `endedReason`. Payload: `{reason}`.

### Driver

- `DRIVER_ROSTER_LOADED` — `loadDriverRoster()` populated
  `snapshot.driverRoster`. Payload: `{count, default}`.
- `DRIVER_PICKED` — `pickDriver(name)`. Payload: `{driver}`.

### Turn

- `TURN_SUBMITTED` — `sendTurn(text)` entry. Payload:
  `{session_id, turn_index, text_length}`.
- `TURN_ACK` — `POST /api/session/<id>/turn` returned 200.
- `TURN_REFUSED` — turn POST failed.
- `TURN_PARKED` — a `Park` envelope arrived; snapshot recorded the
  reason. Payload: `{park_reason}`.
- `TURN_INTERRUPTED` — `interruptTurn()` ACK from
  `/api/session/<id>/interrupt`. Payload: `{was_interrupted, landed}`.

### Stream

- `STREAM_ATTACHED` — SSE `onopen`; `snapshot.connection = "connected"`.
- `STREAM_ENVELOPE_APPENDED` — one envelope folded into the
  transcript. Payload: `{seq, kind}`.
- `STREAM_RECONNECTING` — SSE error tripped the 1s reconnect timer.
- `STREAM_CLOSED` — SSE closed cleanly (RunFinalised).

### Slash

- `SLASH_ROUTED` — `submitLine(line)` matched a known slash. Payload:
  `{cmd}`.
- `SLASH_UNKNOWN` — no case matched. Payload: `{cmd}`.

### Records surface

- `SESSIONS_LOADED` — `loadLiveSessions()` populated
  `snapshot.liveSessions`. Payload: `{count}`.
- `WORKSPACES_LOADED` — `loadRecentWorkspaces()` populated
  `snapshot.recentWorkspaces`. Payload: `{count}`.

### Topology

- `TOPOLOGY_LOADED` — `loadTopologyGraph(name)` returned. Payload:
  `{producer_count, trigger_count}`.

## Shape

Every tag is fired via `controller.emit(tag, payload)`. Shells
subscribe with `controller.onEvent(cb)` and forward through their own
sink (the classic shell into `web/instrumentation/sdd.ts`; the reveal
shell into the same, or a separate JSONL if isolation is wanted).
By-construction both shells see the identical stream so the parity
harness reads one file and matches, not two.

The `onEvent(cb)` and `emit(tag, payload)` methods are new — this
proposal introduces them alongside the existing `subscribe(cb)`. A
shell that doesn't care about signals just ignores them.

## Not in this proposal

- Studio surface tags. Studio isn't wired to the controller yet.
- Assay tags. `assayReport` shape is deferred until substrate exposes
  a projection.
- Multi-pane multi-session vocabulary. The controller holds one
  session today; a `PaneController` would carry its own names.

## What comes next

Land the `emit` / `onEvent` primitives on `SessionController`, fire
every tag above at its named call site, and wire both shells to
forward through the SDD sink. Then the two-shell parity harness runs
both `/` and `/classic` against a driven sequence and diffs their
`captures/*.jsonl` files. Any drift is a shell bug.
