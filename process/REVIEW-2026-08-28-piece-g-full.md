# REVIEW — piece-G full pass across four lenses

**Reviewer:** Claude session 2026-08-28.
**Scope:** the entire piece-G work landed to date (sprints 032a, 033 + CLOSEOUT-ADDENDUM, 033a, 035, plus v0.7 and v0.7.1 vocabulary locks) plus the pending queue that shapes what closes next. Four lenses in one review: SDD discipline, core substrate philosophy, code architecture, code quality.
**Predecessors:** `REVIEW-2026-08-28-piece-g-plan.md` (queue plan), `REVIEW-2026-08-28-v0.7-lock-and-queue-state.md` (v0.7), `REVIEW-2026-08-28-piece-g-work-so-far.md` (twenty findings across sprints 032a + 033). This pass does not repeat those in detail; it names what has closed since, what remains, and what the four lenses surface fresh.

**State at review open.**

Closed: 032a (v0.7 lock), 033 (two-view scaffold) + CLOSEOUT-ADDENDUM (folds AP1–AP8 and H1–H6 from the previous review), 033a (vocab mirror bump), 035 (terminal.ts + session-turn wiring). v0.7.1 lock landed to close H2 + AP5.

Pending: 034, 034a, 034b, 036, 036a–f, 037, 037a–c, 038, plus the substrate-side unblocker 032b.

Fresh gates run at review open: `npx tsc --noEmit` returns **666 errors** (665 pre-existing in app.ts's implicit-any legacy code, verified against `web/app.ts` line count; 2 new in `tools/capture-grade.ts:652,666`); `signals` script chain claims green per the CLOSEOUT-ADDENDUM but the tsc drift is real. The 2 new tsc errors sit on the session-fixture kind's discriminant — a type-level regression the CLOSEOUT-ADDENDUM did not surface.

Findings organised by lens, most severe first within each. Cross-references where a finding hits multiple lenses.

---

# 1. SDD discipline

## SDD-1 — Substrate-side `SessionStarted` class exists, is exported from the topology, and is never emitted anywhere.

`substrate/src/substrate/topologies/session/__init__.py:70` defines `class SessionStarted(Struct, frozen=True)`. Line 599–607 exports it via `__all__`. Line 577–583 carries a comment: "`SessionStarted` fires via an instrument on `substrate.RunStarted` (sprint 209 wires it)." Grep `SessionStarted\(` across the entire substrate `src/` tree returns exactly one hit: the class definition itself.

Sprint 209 either did not wire the instrument or the wiring was reverted; the artifact contract's promise ("session topology bundled + CI record") landed a class with no emit site. terminal.ts (sprint 035) documents the gap in a code comment (line 120–127): "substrate's session topology does not emit a SessionStarted envelope on the record today (the SessionStarted class exists in topologies/session/__init__.py but no producer emits it). The daemon's POST response IS the observable 'session started' event from the UI's vantage."

That is halt-and-articulate in the wrong register. The disciplined move under AGENTS.md rule 4 is a substrate-side halt on `vocabulary_change_required` (or `dual_contract_fail`, since the vocabulary declares `SessionStarted` as one of the eight session kinds and no producer emits it, violating the lock's own strata assignments). A code-comment "we know substrate is broken here, so we compensate at the UI" is not a halt — it is a workaround that hides the substrate defect from the substrate side's own audit trail.

The consequence is real: `session-vocabulary.md`'s lock claims eight tags; only seven are alive. A downstream reader trusting the lock will look for `SessionStarted` on session records and find none. The `checkSessionBookends` grader invariant (v0.6, still in v0.7.1) assumes the pair `SessionStarted → ... → SessionEnded` covers every session record. Every real session record fails the invariant silently because SessionStarted never fires. The grader's `checkSessionBookends` currently ends at line 438 with `capture[0].name !== "SESSION_INIT"` — checking the browser tag, not the substrate wire kind. Two vocabularies overlap in name (SessionStarted vs SESSION_INIT) and neither reader is confused because they cover different scopes, but the substrate-wire SessionStarted has no reader at all.

**Fix.** Author `substrate/process/sprints/sprint-240-session-started-instrument.md` (or the next free number) with scope "wire the RunStarted instrument that emits SessionStarted onto session records." One file (`topologies/session/__init__.py`, add a `producer_kind("session_started", ...)` or an `on_run_started` hook). One concept. Add the observation contract: fresh session record's first non-lifecycle envelope is `SessionStarted`. Update terminal.ts to read SessionStarted from the record instead of firing DRIVER_SESSION_STARTED on daemon-ack. This closes the two-vocabulary redundancy (see SUB-1 below) and honors the eight-Struct lock's own promise.

## SDD-2 — Vocabulary evolution disciplined; v0.7.1 TAG_SPLIT is the model to imitate.

Positive finding, worth naming. v0.7 quietly extended `PANE_SWITCHED.to_pane` from four to six values at the grader (my H2 + AP5 in the prior review). v0.7.1 responded correctly: `TAG_SPLIT_LANDED` per the eight-kind evolution taxonomy, `PANE_SWITCHED` reverts to its four-value contract, `VIEW_SWITCHED` takes the two-value view-scope contract, new pairing invariant lands in the lock's invariants block ("every `VIEW_SWITCHED{to_view:desktop}` is followed within 500ms by exactly one of `GRAPH_RENDERED / TOPOLOGY_RENDERED / SCENE_RENDERED / IO_RENDERED` with matching `subject_record`").

The rationale doc names the proposal type, the motivating review, the closed set enumerated in the tag's note, and the consequential edits landing in the same commit. Every substrate-ui reader of the lock now knows: one tag, one contract. Ratification stamped in `locked_by`.

This is the discipline `grammar/PRINCIPLES.md` commitment 1 (vocabulary is the contract) is written to produce. Piece G's next vocab evolution (034b's `RECORDS_LOADED.bucket` extension, already in v0.7) has the pattern to follow.

## SDD-3 — Rule 12 audit-trail hole closed cleanly.

The prior review's H6 named a rule-12 gap: sprint 033 had been reused after a same-day revert; `sprint-033-language-pass.md` was deleted at revert time, so the reverted card lived only in a BLACKBOARD strikethrough. The CLOSEOUT-ADDENDUM path retro-authored the language-pass card with `status: reverted-2026-08-17` and a "restored 2026-08-28 per REVIEW-2026-08-28-piece-g-work-so-far H6" note. Both cards now sit on disk under distinct filenames sharing slug `033`. The audit trail is continuous.

## SDD-4 — CLOSEOUT-ADDENDUM pattern is a good addition; formalize it.

Sprint 033 landed. The prior review found scope drift between card enumeration and implementation footprint (AP8). Rather than edit the closed card (rule 12), the response landed `sprint-033-CLOSEOUT-ADDENDUM.md` — a new file citing the closed card by path and enumerating what the implementation added. That is the rule-12-honoring shape.

The pattern is worth generalizing. Every sprint whose fold-pass edits touch surfaces beyond the card's enumeration deserves a `sprint-NNN-CLOSEOUT-ADDENDUM.md`. Two ways to formalize:

- Add a `## post-close addenda` section to `sdd-kit-2/templates/SPRINT_CARD.md` describing when to write one and what shape it takes. Kit-side edit.
- Add a project-side rule to `substrate-ui/WORKING_AGREEMENT.md`: "any fold-pass edit touching a surface the closed card did not enumerate lands as a `sprint-NNN-CLOSEOUT-ADDENDUM.md`." Project-scoped.

Both are additive. Neither blocks anything.

## SDD-5 — HARNESS-CATALOG.md became a real project artifact; the discipline scaled.

At the start of piece G the harness catalog held five structural harnesses, four capture harnesses, and one grader tool. Sprint 033 added `capture_view_toggle.js`; sprint 035 added `capture_terminal_session.js`. The `signals` script chain now runs seven scripted stages (`check:vocab-parity → capture:signals → grade:signals → capture:studio-signals → grade:studio-signals → capture:view-toggle → capture:terminal-session → grade:terminal-session`) on every gate pass. Every new harness is documented in the catalog with its wired-status. The gap H1 named ("harness on disk, not wired") did not recur on sprint 035.

## SDD-6 — Sprint 032b (session-bundle-patch) queued as the substrate-ui-side unblocker; the substrate side has no matching card.

The prior review's G1 named that four 036 controls depend on server-side PATCH/POST fields piece B deferred. The response queued `sprint-032b-session-bundle-patch.md` as a substrate-ui sprint that adds `set_bundle` to `SessionRegistry` and lifts `bundle` from `_NOT_YET` to `_PATCHABLE` in `_session_patch`. That handles `bundle` (036b's blocker).

Three of the five blockers from G1 remain unaddressed at review open: `tools` (036d), `workspace` + `workspace_shape` (036c), `isolate` (036e). The 032b card scope names bundle only; a companion sprint 032c or an extended 032b scope needs to cover the rest, or 036c/036d/036e halt on the same class again.

**Fix.** Either extend 032b's scope to cover the four together (rule 6 says ≤2 files / one concept — session_registry.py + server.py, one concept "SessionManifest schema growth") or queue three more cards. The former is honest — the concept is one; the files are one each. Rule-6 stretch acknowledged in the card body.

---

# 2. Core substrate philosophy

## SUB-1 — Two-vocabulary redundancy: UI fires `DRIVER_SESSION_STARTED` on daemon-ack while substrate emits nothing on the record for the same event.

Substrate philosophy per `foundations/01-signal-driven-development.md`: "the program knows more than the human can say" — the runtime speaks for itself; consumers read the record. terminal.ts partially honors this (consumes SSE, reads envelopes) and partially violates it (emits `DRIVER_SESSION_STARTED` at the UI-daemon boundary, ahead of any record envelope).

Two distinct paths now claim the "session started" event:

- **UI-scoped:** `DRIVER_SESSION_STARTED{session_id, driver_name, driver_context_tokens, bundle_slug}` fires synchronously when `POST /api/session` returns `session_id`.
- **Substrate-scoped:** nothing. `SessionStarted` never lands on the record (see SDD-1).

Consequence: two readers of the same event with different observability. A substrate-only reader (someone tailing `~/.substrate/sessions/<id>/records/`) sees no session-start event. A UI-only reader (the grader) sees `DRIVER_SESSION_STARTED` on the client trace but nothing corresponding on the record. The `checkSessionBookends` grader invariant sits at the wrong seam to bridge them.

The disciplined move is one-vocabulary-per-event. Fix substrate side (SDD-1's sprint 240); make terminal.ts read `SessionStarted` from the SSE stream (the shape terminal.ts already uses for `Park`, `SessionEnded`, `TranscriptCompacted`, `SessionWarning`); retire the UI-emitted `DRIVER_SESSION_STARTED` or downgrade it to a grader-side derived tag (a synthetic emitted by the grader when it sees the record's `SessionStarted`, purely for e2e assertion convenience).

The v0.7 rationale's phrasing ("the five new tags are UI-side witnesses of a daemon round-trip") reads sensibly for `DRIVER_PATCHED`, `WORKSPACE_SELECTED`, `TOOLS_RESTRICTED`, `ISOLATE_TOGGLED`, `BUNDLE_ATTACHED` (all UI-driven mutations whose observability *is* the round-trip). It reads wrong for `DRIVER_SESSION_STARTED`, whose canonical observability lives on the record.

## SUB-2 — F-API-6 boundary intact on the substrate-ui side.

Positive check. Grep for kernel imports across `substrate-ui/web/**/*.ts`: zero direct hits (the one `grep` match earlier was inside a built `web/dist/assets/main-*.js` bundle string, not an import). `terminal.ts` imports `emit` from `./instrumentation/sdd` only. `app.ts` imports from `./instrumentation/sdd`, `./view-ids.js`, `./observability.js`, `./terminal.js` — all local. No `substrate.*` imports.

The daemon-side substrate-ui/server.py and session_registry.py do import from substrate proper (per canonical-home registry). Those are the daemon seam, not the browser code, and F-API-6 lives at the browser seam.

## SUB-3 — Record-as-source-of-truth held for four of five substrate-vocab events terminal.ts consumes.

terminal.ts `_handleEnvelope` (line 161–223) branches on `kind` for: `UserMessage` (renders), `ModelReply` (renders), `Park` (renders + emits `PARK_LANDED`), `SessionEnded` (renders + emits `DRIVER_SESSION_ENDED` with double-fire guard), `TranscriptCompacted` (emits `TRANSCRIPT_COMPACTED_LANDED`), `SessionWarning` (emits `DRIVER_SESSION_WARNING_EMITTED`).

Four of these read the record and lift facts into the UI vocabulary: PARK_LANDED, TRANSCRIPT_COMPACTED_LANDED, DRIVER_SESSION_WARNING_EMITTED, DRIVER_SESSION_ENDED (via SSE path). That is the substrate-shape: substrate says it, UI witnesses it.

The one exception is `DRIVER_SESSION_ENDED` also firing synchronously on `POST /end` acknowledgment (line 271). The `endedEmittedFor` double-fire guard is the ad-hoc bridge between the two paths. The disciplined move is the same as SUB-1: the record is the source of truth; the UI reads it. The synchronous emit on POST /end return should be retired; the SSE handler's SessionEnded branch is enough.

## SUB-4 — Kernel-primitive immutability held.

Piece G touched substrate only through 032b's queued card (session_registry + server.py) and the sprint 240 need (SDD-1). No core kernel primitives changed. The 2026-08-27 additive changes (Runtime.cancel_producer + v0.3 payload fields on ProducerCancelled) came from piece B's close, not piece G. Piece G honors the "immutable substrate primitives" bar from the review request framing.

## SUB-5 — The `_paintFrame` frame counter and stratified emission still hold across the two views.

The v0.7.1 pairing invariant ("every VIEW_SWITCHED{to_view:desktop} → GRAPH/TOPOLOGY/SCENE/IO_RENDERED within 500ms") preserves the view-stratum's "frame monotonic across the capture" contract. `capture-grade.ts::checkFrameMonotonic` walks paint-tags and asserts `frame` counter never decreases. Sprint 033's `_toggleView` at web/app.ts:1253 emits `VIEW_SWITCHED` without touching `_paintFrame`; the counter's monotonicity is preserved because the toggle isn't a paint.

Positive. The stratified-emission-no-querying discipline (`grammar/PRINCIPLES.md` commitment 5) holds across the container flip.

---

# 3. Code architecture

## ARCH-1 — `web/app.ts` is 1,285 lines of monolithic legacy; new modules (terminal, observability, view-ids) land as clean satellites but the god file is not decomposed.

`web/app.ts` at review open: 1,285 lines, ~40 functions, one 23-field module-level `STATE` object (line 68), one `render()` function that dispatches to eight `renderX` helpers, one 163-line rail-plus-graph section, plus the piece-G additions (`_snapshotView`, `_restoreView`, `_toggleView`, `installObservabilitySurface` call, `mountTerminal` mount). Compare to `terminal.ts` (325 lines, one export, one internal interface, typed shapes throughout) or `observability.ts` (21 lines, one function, one interface).

Piece G's growth pattern: **new work lands in new files; legacy work stays in app.ts**. `terminal.ts`, `view-ids.ts`, `observability.ts` show what modular substrate-ui code looks like. `app.ts` shows what the daemon-console UI grew into over 33 sprints of accretion. Same asymmetry the substrate side has between the small kernel and the 2,608-line `server.py` — different scale, same shape.

The piece-G queue at review open does not include a decomposition sprint for `app.ts`. Sprint 038 (piece-G review fold) plans "anticipated categories" including "legacy dock removal" and "sprint-id collisions"; it does not name app.ts decomposition. Every downstream sprint (034b rail rewrite, 036a–e session controls) will edit `app.ts` because that is where the rail and header mounts live.

**Fix.** The substrate-side hygiene-splits plan (`process/refactor-reviews/PLAN-2026-08-28-hygiene-splits.md`) covers server.py, session_registry.py, cli.py, delegate.py, substrate_tools.py. It does NOT cover `web/app.ts`. Extend the refactor-review folder with `PLAN-2026-08-28-web-app-ts-split.md` — one plan document covering: proposed `web/console/` package (rail.ts, graph.ts, stream.ts, inspector.ts, transport.ts, health.ts, launch.ts), the sprint chain to land it, the observation contract per sprint (existing `npm run e2e` is the regression gate). Rough shape: eight extraction sprints, one per concept, each ~200 lines out of app.ts into its own file, one week end-to-end.

Dispatch after piece G closes (avoid stepping on 034b's rail extraction and 036's session-header mounts). The refactor is the follow-on to piece G, not a blocker.

## ARCH-2 — `STATE` object is a growing god struct; 23 fields at review open, no schema.

web/app.ts:68 defines `STATE` as one object literal with 23 top-level fields (`name, events, graph, summary, manifest, topology, scene, cursor, playing, speed, term, sel, mode, graphView, live, resumable, assay, assays, assayReport, view, viewSnap` — count includes `term`'s nested state). No `interface State { ... }` declaration; tsc infers a literal type where every field's type is fixed to the initial value (why 665 of the tsc errors are `implicit any` cascading off STATE — see CQ-2).

STATE grew by 2 fields in sprint 033 (`view`, `viewSnap`). Each future 036 sprint plausibly adds another (`activeBundle`, `sessionHeader`, `tools`, `isolate`). By piece G close, STATE approaches 30 fields, unstructured, in one global.

The clean shape is a `interface AppState` declaration (or an msgspec-shape via a lightweight Struct pattern in TS) plus a `createState(): AppState` factory. That both eliminates the `implicit any` cascade *and* gives the god file a real schema to grep against.

**Fix.** One sprint (ARCH-2-scoped): declare `web/state.ts` exporting `AppState` interface + `createState()`; app.ts imports and uses. ~30 lines total. Zero behavior change. Type errors in app.ts drop from 665 to something smaller (many of them are transitive from STATE's inferred type being too narrow — `never[]` on `events` for instance, per tsc at line 96 "Property 'delegateParent' does not exist on type '{ name: null; events: never[]; ... }'").

Land ARCH-2 before ARCH-1's app.ts split — the split becomes trivially safer when every consumer knows the shape.

## ARCH-3 — `web/observability.ts` is the exemplary named-seam pattern; adopt for other implicit globals.

Positive finding with a suggested generalization. `observability.ts` (21 lines) exports `ObservabilitySurface` interface + `installObservabilitySurface(surface)`. The prior implicit `(window as any).STATE = STATE;` scatter became one call site (`web/app.ts:1281`) with a typed contract. Every future Playwright harness reads the typed shape; new observability additions require an interface bump.

The pattern applies elsewhere the substrate-ui code has implicit surface. Two candidates:

- **Debug-CLI seam.** app.ts binds `Ctrl+\`` to `_toggleView`. A future keyboard shortcut set (Ctrl+K, Ctrl+P, etc.) should have a named home (`web/keybinds.ts`), not scatter through `keydown` listeners in app.ts.
- **Signal-emit ergonomics.** `emit(...)` is called from four modules (app.ts, terminal.ts, studio.ts, and inline in others). A `web/instrumentation/emitters.ts` exporting typed `emitDriverPatched(sessionId, driver, priorDriver)` helpers per tag would move payload construction from every call site into one place, giving tsc's structural typing something to check per-tag rather than the current `Record<string, unknown>`. Piece G's five new session-control tags are five natural first helpers.

Not urgent. The pattern is available; adopt when the next implicit surface earns extraction.

## ARCH-4 — The daemon-side handlers are still in server.py's god file (2,608 lines); Plan 1 has not landed.

Cross-reference. `substrate/process/refactor-reviews/PLAN-2026-08-28-hygiene-splits.md` Plan 1 proposes `server_pkg/handlers/{session,topology,agent,static,legacy}.py` decomposition of server.py. Piece G's sprint 032b would add a `set_bundle` method to `SessionRegistry` and a body-dispatch branch to `_session_patch` — both lands in the god file's current shape.

If Plan 1 dispatches during piece G's window (before 032b), 032b lands in the new `handlers/session.py` and `session_registry_pkg/mutation.py` — cleaner shape, one-concept-per-file discipline preserved. If Plan 1 waits until piece G closes, 032b lands in the god files and Plan 1's later split has to carry 032b's additions.

Not a defect; a sequencing note. The prior refactor plan's dispatch order (Plan 6 primitive → Plans 4+5 → Plans 2+3 → Plan 1) puts Plan 1 last. Piece G runs in parallel with Plans 4+5 today. Whether Plan 1 lands mid-piece-G is an Architect call.

## ARCH-5 — Terminal.ts's `mountTerminal` is exemplary for the six 036 controls to imitate.

Positive. `terminal.ts::mountTerminal(root: HTMLElement, opts: MountTerminalOptions = {})` — one export, root-element parameter, options object with sensible defaults, all internal helpers prefixed `_`. No global state, no side effects beyond mounting into the root and installing event listeners on it. The pattern generalizes: each of the five 036 controls (driver picker, bundle picker, workspace picker, tools drawer, isolate toggle) should ship as `web/controls/<name>.ts` exporting a `mountX(root: HTMLElement, ...)`.

If the six 036 cards land as one-module-each rather than as inline additions to `app.ts`, piece G closes with the app decomposed at the seams that matter. Sprint 034b (rail extraction) sets the precedent; each 036 sprint would echo it.

**Recommendation.** Amend each 036a–e card's `## artifact contract → Files created/modified` to name `web/controls/<control>.ts` as a new file, with `web/app.ts` edited only to import and mount. Same rule-6 fit; different landing home.

## ARCH-6 — capture-grade.ts's growth is uniform and disciplined but the discriminant needs work (CQ-1's tsc error is architecture-level, not just quality).

The grader now supports three fixture kinds (`console | studio | session`) with per-kind `EXPECTED_ORDER` + invariants. The kind discriminant at line 652 is where sprint 035 introduced a tsc error: the switch was extended for `"session"` but the outer type union in one signature was not. The architecture is right (per-kind invariants live per-branch); the type declaration lags.

**Fix.** Widen the discriminant type at capture-grade.ts:652 to include `"session"`. Two-line edit. See CQ-1.

---

# 4. Code quality

## CQ-1 — Two new tsc errors in `tools/capture-grade.ts` at lines 652 and 666; the CLOSEOUT-ADDENDUM claim "Gates green" is not truthful under `tsc --noEmit`.

```
tools/capture-grade.ts(652,48): error TS2322: Type '"session" | "studio" | "console"' is not assignable to type '"studio" | "console"'.
tools/capture-grade.ts(666,14): error TS2367: This comparison appears to be unintentional because the types '"console"' and '"session"' have no overlap.
```

The "session" fixture kind added by sprint 035 landed in some code paths but not the discriminant declaration. This is a real type-level regression the CLOSEOUT-ADDENDUM's own gate list ("`grade:terminal-session` PASS") did not surface, because `npx tsx` runs TypeScript through tsx's transpile-only mode — no type-check at runtime. `npm run typecheck` (which does `tsc --noEmit`) is not in the `signals` script chain.

Class: **gate that measures one thing while the claim measures another.** The BLACKBOARD says "npm run signals — full chain PASS." That's true at the runtime-behavior level. The type surface is broken.

**Fix.** Two-line edit to widen the discriminant. Add `npm run typecheck` to the standing `signals` chain (or a companion `gates` script that runs typecheck + signals + e2e together). The Q1 finding from the substrate code-quality review — "Mypy strict is clean" was 111 times false — has an exact parallel here: "Gates green" is one gate below the tightness the claim implies. Same class, different runtime.

## CQ-2 — 665 pre-existing `implicit any` errors in web/app.ts; sprint 033's additions did not tighten them but also did not add many new ones.

`npx tsc --noEmit | grep -c 'error TS'` returns 666. Two are new (CQ-1). The other 664 sit in app.ts. Sample: `web/app.ts(24,12): error TS7006: Parameter 'id' implicitly has an 'any' type.` Cascade off untyped function parameters, `let STATE = { ... }` without an interface, and inferred-never arrays.

Piece G is not the moment to fix 664 legacy type errors — that is ARCH-2's scope. What is worth naming: sprint 033's additions (`_snapshotView`, `_restoreView`, `_toggleView`) landed with explicit types (`(viewId: string): any`, `snap: any`). The `any` returns are a step toward looser typing, not tighter. The disciplined shape is to name the snapshot type: `interface ViewSnapshot { scrolls: [string, number, number][]; focus: FocusSnap | null; }`. Twelve lines total; eliminates two `any` returns.

## CQ-3 — `_promptTick` recursive `requestAnimationFrame` in terminal.ts runs at ~60Hz forever.

`web/terminal.ts:320-323`:

```ts
const promptTick = (): void => {
  prompt.textContent = h.sessionId ? `${h.driverName} ›` : "substrate$";
  requestAnimationFrame(promptTick);
};
promptTick();
```

The prompt text updates on every frame regardless of state change. At 60fps that is 60 DOM writes per second forever. Even without repainting the same text, the assignment traverses the DOM and dirties the text node. The whole animation loop exists to react to `h.sessionId` changing on session open/close and `h.driverName` changing on driver swap (future PATCH work); two events per session lifetime.

The disciplined shape is a stateful updater: call `_updatePrompt()` on session-open and session-end. Zero background loop; the DOM only writes when the state changes.

**Fix.** Replace `promptTick` with `_updatePrompt()`; call it from `_openSession` after `h.sessionId = ...` and from `_closeStream` after `h.sessionId = null`. Same net behavior; zero background CPU.

## CQ-4 — Terminal.ts fetch chains use `.catch(() => null)` and then null-check; silent swallow with different flavor.

`terminal.ts:110-118`, `:246-253`, `:262-266`: three fetch chains follow the pattern `fetch(...).then(r => r.json()).catch(() => null)` and then check `if (!res || res.ok === false || res.error)`. The catch swallows every error class (network, JSON parse, DOM detach, aborted controller) and coerces to a "friendly" `null` that the caller renders as a generic error line.

Class: **coerce-to-null loses diagnostic granularity.** A network timeout, a 500 from the daemon, and a JSON parse failure all render the same line. The KIT_DIARY finding 58 ("a malformed query parameter is a 400, not a 500 — the generic exception handler is a floor, not a router") applies here.

**Fix.** Log the actual error class before coercing:

```ts
.catch((err) => { console.warn("session/turn fetch failed:", err); return null; })
```

Or better: distinguish the caller's response with a typed result — `{ok: true, data} | {ok: false, class: "network" | "http" | "parse", detail: string}`. The UI's error line then names which class fired. Eight lines; the daemon-side has this exact shape (BLACKBOARD 2026-08-26 entry: "field-name drift between spec and handler is a silent-nothing bug").

## CQ-5 — Positive: terminal.ts's public surface is one function, one options object, one root element.

`export function mountTerminal(root: HTMLElement, opts: MountTerminalOptions = {}): void`. That is the whole exported surface of a 325-line module. Every helper is `_`-prefixed. No global state. No exports beyond `mountTerminal` and its options interface. This is the shape ARCH-5 recommends for every 036 control.

## CQ-6 — Positive: msgspec-style envelope-shape mirroring at the seam.

`terminal.ts:27-32`:

```ts
interface RecordEnvelope {
  seq: number;
  kind: string;
  payload: Record<string, unknown>;
  t?: number;
}
```

Mirrors the substrate wire shape (per `substrate/src/substrate/kernel/runtime.py`'s envelope emission). The interface is local — no cross-repo import (F-API-6 held). Any field not in this interface is intentionally not consumed. That is the disciplined shape for consuming a foreign vocabulary: mirror only what you read; ignore the rest.

## CQ-7 — Positive: double-fire guard on `DRIVER_SESSION_ENDED` is real and both paths converge.

`terminal.ts:184-196` (SSE-side) + `271-273` (POST-end-side) share `h.endedEmittedFor`. Both paths check the guard before emitting; both set it after emitting. The race is closed: whichever path wins the network-vs-SSE race emits first, sets the guard, the loser's guard-check fails, skips. The double-fire is not a hypothetical — the SSE stream will deliver `SessionEnded` moments after `POST /end` returns; both paths run in the same session.

Note this only works because both paths run in the same JavaScript event loop (single-threaded browser). A Web Worker version would need real synchronization.

The guard's existence is the honest shape; the deeper move (SUB-1 fix) removes the need for it entirely.

---

## Sequencing recommendation across the four lenses

Nine actionable findings across the four lenses. Ranked by whether they block or unblock piece G's next dispatches:

1. **SDD-1 (SessionStarted emit)** — substrate-side sprint 240. Landing this before 034b lets terminal.ts drop `DRIVER_SESSION_STARTED`'s synchronous emit; the observation-contract simplifies (SUB-1 folds).
2. **SDD-6 (session-manifest schema growth beyond bundle)** — extend 032b's scope or queue 032c–e. Unblocks 036c, 036d, 036e.
3. **CQ-1 (two tsc errors)** — 5-minute type-widening edit. Also add `npm run typecheck` to the standing gate.
4. **ARCH-2 (STATE interface)** — one sprint. Cuts ~half the cascading tsc errors in app.ts. Precondition for ARCH-1.
5. **ARCH-5 recommendation** — amend each 036a–e card body to land the control as `web/controls/<name>.ts` before dispatching them.
6. **CQ-3 (prompt rAF loop)** — 30-second fix; can ride any piece-G sprint that touches terminal.ts.
7. **CQ-4 (fetch error swallow)** — one-file edit; can ride any piece-G sprint that touches terminal.ts.
8. **SDD-4 (formalize CLOSEOUT-ADDENDUM pattern)** — one WORKING_AGREEMENT or kit-template edit. Non-blocking.
9. **ARCH-1 (`web/app.ts` decomposition)** — new plan document at `substrate-ui/process/refactor-reviews/PLAN-web-app-ts-split.md`. Dispatch after piece G closes.

---

*REVIEW-2026-08-28-piece-g-full.md. Four lenses, twenty findings — six SDD, five substrate philosophy, six architecture, seven code-quality (two positive). Piece-G work landed since the prior review has been disciplined; the vocab TAG_SPLIT is the model to imitate. The one deep gap is the two-vocabulary redundancy around session-open, which reveals a substrate-side sprint (SessionStarted emit) that was declared but never wired. Fix on the substrate side, then simplify the UI. Author: Claude session 2026-08-28.*
