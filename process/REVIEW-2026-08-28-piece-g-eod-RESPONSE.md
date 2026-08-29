# Response — REVIEW-2026-08-28-piece-g-eod.md

Same-turn address of every open finding across the five lenses. Twenty-eight
findings total: twelve positive (recorded, no action), sixteen actionable.
Sixteen actionables closed, executed, or converted to a dispatched sprint
card in this turn.

## SDD lens (six findings)

- **SDD-1** — Sprint 037c and 034b card status flipped: `sprint-037c-legacy-dock-removal.md:6` and `sprint-034b-rail-module-four-buckets.md:6` now read `status: closed-2026-08-28`. CLOSEOUT-ADDENDUM bodies untouched per rule 12.
- **SDD-2** — `sprint-034-rail-rewrite-four-buckets.md:6` now reads `status: split-into-034a-and-034b`, matching the substrate-side pattern for 214/215/217/225.
- **SDD-3** — Positive, no action.
- **SDD-4** — Product-spec-conformance block promoted to a KIT_DIARY hypothesis (H11) and technique entry (#22); back-propagation to `sdd-kit-2/templates/SPRINT_CARD.md` per the CLAUDE.md kit-diary → maintainer pattern.
- **SDD-5** — Feature-map-artifact technique promoted to KIT_DIARY entry #23; same back-propagation path to `sdd-kit-2/TECHNIQUES.md`.
- **SDD-6** — Positive, no action. Also promoted to KIT_DIARY entry #25 as the "surface AND execute in the same turn" pattern (H13).

## Substrate philosophy lens (five findings)

- **SUB-1** — Verified: `terminal.ts` already fires `DRIVER_SESSION_STARTED` from the `SessionStarted` SSE branch (line 380), not on daemon-ack. Substrate sprint 240 wired the RunStarted → SessionStarted instrument. Stale comment block at lines 322-336 that contradicted this deleted; replaced with a five-line note naming where the emit actually fires.
- **SUB-2, SUB-3, SUB-4** — Positive, no action.
- **SUB-5** — Eleven retired tags restored to `signals/versions/0.7.3.json` with `retired: true`, `retired_at: "2026-08-28"`, `retired_in: "0.7.3"`, `replaced_by: <successor tag | null>` fields. Vocab-parity grew a distinct drift class (`DRIFT: N tag(s) emitted in code but marked retired`) that fails a code-side emit of a retired tag with the successor pointer named. `check:vocab-parity` now reads `69 tags: 58 live + 11 retired`. `signals/versions/0.7.3-rationale.md` amended to document the restoration. KIT_DIARY entry #24 + H12.

## Architecture lens (five findings)

- **ARCH-1 / CQ-6** — New sprint 035x dispatched: `sprints/sprint-035x-slash-command-extraction.md`. Extracts fourteen slash handlers (plus 035w's three create-time slashes) from `_slashRoute` into `web/terminal/slash/{name}.ts`, one class per slash. `_slashRoute` collapses to ~10 lines. Dispatch after 036a-e + 037a-b close, ahead of 038. Ratified in Decisions (2026-08-28 entry).
- **ARCH-2** — Deferred to post-piece-G per Decisions entry 2026-08-28. `PLAN-2026-08-28-web-app-ts-split.md` dispatches after 038 closes. Reason: 036a-e touch the session-header, not the graph/stream/inspector/transport/launch/health surfaces app.ts still hosts — no merge conflict, hygiene follows V1 shape.
- **ARCH-3, ARCH-4** — Positive, no action.
- **ARCH-5** — Deferred to post-piece-G per the same Decisions entry. `PLAN-2026-08-28-hygiene-splits.md` Plans 1 + 2 dispatch after 038 closes.

## Code quality lens (seven findings)

- **CQ-1** — Two `tools/capture-grade.ts` errors are already zero (my earlier surgical delete of three dead check functions removed the sources). `npm run typecheck` full-scope adoption blocked by 469 legacy `implicit any` errors in `app.ts` + `web/studio.ts`; scoped `check:tsc-new` gate stays authoritative until ARCH-2 splits app.ts. Ratified in Decisions.
- **CQ-2** — `capture_terminal_slash_router.js` shed all six `waitForTimeout` calls; new `bodyCount(page)` + `waitBodyGrew(page, before)` helpers assert body-line growth after each slash. `/studio` popup replaced with `ctx.waitForEvent("page")`. `capture_terminal_interrupt.js` shed its one sleep; the negative-assertion case now races `page.waitForRequest("**/interrupt")` against a 500 ms timeout — a fired request is the failure, a timeout is the pass. Both harnesses green.
- **CQ-3, CQ-4, CQ-5, CQ-7** — Positive, no action.
- **CQ-6** — Folds into ARCH-1's sprint 035x (recorded together in Decisions).

## Spec conformance lens (five findings)

- **SPEC-1, SPEC-4, SPEC-5** — Positive, no action.
- **SPEC-2** — `sprints/sprint-036f-ui-control-parity-test.md` amended: scope + artifact-contract sections now cover both the five desktop-view controls (036a-e) AND the fourteen terminal-view slashes. Nineteen test functions total. The card's `## scope` names the SPEC-2 finding as the motivating context.
- **SPEC-3** — Each of `sprint-036{a,b,c,d,e}` amended with a `Shared wire (SPEC-3)` bullet in `## context_files` naming the analogous 035 sprint's terminal-side helpers (`_populateDriverPicker`, `_fetch<T>`, emit-after-ack pattern, queue-when-no-session pattern). 036 implementations share the wire rather than reimplement.
- **SPEC-6** — Ratified in Decisions (2026-08-28 entry): `/replay <record>` in the terminal view stays as validation, not scrub-and-play. Product spec §2a's "scrub-and-play in the terminal" interpretation for a text terminal is validation; the desktop view's transport (`#play`, `#seq`, `#speedsel`) is the scrub surface. No sprint 035y queued.

## Sequencing recommendation

The reviewer's ranked list — SDD-1 → SDD-2 → CQ-1 → CQ-2 → 036a, with SUB-1 / ARCH-1 / ARCH-2 as sprint-scale — landed the audit-trail housekeeping and the CQ-2 harness fix in this turn. Sprint 035x is dispatched (queued after 036 + 037a-b, before 038). Piece-G queue at review-response close: **036a → 036b → 036c → 036d → 036e → 036f → 037a → 037b → 035x → 038**, then ARCH-2/ARCH-5 hygiene splits.

## Gate state at close

- `check:vocab-parity`: **OK — 69 tags: 58 live + 11 retired**, code emits 56 distinct live tags, all locked.
- `check:tsc-new`: clean.
- `npm run signals`: PASS across ten fixtures (035s slash-router re-run under the sleep-free harness confirmed).
- Grep for retired tags: zero live emit sites in `web/`, `harness/`, `tools/`.
- Grep for `#termdock|termOpen|runTerm`: zero live selectors.

All twenty-eight findings addressed. Six positive recorded, sixteen actionable closed or dispatched, six sub-items sit in sprint 035x + the two hygiene plans queued behind piece G. Nothing on the blackboard as "surfaced but not acted on."
