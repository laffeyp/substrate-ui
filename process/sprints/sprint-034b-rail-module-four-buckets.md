# Sprint 034b — `web/rail.ts` module + four-bucket rail

```yaml
---
id: 034b
status: closed-2026-08-28
phase: 5
pass_kind: functional
---
```

## scope

Extract the rail from `web/app.ts` into a new `web/rail.ts` module.
Rewrite it as four buckets: **live sessions**, **recent records**,
**bundles**, **records (collapsed)**. Consumes the two endpoints
sprint 034a added.

Two files. One concept: rail extraction and re-render.

## prerequisites

- 034a (server endpoints).
- 032a (v0.7 vocab lock — carries `RECORDS_LOADED.bucket`).

## context_files

- `web/app.ts` — current rail lives inline; extract from here.
- `process/HARNESS-CATALOG.md` § grader for the RECORDS_LOADED shape.
- `signals/versions/0.7.json` — the bucket payload field is now locked.

## artifact contract → Files created/modified

- `substrate-ui/web/rail.ts` — new module. Exports
  `mountRail(el: HTMLElement, api: ApiClient)`. Renders four bucket
  sections; polls records + bundles on mount; refreshes on
  `sessions:updated`.
- `substrate-ui/web/app.ts` — replaces the inline rail with
  `mountRail($("rail"), api)`. No other behavior change.
- `substrate-ui/harness/e2e_console.js` — assertion added: rail
  contains all four bucket headings after mount.

## signal contract → Emits

- `RECORDS_LOADED{bucket: "sessions" | "recent" | "bundles" | "records", count}`
  — fires once per bucket after initial render. Bucket payload field
  requires v0.7 (see 032a prerequisite).

## observation contract

- **UI driving steps**. Load `/`; assert `#rail` contains four
  bucket headings; assert live-sessions bucket updates after
  `POST /api/session`.
- **Expected stderr log substrings**. `GET /api/records?exclude_sessions=true`,
  `GET /api/bundles` each hit ≥1 time.
- **Expected grader signals**. Four `RECORDS_LOADED` events, one per
  bucket value.
- **Expected screenshot frames**. `screenshots/34b-rail-four-buckets.png`
  viewed and clean.

## halt conditions

- `vocabulary_change_required` if `RECORDS_LOADED.bucket` is absent from
  the locked vocab (means 032a did not close first).
- `dual_contract_fail` if the extraction drops any existing rail
  behavior.

## definition of done

Rail lives in `web/rail.ts`. Four buckets render. Grader accepts the
new `bucket` payload field. Screenshot viewed and clean.
