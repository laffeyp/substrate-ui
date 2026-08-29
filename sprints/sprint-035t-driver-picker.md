# Sprint 035t — terminal-header driver picker

```yaml
---
id: 035t
status: closed
phase: 5
pass_kind: functional
---
```

## Product-spec conformance

**Fulfills:** PRODUCT-SPEC-2026-08-17-round12.md §4 "One driver per
session, set at creation, changeable mid-session with /model <name>."
§13 View A "same DOM as substrate-ui's integrated terminal today" —
the agent terminal exposes a driver dropdown; the daily-driver
terminal carries the same control. §13 "What toggles in the UI that
were CLI flags" lists driver picker as one of five UI/CLI-parity
controls.

**Complements:** sprint 035s's `/model` slash. One control, two
entry points, one wire (PATCH /api/session/<id> {driver}).

## Scope

Adds a `<select id="terminal-driver">` to the terminal-view header,
populated from `GET /api/models` on mount. Change fires `PATCH
/api/session/<id> {driver}` + emits `DRIVER_PATCHED{session_id,
driver, prior_driver}` when a session is active; queues on
`h.driverName` when no session (next `_openSession` uses the picked
driver). Same wire as `/model` slash; the prompt refresh + emit path
is shared.

## Artifact contract → Files created/modified

- `web/terminal.ts` — `_mkChildren` returns `driverSelect` alongside
  body/input/prompt; new `_populateDriverPicker(select, h)` async
  helper reads `/api/models`, dedupes across models+cli+deterministic,
  sets initial value; `mountTerminal` wires the change handler.
- `harness/capture_terminal_driver_picker.js` — new; 12 assertions.
- `package.json` — new `capture:terminal-driver-picker` script wired
  into `npm run signals`.

## Signal contract → Emits

- `DRIVER_PATCHED{session_id, driver, prior_driver}` — on picker
  change with an active session. Same tag `/model` fires (035s).

## Observation contract

- Picker mounts with 20 options after `/api/models` resolves.
- `deterministic` and `kimi-k2.6:cloud` are among the options.
- Initial value equals `opts.driverDefault` ("deterministic" from
  app.ts) when it exists in the option list.
- Change with no active session prints "queued for next session"
  and does NOT fire `DRIVER_PATCHED`.
- Change after session open fires `DRIVER_PATCHED` with correct
  swap direction.
- Prompt refreshes to `${driver} ›` after the ACK.
- Swap back fires a second `DRIVER_PATCHED` with reversed direction.
- No uncaught page errors.
- 12/12 assertions PASS in isolation and under `npm run signals`.
- Screenshot `screenshots/035t-driver-picker.png` viewed: driver
  dropdown sits between title and hint; 20 options; hint reads
  "type to talk · /exit to leave · /help."

## Halt conditions

- `dual_contract_fail` if the picker change fires without a paired
  `DRIVER_PATCHED` emit.

## Definition of done

Picker mounts + populates + wires. Change fires PATCH + emit + prompt
refresh with an active session; queues with none. 12/12 assertions
PASS. Full signals chain PASS. Cleared: 037c dock-retirement
precondition #2 (driver picker in terminal header).
