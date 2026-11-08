# Sprint 362 — what each pane draws (plan item 4, PANE_DRAWN)

```yaml
---
id: 362
status: closed
phase: SDD re-centre
pass_kind: functional
---
```

## scope

`PANE_DRAWN` is written from `web/app/App.tsx` `notePaneDrawn`, after `publish` in `componentDidMount` and `componentDidUpdate`, whenever a pane's drawn fields change:
- a picker record carries its line, whether a folder is armed, its row counts and the driver shown;
- a session or record carries its connection, its turn state as the activity line draws it, the driver shown, whether it is named, and its session id.

Vocabulary v0.15.

## signal contract

Emits `PANE_DRAWN`.

## artifact contract

- **Created:** `web/vm/signals/versions/0.15.json`, `0.15-rationale.md`.
- **Modified:** `web/app/App.tsx`, `harness/shakeout/pane_signals.ts`, `harness/shakeout/trace_files.ts`, `proposals.json`, `unemitted.json` (16 → 15), `current.json`, `WORKING_AGREEMENT.md` (prior copy `process/archive/WORKING_AGREEMENT-2026-11-07-v0.14.md`).

## observation contract

- **`pane_signals.ts`:** pane 1 is drawn through 9 states: the folder column; the folder armed; guidance; length; tone; the session not yet open; the session connected; after the reload, the picker; the restored session.
- **`trace_files.ts`:** after the "hello" turn's `TURN_ACK`, pane 1 is drawn parked and connected.
- **Plants:**
  - `armed` always false → step 2 named;
  - a parked turn written as idle → named;
  - records written only when `state` changes → step 2 named.

## result

- **Commands:** tsc 0, lint 0, build 0, unit 194, Python 321 passed 5 skipped, signals 0 (73 emitted, 15 pending).
- **Gates:** all 67 `gates:electron` commands run one at a time from source, all 0. Packaged: `pane_signals`, `trace_files`, `run_panes` 0.
- **Plants:** all three exit 1, each naming its step; restored (`cmp` equal) and rebuilt.
- **Rubber Duck Pass.** Pane 1, in order:
  - the picker, through each line;
  - session idle with no id;
  - connecting, then connecting with its id;
  - connected;
  - after the reload, the picker for one commit, then the restored session;
  - at quit, reconnecting.

  Observations:
  - **Vocabulary gaps:** two, resolved in v0.15: `connection` `idle`, and `turn_state` `failed`.
  - **Timing:** a deterministic turn's three entries landed within 4 ms (UserMessage 03:18:45.623, Returned .627) and were drawn in one commit, so the strip went from idle to parked and never drew running. Recorded; the gate asks for parked, not running.
  - **Timing:** for 210 ms between `TURN_SUBMITTED` (.411) and the first entry (.623) the activity line drew no turn. That is what the screen showed; recorded as a finding about the product.
