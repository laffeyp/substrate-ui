# Sprint 034a — server: records/bundles endpoints

```yaml
---
id: 034a
status: closed
phase: 5
pass_kind: functional
---
```

## Product-spec conformance

**Fulfills:** PRODUCT-SPEC-2026-08-17-round12.md §13 "the rail becomes
a project browser" — four buckets need distinct backends. §7b bundle
listing on-demand. §9 "one record" per session — the rail's records
bucket must not double-render live sessions the sessions bucket
already shows.

**Enables:** substrate-ui sprint 034b (four-bucket rail) reads `GET
/api/records?exclude_sessions=true` + `GET /api/bundles`; sprint 035w
(create-time controls dialog) reads `GET /api/bundles` for the bundle
picker in the new-session flow.

## Scope

Two GET endpoints on the daemon:

- `GET /api/records` gains optional `?exclude_sessions=true` query
  param. When set, drops any record whose name starts with
  `_SESSION_PREFIXES` (`launch_`, `build_`, `resume_`) or matches
  `_SESSION_ID_RE` (`^s_[0-9a-f]{8,32}$`).
- `GET /api/bundles` new; consumes `substrate.bundles.list_bundles()`
  (substrate sprint 238, closed today). Response shape per bundle:
  `{name, description, tools_enabled, slot_count}` where slot_count
  counts the three prose slots (methodology, personality, per_turn)
  that carry text.

## Artifact contract → Files created/modified

- `substrate-ui/server.py` — `_records_index(exclude_sessions=False)`
  extended with the filter; new `_bundles_index()` helper; `do_GET`
  gains the two dispatch branches.
- `substrate-ui/tests/test_server_records_bundles.py` — new; 6 test
  cases (default records list, exclude_sessions is subset of default,
  session-prefixed names filtered, bundles lists shipped defaults,
  bundle shape check, bundles sorted by name).

## Signal contract → Emits

None (server-side; no UI-emitted tags).

## Observation contract

- 6/6 pytests PASS.
- Live daemon: `GET /api/bundles` returns 5 bundles with correct
  shape; `GET /api/records?exclude_sessions=true` returns 30 records
  with zero session-prefixed names.
- Full `npm run signals` chain PASS (no regression on existing
  `/api/records` consumers).

## Halt conditions

- `dual_contract_fail` if the filter breaks existing `/api/records`
  consumers.

## Definition of done

Both endpoints live. Six pytests PASS. Live verification. Full signals
chain PASS. Cleared: sprint 034b (rail rewrite) + sprint 035w
(create-time controls) — both consumers unblocked.
