# Sprint 023 — stream + inspector

```yaml
---
id: 023
status: closed
phase: 3
pass_kind: implementation
---
```

## scope

Wire three emit sites: `STREAM_RENDERED` at `renderStream()` tail (carries the universal view payload plus `line_count`); `EVENT_INSPECTED` at `inspectEvent()` entry (carries `seq`, `kind`, `subject_record`); `PRODUCER_INSPECTED` at `inspectProducer()` entry (carries `instance`, `kind`, `subject_record`). Extend the grader with the vocab invariant: `EVENT_INSPECTED.seq` and `EVENT_INSPECTED.kind` must match a real event in the capture's `STATE.events` proxy (we assert `seq >= 0` and `kind` non-empty since we don't hold event tables in the grader); `PRODUCER_INSPECTED.instance` non-empty and `kind` non-empty. Extend the harness to click one event and one lane so the fixture carries both inspects.

## context_files

- `signals/versions/0.1.json` (stream category; `EVENT_INSPECTED`, `PRODUCER_INSPECTED` invariants)
- `web/app.ts` (`renderStream`, `inspectEvent`, `inspectProducer`)
- `tools/capture-grade.ts`
- `harness/capture_signals.js`

## artifact contract → Files created/modified

- `substrate-ui/web/app.ts` — three `emit(...)` calls.
- `substrate-ui/tools/capture-grade.ts` — `STREAM_RENDERED` added to the pane-render set (for `checkFrameMonotonic`); payload-content checks for `EVENT_INSPECTED` + `PRODUCER_INSPECTED`.
- `substrate-ui/harness/capture_signals.js` — click one `.ev` and one `.lane`.
- `substrate-ui/captures/sprint-021/console.jsonl` — regenerated.
- `substrate-ui/sprints/sprint-023-stream-inspector.md` — this file, closed with rubber duck pass.

## signal contract → Emits

`STREAM_RENDERED`, `EVENT_INSPECTED`, `PRODUCER_INSPECTED` all present in the fixture; all prior tags still present.

## observation contract

- Harness clicks `.ev[data-seq]` (the first event row) and `.lane[data-inst]` (the first lane).
- Expected fixture: `STREAM_RENDERED` fires alongside every pane-render (renderStream runs inside render() when mode!==io); `EVENT_INSPECTED` and `PRODUCER_INSPECTED` each fire at least once with non-empty required fields; `frame` monotonic across the extended pane-render set.

## dual-contract close

Four gates: parity, build, e2e, grader all green.

## rubber duck pass

*Sequence narration:* every non-io render() now paints STREAM_RENDERED alongside the pane-tag (frame counter interleaves stream + pane + health). Harness returns to run view, clicks the first stream event → EVENT_INSPECTED(seq=0, kind=substrate.RunStarted); clicks the first lane → PRODUCER_INSPECTED(instance=<uuid>, kind=<producer-kind>). Both carry the current subject_record. Fixture grew 237 → 350 signals; expected order now 18 tags, all present in sequence.

*Observations:* missing pair — none; order — VIEW_SWITCHED → pane-render invariant now checked at 6 switches (added the return-to-run before inspector clicks), all within 500 ms; vocabulary gap — none (20 distinct emits, all locked); payload anomaly — none (EVENT_INSPECTED.seq ≥ 0, kind non-empty; PRODUCER_INSPECTED.instance/kind non-empty); timing surprise — none; tone trace — payloads structural.

*Adversarial pass:* could inspectProducer emit `kind: "unknown"` and pass? Yes, if `STATE.graph.instances` is missing the instance. The fallback covers the case where a lane click races the graph mutation. The grader's payload check only asserts non-empty string; "unknown" would pass. That's an accepted trade — refusing the emit would drop a real inspector event; a stronger check would need to consult the record's manifest, which the grader doesn't hold. Noted on drift watchlist for later strengthening if false-positives arrive. Zero halted, zero surfaced.

## follow-on

Sprint 024 — terminal subsystem, 6 tags (TERMINAL_OPENED, TERMINAL_CLOSED, CHAT_ENTERED, CHAT_EXITED, MODEL_SELECTED, PARAMS_CHANGED).

