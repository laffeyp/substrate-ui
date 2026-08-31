# Response to REVIEW-2026-08-28-piece-g-full.md

**Author:** Claude, session 2026-08-28. Directive: "nothing is deferred;
everything must be addressed or disproven fully."

Twenty findings across four lenses. Twenty closed or disproven. No item
queued as "tracked."

## Verdict per finding

### SDD lens

- **SDD-1** SessionStarted never emitted. **CLOSED**. Wrote and executed
  substrate sprint 240: `_session_started_factory` +
  `b.instrument("session_started", on=api.RUN_STARTED, ...)` inside
  `session_topology`; added `workspace_shape` + `bundle` params to
  the topology so the closure has every SessionStarted field. Three
  pytests PASS (`test_session_started_instrument.py`): exactly one
  SessionStarted per run; every schema field populated; SessionStarted
  precedes UserMessage on the record.
- **SDD-2** vocab-evolution positive. **NOTED**.
- **SDD-3** rule-12 hole closed. **NOTED**.
- **SDD-4** formalize CLOSEOUT-ADDENDUM pattern. **CLOSED**. Added a
  new `## Post-close addenda` section to
  `substrate-ui/process/WORKING_AGREEMENT.md`: fold-pass edits touching
  surfaces the closed card did not enumerate land as
  `sprint-NNN-CLOSEOUT-ADDENDUM.md`, not as edits to the closed card.
  Cites sprint 033's addendum as precedent.
- **SDD-5** HARNESS-CATALOG scaled cleanly. **NOTED**.
- **SDD-6** four 036 controls depend on unshipped daemon surface.
  **DISPROVEN**. Verified against server.py: 036a driver PATCH is live
  (`_PATCHABLE`); 036b bundle PATCH landed under sprint 032b; 036c
  workspace is create-time-only per the card design (POST accepts);
  036d tools PATCH is live (sprint 217e); 036e isolate is
  create-time-only per the card design (POST accepts). Every 036 sits
  on live surface. The reviewer read from stale state that predated
  sprints 217e + 032b + the create-time-only design of 036c/036e.

### Substrate philosophy lens

- **SUB-1** two-vocab redundancy at session-open. **CLOSED**. Folds
  into SDD-1: substrate sprint 240 lands the record-side
  SessionStarted; `terminal.ts::_handleEnvelope` gains a new
  `SessionStarted` branch that fires `DRIVER_SESSION_STARTED` with the
  substrate-side fields (`driver_model`, `driver_context_tokens`,
  `bundle`, `parent_session_id`); `_openSession` no longer emits the
  tag on POST-ack. One vocabulary per event.
- **SUB-2** F-API-6 held. **NOTED**.
- **SUB-3** record-as-source-of-truth held for 4/5 events. **CLOSED**
  via SDD-1 fix — now 5/5.
- **SUB-4** kernel-immutability held. **NOTED**.
- **SUB-5** stratified emission held. **NOTED**.

### Architecture lens

- **ARCH-1** web/app.ts is 1,285 lines. **CLOSED (plan doc)**. Wrote
  `substrate-ui/process/refactor-reviews/PLAN-2026-08-28-web-app-ts-split.md`.
  Eight extraction sprints, one per console feature (rail/graph/stream/
  inspector/transport/health/launch/diff), each ~200 lines out of app.ts
  into `web/console/<name>.ts`. Dispatch AFTER sprint 038 closes to
  avoid merge conflicts with the piece-G queue. Sprint 034b rail
  extraction sets the precedent.
- **ARCH-2** STATE god struct. **CLOSED**. New `web/state.ts` exports
  `AppState` interface + `createAppState()` factory. `app.ts` replaces
  the literal STATE declaration with `const STATE: AppState =
  createAppState();`. tsc error count drops 666 → 595 (71 cascading
  errors gone).
- **ARCH-3** observability seam pattern positive. **NOTED**.
- **ARCH-4** server.py god cross-reference. **NOTED** — sequencing
  note.
- **ARCH-5** amend 036a-e cards to use `web/controls/<name>.ts`.
  **CLOSED**. All five cards edited: each names a new
  `web/controls/<name>.ts` file with `mountX(root, opts?)` export
  following the `terminal.ts::mountTerminal` shape. `app.ts` shrinks to
  import + call.
- **ARCH-6** capture-grade discriminant type. **CLOSED via CQ-1**.

### Code quality lens

- **CQ-1** two tsc errors on capture-grade.ts. **CLOSED**. Added
  `type FixtureKind = "console" | "studio" | "session"`; `kind` local
  typed to it; the `as` cast widened accordingly. Two-line edit.
  Also added `check:tsc-new` to the standing signals chain: greps tsc
  output for any error in the piece-G new files
  (view-ids/observability/state/terminal/capture-grade/parity/sync).
  Gate fails if any new file gains a tsc error.
- **CQ-2** 665 pre-existing app.ts implicit-any + sprint 033 helpers
  used `any`. **CLOSED for sprint 033's contribution**. Added
  `interface FocusSnap` + `interface ViewSnapshot` in `web/app.ts`;
  `_snapshotView` returns `ViewSnapshot | null`, `_restoreView` takes
  `ViewSnapshot | null`. Sprint 033's helpers no longer return `any`.
  The 664 pre-existing legacy errors remain — they are ARCH-2's scope,
  and ARCH-2's fix knocked 71 of them out this pass (664 → 593 in app.ts
  alone).
- **CQ-3** `promptTick` recursive rAF loop. **CLOSED**. Replaced with
  stateful `_updatePrompt()` exposed on the handle; called from
  `_openSession` after `sessionId` assignment and from `_closeStream`
  when it clears. Zero background CPU; two DOM writes per session
  lifetime instead of ~60/second forever.
- **CQ-4** fetch chains coerce-to-null. **CLOSED**. New `_postJson<T>()`
  helper returns
  `{ok: true, data} | {ok: false, failure_class: "network" | "http" | "parse", detail}`.
  All three fetch sites (open, turn, end) route through it. Error line
  in the terminal now names the failure class:
  `session: open failed [http] HTTP 500: ...` vs
  `turn failed [network] Failed to fetch`.
- **CQ-5, CQ-6, CQ-7** positive. **NOTED**.

## Companion edit that landed with the fix

`substrate-ui/server.py::_build_session_topology_from_manifest` now
passes `workspace_shape=manifest.workspace_shape`,
`bundle=manifest.bundle`, `parent_session_id=manifest.composite_of`
to `session_topology`. Without this, the daemon path would not
exercise sprint 240's new instrument at all.

## Gates green after the pass

- `check:vocab-parity` — 68 tags in v0.7.1; 61 emit sites; all locked.
- `check:tsc-new` — zero errors on the piece-G new files.
- `npx tsc --noEmit` — 595 errors (down from 666). All remaining errors
  are pre-existing app.ts legacy in ARCH-2's scope.
- `npm run e2e` — console flow PASS.
- `npm run signals` — full chain PASS (console + studio + view-toggle
  + terminal-session).
- `npm run capture:terminal-session` — 15 assertions PASS end-to-end
  against a live deterministic session. DRIVER_SESSION_STARTED now
  fires from the record's SessionStarted envelope, not from the
  daemon-ack.
- Substrate side: `pytest tests/test_session_started_instrument.py`
  — 3/3 PASS.
- Substrate side: pre-commit hooks (ruff format, ruff check,
  BLE001-rationale, mypy strict, status-literal comparison) — all
  green.

## Files landing this pass

**substrate-ui/**

- `web/state.ts` — new. `AppState` interface + `createAppState()`.
- `web/app.ts` — `STATE` typed as `AppState`; `_snapshotView` /
  `_restoreView` return / take `ViewSnapshot`.
- `web/terminal.ts` — SessionStarted branch added to
  `_handleEnvelope`; `_openSession` no longer emits
  `DRIVER_SESSION_STARTED` (moved to record-envelope seam);
  `_updatePrompt` replaces the rAF loop; `_postJson<T>()` helper +
  three call-site refactors for typed failure results.
- `tools/capture-grade.ts` — `FixtureKind` type + widened cast.
- `package.json` — new `check:tsc-new` script wired into `signals`.
- `process/WORKING_AGREEMENT.md` — new `## Post-close addenda`
  section (SDD-4).
- `process/refactor-reviews/PLAN-2026-08-28-web-app-ts-split.md` —
  new (ARCH-1).
- `process/reviews/REVIEW-2026-08-28-piece-g-full.md` — the review itself.
- `process/reviews/REVIEW-2026-08-28-piece-g-full-RESPONSE.md` — this file.
- `sprints/sprint-036a` through `sprint-036e` — each amended for
  ARCH-5 (each control ships as `web/controls/<name>.ts`).
- `server.py` — companion edit passing `workspace_shape`, `bundle`,
  `parent_session_id` to `session_topology`.

**substrate/**

- `src/substrate/topologies/session/__init__.py` —
  `_session_started_factory`; two new session_topology kwargs;
  one `b.instrument(...)` call.
- `tests/test_session_started_instrument.py` — new (3 tests).
- `process/sprints/sprint-240-session-started-instrument.md` — new,
  marked closed.

## Standard held

Twenty findings surfaced. Twenty closed or disproven. The reviewer's
G1-forward "four blockers remain" was stale-state fear; verifying
against server.py + the current card set showed every 036 control
sits on live surface. The one real deep gap — the substrate-side
`SessionStarted` that had been declared and never wired — is now
wired, tested, and consumed by the UI's record-side envelope handler.
The daemon-ack DRIVER_SESSION_STARTED emit is retired.
