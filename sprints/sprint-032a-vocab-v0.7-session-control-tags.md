# Sprint 032a — vocab v0.7 lock: session-control tags

```yaml
---
id: 032a
status: pending
phase: 5
pass_kind: architecture
---
```

## scope

Bump the substrate-ui vocabulary from v0.6 to v0.7. v0.7 adds five
session-control tags plus one payload-field extension. Prerequisite for
sprints 034b (RECORDS_LOADED.bucket) and 036a-e (five session-control
tags). Without this lock, those sprints halt on `vocabulary_change_required`
at first emit.

## context_files

- `signals/versions/0.6.json` — the current lock.
- `signals/versions/current.json` — the pointer symlink.
- `process/HARNESS-CATALOG.md` § "vocabulary sync tools".
- `tools/check-vocabulary-parity.ts` — enforces closed-set membership.

## artifact contract → Files created/modified

- `signals/versions/0.7.json` — new locked file. Copy of 0.6 + the six
  additions below.
- `signals/versions/current.json` — repointed from 0.6.json to 0.7.json.
- `signals/versions/0.7-rationale.md` — new. Per-addition rationale +
  source-sprint citations.

Additions:

- `DRIVER_PATCHED{session_id, driver, prior_driver}` — category
  `driver_session`. Fires on `PATCH /api/session/<id> {driver}` round-trip.
- `BUNDLE_ATTACHED{session_id, bundle, prior_bundle}` — category
  `driver_session`. Fires on bundle attach (POST at create-time OR PATCH
  mid-session).
- `WORKSPACE_SELECTED{session_id, workspace, workspace_shape}` — category
  `driver_session`. Create-time only.
- `TOOLS_RESTRICTED{session_id, tools}` — category `driver_session`.
  `tools` is a sorted array of tool names.
- `ISOLATE_TOGGLED{session_id, isolate}` — category `driver_session`.
  Create-time only.
- `RECORDS_LOADED.bucket` payload field — optional string, one of
  `sessions | recent | bundles | records`. Extends the existing
  `RECORDS_LOADED` tag.

## signal contract → Emits

None (vocab-lock sprint). The additions become emittable from 036a-e and
034b once this closes.

## observation contract

- `signals/versions/0.7.json` parses; JSON Schema Draft-07 valid.
- `signals/versions/current.json` resolves to `0.7.json`.
- `npm run check:vocab-parity` green (closed set unchanged for existing
  emits; new tags not yet used).
- `npm run e2e && npm run e2e:studio && npm run e2e:assay && npm run
  e2e:delegate` green (no regression).
- `signals/versions/0.7-rationale.md` cites 036a-e and 034b as the
  motivating sprints.

## halt conditions

- `dual_contract_fail` if any existing emit's `substrate_kind` value fails
  the v0.7 closed-set check.

## definition of done

v0.7 locked; pointer bumped; rationale on disk; parity + e2e green.
Sprints 034b and 036a-e cleared to dispatch.
