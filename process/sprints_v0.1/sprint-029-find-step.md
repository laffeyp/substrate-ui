# Sprint 029 — find step (silent walk over matches)

---
id: 029
epic: H — Find
status: pending
phase: 3
pass_kind: architecture
spec_reference: signals/0.1.json § find — Layer 1 v0.1 carries FIND_OPENED / FIND_SCOPE_CHANGED / FIND_QUERY_CHANGED / FIND_CLOSED (no per-step tag; the step is UI-only)
prerequisites: 028 closed
---

## scope

Enter / Shift-Enter steps forward / back through the match set the current FIND_QUERY_CHANGED settled on. Sprint 028 already emits `match_count` on every query change; this sprint adds the walk (which match_index is highlighted) as a silent per-key UI update. Wraparound both directions.

No new tag: Layer 1 v0.1 ratified four find tags (OPENED / SCOPE_CHANGED / QUERY_CHANGED / CLOSED) and no MATCH_STEPPED. The observation contract grades on DOM state (which match carries the `.find-active` class) plus the standing `match_count` in the last FIND_QUERY_CHANGED.

## signal contract

### Emits

None. This sprint modifies UI behaviour without extending Layer 1.

### Consumes

The `match_count` from the last FIND_QUERY_CHANGED (Sprint 028); Enter / Shift-Enter keys.

## artifact contract

### Files

- `src/render/FindBar.tsx` — Enter/Shift-Enter handlers; `match_index` state
- `src/lib/findMatches.ts` — match list; step helpers
- `tests/harness/e2e_find_step.js`

### Content assertions

- `match_index ∈ [0, match_count)` with wraparound both directions
- No new tag names appear in the emitted JSONL during the walk (grep proof)

### Command exit codes

- `node tests/harness/e2e_find_step.js` returns 0

## observation contract

### Driving steps

1. Open find on a transcript with 3 hits of "hello" (Sprint 028's FIND_OPENED + FIND_QUERY_CHANGED{match_count:3} fire)
2. Enter three times; assert `.find-active` moves through matches 0 → 1 → 2 → 0 (wrap)
3. Assert the harness JSONL carries FOUR find tags total (one OPEN + one QUERY_CHANGED + one CLOSE at teardown), no more

### Three-channel agreement

- Structural: exactly one `.find-active` DOM element at any time; the highlighted position walks with Enter
- Perceptual: `anchor-pane-<id>-find` byte holds constant through the walk (scope + open state don't change; only match_index does, which has no anchor)
- Log ↔ signal: zero MATCH_STEPPED tags emitted (Layer 1 v0.1 doesn't ratify one); the walk is silent in the trace

## done criteria

Step forward/back with wrap works; the trace stays clean of invented tags. Epic H closes. Sprint 030 (slash router — repurposed from PaneHeader after the D42 fix moved header to Sprint 002) dispatches next.
