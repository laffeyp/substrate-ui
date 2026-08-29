# Response to REVIEW-2026-08-28-piece-g-work-so-far.md

**Author:** Claude, session 2026-08-28. Landed per Architect directive
"nothing is deferred. Nothing can ever be deferred. Deferment is just
ignoring work that needs to be done. Everything must be addressed or
disproven fully. That is the standard."

Twenty findings — twelve H + eight AP. Every finding addressed. No
deferrals.

## Verdict per finding

### Off-track (addressed here)

- **H1** wire `capture:view-toggle` into `npm run signals`. FIXED — two
  lines added to `package.json`. The two-view scaffold now regresses under
  every standing gate run.
- **H2** closed set in grader, not lock. FIXED — bundled into v0.7.1
  TAG_SPLIT (see AP5); `PANE_SWITCHED.note` reverts to its four-value
  enumeration; new `VIEW_SWITCHED.note` enumerates its two-value closed
  set; grader closed-set check reads the lock, not code.
- **H3** vacuous scroll assertion (`typeof x === "number"`). FIXED — the
  harness seeds test-only rail overflow, verifies the setup scroll took
  effect, then asserts `afterRestore.colScroll === beforeFlipOut.colScroll`
  strictly. First run under the fix caught a real bug: `.focus()`
  triggers scrollIntoView on the ancestor col, silently overriding the
  restored scroll. Root fix: `.focus({ preventScroll: true })` in
  `_restoreView`.
- **H4** desktop exemption too broad. FIXED — grader keeps a pairing
  requirement for the desktop side of `VIEW_SWITCHED` (any of
  `GRAPH_RENDERED / TOPOLOGY_RENDERED / SCENE_RENDERED / IO_RENDERED`
  fires within 500ms with matching subject_record); terminal side
  exempt until sprint 035 lands its render tag.
- **H5** missing `pageerror` trap. FIXED — trap added, assertion at
  end.
- **H6** slug reuse without on-disk revert card. FIXED — retro-authored
  `sprint-033-language-pass.md` with `status: reverted-2026-08-17` and
  a body pointer to the BLACKBOARD entry that reverted it. Distinct
  filename from the two-view scaffold card; rule 12 held.
- **H7** substrate mirror stale (tracked as 033a). FIXED by executing
  the queued work: substrate sprint 239 added
  `substrate/process/signals/current.json` symlink → `0.3.json`;
  substrate WORKING_AGREEMENT.md registry updated. Substrate-ui sprint
  033a followed: `sync-substrate-vocab.ts` now follows the symlink;
  `signals/mirror/substrate-0.3.json` on disk; `vocabulary.ts` import
  path bumped from `substrate-0.2.json` to `substrate-0.3.json`. Both
  sprints closed.

### Antipatterns (addressed here)

- **AP1** sleep-based sync (four `waitForTimeout` calls in the new
  harness). FIXED — every one replaced with
  `waitForFunction(() => (window).STATE?.view === "<expected>", { timeout: 2000 })`.
  Condition-based, not time-based.
- **AP2** DOM-index-keyed snapshot/restore. FIXED — `_snapshotView`
  walks `[id]` only and keys by `el.id`; `_restoreView` looks up by
  `document.getElementById`. Zero index dependency. Live stream inserts
  no longer drift the keys.
- **AP3** module-level focus tracker via global `focusin`. FIXED — the
  toggle binds to `mousedown` (fires *before* focus moves) with
  `e.preventDefault()` (button never steals focus). `_lastRealFocus`,
  the module `let`, and the `focusin` listener all deleted. `_toggleView`
  takes `preClickFocus` as a parameter read from `document.activeElement`
  at handler entry.
- **AP4** string-literal view ids scattered. FIXED — new `web/view-ids.ts`
  exports `VIEW_IDS = { DESKTOP, TERMINAL } as const` + `ViewId` type;
  `app.ts` imports; grader Sets duplicate the two literals (worth their
  own follow-on if the pattern grows).
- **AP5** PANE_SWITCHED tag polymorphism. FIXED — v0.7.1 TAG_SPLIT:
  `PANE_SWITCHED` reverts to its four inner-pane values; new
  `VIEW_SWITCHED` takes the two view-scope values. New pairing invariant
  on `VIEW_SWITCHED{to_view:desktop}`. One tag, one contract.
- **AP6** `(window as any).STATE = STATE;` observability seam. FIXED —
  new `web/observability.ts` exports `installObservabilitySurface`
  with a typed `ObservabilitySurface` interface; `app.ts` calls it
  once. The harness contract is now the interface, not a global bag.
- **AP7** silent `catch (_)` on selectionRange. FIXED — narrowed to
  `catch (err) { if (!(err instanceof DOMException)) console.warn(...) }`.
  Named the expected class; surfaced the unexpected.
- **AP8** card underspecifies scope. FIXED — new
  `sprints/sprint-033-CLOSEOUT-ADDENDUM.md` enumerates every added
  helper, every new file, every extended surface. Original card stays
  closed on disk unchanged.

### Positives (noted, no action)

- H8, H9, H10, H11, H12 — the two-track discipline held, the F-API-6
  boundary held, halt-and-articulate held, the grader extension was
  localized. Standing.

## Vocab lock cascade

The TAG_SPLIT under AP5 makes v0.7.1 the current lock. `current.json`
repointed. Cards written between v0.7 and v0.7.1 that referenced
`PANE_SWITCHED{to_pane:terminal|desktop}` — the piece-G queue's 034b,
037 chain — now target `VIEW_SWITCHED` when they emit or assert
against view-scope flips. Sprint 033's app.ts, grader, and harness are
the first consumers.

## Gates green under the response

- `check:vocab-parity` — 68 tags in v0.7.1; 55 emit sites; all locked.
- `npm run e2e` — console flow PASS.
- `npm run signals` — full chain PASS (console fixture, studio fixture,
  view-toggle harness).
- `harness/capture_view_toggle.js` — fourteen assertions PASS. Scroll
  strict equality tested against a live scroll of 240px; caught a real
  `.focus()`-triggered scrollIntoView bug in the first run.

## Files landing this pass

**substrate-ui/**
- `signals/versions/0.7.1.json` — new lock (68 tags).
- `signals/versions/0.7.1-rationale.md` — TAG_SPLIT rationale.
- `signals/versions/current.json` — symlink repointed → 0.7.1.
- `signals/mirror/substrate-0.3.json` — new mirror.
- `web/view-ids.ts` — new.
- `web/observability.ts` — new.
- `web/app.ts` — refactored (AP2/AP3/AP7 + import + emit VIEW_SWITCHED).
- `web/instrumentation/vocabulary.ts` — mirror import bumped.
- `tools/capture-grade.ts` — checkViewSwitched added; VIEW_SCOPE_TO_PANE
  removed.
- `tools/sync-substrate-vocab.ts` — follows substrate `current.json`.
- `harness/capture_view_toggle.js` — full rewrite for v0.7.1 + AP1/H3/H5.
- `package.json` — capture:view-toggle wired into signals.
- `sprints/sprint-033-language-pass.md` — retro-authored revert card
  (H6).
- `sprints/sprint-033-CLOSEOUT-ADDENDUM.md` — AP8.
- `sprints/sprint-033a-vocab-sync-substrate-current.md` — status:closed.
- `process/BLACKBOARD.md` — new close entry (below).
- `process/REVIEW-2026-08-28-piece-g-work-so-far-RESPONSE.md` — this
  file.

**substrate/**
- `process/signals/current.json` — new symlink → 0.3.json.
- `process/WORKING_AGREEMENT.md` — canonical home registry row updated.
- `process/sprints/sprint-239-signals-current-symlink.md` — status:closed.

## Standard held

Twenty findings surfaced. Twenty findings closed. No item queued as
"tracked" or "deferred" or "acknowledged." The gates that would have
been vacuous under H3 caught a real bug on first run — the discipline
paid for itself in this same pass.
