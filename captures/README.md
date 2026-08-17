# captures/

Per-sprint JSONL snapshots of `window.__signals` captured by `harness/capture_signals.js`, graded
by `tools/capture-grade.ts` against the vocabulary invariants in `signals/versions/0.1.json`.

## Layout

- `sprint-021/console.jsonl` — the canonical Wave-1 fixture. Grows as sprints 021–028 wire more tags;
  the file name is stable so `tools/capture-grade.ts captures/sprint-021/console.jsonl` and
  `npm run signals` continue to work without rewiring paths across nine sprint closes.
- `e2e-<name>.jsonl` (optional, Sprint 031) — written by the standing e2e harnesses ONLY when
  `CAPTURE_SIGNALS=1` is set. Four fixtures: `e2e-console.jsonl`, `e2e-studio.jsonl`,
  `e2e-assay.jsonl`, `e2e-delegate.jsonl`. The e2e's DOM pass/fail is orthogonal to whether the
  signal capture succeeds. Run: `CAPTURE_SIGNALS=1 npm run e2e` (etc.).

## Regenerating

The fixture is captured live against a running server:

```
cd substrate && uv run python ../substrate-ui/server.py &        # backend on :8765
cd substrate-ui && npm run build && npm run signals              # capture + grade
```

`npm run signals` is: parity gate → capture → grade. Green means (a) every emit call site is in the
lock, (b) the run produced the expected in-order tag sequence, (c) every pairing invariant held.

## Drift and REFREEZE

The grader enforces vocabulary invariants (contains-in-order, exactly-one pairings, payload-content
constraints), not byte-identical fixture equality. Re-running `npm run capture:signals` overwrites
the file with a fresh snapshot; the grader passes as long as the invariants hold, so intentional new
tags land by wiring emits + extending the grader in the same sprint. There is no separate REFREEZE
flag — the fixture regenerates every capture; the discipline is the grader, not the diff.

## Grader outputs today (Wave-1 close, 44/44 tags)

```
[grade] loaded 333 signals from captures/sprint-021/console.jsonl
[grade] contains-in-order: PASS (all 37 expected tags in sequence).
[grade] pairing (RECORD_SELECTED → RECORD_LOADED, exactly-one + staleness-drop): PASS (4 checked).
[grade] pairing (VIEW_SWITCHED → next pane-render matches to_view): PASS (6 checked).
[grade] frame monotonic across pane-render tags: PASS.
[grade] inspector payload contents: PASS.
[grade] TURN_SUBMITTED inside CHAT_ENTERED→CHAT_EXITED: PASS (1 checked).
[grade] pairing (AGENT_LAUNCH_REQUESTED → AGENT_LAUNCHED|LAUNCH_REJECTED): PASS (1 checked).
[grade] pairing (AGENT_LAUNCHED → exactly-one FINAL_ANSWER_RENDERED|POLL_TIMEOUT): PASS (1 checked).
[grade] pairing (TOPOLOGY_LAUNCH_REQUESTED → TOPOLOGY_LAUNCHED|LAUNCH_REJECTED): PASS (2 checked).
[grade] incident payloads (FETCH_FAILED, LAUNCH_REJECTED, POLL_TIMEOUT): PASS.
[grade] CHAT_EXITED.turns_in_conversation matches TURN_SUBMITTED count: PASS.
[grade] pairing (DIFF_REQUESTED → DIFF_RENDERED): PASS (1 checked).
[grade] PASS
```
