# Sprint 036b — bundle picker

```yaml
---
id: 036b
status: pending
phase: 5
pass_kind: functional
---
```

## scope

One control: bundle picker. Two entry points: new-session dialog
(POST at create) and session-header "attach bundle" (PATCH
mid-session). Mid-session attach re-assembles the seed transcript and
emits `TranscriptCompacted{reason:"bundle_changed"}` on the record.

Two files. One concept.

## prerequisites

- 032a (v0.7 vocab lock — `BUNDLE_ATTACHED`).
- 033 (two-view scaffold).
- 034a (`GET /api/bundles` endpoint the picker reads).
- **Substrate-side `sprint-215e-bundle-patch-and-list-bundles`** —
  lifts `bundle` from `_NOT_YET` to `_PATCHABLE` in
  `substrate-ui/server.py::_session_patch`, adds
  `_SESSION_REGISTRY.set_bundle(session_id, bundle)` that re-assembles
  the seed transcript and emits
  `TranscriptCompacted{reason:"bundle_changed"}` on the record. Today's
  `_session_patch` returns 400 on `bundle`; without 215e, the
  mid-session PATCH path this card exercises fails at the daemon.

## context_files

- `substrate-ui/web/app.ts` — new-session dialog + session-header.
- `substrate-ui/server.py::_session_create` — POST accepts `bundle`.
- `substrate-ui/server.py::_session_patch` — PATCH accepts `bundle`
  and triggers seed re-assembly.
- `signals/versions/0.7.json` — `BUNDLE_ATTACHED` payload.
- **Shared wire (SPEC-3):** reuse the terminal-side `/bundle` slash
  helpers from sprint 035w (create-time queue) and 035s (mid-session
  PATCH). `web/terminal.ts::_slashRoute` case `/bundle` fires
  BUNDLE_ATTACHED with `{bundle, prior_bundle}` on ACK; the desktop
  picker shares the wire.

## artifact contract → Files created/modified

- `substrate-ui/web/controls/bundle_picker.ts` — new. Exports
  `mountBundlePicker(root: HTMLElement, opts?)` following the
  `terminal.ts::mountTerminal` shape (ARCH-5).
- `substrate-ui/web/index.html` — `#bundle-picker` in new-session
  dialog + `#bundle-attach` in session-header.
- `substrate-ui/web/app.ts` — import + `mountBundlePicker($("bundle-picker"))`
  only.

## signal contract → Emits

- `BUNDLE_ATTACHED{session_id, bundle, prior_bundle}` — once per
  attach round-trip. `prior_bundle` is null on create-time attach.

## observation contract

- **UI driving steps**. Create a session with bundle `pair_coding`;
  mid-session change bundle to `daily`; assert manifest carries new
  bundle; assert record has `TranscriptCompacted{reason:"bundle_changed"}`.
- **Expected stderr log substrings**. `POST /api/session` once;
  `PATCH /api/session/<id>` once.
- **Expected grader signals**. `BUNDLE_ATTACHED` twice (create + swap).
- **Expected screenshot frames**. `screenshots/36b-bundle-picker.png`.
- Parity: CLI `/bundle` slash produces the same manifest state.

## halt conditions

- `vocabulary_change_required` if `BUNDLE_ATTACHED` missing.
- `dual_contract_fail` on parity divergence or missing
  `TranscriptCompacted` on swap.

## definition of done

Both mount points wired; POST + PATCH paths land; manifest updates;
transcript compaction fires on swap; parity green.
