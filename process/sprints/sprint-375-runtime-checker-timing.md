# Sprint 375 — the runtime checker: the timing rules within main and each window

```yaml
---
id: 375
status: closed
phase: SDD re-centre
pass_kind: architecture
---
```

## scope

Plan r3 item 5, second link. `electron/invariants.ts` checks the vocabulary's timing rules whose records main sees:
- **T1:** SERVER_SPAWNED, then SERVER_BOUND within 5000 ms.
- **T3:** APP_QUIT_REQUESTED, then APP_QUIT_COMPLETED within 45000 ms.
- **T4:** a pane's STREAM_ENVELOPE_APPENDED, then its TRANSCRIPT_ROW_DRAWN or TRANSCRIPT_ROW_SKIPPED, same pane and seq, within 1000 ms.
- **T5:** a pane's SESSION_OPEN_REQUESTED, then its SESSION_OPEN_ACKED or SESSION_OPEN_REFUSED within 10000 ms.
- **T6:** a pane's TURN_SUBMITTED, then its TURN_ACK, TURN_REFUSED or TURN_REFUSED_VIEW_ONLY within 10000 ms.

How the waits work:
- **The windows come from the vocabulary.** The generator writes `TEMPORAL_WITHIN_MS`, each `temporal_invariants` window by id, into both `signals.gen.ts` files. The checker retypes no number.
- **The clock is main's monotonic clock**, as records reach the checker. Wall time is never read.
- **A break is found** by the next record, or by `tick()`. Main calls `tick()` every 250 ms on an unref'd timer, and once before its closing record, so a break comes before APP_QUIT_COMPLETED (S2).
- **A wait ends without a break** when its pane closes, or its window reloads or closes. A wait still open at the end of the boot is not reported, because its window had not passed.

T2 (SERVER_BOUND to the server's SERVER_STARTED) needs the server's records and goes with sprint 376.

## context_files

- `web/vm/signals/versions/0.21.json` (`temporal_invariants`); `scripts/gen_signals.py`
- `electron/invariants.ts`, `electron/main.ts` (`checkRecord`, `closeTrace`)
- `web/vm/session_controller.ts` (open, turn, envelope); `web/reveal/transcript/Row.tsx`, `Transcript.tsx` (row drawn, row skipped)

## signal contract

### Emits

- `INVARIANT_BROKEN` (`rule` T1, T3, T4, T5 or T6; `context.state`: the record that opened the wait, `pane_id`, `within_ms`, `waited_ms`)

## artifact contract

### Files modified

- `electron/invariants.ts`, `electron/main.ts`; `scripts/gen_signals.py` and its outputs; `web/app/__tests__/invariants.spec.ts`; `harness/shakeout/invariant_signals.ts`

### Command exit codes

`npm run build` 0; `npm run test:unit` 0; `gen_signals.py --check` 0; `npm run signals` 0.

## observation contract

`harness/shakeout/invariant_signals.ts`, from source and packaged:
- After its eight ordering plants, the gate plants on panes 931–933, through the window channel:
  1. an envelope appended with no row;
  2. an open requested with no answer;
  3. a turn submitted with no answer.
- `main.jsonl` then holds T4, T5 and T6 after the eight ordering breaks, in that order, each with `waited_ms` over `within_ms`.

T1 and T3 are main's own records and are planted in the spec, which runs each rule's late answer found both by `tick()` and by the next record. Every source gate is also a normal run, and none may leave a timing break.

Plant: with the checker's expiry never breaking, the gate's T4, T5 and T6 never appear. A plant that removes only main's timer is weaker, because any later window record finds the break through `see()`.

## done criteria

A wait that passes its window without an answer is followed in the trace by an incident naming the rule, the record that opened it and how long it waited; the app's normal runs break none.

## result

- **Spec:** 12 cases, each timing rule late by tick and by the next record.
- **Gate:** `invariant_signals` 0 from source and packaged: T4, T5 and T6 after the ordering plants. The expiry plant fails it.
- **Quit (found on the packaged `key_signals`, 2026-11-08):** from APP_QUIT_REQUESTED every wait but T3's ends and none opens. A quitting app's window drew no row for the server's SessionEnded before it closed. A wait already late before the quit still breaks.
