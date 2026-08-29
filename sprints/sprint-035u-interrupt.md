# Sprint 035u — Ctrl+C interrupt

```yaml
---
id: 035u
status: closed
phase: 5
pass_kind: functional
---
```

## Product-spec conformance

**Fulfills:** PRODUCT-SPEC-2026-08-17-round12.md §2 "Ctrl+C interrupts
the current turn without ending the session." §13 View A "same DOM as
substrate-ui's integrated terminal today" — the agent terminal is
Ctrl+C-aware in the daily-driver's terminal seat.

**Complements:** sprint 035s's `/interrupt` slash — one behavior, two
entry points (keyboard + slash), same wire (`POST /api/session/<id>/interrupt`).

## Scope

Adds a `keydown` handler on `#terminal-input` that intercepts Ctrl+C
(or Cmd+C on macOS) when the input has focus AND no selection.
Selection-preserved copy stays as browser default. Handler:

- No session → prints "(no session in flight; type /exit to close or
  open one with a message)".
- Active session → POST /api/session/<id>/interrupt (piece B 217d).
  Response shape `{interrupted, landed, session_id}`:
  - `interrupted: true, landed: true` → "^C interrupt (landed)".
  - `interrupted: true, landed: false` → "^C interrupt (dispatched —
    envelope arriving on /events)".
  - `interrupted: false` → "^C — no turn in flight; type /exit to end
    session".

Rule 6: one file, one concept. No new emit sites (interrupt effect
lands on the record as `substrate.ProducerCancelled`; the UI-side
witness of Ctrl+C is body output, not a new v0.7 tag).

## Artifact contract → Files created/modified

- `web/terminal.ts` — new `keydown` listener on `input` for
  Ctrl/Cmd + C; wired via `_fetch` helper (035s).
- `harness/capture_terminal_interrupt.js` — new; 7 assertions.
- `package.json` — new `capture:terminal-interrupt` script wired
  into `npm run signals`.

## Signal contract → Emits

None new. The interrupt's effect lands on the substrate record as
`substrate.ProducerCancelled` per piece B 217d; that envelope is
observable via `/api/session/<id>/events` SSE, which the terminal
already reads.

## Observation contract

- Ctrl+C with no session prints the "no session in flight" hint.
- Ctrl+C on an idle (parked) session posts /interrupt; response
  `{interrupted: false}` yields "^C — no turn in flight".
- Ctrl+C with a selection in the input does NOT fire /interrupt
  (browser copy path preserved); interrupt-line count stable.
- Ctrl+C with no selection AND active session fires /interrupt path
  (second "no turn in flight" line lands, confirming the second
  call reached the daemon).
- /exit ends the session cleanly at end.
- No uncaught page errors.
- 7/7 assertions PASS.

## Halt conditions

- `dual_contract_fail` if Ctrl+C with a selection ever fires
  /interrupt (would break browser-native copy for typed input text).

## Definition of done

Ctrl+C wired. Selection-preserved copy path holds. 7/7 harness
assertions PASS. Full signals chain PASS (seven fixtures now).
Cleared: 037c dock-retirement precondition #3.
