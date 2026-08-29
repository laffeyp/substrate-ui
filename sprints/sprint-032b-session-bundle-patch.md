# Sprint 032b — session bundle PATCH mid-session

```yaml
---
id: 032b
status: closed
phase: 5
pass_kind: functional
---
```

## scope

Lift `bundle` from `_NOT_YET` to `_PATCHABLE` in
`substrate-ui/server.py::_session_patch`. Add
`SessionRegistry.set_bundle(session_id, bundle)` that re-assembles the
seed transcript against the new bundle and emits
`TranscriptCompacted{reason:"bundle_changed"}` on the record.

Prerequisite for sprint 036b (bundle picker mid-session swap). Piece B
sprint 215c deferred this with an explicit 400 naming
"SessionManifest schema growth needed (piece-B follow-up)"; this sprint
is that follow-up.

Two files. One concept.

## prerequisites

- Piece-B sprint 215c closed (already true).
- Piece-H sprint 231 (default bundles shipped, already true).

## context_files

- `substrate-ui/server.py::_session_patch` — `_PATCHABLE` set +
  `_NOT_YET` set at lines 967-968; body-dispatch chain 1010-1030.
- `substrate-ui/session_registry.py::SessionRegistry` — existing
  `set_driver`, `set_name`, `set_tools`, `set_per_turn` as pattern.
- `substrate/src/substrate/topologies/session/transcript.py` — seed
  re-assembly path; check `resolve_driver_context_tokens` for the
  shape.
- `substrate/src/substrate/bundles.py::assemble_seed` — the seed
  builder the new bundle drives through.
- `signals/versions/0.7.json` (once 032a locks it) — the
  `TranscriptCompacted.reason` enum.

## artifact contract → Files created/modified

- `substrate-ui/server.py` — `_NOT_YET.remove("bundle")`;
  `_PATCHABLE.add("bundle")`; body-dispatch branch that calls
  `_SESSION_REGISTRY.set_bundle(session_id, bundle)` on a `bundle`
  key.
- `substrate-ui/session_registry.py` — new `set_bundle(session_id: str,
  bundle: str | None) -> SessionManifest`. Loads the new bundle via
  `bundles.load_bundle(name)`; re-assembles seed; writes a
  `TranscriptCompacted{reason:"bundle_changed"}` envelope onto the
  session's record; returns the updated manifest.

## signal contract → Emits

- `TranscriptCompacted{reason:"bundle_changed", session_id, prior_bundle, new_bundle}`
  — one record-side envelope per successful mid-session bundle swap.
  Substrate wire kind; not a UI signal.

## observation contract

- **UI/API driving steps**. Create a session with bundle
  `pair_coding`; `PATCH /api/session/<id> {"bundle": "daily"}`; assert
  200 response with updated manifest; `GET /api/session/<id>/record`
  contains a `TranscriptCompacted` envelope with `reason:"bundle_changed"`.
- **Expected stderr log substrings**. `PATCH /api/session/<id>` once
  with 200 status.
- **Expected record envelopes**. One `TranscriptCompacted` after the
  PATCH; `prior_bundle` equals the create-time bundle; `new_bundle`
  equals the PATCH target.
- **Regression**: `PATCH /api/session/<id> {"workspace": "..."}` still
  returns 400 (the three remaining `_NOT_YET` fields are unaffected).
- `tests/test_server_session_patch_bundle.py` new — three cases:
  successful swap, unknown bundle name 400, workspace still refused
  400.

## halt conditions

- `vocabulary_change_required` if `TranscriptCompacted.reason` in the
  substrate-side vocab does not admit the `"bundle_changed"` enum
  value. Propose via `PAYLOAD_FIELD_PROPOSED` on the substrate side.
- `dual_contract_fail` if seed re-assembly changes turn history
  (should only prepend a new seed; existing turns preserved).

## definition of done

`bundle` PATCH lands with 200; record carries the compaction envelope;
the other three deferred fields still return 400; new test green;
`npm run e2e` green.
