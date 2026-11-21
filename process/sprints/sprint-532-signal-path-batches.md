# Sprint 532 — The signal path batches

```yaml
---
id: 532
status: pending
phase: window productionized (roadmap 2026-11-18-window-productionizing r1, W10)
pass_kind: functional
depends_on: [531]
plan: process/planning/2026-11-18-window-productionizing/ROADMAP-2026-11-19-window-productionizing-r1.md
---
```

## scope

The page sends its signal records to main once per animation frame, not once per record. Main writes them asynchronously (non-blocking file I/O or a write queue). The runtime checker reads `server.jsonl` on its timer, not per record. The per-envelope tags `STREAM_ENVELOPE_APPENDED` and `TRANSCRIPT_ROW_SKIPPED` become per-batch summaries: one `STREAM_BATCH_FOLDED` per batch with `{ count, first_seq, last_seq }` replaces the per-envelope `STREAM_ENVELOPE_APPENDED`; one `TRANSCRIPT_ROWS_SKIPPED` per batch with `{ count, reasons: Record<string, number> }` replaces the per-envelope `TRANSCRIPT_ROW_SKIPPED`. The vocabulary change is proposed, ratified, version bumped, and recorded. Gates that counted the per-envelope tags are updated to count the batch summaries. One verifiable property: W1's trace holds one `STREAM_BATCH_FOLDED` per animation-frame batch, not one `STREAM_ENVELOPE_APPENDED` per envelope, and no `TRACE_LOST`.

## prerequisites

- 531 (W9: root renders on own inputs; the render path is fixed, now the signal path is fixed)

## context_files

- `../sdd-kit-3/AGENTS.md`
- `web/vm/signals/versions/current.json`
- `BLACKBOARD.md` (decision entries, tail)
- `WORKING_AGREEMENT.md`
- `web/vm/instrumentation/sdd.ts` — the page's signal emitter; how records reach main
- `electron/main.ts` — `traceEmit`, the trace writer (blocking `fs.writeFileSync`), the runtime checker's timer
- `electron/invariants.ts` — the runtime checker; how it reads `server.jsonl`
- `electron/preload.ts` — the IPC bridge for signals

## signal contract

### Emits

- `STREAM_BATCH_FOLDED` (new tag, proposed): `{ count: number, first_seq: number, last_seq: number }`.
- `TRANSCRIPT_ROWS_SKIPPED` (new tag, proposed): `{ count: number, reasons: Record<string, number> }`.
- `STREAM_ENVELOPE_APPENDED` and `TRANSCRIPT_ROW_SKIPPED` are retired (or kept for the rare single-envelope case — decided in the proposal).

### Consumes

- As listed in `context_files`.

### Invariants

- The vocabulary change is proposed, ratified, version bumped, and recorded.
- No `TRACE_LOST` in W1's trace (the batch path does not outrun the writer).
- The runtime checker's invariant checks still work: ordering, timing, pairing rules apply to the batch summaries.
- Gates that previously asserted per-envelope signal counts are updated to assert per-batch counts.

## artifact contract

### Files created

None.

### Files modified

- `web/vm/instrumentation/sdd.ts` — buffers records and flushes once per rAF.
- `web/vm/session_controller.ts` — emits `STREAM_BATCH_FOLDED` and `TRANSCRIPT_ROWS_SKIPPED` per batch instead of per-envelope tags.
- `electron/main.ts` — the trace writer uses `fs.write` (async) or a write queue instead of `fs.writeFileSync`.
- `electron/invariants.ts` — updated for the new tag names and batch semantics.
- Vocabulary files — new version with the two new tags and the retired ones.
- Gates that count `STREAM_ENVELOPE_APPENDED` or `TRANSCRIPT_ROW_SKIPPED` — updated.

### Content assertions

- `sdd.ts` contains `requestAnimationFrame` or a frame-based flush.
- `main.ts` does not contain `writeFileSync` for trace records (or the blocking write is replaced).
- The vocabulary's new tags have the payload shapes named above.

### Command exit codes

- `npx tsc -p harness --noEmit` returns 0.
- `npm run test:unit` returns 0 (includes `npm run signals`).
- `npm run gates:electron` — `sdd_signals` and all existing gates pass.

## observation contract

### UI driving steps

- Run the W1 gate: the trace holds batch summaries, not per-envelope tags.
- Run the `sdd_signals` gate: the signal-capture assertions hold.

### Expected runtime signals

- `STREAM_BATCH_FOLDED` tags in the trace, one per batch.
- No `TRACE_LOST`.
- No per-envelope `STREAM_ENVELOPE_APPENDED`.

## done criteria

The signal path batches records per frame; main writes asynchronously; per-envelope tags are replaced by per-batch summaries; the vocabulary is bumped; gates are updated; no trace losses.

## notes

- The trace writer's blocking `writeFileSync` was noted in the R5 research as not a cause today (main was idle) but contrary to Electron's guidance. This sprint fixes it alongside the batching.
- The signal buffer in `sdd.ts` follows the same rAF pattern as W2's envelope buffer in the controller. If the two can share a frame callback, they should; if not, each schedules its own.
- Retiring tags: the vocabulary's evolution type is `deprecated` (per `grammar/PRINCIPLES.md`). The old tags stay in the vocabulary with a `deprecated_at` field; no code emits them.
- This sprint touches many files. Log the bypass.

## self-review checklist

- [ ] Scope is concrete and bounded (one paragraph; one verifiable property of the artifact).
- [ ] `context_files` covers everything the Agent needs to read.
- [ ] Signal contract's `Emits` list references only tags in the vocabulary (or the proposed bump).
- [ ] Artifact contract is gradable: content assertions are concrete, command exit codes are runnable.
- [ ] If `pass_kind: functional`: observation contract is present.
- [ ] Sprint sweet spot: exceeds 2 files; log bypass per hard rule 10.
