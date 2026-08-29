# Sprint 033 — closeout addendum (2026-08-28)

*Additive audit note per REVIEW-2026-08-28-piece-g-work-so-far AP8.
The original card enumerated three files; the implementation added
internal helpers the card did not name. This file records the actual
footprint. Rule 12 preserved — the original card unchanged on disk.*

## Actual implementation footprint

Original card (`sprint-033-two-view-scaffold.md`) named three files:
`web/index.html`, `web/app.ts`, `tools/capture-grade.ts`. The
implementation, plus the v0.7.1 refactor that closed the piece-G
plan-review findings, touches these additional surfaces:

### New files

- `web/view-ids.ts` — `VIEW_IDS` closed-set constant + `ViewId` type
  (AP4 fix — one seam for the two literal view identifiers, imported
  by app.ts and readable to the grader).
- `web/observability.ts` — `installObservabilitySurface()` + typed
  `ObservabilitySurface` interface (AP6 fix — one named seam for the
  Playwright harness's `window.STATE` / `window.loadRecords` reads,
  previously an implicit `(window as any)` bag).
- `signals/versions/0.7.1.json` + `signals/versions/0.7.1-rationale.md`
  (H2 + AP5 fix — TAG_SPLIT PANE_SWITCHED → VIEW_SWITCHED, closed sets
  enumerated in the lock).

### Existing files edited beyond the card's enumeration

- `web/app.ts` — helpers `_snapshotView`, `_restoreView`, `_toggleView`
  (id-only DOM keying per AP2 fix; no module-level state, no `focusin`
  listener); the toggle bound to `mousedown` with `preventDefault` so
  the button never steals focus (AP3 fix). `installObservabilitySurface`
  call replaces the four `(window as any).X = X;` lines. Emit tag
  swapped from `PANE_SWITCHED` to `VIEW_SWITCHED` per v0.7.1.
- `web/index.html` — additional CSS class hook `#view-toggle.on-terminal`;
  the two view containers `#view-desktop` and `#view-terminal` with
  full CSS reflow of `.app`'s grid rows.
- `tools/capture-grade.ts` — new `checkViewSwitched()` handler for
  the v0.7.1 tag; `VIEW_TO_PANE_ID` reverted to its four inner-pane
  entries (H4 + tag split); `VIEW_SCOPE_TO_PANE` removed.
- `web/instrumentation/vocabulary.ts` — mirror import path bumped from
  `substrate-0.2.json` to `substrate-0.3.json` (sprint 033a follow-on).
- `harness/capture_view_toggle.js` — full rewrite for v0.7.1 assertions
  and `waitForFunction` sync (AP1 fix); `pageerror` trap (H5); strict
  scroll equality with test-setup guard (H3); test-only rail overflow
  seeding so the scroll assertion is not vacuous.
- `package.json` — `capture:view-toggle` script + wired into
  `npm run signals` (H1 fix).
- `tools/sync-substrate-vocab.ts` — follows substrate's `current.json`
  symlink instead of hard-coded 0.2.json (sprint 033a).

## Gates green under the addendum

- `check:vocab-parity` — 68 tags in v0.7.1; 55 emit sites; all locked.
- `npm run e2e` — console flow PASS.
- `npm run signals` — full chain PASS (console fixture, studio fixture,
  view-toggle harness).
- `harness/capture_view_toggle.js` — fourteen assertions PASS,
  including strict scroll equality and `pageerror` trap.

## Why this file, not an edit to the closed card

The card carries `status: closed`. Rule 12 keeps the closed card as
the authored artifact of that sprint's close. New audit obligations
land as separate files that cite the card by path. This addendum names
what the card underspecified without rewriting it.
