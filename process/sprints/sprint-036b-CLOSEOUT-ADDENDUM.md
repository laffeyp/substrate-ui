# Sprint 036b CLOSEOUT ADDENDUM — desktop-view bundle picker

Rule 12 addendum to `sprint-036b-bundle-picker.md`.

## Deviations from the pending card

- **One mount point, not two.** The card scoped two entry points: a
  new-session dialog (POST at create) and a session-header attach picker
  (PATCH mid-session). No new-session dialog exists in the desktop view
  today — the terminal view owns session creation via `/bundle` +
  `hello` (per sprint 035w). Building a whole dialog to hang the picker
  in was out-of-scope for a control-shaped card. This sprint mounts the
  session-header picker only. Create-time attach lives in the terminal
  view already; parity is closed there.

- **TranscriptCompacted{reason:"bundle_changed"} is NOT emitted, and the
  harness verifies its ABSENCE.** The pending card's observation
  contract line 67 asked for `TranscriptCompacted{reason:"bundle_changed"}`
  on the record after swap. Sprint 032b explicitly ruled the emit off
  ("NO TranscriptCompacted envelope emitted — nothing gets compacted at
  bundle-change; only the next turn's seed shape changes; emitting a
  false-signal envelope would be worse than the absence of one" —
  BLACKBOARD 2026-08-28). The harness asserts `compactionEvents.length
  === 0` after the swap so the ruling stays live.

- **`(none)` sentinel option.** The picker options are `[(none),
  ...bundle names]`. Selecting `(none)` PATCHes `{bundle: null}`,
  clears the manifest field, and emits
  `BUNDLE_ATTACHED{bundle:"", prior_bundle:<prior>}`. The empty-string
  bundle payload is the explicit "no bundle" state — v0.7.3's
  `BUNDLE_ATTACHED.bundle` field is a string, not nullable, so `""`
  carries the semantic. Recorded here because the payload shape is not
  spelled out in the card.

## Shared wire — landed

- Consumes `web/lib/fetch.ts` (extracted in sprint 036a) — same
  `postJson` / `fetchJson` / `fetchGet` under the same local names as
  the driver picker and `web/terminal.ts`.
- Consumes the `substrate:session-changed` CustomEvent bus wired at
  sprint 036a. `app.ts` boot dispatches to both the driver and bundle
  pickers on the same event; no per-picker listener duplication.
- Consumes GET /api/bundles from sprint 034a (five bundles ship:
  session, code_review, pair_coding, best_of_n_verified, research_sweep).
- Consumes PATCH `/api/session/<id> {bundle}` from sprint 032b
  (`_session_patch::_PATCHABLE` lift + `SessionRegistry.set_bundle`).

## Signal contract — what actually fires

- `BUNDLE_ATTACHED{session_id, bundle, prior_bundle}` per PATCH ACK.
  `bundle=""` on clear-to-none.
- No `TranscriptCompacted` (per 032b ruling — see above).

## Observation contract — what passed

- Eleven assertions in `capture_desktop_bundle_picker.js` PASS:
  picker mounts; six options (`(none)` + five shipped); (none) is the
  first option; picker binds by sid after DRIVER_SESSION_STARTED;
  BUNDLE_ATTACHED payload correct on flip; manifest carries new
  bundle; status hint reflects flip; NO TranscriptCompacted on record
  after swap; BUNDLE_ATTACHED on clear; manifest bundle cleared to
  null; no uncaught page errors.
- Full signals chain PASS across TWELVE fixtures.
- `check:tsc-new` clean.

## Definition of done — satisfied

- `web/controls/bundle_picker.ts` exists (173 lines).
- `#bundle-picker` mount point sits between `#driver-picker` and
  `#studiolink` in the desktop-view header.
- Mid-session PATCH round-trip proven end-to-end.
- Clear-bundle path proven; manifest field goes to null.
- Parity check with CLI `/bundle` scoped to sprint 036f per SPEC-2.
