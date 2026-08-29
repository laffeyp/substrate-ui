# Sprint 034 — `web/rail.ts` + rail rewrite (four buckets)

```yaml
---
id: 034
status: pending
phase: 5
pass_kind: implementation
---
```

## scope

TECH-SPEC §10 line 10. Today's rail (`web/app.ts::loadRecords`) shows
two groups: `your runs` (session records under `~/.substrate/sessions/`)
and `demos` (bundled). Piece G's rail is four buckets:
`live sessions` (running or parked, per `GET /api/session`), `recent
records` (finished runs, newest first), `bundles` (per new
`GET /api/bundles`), `records (collapsed)` (the debug fallthrough via
`GET /api/records?exclude_sessions=true`).

Extract the rail logic into `web/rail.ts` — a first module split off
app.ts. app.ts imports and mounts. Rail state stays local to the
module.

Two backend additions:

- `GET /api/records?exclude_sessions=true` — `_records_index` filters
  out records whose manifest has a `session_id` field.
- `GET /api/bundles` — walks `~/.substrate/bundles/` + the shipped
  defaults under `substrate/topologies/**/bundle/` (piece H sprint 231
  shipped both). Returns `[{name, description, source: "user" | "shipped"}]`.

## context_files

- `web/app.ts:75-137` — current `loadRecords` + rail rendering.
- `substrate-ui/server.py::_session_list` (piece B) — `GET /api/session`
  already returns `{live: [...], parked: [...], ended: [...], interrupted: [...]}`.
- `substrate/src/substrate/bundles.py` (piece H sprint 229) — `load_bundle`
  + `_shipped_bundle_dir` for the shipped-defaults fallback.
- `process/HARNESS-CATALOG.md` § signal-trace — grader's
  `RECORDS_LOADED` tag; extend `EXPECTED_ORDER` with the four-bucket
  fixture.

## artifact contract → Files created/modified

- `substrate-ui/web/rail.ts` — new module. Exports `mountRail(el:
  HTMLElement, onSelect: (name: string) => void, onBundleSelect:
  (name: string) => void)`. Handles the four sections + their
  respective fetches; emits `RECORDS_LOADED` per bucket load with
  `bucket: "live" | "parked" | "recent" | "bundle"`.
- `substrate-ui/web/app.ts` — replaces the inline `loadRecords` call
  with `mountRail($("rail"), selectRecord, selectBundle)`; removes the
  old `groupHdr`/`mkRec` helpers.
- `substrate-ui/server.py` — `_records_index` gains an
  `exclude_sessions` query param; new `_bundles_index` + GET route
  `/api/bundles`.
- `substrate-ui/signals/versions/current.json` — no bump; `bucket` is
  a new `RECORDS_LOADED` payload field. If v0.6's payload schema
  requires an addition, propose `PAYLOAD_FIELD_PROPOSED:
  RECORDS_LOADED.bucket` per the 8-kind vocabulary evolution
  taxonomy; land in v0.7 if the Architect ratifies.
- `substrate-ui/tools/capture-grade.ts` — `EXPECTED_ORDER` includes at
  least one `RECORDS_LOADED` per bucket during the fixture path.
- `substrate-ui/sprints/sprint-034-rail-rewrite-four-buckets.md` —
  this file.

## signal contract → Emits

`RECORDS_LOADED{bucket, count, run_count?, demo_count?}` (four calls,
one per bucket, in the fixture). Vocab may require the PAYLOAD_FIELD
proposal above. Parity gate exit 0.

## observation contract

- **UI driving steps**. Open the console; assert four rail sections
  render (headers include "live sessions", "recent records",
  "bundles", "records"); create a session via API; assert the "live
  sessions" section grows.
- **Expected stderr log substrings**. `GET /api/records?exclude_sessions=true`
  and `GET /api/bundles` observed in server access logs.
- **Expected runtime signals on the record**. None (rail-only sprint).
- **Expected grader signals**. Four `RECORDS_LOADED` fires with
  distinct `bucket` values before the first `PANE_SWITCHED`.
- **Expected screenshot frames**. One: `screenshots/34-rail-four-buckets.png`.

## halt conditions

- `vocabulary_change_required` if `RECORDS_LOADED.bucket` needs a
  new value beyond the four documented (surface a
  `PAYLOAD_FIELD_PROPOSED` per the 8-kind taxonomy).

## definition of done

Rail extracted into its own module. Four buckets on disk + wired to
their endpoints. `RECORDS_LOADED` fires per bucket. Grader green.
Screenshot viewed and clean.
