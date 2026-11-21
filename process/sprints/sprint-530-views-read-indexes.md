# Sprint 530 — Views read indexes, not the whole log

```yaml
---
id: 530
status: closed
phase: window productionized (roadmap 2026-11-18-window-productionizing r1, W8)
pass_kind: functional
depends_on: [529]
plan: process/planning/2026-11-18-window-productionizing/ROADMAP-2026-11-19-window-productionizing-r1.md
---
```

## scope

The session controller keeps the indexes its views need — the files a session touched, one file's history, the last message, the last end-of-turn marker — updated per batch (W2's fold), and the views that consume them (`Centre`, `LeftTabs`, `Inspector`, `Follow`, `scanActivity`, meta's lenses) read the indexes instead of scanning `rawEnvelopes` or the whole transcript. `rawEnvelopes` as a whole-session array is either bounded to a trailing window or removed in favor of the indexes and the transcript. One verifiable property: the W1 gate's heap after a forced garbage collection stays under a budget set from the session's row count, not its envelope count.

## prerequisites

- 529 (W7: windowed transcript; the transcript's DOM is bounded, now the data behind it is bounded too)

## context_files

- `../sdd-kit-3/AGENTS.md`
- `web/vm/signals/versions/current.json`
- `BLACKBOARD.md` (decision entries, tail)
- `WORKING_AGREEMENT.md`
- `web/vm/session_controller.ts` — `rawEnvelopes`, the envelope-to-row switch, `appendTranscript`, the snapshot
- `web/vm/types.ts` — the `Snapshot` type; `rawEnvelopes` and other fields that hold the whole session
- `web/app/editor/Centre.tsx` — reads file data from the snapshot
- `web/app/editor/LeftTabs.tsx` or the file tree — reads the files a session touched
- `web/reveal/transcript/Transcript.tsx` — `buildResultByCallId` scans the transcript every render
- `web/app/derive/inspector.ts` — derives inspector state from the snapshot
- `web/app/derive/follow.ts` — derives follow state
- `web/app/derive/activity_files.ts` — derives activity files

## signal contract

### Emits

No new tags.

### Consumes

- As listed in `context_files`.

### Invariants

- The vocabulary file is not modified.
- Every view that previously read from `rawEnvelopes` produces the same data from the index.
- The editor's file tree shows the same files as before.
- The inspector's derivation produces the same state.
- If `rawEnvelopes` is bounded, the last N envelopes are kept (N chosen to cover any view's lookback); if removed, no view reaches for it.

## artifact contract

### Files created

None.

### Files modified

- `web/vm/session_controller.ts` — adds per-batch index updates (file set, file history map, last-message ref, last-turn-end ref); bounds or removes `rawEnvelopes`.
- `web/vm/types.ts` — snapshot gains the index fields (or they live as controller-internal state if no view reads them from the snapshot).
- Views that currently scan `rawEnvelopes` or the full transcript are updated to read the index.

### Content assertions

- `session_controller.ts` does not spread `rawEnvelopes` per envelope (the per-envelope `[...existing, env]` is gone from W2; this sprint removes or bounds the array itself).
- Each index field is updated inside the batch fold, not per envelope.

### Command exit codes

- `npx tsc -p harness --noEmit` returns 0.
- `npm run test:unit` returns 0.
- `npm run gates:electron` — `editor_follow`, `editor_save_on_send`, `editor_history`, `tool_output_text` pass.

## observation contract

### UI driving steps

- Run the editor gates: the file tree, follow and inspector show the correct state.
- Run W1's gate: heap after forced GC is under budget.

### Expected runtime signals

- `EDITOR_DRAWN` with the correct file count.
- No `RENDERER_GONE`.

## done criteria

Views read per-batch indexes; `rawEnvelopes` is bounded or gone; the editor and inspector gates pass; W1's heap is bounded by row count, not envelope count.

## notes

- The indexes are projections: a file-set is a `Set<string>` of paths seen, a file history is a `Map<string, Array<{seq, kind}>>`, the last message is a ref to the last `UserMessage` or `AssistantMessage` row. Each is O(1) to update per envelope, O(1) to read.
- `buildResultByCallId` in `Transcript.tsx` scans the full transcript on every render. With the index approach, the controller can maintain a `resultByCallId` map updated per batch, and the transcript reads it from the snapshot.
- This sprint may touch many files (the views). If more than 2, log the bypass. The concept is one (indexed projections replacing scans).

## self-review checklist

- [ ] Scope is concrete and bounded (one paragraph; one verifiable property of the artifact).
- [ ] `context_files` covers everything the Agent needs to read.
- [ ] Signal contract's `Emits` list references only tags in the vocabulary.
- [ ] Artifact contract is gradable: content assertions are concrete, command exit codes are runnable.
- [ ] If `pass_kind: functional`: observation contract is present.
- [ ] Sprint sweet spot: likely exceeds 2 files; log bypass per hard rule 10.
