# Sprint 034b CLOSEOUT ADDENDUM — four-bucket rail

Rule 12 (append-only) addendum to `sprint-034b-rail-module-four-buckets.md`.
The card as pending named `e2e_console.js` as the harness site; on close,
the rail assertions landed in a new file `capture_rail_four_buckets.js`
instead, because the legacy console harness is scheduled for deletion in
037c and coupling 034b's proof to a doomed harness would move work to
037c that doesn't belong there.

## Deviations from the pending card

- **New harness file** `harness/capture_rail_four_buckets.js` (fourteen
  assertions) rather than adding lines to `harness/e2e_console.js`. The
  legacy console harness is untouched; its `.rail-clear` selector still
  resolves because the "recent records" bucket keeps the same
  `<span class="rail-clear">` element when runs.length > 0.
- **`web/rail.ts` exports** `mountRail(el, deps)` + `RailHandle` type.
  Deps: `{api, escapeHtml, selectRecord, onRailPopulated?}`. The
  `onRailPopulated(records)` callback carries the raw records array back
  to `app.ts` so the diff-selector, `STATE.resumable`, and first-load
  auto-select can stay where they were.
- **Fifth emit per refresh not needed.** The card's four emits (one per
  bucket) is the whole contract. No aggregate `RECORDS_LOADED{count:total}`.
- **`check:tsc-new` regex** extended to include `rail\.ts` so the new
  file is under the same type-clean gate as `state`, `terminal`, and the
  other piece-G additions.

## Signal contract — what actually fires

Four `RECORDS_LOADED{bucket, count, run_count, demo_count}` events per
refresh — `bucket ∈ {sessions, recent, bundles, records}`. `count` is
the entry count for that bucket. `run_count` / `demo_count` retained
for grader-schema stability (both zero on non-record buckets).

## Observation contract — what passed

- Fourteen assertions in `capture_rail_four_buckets.js` PASS.
- Full `npm run signals` chain PASS across ten fixtures (`capture:signals`
  intact; the legacy dock harness continues to find `.rail-clear`).
- `check:tsc-new` clean with rail.ts in the whitelist.
- Bundles bucket rendered 5 entries (session + four apps from 034a's
  `list_bundles`). Records bucket rendered 30 non-run records matching
  `/api/records?exclude_sessions=true`.

## Definition of done — satisfied

- `web/rail.ts` exists and owns the rail render.
- `web/app.ts::loadRecords` is a thin wrapper that delegates to
  `mountRail.refresh()` and threads the records back to the app's
  diff-selector + STATE.resumable + auto-select via callback.
- Four buckets render in the fixed order sessions → recent → bundles →
  records.
- Four `RECORDS_LOADED` emits per refresh, one per bucket.
- Full signals chain green.
