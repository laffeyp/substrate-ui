# Sprint 535 — T4 tolerates a batched backlog (the W1 gate goes green)

```yaml
---
id: 535
status: pending
phase: window productionized (roadmap 2026-11-18-window-productionizing r1; closes the W1 gate)
pass_kind: architecture
depends_on: [524, 529, 523]
plan: process/planning/2026-11-18-window-productionizing/ROADMAP-2026-11-19-window-productionizing-r1.md
---
```

## scope

The runtime checker's `T4` rule (`electron/invariants.ts`) requires a pane's `STREAM_ENVELOPE_APPENDED` to be answered by a `TRANSCRIPT_ROW_DRAWN` or `_SKIPPED` for the same seq within `TEMPORAL_WITHIN_MS["T4"]` (1,000 ms). Sprint 524 folds a pane's envelopes per animation frame, so opening a long session draws a large backlog over many seconds; a row appended early draws well after 1 s from its own append, and `T4` fires once per such row (~817 times on the W1 gate's 37,606-envelope replay). `T4`'s per-row deadline is the wrong contract under batched rendering, but it must still catch a genuinely stuck renderer. Rewrite `T4` as a progress watchdog that is O(1) amortized per record: while a pane has rows appended but not yet drawn/skipped, `T4` breaks only if the pane draws or skips **nothing** for 1,000 ms. One verifiable property: the W1 gate (`harness/shakeout/long_session_open.ts`) exits 0 — all four window checks pass AND zero `INVARIANT_BROKEN` — while a unit test proves `T4` still breaks when a pane stops drawing with rows pending.

## prerequisites

- 524 (W2, batched fold — the reason the backlog draws over time), 529 (W7, windowed transcript), 523 (W1 gate).

## context_files

- `../sdd-kit-3/AGENTS.md`
- `web/vm/signals/versions/current.json`
- `BLACKBOARD.md` (decision entries; the 2026-11-21 `built` and `surfaced` entries on the W1 gate and T4 at the tail)
- `WORKING_AGREEMENT.md`
- `electron/invariants.ts` — the whole checker. Read: `createChecker`, the `Wait` type, `waits`, `wait()`, `expire()` (loops every wait per call — this is why a watchdog that keeps waits alive turns the checker O(n²): a prior attempt reset each wait's clock on every progress record and the pending-wait array grew to backlog size, collapsing the run to ~1,700 rows), `see()`, `tick()`, the `T4` branch (`case Signal.STREAM_ENVELOPE_APPENDED`), the `TEMPORAL_WITHIN_MS` table, `TRANSCRIPT_ROW_DRAWN`/`_SKIPPED` handling.
- `web/app/__tests__/invariants.spec.ts` — the checker's unit tests (16); extend, do not break them.
- `harness/shakeout/long_session_open.ts` — the W1 gate this card must take green; read its four checks and that cleanup fails on any `INVARIANT_BROKEN`.

## signal contract

### Emits

No new tags. `T4` already fires `INVARIANT_BROKEN`; this card changes when, not the tag.

### Invariants

- The vocabulary file is not modified.
- `T1`, `T2`, `T3`, `T5`, `T6` are unchanged.
- `T4` still breaks when a pane has a row pending and draws/skips nothing for its window — a stuck renderer.
- The checker is O(1) amortized per record: no per-record loop whose length grows with the number of pending appends. (The existing `expire()` loop is acceptable only if the `T4` redesign stops the pending-wait array from growing with backlog depth — e.g. do not create one wait per appended envelope for T4; track per pane the count of unanswered appends and the last draw/skip time.)

## artifact contract

### Files modified

- `electron/invariants.ts` — the `T4` mechanism.
- `web/app/__tests__/invariants.spec.ts` — add the watchdog tests.

### Content assertions

- `electron/invariants.ts` no longer creates a per-envelope `T4` `Wait` whose expiry is measured from its own append time (grep: the `case Signal.STREAM_ENVELOPE_APPENDED` no longer calls `wait("T4", ...)`, or the expiry base is the pane's last-progress time, structured so pending T4 state is O(1) per pane, not O(appends)).
- `web/app/__tests__/invariants.spec.ts` asserts: (a) a pane that appends many rows and draws/skips at least one every <1,000 ms yields zero `T4` breaks even when a given row's own draw lags >1,000 ms from its append; (b) a pane with a row appended that then draws/skips nothing for >1,000 ms yields one `T4` break.

### Command exit codes

- `npm run build` returns 0.
- `npx tsc -p harness --noEmit` returns 0.
- `npx tsx --test web/app/__tests__/invariants.spec.ts` returns 0 (the 16 existing plus the new tests).
- `npx tsx harness/shakeout/long_session_open.ts` returns 0 — all four checks pass and zero `INVARIANT_BROKEN`. Run it on an otherwise-idle machine (concurrent builds peg the main-process checker and skew the replay); if a run draws far fewer than ~37,000 rows, suspect machine load or an O(n²) regression in the checker, not the window.

## observation contract

### Expected runtime signals

- Across the W1 gate replay: zero `INVARIANT_BROKEN` of rule `T4`.
- `TRANSCRIPT_ROW_DRAWN` reaches a seq within 500 of the record's last (the window follows to the bottom).
- No `RENDERER_GONE`.

## done criteria

`T4` catches a stuck renderer but tolerates a batched backlog drain; the W1 gate exits 0 on an idle machine; the checker stays O(1) amortized per record.

## notes

- The failed prior attempt (reverted): a per-pane `lastProgress` stamp read in `expire()` as `max(w.at, lastProgress)`. It was correct in intent but kept the per-envelope `T4` waits alive, so the `waits` array grew to ~37k and `expire()`'s per-record full scan went O(n²), collapsing the run. The fix must remove the per-envelope wait growth for T4, not just change its expiry base. One shape: per pane, hold `appendedCount`, `answeredCount`, and `lastProgressAt`; on a draw/skip bump `answeredCount` and set `lastProgressAt`; in `tick()`/`see()`, break `T4` once if `appendedCount > answeredCount` and `now - lastProgressAt > within`. Decide the exact structure on the grounds and record it.
- `T4`'s per-seq attribution (which row was late) is lost in a count-based watchdog; that is acceptable — `T4`'s purpose is "the renderer is keeping up," not "this seq was late." Note the trade in the rationale.

## self-review checklist

- [ ] Scope names one verifiable property (gate exits 0 + the stuck-renderer test).
- [ ] context_files covers the checker, its tests, and the gate.
- [ ] No vocabulary change; `Emits` unchanged.
- [ ] Artifact contract is gradable; the gate command is the end check.
- [ ] Observation contract present (zero T4 breaks; follows to bottom).
- [ ] ≤2 files + its test; one concept (T4 as a watchdog).
```
