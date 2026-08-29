# Sprint 035 — `web/terminal.ts` module + session-turn wiring

```yaml
---
id: 035
status: pending
phase: 5
pass_kind: implementation
---
```

## scope

TECH-SPEC §10 line 11. The current terminal is a bottom dock
(`#termdock`, opened via `#termOpen`). Piece G promotes it to a full
column inside `#view-terminal` (from sprint 033). The dock DOM stays
one release for backwards-compat inside `#view-desktop`; the
canonical terminal lives in `#view-terminal`.

Two wiring changes:

- Turn submission moves from `POST /api/agent` (legacy compat bridge)
  to `POST /api/session/<id>/turn` (piece B). The terminal opens a
  session lazily on the first turn if none is selected in the rail.
- Live-follow moves from polling `/api/records/<name>/summary` every
  400ms to the piece-B SSE stream at
  `GET /api/session/<id>/events?since_seq=<n>`.

The four driver-session signal tags fire at real code paths.

## context_files

- `web/app.ts:940-1183` — current terminal DOM + `runTerm` +
  `sendChatMessage`.
- `substrate-ui/server.py::_session_turn` (piece B) — the endpoint.
- `substrate-ui/server.py::_session_events` (piece B) — SSE stream.
- `signals/versions/0.6.json` — driver-session category tags already
  present.
- `process/HARNESS-CATALOG.md` § grader — extend `EXPECTED_ORDER`.

## artifact contract → Files created/modified

- `substrate-ui/web/terminal.ts` — new module. Exports
  `mountTerminal(el: HTMLElement, sessionRegistry: SessionRegistryClient)`.
  Wires the terminal's `sendChatMessage` path to
  `POST /api/session/<id>/turn`; opens an EventSource against
  `/api/session/<id>/events` for live-follow.
- `substrate-ui/web/app.ts` — mounts `mountTerminal($("view-terminal"), ...)`.
  Legacy dock inside `#view-desktop` continues to work via the compat
  bridge for one release; sprint 037 deletes the dock.
- `substrate-ui/tools/capture-grade.ts` — `EXPECTED_ORDER` gains
  `DRIVER_SESSION_STARTED`, `USER_MESSAGE_INJECTED`, `PARK_LANDED`,
  `DRIVER_SESSION_ENDED` in that order. New pairing invariant
  `checkDriverSessionBookends`: every `DRIVER_SESSION_STARTED`
  followed by `DRIVER_SESSION_ENDED` within the fixture's lifetime;
  every `USER_MESSAGE_INJECTED` followed by `PARK_LANDED` within one
  turn's timeout.
- `substrate-ui/sprints/sprint-035-terminal-column-session-turn.md` —
  this file.

## signal contract → Emits

Four new emit sites in `terminal.ts`, all mapped to real user actions:

- `DRIVER_SESSION_STARTED{session_id, driver, workspace_shape}` on
  first-turn session open.
- `USER_MESSAGE_INJECTED{session_id, turn_index, source: "keyboard" |
  "programmatic"}` on Enter.
- `PARK_LANDED{session_id, turn_index, reason}` when the SSE stream
  yields a `Park` envelope.
- `DRIVER_SESSION_ENDED{session_id, reason}` on `/exit` slash or
  `POST /api/session/<id>/end`.

Parity gate exit 0. `TRANSCRIPT_COMPACTED_LANDED` and
`DRIVER_SESSION_WARNING_EMITTED` are ambient — they fire when the
substrate side emits `TranscriptCompacted` or `SessionWarning` on the
record; a fixture that opens a small session may not exercise them.

## observation contract

- **UI driving steps**. Flip to `#view-terminal`. Type `hello`. Press
  Enter. Assert `DRIVER_SESSION_STARTED` fires; the SSE stream
  writes `UserMessage` on the session's record; the terminal shows
  the assistant's reply. Type `/exit`. Assert `DRIVER_SESSION_ENDED`
  fires; the session's record carries `SessionEnded{reason:"user_exit"}`.
- **Expected stderr log substrings**. `POST /api/session ` (open),
  `POST /api/session/<id>/turn` (send), `GET /api/session/<id>/events`
  (SSE stream).
- **Expected runtime signals on the record**. `SessionStarted`,
  `UserMessage`, `ModelReply`, `Park`, `SessionEnded` (in seq order).
- **Expected grader signals**.
  `DRIVER_SESSION_STARTED → USER_MESSAGE_INJECTED → PARK_LANDED →
  DRIVER_SESSION_ENDED` in the fixture's tail.
- **Expected screenshot frames**. Two:
  `screenshots/35-terminal-view-post-user-message.png`,
  `screenshots/35-terminal-view-post-model-reply.png`.

## halt conditions

- `dual_contract_fail` if the four driver-session tags fire but the
  session record shows no matching substrate-side envelopes (pairing
  broken across the seam).
- `bridge_mapping_required` if the SSE reader needs a new browser API
  that isn't in the stdlib EventSource surface.

## definition of done

Terminal module extracted + wired to piece-B session endpoints. Four
driver-session tags fire at real code paths. Grader accepts the new
`checkDriverSessionBookends` invariant. Two screenshots viewed and
clean. `POST /api/agent` in `sendChatMessage` deleted (the legacy
bridge lives for one more release inside the docked terminal in
`#view-desktop`).
