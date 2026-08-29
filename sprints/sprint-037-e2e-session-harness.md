# Sprint 037 — `harness/e2e_session.js` + observation contract close

```yaml
---
id: 037
status: pending
phase: 5
pass_kind: implementation
---
```

## scope

TECH-SPEC §10 line 20 names this harness. It is the piece-G analog of
`e2e_console.js` / `e2e_studio.js` / `e2e_assay.js` / `e2e_delegate.js`
per `process/HARNESS-CATALOG.md`. Drives the full session shape end-to-end:

1. Open the browser at `http://127.0.0.1:8765/`.
2. Assert desktop view visible; assert `#view-toggle` present.
3. Click `+ session` in the rail (sprint 034). Fill driver
   `"deterministic"`. Submit.
4. Assert `DRIVER_SESSION_STARTED` fires; session appears in the
   `live sessions` bucket.
5. Send two `UserMessage`s via the terminal (sprint 035).
6. Press `Ctrl+\`` mid-session. Assert terminal view now visible;
   session still driving.
7. Press `Ctrl+\`` back. Assert desktop view; scroll + cursor
   preserved from step 4.
8. `/exit` slash. Assert `DRIVER_SESSION_ENDED` fires; record carries
   `SessionEnded{reason:"user_exit"}`.

Companion harnesses:

- `harness/capture_session.js` — perceptual capture of the four DOM
  states named in the tech spec: terminal-view empty, terminal-view
  mid-turn, desktop-view four columns visible, desktop-view mid-session.
- `harness/capture_session_signals.js` — signal-trace capture; dumps
  `window.__signals` to `captures/sprint-037/session.jsonl`. Grader
  reads it.

Deletes the legacy docked terminal inside `#view-desktop` (kept one
release from sprint 035).

## context_files

- `process/HARNESS-CATALOG.md` § "How to write a piece-G harness" —
  the seven adoption points (BASE, launch shape, error trap, fails
  array, capture-tail, perceptual pair, grader extension,
  package.json script).
- `harness/e2e_console.js` — the shape to mirror.
- `sprints/sprint-033-two-view-scaffold.md` through
  `sprint-036-desktop-five-controls.md` — everything this harness
  drives.

## artifact contract → Files created/modified

- `substrate-ui/harness/e2e_session.js` — new. Follows the shape
  named in HARNESS-CATALOG.md § "How to write a piece-G harness."
- `substrate-ui/harness/capture_session.js` — new. Screenshots the
  four named DOM states under `screenshots/37-*.png`.
- `substrate-ui/harness/capture_session_signals.js` — new. Drives the
  session flow, dumps signals to `captures/sprint-037/session.jsonl`.
- `substrate-ui/package.json` — new scripts: `e2e:session`,
  `capture:session`, `capture:session-signals`, `grade:session-signals`.
  `npm run signals` extended to chain the session fixture.
- `substrate-ui/tools/capture-grade.ts` — session-fixture kind added
  (`--kind session`) with its own `EXPECTED_ORDER` and the
  `checkDriverSessionBookends` invariant from sprint 035.
- `substrate-ui/web/app.ts` — legacy docked terminal DOM + handlers
  deleted (sprint 035 kept them one release; this sprint retires
  them).
- `substrate-ui/sprints/sprint-037-e2e-session-harness.md` — this
  file.

## signal contract → Emits

No new emits; every tag piece G ships fires from prior sprints. This
sprint asserts the full trace: `SESSION_INIT` → `PANE_SWITCHED` ×
2+ (toggle events) → `DRIVER_SESSION_STARTED` →
`USER_MESSAGE_INJECTED` × 2 → `PARK_LANDED` × 2 →
`DRIVER_SESSION_ENDED` → `SESSION_ENDED`.

## observation contract

- **UI driving steps**. Verbatim from the harness script above.
- **Expected stderr log substrings**. `pointer to session s_...`
  (server log line per tech spec §10 line 22).
- **Expected runtime signals on the record**. `SessionStarted`, two
  `UserMessage`, two `ModelReply`, two `FinalAnswer`, two `Park`,
  `SessionEnded` (per tech spec §10 line 23).
- **Expected grader signals**. `DRIVER_SESSION_STARTED`,
  `USER_MESSAGE_INJECTED × 2`, `PARK_LANDED × 2`,
  `PANE_SWITCHED × 2` (toggle events), `DRIVER_SESSION_ENDED` on
  close.
- **Expected screenshot frames**. Four viewed:
  `screenshots/37-terminal-empty.png`,
  `screenshots/37-terminal-mid-turn.png`,
  `screenshots/37-desktop-four-columns.png`,
  `screenshots/37-desktop-mid-session.png`.

## halt conditions

- `dual_contract_fail` if the fixture trace fails any grader
  invariant.

## definition of done

`npm run e2e:session` exit 0. `npm run capture:session-signals`
writes the fixture. `npm run grade:signals` chain green (four
fixtures now: console, studio, session, plus any parity). Four
screenshots viewed and clean. Legacy dock gone from `#view-desktop`.
