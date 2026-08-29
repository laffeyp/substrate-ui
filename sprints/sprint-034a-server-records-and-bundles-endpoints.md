# Sprint 034a — `server.py`: records/bundles endpoints

```yaml
---
id: 034a
status: pending
phase: 5
pass_kind: functional
---
```

## scope

Add two read endpoints to `substrate-ui/server.py` that the four-bucket
rail (sprint 034b) will consume:

- `GET /api/records?exclude_sessions=true` — returns non-session records
  only. Existing `GET /api/records` returns all records; the query param
  filters live sessions out server-side (the rail already renders them
  in a separate bucket).
- `GET /api/bundles` — lists every bundle from
  `substrate/src/substrate/topologies/applications/registry.py`'s
  bundle catalog. Response shape: `[{name, description, slot_count}]`.

One file. The rail rewrite (034b) is the consumer.

## context_files

- `substrate-ui/server.py` — the daemon. Existing `_records` handler is
  the anchor for the query-param extension.
- `substrate/src/substrate/topologies/applications/registry.py` — bundle
  catalog source.
- `../substrate/process/signals/current.json` — for reference.

## artifact contract → Files created/modified

- `substrate-ui/server.py` — two new handlers (or one handler with a
  branch on path), routed from `_dispatch`.
- `substrate-ui/tests/test_server_records_bundles.py` — new. Three
  cases: `GET /api/records` (unchanged), `GET /api/records?exclude_sessions=true`
  (filters live sessions), `GET /api/bundles` (lists ≥5 bundles per the
  five default bundles from piece H).

## signal contract → Emits

None (server-side; no UI-emitted tags).

## observation contract

- `POST /api/session` create a session; `GET /api/records` includes it;
  `GET /api/records?exclude_sessions=true` does not.
- `GET /api/bundles` returns the five default bundles from piece H's
  `bundles.py`.
- `test_server_records_bundles.py` green.
- Existing `npm run e2e` green (no regression on the unmodified
  `/api/records` path).

## halt conditions

- `dual_contract_fail` if filtering breaks the existing records read.

## definition of done

Both endpoints live; test green; existing e2e unchanged.
