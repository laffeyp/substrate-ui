# Sprint 037b — `capture_session.js` + `capture_session_signals.js`

```yaml
---
id: 037b
status: pending
phase: 5
pass_kind: functional
---
```

## scope

The two capture companions to 037a's driver harness. Perceptual
frames + signal-trace fixture. Together they close the third grading
track for piece G.

Two files. One concept: capture the artifacts the grader reads.

## prerequisites

- 037a (driver + grader kind).

## context_files

- `harness/capture_console.js` and `harness/capture_signals.js` —
  shape to mirror.
- `harness/e2e_session.js` — reuses its flow.
- `process/HARNESS-CATALOG.md`.

## artifact contract → Files created/modified

- `substrate-ui/harness/capture_session.js` — new. Screenshots four
  DOM states under `screenshots/37-*.png`: terminal-view-empty,
  terminal-view-mid-turn, desktop-view-four-columns,
  desktop-view-mid-session.
- `substrate-ui/harness/capture_session_signals.js` — new. Drives
  the session flow (reuses 037a's steps), dumps `window.__signals` to
  `captures/sprint-037/session.jsonl`.
- `substrate-ui/package.json` — scripts `capture:session`,
  `capture:session-signals`, `grade:session-signals`.
- `substrate-ui/package.json` — `npm run signals` extended to chain
  the session fixture.

## signal contract → Emits

No new emits.

## observation contract

- `npm run capture:session` writes the four screenshots; each viewable
  under 2000px.
- `npm run capture:session-signals` writes `session.jsonl`.
- `npm run grade:signals` green for the session fixture.
- All four screenshots viewed and clean.

## halt conditions

- `dual_contract_fail` if the fixture written by
  capture_session_signals fails 037a's grader kind.

## definition of done

Both harnesses on disk; four screenshots viewed clean; JSONL fixture
grader-green; scripts wired.
