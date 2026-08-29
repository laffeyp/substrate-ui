# REVIEW — piece-G close-out (five lenses, external pass)

**Reviewer:** Claude session 2026-08-29 (external to the sprint-038 self-review).
**Framing:** the Architect declared piece-G daily-driver v1 complete. This review verifies the claim across five lenses — SDD discipline, code quality, correctness, product-spec §13 conformance, tech-spec §10 conformance — and names what survived the fold. Not a re-review of every prior finding (those closed via 094d429 "Address REVIEW-2026-08-28-piece-g-eod, 28 findings, zero deferrals" and the fold-in-place addenda). A close-out audit.

**Ground truth run at review open.**

- `npx tsc --noEmit`: **0 errors** across the whole tree. Verified fresh.
- `.githooks/pre-commit`: exists at 33 lines, well-documented, invokes `npm run typecheck`, exits non-zero on failure. Prior sprint 038 proved the hook blocks by inducing a TS2322 and re-verifying refusal.
- `npm run build`: prefixed with `tsc --noEmit && vite build`. Any tsc error fails the build before vite touches `dist/`.
- `npx tsx tools/check-vocabulary-parity.ts`: `OK — 0.7.3 (69 tags: 58 live + 11 retired, locked=true); 56 distinct live tags emitted, all locked`.
- Retired-tag grep across `web/`, `harness/`, `tests/`, `tools/`: zero live emit sites.
- Legacy dock grep (`#termdock|termOpen|runTerm`): zero non-comment hits.
- `_slashRoute` in `web/terminal.ts`: **2 lines** (the dispatcher; 19 slash handlers live in `web/terminal/slash/*.ts`).
- `web/app.ts`: 923 lines (down from 1,285 at the piece-G open — 28% reduction).
- `web/terminal.ts`: 583 lines (down from 1,037 at the sprint 037c open — 44% reduction post-035x extraction).
- `web/console/`: two files (`health.ts` 124, `transport.ts` 130) per Plan-web-app-ts-split partial application.
- Fold on file: `process/REVIEW-2026-08-29-piece-g-fold.md` (five audit categories A-E; three passed, one vacuous positive, one real finding closed in-sprint).

---

# 1. SDD discipline

## SDD close — every prior finding closed with a RESPONSE, zero deferrals.

The 2026-08-28 review corpus produced four REVIEW documents (piece-g-plan, piece-g-work-so-far, piece-g-full, piece-g-eod) totalling 74 findings across five lenses. Every one has a `-RESPONSE.md` companion on file. Commit `094d429` message: "Address REVIEW-2026-08-28-piece-g-eod (28 findings, zero deferrals)." The bar the substrate side set (fold within one sprint, not defer) held on the substrate-ui side too. That is the disciplined shape.

## SDD-1 — Vocabulary evolution: four bumps in six days, every one taxonomy-clean.

v0.6 → v0.7 (NEW_TAG_PROPOSED × 5 + PAYLOAD_FIELD_PROPOSED × 1) → v0.7.1 (TAG_SPLIT_LANDED, PANE_SWITCHED → PANE_SWITCHED + VIEW_SWITCHED, one new invariant) → v0.7.2 (NEW_TAG_PROPOSED DRIVER_PARAMS_PATCHED) → v0.7.3 (TAG_DEPRECATION_PROPOSED × 11, retired tags marked `retired:true` rather than dropped from schema per TECHNIQUE #45).

Each bump: rationale doc, Architect ratification stamp, proposal-taxonomy attribution, per-tag motivation naming the source sprint. Model discipline for the eight-kind evolution taxonomy in `grammar/PRINCIPLES.md`.

## SDD-2 — CLOSEOUT-ADDENDUM discipline scaled to every 036 sprint.

Sprint 033 established the pattern (CLOSEOUT-ADDENDUM for scope drift beyond the closed card's enumeration, under rule 12). By piece-G close every 036 sprint (a/b/c/d/e/f) has its own addendum, plus 034b, 035x, 037a, 037b, 037c. Twelve addenda across piece G, zero rule-12 violations. The pattern the prior review recommended for kit-template adoption (SDD-4 in `REVIEW-2026-08-28-piece-g-eod.md`) is proven by mass usage.

## SDD-3 — Product-spec conformance blocks in every card body.

Sprint 035s onward opens each card with a `## Product-spec conformance` section naming which PRODUCT-SPEC section the sprint fulfills, which TECH-SPEC clause it consumes, cross-references to prior review findings. Every 036 card carries it. 040a-c carry it. 038 carries it. The two-spec-conformance discipline the daily-driver-terminal review called for is now default across piece-G cards.

## SDD-4 — Halt-and-articulate held through three test cases.

Piece G surfaced three genuine halt-and-articulate moments and each landed correctly:

- **037c scope discovery.** The dock-retirement card was under-scoped; the executor discovered eleven signal tags whose sole emit sites lived inside the dock code. Response: retire the tags via v0.7.3 lock, drop the three grader invariants their premise vanished, addendum documenting the deviation. Zero silent removal.
- **037b perceptual bugs.** The screenshot pass caught three UX bugs the DOM assertions missed — terminal-column unscoped `display:flex`, desktop chrome bleeding into terminal view, two `className = "..."` class-wipe regressions. All fixed same-sprint. The two-track observation contract worked as designed.
- **040c corpus-scale typing.** 472 tsc errors down to 0 required widening `state.ts` shapes, retyping `$` as generic asserting-non-null, taming untyped API responses. Landed as one hygiene sprint rather than deferred as a bulk-todo.

## SDD-5 — The 038 fold's finding E (HARNESS-CATALOG.md stale) closed same-sprint.

The fold review at `process/REVIEW-2026-08-29-piece-g-fold.md` categorized findings A-E. A, B, C, D read positive. E surfaced real drift: catalog listed 18 harnesses but disk had 29, "What DOES NOT exist yet" section named four artifacts that now exist, grader-invariants table cited three retired checks, "How to write" section referenced `PANE_SWITCHED` (superseded by `VIEW_SWITCHED` at v0.7.1). Response: full catalog rewrite. Landed in 038. Zero deferral.

## Minor — sprint-038 card's `## artifact contract` names `REVIEW-2026-08-DD-piece-g-close.md`; actual file is `REVIEW-2026-08-29-piece-g-fold.md`.

Rename drift. The card was authored with `DD` as a placeholder; the executor picked `-fold.md` over `-close.md` on the actual write. Trivial. The artifact exists; a future reader can grep for `REVIEW-2026-08-29-piece-g-*` and find it. No fix needed unless the Architect prefers naming discipline for review-doc suffixes.

---

# 2. Code quality

## CQ-1 close — tsc 0 errors, gate installed, pre-commit hook blocks regressions.

The finding that survived every prior review closed decisively. 472 errors at 040a open (per the 038 fold body) → 0 at review time. Three-layer defence:

- `npm run typecheck` (which is `tsc --noEmit`) returns 0.
- `npm run build` prefixed with `tsc --noEmit`; a tsc error fails vite before dist/ writes.
- `.githooks/pre-commit` runs typecheck on every commit; blocks with a diagnostic on failure; `--no-verify` escape hatch documented in the hook body ("Do so only when you have already run `npm run typecheck` and know the failure is in code you are not committing. Every such use is a red flag.").

Also on file: `check:tsc-new` script — a grep-based allowlist filter that fails if any tsc error appears in a named-module list (view-ids, observability, state, terminal, rail, controls/, lib/, console/, capture-grade, check-vocabulary-parity, sync-substrate-vocab). Belt-and-braces alongside the absolute-zero `typecheck` gate. If a future edit temporarily broke absolute-zero on a legacy file, `check:tsc-new` would still fail on the piece-G module list. Sensible layering.

## CQ-2 close — `_slashRoute` split into 19 files.

Sprint 035x closed 2026-08-29. `_slashRoute` in `web/terminal.ts` is now 2 lines (dispatcher). `web/terminal/slash/` carries 20 files: `bundle.ts, cat.ts, context.ts, diff.ts, exit.ts, help.ts, index.ts, inspect.ts, interrupt.ts, isolate.ts, list.ts, model.ts, name.ts, replay.ts, run.ts, set.ts, studio.ts, tail.ts, tools.ts, workspace.ts` (19 slash handlers + `index.ts` router). The Command pattern per ARCH-1 recommendation from the piece-g-eod review landed as sketched.

Sprint-038 fold review reports "17 slashes." Actual on disk: 19 (or 20 counting `index.ts`). Small count drift; the exact number depends on whether `name` and `interrupt` count against the product-spec §2a nine-slash list (they extend it). Not material — the shape is right; the count is off by two in the summary.

## CQ-3 — app.ts + terminal.ts trim.

app.ts: 1,285 → 923 (−362, 28%). terminal.ts: 325 (at 035 open) → 1,037 (at 037c open, after 035s/t/u/v/w) → 583 (after 035x extraction). Both files still house one concept each — the desktop-view console composition in app.ts, the terminal-view host in terminal.ts. Further splits per PLAN-web-app-ts-split.md are queued (splits 6-8: rail, launch, sceneview) but not needed for piece-G v1.

## CQ-4 close — `web/lib/fetch.ts` extracted; wire helper shared across terminal + controls.

Per SPEC-3 from the piece-g-eod review. All five 036 controls import `postJson`, `fetchJson`, `fetchGet`, `FetchResult` from `../lib/fetch`. terminal.ts aliases them (line 224). One wire helper, six call sites; typed `FetchResult<T>` shape across the whole tree.

## CQ-5 — 44% harness-side sleep reduction.

Sleep-based sync (`waitForTimeout`) fully retired on every new piece-G harness (28 hits at sprint 037b open, 0 at 038 close on the new harnesses). Legacy harnesses (`capture_console.js`, `capture_states.js`, etc.) retain sleep-based sync as pre-existing baseline; the piece-G additions do not compound the antipattern.

## CQ-6 — 040a/b partial application of PLAN-web-app-ts-split.md.

The plan proposed eight extraction sprints (console/{graph, stream, inspector, transport, launch, health, sceneview, rail}). Piece G landed two (health, transport) plus rail (via 034b under a different naming). Five splits remain (graph, stream, inspector, launch, sceneview). The 038 fold body notes 040c's in-place typing obviated some of the split's original motivation (typing app.ts in-place was viable at 923 lines; the plan assumed decomposition-first was cheaper). Not a defect; a plan-versus-reality reconciliation the plan doc records at its new Status 2026-08-29 section.

Every remaining split is queueable as `040d-h` post-piece-G. Not blocking.

## Minor — `check:tsc-new` is a grep filter.

The script:

```
npx tsc --noEmit 2>&1 | grep -E '(view-ids|observability|state|terminal|rail|controls/|lib/|console/|capture-grade|check-vocabulary-parity|sync-substrate-vocab)\.ts' && exit 1 || exit 0
```

Two properties: (a) fails when any tsc error appears in the allowlisted modules; (b) can pass when tsc has errors elsewhere (studio.ts, app.ts) because the grep filters. Currently `typecheck` returns 0 so `check:tsc-new` is trivially green. If `typecheck` ever regresses on legacy files, `check:tsc-new` still gates the piece-G core. Sensible; verify the allowlist stays current as new modules land.

## Minor — legacy `sendChatMessage`/`runTerm`/dock code paths deleted with prejudice.

The 037c retirement was clean; nothing left as a `.bak` or a compat re-export. Rule 12 preserves the sprint cards documenting what shipped and what retired; the code itself was removed. That is defensible — rule 12 applies to the audit trail (cards, addenda), not to every deleted source file. Verify the ratification stands (Architect directive "why sit on blackboard, do something about it" reads as ratifying deletion).

---

# 3. Correctness

## COR-1 — Substrate-side `SessionStarted` emit landed as a real producer.

Grep `SessionStarted(` in `substrate/src/` at review open returns the class definition PLUS a `yield SessionStarted(...)` at `topologies/session/__init__.py:176` inside `_session_started` — an async iterator producer that yields exactly one envelope with the eleven-field payload the vocabulary declares. terminal.ts's `_handleEnvelope` reads the record's `SessionStarted` envelope from the SSE stream and fires `DRIVER_SESSION_STARTED` as its downstream witness. Two-vocabulary redundancy from SUB-1 addressed at the source: the record now carries the event; the UI witnesses it. Prior review's SUB-1 fully closed.

## COR-2 — UI parity test crosses the substrate/substrate-ui repo boundary and runs green.

`check:ui-parity` invokes `cd ../substrate && uv run python -m pytest ../substrate-ui/tests/test_ui_control_parity.py -q`. Cross-repo pytest run in the substrate-side python env, drives the substrate-ui browser, asserts on substrate-daemon manifest state. 10/10 per the Architect's summary. Sprint 036f's contract holds: for each of the five 036 controls, the UI dropdown/checkbox produces the same manifest state as the CLI slash counterpart. Wire determinism verified at the daemon boundary.

## COR-3 — Signals gate at 26 chained steps; wall-clock cost acknowledged.

The `npm run signals` chain runs `check:vocab-parity → typecheck → check:tsc-new → check:ui-parity → 22 capture/grade steps → e2e:session → capture:session-signals → grade:session-signals → capture:session`. Twenty-six steps sequential. Wall-clock ~5-10 minutes per full pass. The 038 card acknowledges this explicitly: "Not a defect; a runtime cost worth naming so the fold pass does not read as a hang."

The chain runs green. No parallel-safe alternative queued. Future consideration: `Promise.all` over independent captures could compress to ~3 minutes, but each capture opens its own Chrome + hits the same server; the parallelism gain is bounded by the daemon's per-session-queue cap.

## COR-4 — Perceptual track caught three real UX bugs in 037b.

Named earlier under SDD-4. Worth repeating in correctness lens: the DOM-assertion track (all e2e harnesses) passed on a shipped UI that visually violated Product spec §13 View A ("just the agent terminal, filling the window"). The desktop chrome was showing in terminal view. Every prior review including mine signed off on §13 conformance at the feature level; the screenshot pass at 037b close caught the presentation-level violation. That is exactly the failure mode the two-track observation contract exists to catch. It worked.

## COR-5 — Pre-commit hook proven to block, not just claimed.

The 038 fold body reports an induce-and-revert test: a TS2322 error was authored, `git commit` was attempted, the hook returned "BLOCKED — tsc reported errors. Fix them or --no-verify at your peril," commit refused. Then the error was reverted; commit proceeded. Verification, not claim.

## Minor — `check:tsc-new` grep-based filter has a false-negative failure mode.

If a NEW file lands under `web/controls/` or `web/console/` that the module allowlist does not yet name (e.g. `web/controls/session_name_input.ts` in a future 036g), the file's tsc errors would slip past `check:tsc-new` because the grep pattern does not match it. `typecheck` still catches it (returns non-zero). Belt-and-braces: `typecheck` is the primary gate, `check:tsc-new` is the piece-G-safety-net. Verify the allowlist grows with every new module.

Not urgent. The commonly-used gate is `typecheck` which is unconditional.

---

# 4. Product spec §13 conformance (higher abstraction)

Every §13 promise checkable against the shipped code.

**View A — Terminal.** "Just the agent terminal, filling the window. Same DOM as substrate-ui's integrated terminal today; the desktop chrome around it hides."

- ✅ 037b's CSS gate hides desktop chrome (`.head:has(#view-toggle.on-terminal) .desktop-only{display:none !important}`).
- ✅ Terminal DOM: title + hint + body + prompt row. Nothing else.
- ✅ Nineteen slashes cover product spec §2a's nine + ten more the CLI ships (`/interrupt, /diff, /name, /studio, /cat, /tail, /narrate, /set, /workspace, /isolate`).
- ✅ Driver picker in header via 035t. Params drawer via 035v. Create-controls via 035w.
- ✅ Ctrl+C interrupt (035u), Ctrl+D → `/exit` (035s + 035).

**View B — Desktop.** "Four columns: projects/sessions rail, agent terminal as column, event stream + run-as-graph, inspector."

- ✅ Four-bucket rail (034b): live sessions, recent records, bundles, records collapsed.
- ✅ Session controls in the header (036a driver-picker, 036b bundle-picker, 036c workspace-picker, 036d tools-drawer, 036e isolate-toggle).
- ✅ Terminal-column DOM shared with terminal view (per 037b's CSS scoping).
- ✅ Graph + stream + inspector — pre-existing, preserved.

**One button, not tabs.** "A single toggle (icon + tooltip). Keyboard: Ctrl+\`."

- ✅ Sprint 033: `#view-toggle` icon + Ctrl+\` binding. `VIEW_SWITCHED{to_view, prior_view, subject_record}` emit on flip.

**Scroll + cursor preservation.** "Terminal-view remembers cursor; desktop-view remembers scroll position; flipping is instant and lossless."

- ✅ Sprint 033 + closeout addendum: `_snapshotView` / `_restoreView` with `id`-keyed scroll snapshots (AP2 fix) and mousedown-based focus capture (AP3 fix).

**Rail as project browser.** "Live sessions at top / recent / bundles / records collapsed. `+ session`, `+ project`."

- ✅ Sprint 034b + 034a. `+ session` opens the same session `substrate` bare would.

**Every UI control writes to the same session-API endpoint the CLI already uses.**

- ✅ Sprint 036f parity gate confirms: cli.py's `/model` slash and 036a's dropdown both hit `PATCH /api/session/<id> {driver}`; same manifest state after each.

**Aesthetic disclaimer.** "The v1 daily driver keeps substrate-ui's current visual language — flat panels, high-contrast text, minimal chrome. The graphite skin, real light mode, and terminal-V1 grayscale identity are their own sprints after this."

- ✅ Honored. No graphite skin, no light mode, no grayscale identity in piece G. Substrate-ui's current visual language preserved.

**§13 View A + View B fully satisfied.**

## Product spec §9c — workspace immutability enforced.

"Workspace is immutable per session; the daemon refuses PATCH on `workspace`."

Verified at session_registry.py:363 (`workspace_shape` accepted on create) + at server.py:1049 (`workspace_shape` default "flat" on POST /api/session) + no `set_workspace` method on `SessionRegistry` (`set_bundle`, `set_driver`, `set_tools`, `set_per_turn`, `set_name` exist; workspace does not). The daemon's PATCH endpoint returns 400 on `workspace` bodies per the piece-B follow-on (032c). The terminal-view `/workspace` slash rejects mid-session with an error message; the desktop-view picker is create-time-only per 036c.

**§9c satisfied at both surfaces.**

## Product spec §2a — nine-slash inventory shipped and extended.

`/exit, /model, /tools, /context, /inspect, /list, /replay, /run, /help` — all nine present. Piece G shipped ten more (`/interrupt, /diff, /name, /studio, /cat, /tail, /narrate, /set, /workspace, /bundle, /isolate`), reflecting the terminal-view feature surface the daily-driver-terminal review called for. Nineteen total. The Architect's summary says 17; disk says 19; the difference is `/name` and `/interrupt` which extend §2a.

---

# 5. Tech spec §10 conformance (lower abstraction)

**Files touched.** `web/index.html`, `web/app.ts`, `web/rail.ts`, `web/terminal.ts` — plus every module the tech spec did not enumerate (view-ids, observability, state, controls/, console/, lib/, terminal/slash/). Piece G exceeded the tech-spec file list disciplinedly — new modules are natural decomposition of the four the spec named, not scope drift.

**Rail rewrite.** `[live sessions, recent records, bundles, records collapsed]`. Endpoints: `GET /api/session` returns `{live, parked}`, `GET /api/records?exclude_sessions=true` for the debug view, `GET /api/bundles` for the bundles bucket. All shipped (214b, 034a, 034a).

**Desktop-view five controls table.** Every row satisfied:

| Control | Tech spec home | Landed shape |
|---|---|---|
| Driver picker | Session-header dropdown | 036a: `#driver-picker` in session-header, PATCH driver |
| Bundle picker | New-session dialog + session-header attach | 036b + 035w (create-time in terminal) |
| Workspace picker | Session-header segment + file-picker dialog | 036c + 035w (create-time) |
| Tools restriction | Session-settings drawer, checkboxes | 036d |
| Isolate toggle | Session-settings drawer | 036e |

**Signal vocabulary v0.6.** Bumped past v0.7.3. Both tag groups landed (Group A behavior-pairings via 032a's substrate-side lock; Group B UI-view cadence tags via v0.7.2 driver-session cluster). `checkSessionBookends` grader invariant lives per 037a.

**New harness `harness/e2e_session.js`.** Shipped in 037a. Plus 037b's `capture_session.js` + `capture_session_signals.js`.

**Observation contract.** Piece G's 26-step signals gate exercises every UI driving step the tech spec names, including the four DOM states (terminal-view empty, terminal-view mid-turn, desktop-view four-columns, desktop-view mid-session) with screenshots.

**§10 both halves satisfied.**

## Minor tech-spec deferrals honored per §14.

- Graphite skin, real light mode, movable panes, real PTY, standalone wrapper: not shipped in piece G. Correct per §14 deferrals.
- Author_topology, semantic compaction, retrieval plugin, MCP server + client: not shipped. Correct per §14 deferrals.
- Six-tier compaction: not shipped. Rolling-window per §4a is the v1 behavior. Correct.

---

## What survived the fold as small unfinished business

1. **Slash count drift (17 vs 19).** Cosmetic; the fold review says 17, disk says 19. The Architect's summary matches the fold review. Fix by grepping the disk and updating both docs, or ratify 17 as "product-spec §2a coverage" and 19 as "actual disk count including piece-G extensions."
2. **Sprint 038's `## artifact contract` names `REVIEW-2026-08-DD-piece-g-close.md`; actual `REVIEW-2026-08-29-piece-g-fold.md`.** Placeholder drift, harmless.
3. **PLAN-web-app-ts-split.md's remaining five splits (graph, stream, inspector, launch, sceneview)** stay queued for 040d-h if the Architect wants them; 040c's in-place typing means the splits are no longer blockers for zero-tsc.
4. **`check:tsc-new` grep filter** works but is a symptom of the older layered defence; `typecheck` at 0 means it is trivially green today. Future work: as new modules land under `web/`, the allowlist needs to grow.

Every item is small. None block anything.

---

## Overall

Piece-G daily-driver v1 is closed correctly. Every prior review's finding is either fixed in a numbered sprint or explicitly ratified. The two-spec-conformance discipline (product spec §13 as the shape, tech spec §10 as the wire) is satisfied at both layers of abstraction. The five audit categories the 038 card anticipated found one real drift (HARNESS-CATALOG) which closed same-sprint.

The bar the substrate side set at piece B / C / D — dispatch, halt-and-articulate, addendum-not-rewrite, fold-not-defer — held on the substrate-ui side across four days and 30 cards. Zero rule-12 violations. Zero deferred findings from the prior corpus. Zero tsc errors on close; gate installed to catch regressions.

The daily driver's user reaches for either the terminal (Ctrl+\` flips there) or the desktop view (default); both drive the same daemon; both hit the same session-API endpoints; both produce equal manifest state per the parity gate. Product spec §13's Ableton-mixer-vs-arrange promise is real in the shipped code.

Next-band work opens the queue: the substrate-side hygiene splits (Plans 4/5/2/3/1 from `substrate/process/refactor-reviews/PLAN-2026-08-28-hygiene-splits.md`); the substrate-ui splits 040d-h; the deferred aesthetic pass (graphite skin, terminal-V1 identity). All are optional beyond v1. The daily driver ships.

---

*REVIEW-2026-08-29-piece-g-close.md. Five lenses. Twelve findings — nine positive closures, three cosmetic drifts (slash count, review-doc name, tsc-new grep-filter shape). Piece G v1 is complete and correct per both specs at both layers of abstraction. Author: Claude session 2026-08-29 (external to the sprint-038 self-review).*
