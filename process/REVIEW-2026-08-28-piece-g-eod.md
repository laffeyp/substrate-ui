# REVIEW — piece-G end-of-day state (five lenses)

**Reviewer:** Claude session 2026-08-28.
**State at review open.** Closed since the prior full review: sprints 032b, 032c, 034a, 035s, 035t, 035u, 035v, 035w, 037c. Sprint 033 CLOSEOUT-ADDENDUM held; 034b and 037c grew their own addenda. Vocabulary bumped v0.7.1 → v0.7.2 → v0.7.3 (58 tags, eleven dock-tied tags retired per `TAG_DEPRECATION_PROPOSED`). Substrate side of the daily driver is complete for every terminal control the feature map named; the eleven dock tags they replaced are gone.
**Still pending:** sprint 034b (rail rewrite — file `web/rail.ts` on disk but sprint card frontmatter says `pending`), sprint 036 family (desktop-view five controls), sprint 037a–b (session e2e harness), sprint 038 (fold).

**Five lenses in one pass:** SDD discipline, core substrate philosophy, code architecture, code quality, product/tech-spec conformance (the fifth lens the sprints themselves adopted after the feature-map review).

**Ground truth run at review open.**
- `npx tsc --noEmit`: **444 errors** (down from 666 at the prior full review — a real 222-error drop, most of it the app.ts trim from 1,285 → 911 lines and the `state.ts` extraction). Every remaining error is legacy `implicit any` on the surviving app.ts surface.
- vocab-parity: 58/58 locked, verified against the current.json symlink target 0.7.3.json.
- Retired-tag grep: `TERMINAL_OPENED|TERMINAL_CLOSED|CHAT_ENTERED|CHAT_EXITED|MODEL_SELECTED|PARAMS_CHANGED|TURN_SUBMITTED|AGENT_LAUNCH_REQUESTED|AGENT_LAUNCHED|AGENT_TURN_STREAMED|FINAL_ANSWER_RENDERED` — zero live emit sites in `web/`, `harness/`, `tools/`; only descriptive prose in comments and cards.
- `#termdock|termOpen|runTerm` grep: same — only prose survives.

Findings organized by lens, most severe first within each. Cross-references named.

---

# 1. SDD discipline

## SDD-1 — Sprint 037c and 034b cards say `status: pending`; both are closed per their addenda and per gates green.

`sprints/sprint-037c-legacy-dock-removal.md:6` — `status: pending`. `sprint-037c-CLOSEOUT-ADDENDUM.md` says the retirement landed. Vocab retired. Grep clean. Signals gate PASS. Every operational signal points to closed.

Same shape on `sprints/sprint-034b-rail-module-four-buckets.md`. `web/rail.ts` exists at 173 lines. `sprint-034b-CLOSEOUT-ADDENDUM.md` explains the deviation (`capture_rail_four_buckets.js` instead of adding to the doomed `e2e_console.js`). The card still says `pending`.

The CLOSEOUT-ADDENDUM pattern was supposed to be additive under rule 12 while the card's frontmatter status flipped to `closed` on close. Sprint 033 did this: `sprint-033-two-view-scaffold.md` reads `status: closed`, and `sprint-033-CLOSEOUT-ADDENDUM.md` sits alongside. Sprint 037c and 034b regressed the pattern — they wrote the addendum without flipping the frontmatter.

This is a rule-12 misreading. Rule 12 forbids deleting the closed card's *body* (audit-trail preservation). It does not forbid — it *requires* — updating the frontmatter's status field on close, because the status field IS how the audit trail communicates whether the card is live or complete. A card stuck at `pending` after close is a stale audit-trail signal; every future reader either mis-reads the queue or has to open the addendum to know what happened.

**Fix.** Two-line edits: change `status: pending` → `status: closed-2026-08-28` on both card headers. Rule 12 preserves the addendum bodies and the original card bodies; only the status field changes. Consider adding a Kit-side clarification: `sdd-kit-2/templates/SPRINT_CARD.md` § "status enum" should name explicitly that `status: closed` and a peer CLOSEOUT-ADDENDUM together are the shape.

## SDD-2 — Sprint 034 parent meta card still says `status: pending`.

`sprint-034-rail-rewrite-four-buckets.md:6` — `status: pending`. This is the pre-split meta card that 034a and 034b superseded. The prior pattern (214, 215, 217, 225 on the substrate side) marks the meta card `status: split-into-<children>`. 034 was skipped in that pass.

**Fix.** One-line edit: `status: split-into-034a-and-034b`.

## SDD-3 — Vocabulary evolution stayed disciplined across three bumps (v0.7 → v0.7.1 → v0.7.2 → v0.7.3).

Positive. Four locks in one week, each with a proper rationale doc, each ratified by named Architect directive, each with a proposal-taxonomy attribution:

- v0.7 (2026-08-28 morning): five NEW_TAG_PROPOSED for driver_session controls + one PAYLOAD_FIELD_PROPOSED for RECORDS_LOADED.bucket.
- v0.7.1: TAG_SPLIT_LANDED (PANE_SWITCHED → PANE_SWITCHED + VIEW_SWITCHED) with new pairing invariant.
- v0.7.2: presumed DRIVER_PARAMS_PATCHED addition per sprint 035v's product-spec conformance line.
- v0.7.3: TAG_DEPRECATION_PROPOSED × eleven (the dock-tied tags), ratified by directive "why sit on blackboard, do something about it."

Each bump reads the previous, names its own delta, cites the sprints motivating the change. That is exactly the eight-kind evolution taxonomy in `grammar/PRINCIPLES.md`. Model discipline.

## SDD-4 — Product-spec conformance block adopted on every 035 sprint. Recommended discipline held.

Each of sprint-035s/t/u/v/w opens with `## Product-spec conformance` naming which PRODUCT-SPEC section the sprint fulfills, which TECH-SPEC clause it consumes, and (for 035w) an explicit acknowledgement that "silence in the spec is not exclusion." The observation-contract-vs-spec discipline the daily-driver-terminal review called for landed cleanly.

Recommendation: hoist the block into `sdd-kit-2/templates/SPRINT_CARD.md` as a first-class section between `## scope` and `## artifact contract`, so future sprints inherit the shape by default.

## SDD-5 — Feature-map artifact drove real work.

Positive. `FEATURE-MAP-2026-08-28-agent-terminal-to-daily-driver.md` named nine UI-side sprints and three substrate-side unblockers. Five 035 sprints (s/t/u/v/w) plus three substrate-side (032b, 032c, 034a) closed as a direct chain. The map's "one-shot slash router sprint" prediction (single card covering eleven slashes) was honored by 035s.

Two implications for the kit: (a) named artifacts (feature maps, closeout addenda, plan docs under `refactor-reviews/`) work as coordination surfaces alongside sprint cards, and (b) mechanical-translation reviews caught the bifurcation before it hardened. Worth naming in `sdd-kit-2/TECHNIQUES.md` as a technique-in-waiting for the next kit-level pass.

## SDD-6 — Halt-and-articulate on the 037c scope discovery.

The 037c closeout addendum reads: "The card as pending named a smaller job than the retirement actually was … Grep after the fact identified eleven signal tags whose sole emit sites lived inside the dock code the card would delete." That is halt-and-articulate mid-sprint: the executor discovered the true scope exceeded the card's enumeration and either surfaced or landed the wider scope with an addendum documenting the deviation. The addendum names what was added and why. Rule-12-honoring.

The alternative — silently deleting the eleven tags without retiring them from the lock and grader — would have crashed vocab-parity at 58/69 and broken the console-fixture invariant. The halt-and-fix landed under one commit.

---

# 2. Core substrate philosophy

## SUB-1 — Two-vocabulary redundancy on `SessionStarted` still open.

The prior full review's SDD-1 named a substrate-side gap: `SessionStarted` class exists in `topologies/session/__init__.py:70`, is exported via `__all__`, is never constructed. `terminal.ts::_openSession` (line 257 today) still fires `DRIVER_SESSION_STARTED` synchronously on daemon-ack rather than reading a `SessionStarted` envelope from the record.

The 035s/t/u/v/w work rewired the daily-driver terminal against piece-B endpoints correctly; the daily-driver terminal now reads five substrate-wire envelope kinds from the SSE stream (`UserMessage`, `ModelReply`, `Park`, `SessionEnded`, `TranscriptCompacted`, `SessionWarning`). It still emits `DRIVER_SESSION_STARTED` at the UI-daemon boundary rather than lifting it from the record.

No substrate-side sprint has been queued (my earlier recommendation was sprint 240 on the substrate side). The gap survived across the 032b/032c/034a landings.

**Fix.** Author `substrate/process/sprints/sprint-240-session-started-instrument.md`. Wire an on-`substrate.RunStarted` instrument that emits `SessionStarted` at seq 1 on session records. Update terminal.ts to consume `SessionStarted` from the record via SSE; drop the synchronous `DRIVER_SESSION_STARTED` emit. `checkSessionBookends` grader invariant then has a real witness. One substrate card + one one-line UI edit.

## SUB-2 — F-API-6 boundary intact after 037c's shed of `_agent_legacy`-adjacent code.

Positive. `_agent_legacy` on the substrate-ui daemon side still exists at server.py:1935 (kept as `?legacy=true` opt-in for one-release deprecation per sprint 224d) — but browser-side `sendChatMessage` at app.ts:336, which fired the legacy `POST /api/agent`, is gone. Grep confirms `web/**/*.ts` no longer references `/api/agent`. The boundary tightened.

## SUB-3 — Record-as-source-of-truth held across the 035s/t/u/v/w wire.

Every mutating slash in `_slashRoute` hits the daemon endpoint that owns the manifest. `/model` → PATCH driver → daemon writes manifest, daemon-side (substrate) resolves next turn's Responder from the new driver. `/tools` → PATCH tools → daemon writes manifest. `/set` → PATCH driver_params (v0.7.2 addition). Every emit is post-ack (the daemon confirms, then the tag fires) — the record is the source of truth, the UI is the witness.

The `endedEmittedFor` double-fire guard on `DRIVER_SESSION_ENDED` still lives (terminal.ts around the SSE `SessionEnded` handler and the POST `/end` path). That is the SUB-1 fix's downstream: once `SessionStarted` reads from the record, `SessionEnded` should do the same, and the double-fire guard collapses.

## SUB-4 — Substrate primitives immutable across the piece-G window.

Positive. Piece G did not touch `Runtime`, `Producer`, `Topology`, `RunState`, `LiveRecord`. Sprint 032c grew `SessionManifest` (a msgspec Struct, per the manifest-schema-growth path that 215c named). Sprint 032b added `set_bundle` to `SessionRegistry` (substrate-ui side). Sprint 032c added driver-params to `SessionManifest` + PATCH + resolver. None touch the kernel.

## SUB-5 — v0.7.3 retirement honored the eight-kind evolution taxonomy but did NOT preserve the retired-tag definitions in the lock.

The eleven retired tags — TERMINAL_OPENED, TERMINAL_CLOSED, CHAT_ENTERED, CHAT_EXITED, MODEL_SELECTED, PARAMS_CHANGED, TURN_SUBMITTED, AGENT_LAUNCH_REQUESTED, AGENT_LAUNCHED, AGENT_TURN_STREAMED, FINAL_ANSWER_RENDERED — are gone from 0.7.3.json's tag list (58 tags in v0.7.3 vs 69 in v0.7.2).

`grammar/PRINCIPLES.md` commitment 1 ("vocabulary is the contract; refactored like a public API; changes are intentional and old names are retired explicitly, never silently") + TECHNIQUE #45 ("deprecation entries instead of removals") argue: a retired tag stays in the vocabulary with a `retired: true` + `replaced_by:` marker, so a downstream reader that has an old fixture on disk can still parse it. Removing the entry outright means an old capture referencing `TERMINAL_OPENED` fails vocab-parity as "unknown tag."

The v0.7.3 rationale doc names the retired tags in prose (in `locked_by`) but the *schema* drops them. That is the difference between explicit deprecation (kept with a marker) and silent removal (gone from the schema).

**Fix.** Restore the eleven tags to v0.7.3.json's tag list with `retired: true`, `retired_at: "2026-08-28"`, `replaced_by: null` (or a specific tag where one exists). Update `check:vocab-parity` to accept `retired:true` tags as valid-but-not-emitted (an emit site referencing them still fails, but an old fixture parsing them succeeds). Same class as `signals/versions/0.6.json` staying on disk — the audit trail is the work.

The alternative (accept the current shape) is a v1-scale project decision: if old console fixtures are never re-graded, the retirement can be a clean drop. Ratify the choice in `## Decisions`.

---

# 3. Code architecture

## ARCH-1 — Terminal.ts at 1,037 lines with a 308-line `_slashRoute` chain-of-if.

`terminal.ts` grew from 325 lines at 035 close to 1,037 lines after 035s/t/u/v/w. Function-size inventory:

| Function | Lines | Concern |
|---|---|---|
| `_slashRoute` | 308 | dispatcher for eleven slashes |
| `mountTerminal` | 129 | export, mounts + wires everything |
| `_handleEnvelope` | 86 | SSE branch table |
| `_openSession` | 85 | session creation + params PATCH + stream open |
| `_mkChildren` | 77 | DOM construction |
| `_endSession` | 40 | end path |

`_slashRoute` at 308 lines is exactly the antipattern the substrate code-quality review named at cli.py:1053 (Q11) — a chain of `if slash === "/foo"` branches, each parsing args, calling a helper, printing to the terminal body. The GoF Command-pattern extraction I sketched for cli.py applies verbatim here: one class per slash with `parse(args) → validate() → execute(handle) → format_result() → str`, a `SLASH_COMMANDS: Record<string, SlashCommand>` router, a ten-line `_slashRoute` that looks the command up and calls it.

Same class as substrate's cli.py chain-of-if; same fix; different runtime. Piece G's rebuild has reproduced the substrate side's known antipattern rather than avoiding it.

**Fix.** Add `web/terminal/slash/` package. One file per slash: `exit.ts`, `help.ts`, `model.ts`, `tools.ts`, `set.ts`, `context.ts`, `inspect.ts`, `list.ts`, `replay.ts`, `run.ts`, `diff.ts`, `studio.ts`, `bundle.ts`, `interrupt.ts` (fourteen files, ~15-30 lines each). `web/terminal/slash/index.ts` exports the `SLASH_COMMANDS` dict and a small `route(line, handle) → boolean`. `terminal.ts::_slashRoute` collapses to ten lines. Total LOC roughly unchanged; per-file LOC drops by 20×; adding a new slash is one new file, not one new branch in a 308-line function.

Not a piece-G blocker. Do as a hygiene sprint before piece G closes (call it 035x or defer to a piece-G-follow-on). Sprint 038's fold is the natural home if the fold has appetite; otherwise its own card.

## ARCH-2 — App.ts down from 1,285 to 911 lines; STATE.ts extraction landed.

Positive. The prior review's ARCH-2 (STATE interface extraction) landed as `web/state.ts` at 76 lines. app.ts trimmed 374 lines via 037c's dock retirement + the extraction. tsc error count dropped by 222 (from 666 to 444) — direct evidence of the STATE typing helping.

app.ts still hosts the rail + graph + stream + inspector + transport + launch + health surfaces. Rail extraction is queued (sprint 034b, closeout-addendum on file). The other five concerns still live inline.

**Fix.** The `PLAN-web-app-ts-split.md` I recommended in the prior review is the natural home. Six extraction sprints (`console/{graph,stream,inspector,transport,launch,health}.ts`), each ~100-200 lines out of app.ts. Land after piece G closes; sprint 036a–e work touches the session header, not these surfaces, so no merge conflict.

## ARCH-3 — Terminal.ts's `mountTerminal` shape held.

Positive. `export function mountTerminal(root: HTMLElement, opts: MountTerminalOptions = {}): void` is still the whole public surface at 1,037 lines. Every helper `_`-prefixed. No exports beyond `mountTerminal` + `MountTerminalOptions`. The 035s/t/u/v/w growth landed *inside* the module without leaking new exports. ARCH-5 in the prior review (recommend 036 controls follow this shape) still holds and now has a proven precedent.

## ARCH-4 — Rail.ts landed at 173 lines with the same clean shape.

Positive. `web/rail.ts` at 173 lines. Presumed one export (`mountRail` per the sprint card). Precedent from mountTerminal reproduced. Piece G's growth pattern is now: new modules ship as `web/<name>.ts` with `mount<Name>` exports; `app.ts` shrinks accordingly.

Same pattern for each of the five 036 controls per the ARCH-5 recommendation of the prior review: `web/controls/driver-picker.ts`, `web/controls/bundle-picker.ts`, etc.

## ARCH-5 — The daemon-side god files (server.py 2,608; session_registry.py 1,232) still not decomposed.

Cross-reference to `substrate/process/refactor-reviews/PLAN-2026-08-28-hygiene-splits.md`. 032b, 032c, 034a all added functions/methods/handlers to the god files. Plan 1 (server.py split) and Plan 2 (session_registry.py split) have not dispatched. Piece G is stacking substrate-ui-side additions on top of un-decomposed daemon code.

Timing per the plan: Plan 1 dispatches after piece G closes. That is defensible if piece G closes soon; if 036/037/038 stretch into weeks, the god files grow with them.

Not urgent. Named because the growth is real: `session_registry.py` at review time is likely >1,300 lines after `set_bundle` + driver-params helpers. Verify before Plan 2 dispatches.

---

# 4. Code quality

## CQ-1 — 444 tsc errors survive; two of them at `capture-grade.ts` from the prior review are still there.

`npx tsc --noEmit` at review open: 444 errors. Two categories:

- ~442 legacy `implicit any` in app.ts on the surviving 911-line surface. Pre-existing baseline; drops incrementally as ARCH-2's split lands.
- 2 in `tools/capture-grade.ts:652,666` on the "session" fixture-kind discriminant. These landed at sprint 035; my prior CQ-1 flagged them; no card has closed them.

`npm run typecheck` was recommended for the standing `signals` gate; not verified adopted. The signals chain runs `tsx` (transpile-only) and does not catch these.

**Fix.** Two-line type-widening at capture-grade.ts:652,666 discriminant. Add `npm run typecheck` to the `signals` chain. Both fixes ≤10 minutes. Sprint 038's fold can absorb them if not landed sooner.

## CQ-2 — Sleep-based sync fully retired on new piece-G harnesses.

Positive with a caveat. `waitForTimeout` grep across `harness/*.js`:

| Harness | Sleep hits | Provenance |
|---|---|---|
| capture_view_toggle.js | 0 | sprint 033 (fixed post-review) |
| capture_terminal_session.js | 0 | sprint 035 |
| capture_terminal_driver_picker.js | 0 | sprint 035t |
| capture_terminal_create_controls.js | 0 | sprint 035w |
| capture_terminal_params_drawer.js | 0 | sprint 035v |
| capture_rail_four_buckets.js | 0 | sprint 034b |
| capture_terminal_interrupt.js | 1 | sprint 035u |
| capture_terminal_slash_router.js | 6 | sprint 035s |
| capture_studio_signals.js | 0 | prior |
| capture_signals.js | 2 | prior legacy |
| capture_console.js | 8 | prior legacy |
| capture_states.js | 7 | prior legacy |
| capture_studio.js | 9 | prior legacy |
| capture_assay.js | 2 | prior legacy |
| capture_delegate.js | 1 | prior legacy |
| capture_scene.js | 2 | prior legacy |

Every new piece-G harness (six of them) except two is sleep-free. `capture_terminal_slash_router.js` still uses six sleeps; `capture_terminal_interrupt.js` uses one. That is regression: the AP1 fix pattern is available and known, but the busiest new harness (six sleeps) skipped it.

**Fix.** Replace each `waitForTimeout(N)` in `capture_terminal_slash_router.js` with `waitForFunction(cond, {timeout})`. Add a lint rule to the harness catalog: "any new `waitForTimeout` in a harness is a review-blocker." Legacy harnesses (~30 hits total in prior harnesses) survive as pre-existing baseline; new ones must not add.

## CQ-3 — Recursive rAF `promptTick` retired.

Positive. My prior CQ-3 named a 60Hz DOM-write loop in `terminal.ts`. Grep for `promptTick`: zero hits today. Replaced with an event-driven `updatePrompt()` call (visible at 035s where `/model` slash calls `h.updatePrompt()` after PATCH-ack). CPU noise gone; the fix landed clean.

## CQ-4 — Fetch error handling upgraded from swallow-to-null to typed FetchResult.

Positive with named provenance. `terminal.ts::_postJson<T>` and `_fetch<T>` (lines 223 and 864) now return `FetchResult<T>` — a discriminated `{ok:true,data} | {ok:false,failure_class,detail}` shape. Every caller (`_openSession`, `_sendTurn`, `_endSession`, every slash) reads the `failure_class` and renders `[<class>] <detail>` in the terminal body. My prior CQ-4 called for exactly this shape. Adopted.

Sample:

```ts
_push(body, `/model failed [${result.failure_class}] ${result.detail}`, CLS.err);
```

The `.catch(() => null)` pattern is gone from `terminal.ts`. One `.catch(_)` swallow survives at `app.ts` and one at `terminal.ts` (grep confirmed) — small residue, worth naming for cleanup.

## CQ-5 — Positive: driver-picker + params-drawer + create-controls each shipped with real observation contracts.

Sample `capture_terminal_driver_picker.js` has zero sleeps and reads `window.__signals` for `DRIVER_PATCHED` shape assertion. `capture_terminal_create_controls.js` asserts on the manifest state written to disk. `capture_terminal_params_drawer.js` reads the params PATCH round-trip.

Each harness is scoped to one control, mirrors the sprint's `## observation contract`, and runs in the standing `signals` gate. That is the two-track discipline the prior reviews called for, applied per-control.

## CQ-6 — `_slashRoute` at 308 lines carries visible copy-paste.

Adjacent to ARCH-1's decomposition argument. Every slash branch in `_slashRoute` repeats: parse args → check session presence → build fetch URL → await `_fetch` → check `result.ok` → push error line OR emit tag + push accent line. Fourteen slashes × ~20 lines of nearly-identical shape. The Command pattern is the disciplined fix; a smaller alternative is a `withSession<T>(h, fn)` wrapper + a `withFetchResult(result, onOk, onFail)` helper — three helpers, ~30 lines, remove ~150 lines of duplication.

Same file, same review pass as ARCH-1.

## CQ-7 — Positive: TypeScript typing tightened in the new modules.

Every 035 sprint's new/edited code uses proper types: `interface TerminalHandle`, `type ViewSnapshot`, `interface RecordEnvelope`, `interface MountTerminalOptions`, `FetchResult<T>` generic, `PendingCreate` shape. No `any` returns except at explicit boundaries (`_populateDriverPicker`'s Ollama-response parse). The 442 legacy tsc errors are entirely inside app.ts's untouched region.

Contrast with cli.py's mostly-untyped Python — the substrate side accumulates `Any` where the browser side avoids it in new work. TypeScript discipline holds.

---

# 5. Product-spec + tech-spec conformance

## SPEC-1 — Product spec §13 View A satisfied for the terminal view.

Product spec §13 View A: "just the agent terminal, filling the window; same DOM as substrate-ui's integrated terminal today." The daily-driver terminal now carries every capability the agent terminal shipped, per the feature map:

| Feature (feature map row) | Landed |
|---|---|
| Driver picker + `/model` slash | 035t + 035s ✅ |
| Params (think/tokens/timeout) drawer + `/set` slash | 032c + 035v ✅ |
| Bundle attach at create + `/bundle` slash | 032b + 034a + 035w ✅ |
| Workspace + `--workspace` at create | 032c + 035w ✅ |
| Isolate at create | 032c + 035w ✅ |
| Tools restriction (create + PATCH mid-session) | 032c + 035w + 035s ✅ |
| `/interrupt` + Ctrl+C | 035s + 035u ✅ |
| `/exit` + Ctrl+D | 035 (shipped) + 035s ✅ |
| `/help` | 035s ✅ |
| `/model` mid-session | 035t + 035s ✅ |
| `/context <lo-hi>` | 035s ✅ |
| `/inspect` + `/narrate` | 035s ✅ |
| `/tail` + `/cat` | 035s ✅ |
| `/list [records\|topologies\|sessions\|applications\|bundles]` | 035s ✅ |
| `/replay` | 035s ✅ |
| `/run <app>` | 035s ✅ |
| `/diff` | 035s ✅ |
| `/studio` | 035s ✅ |

Eighteen features enumerated in the feature map's summary, eighteen wired. **The bifurcation is closed.** A Claude Code user opening `#view-terminal` gets the shape §13 View A promises.

## SPEC-2 — Product spec §2 CLI verbs still not in scope for piece G.

`substrate chat`, `substrate resume`, `substrate session ls|end|rm|set-name`, `substrate bundle create|ls|show|edit`, `substrate builder`, `substrate run` — the eight-verb CLI at product spec §2. Piece D (sprints 218-222) shipped these on the CLI. Piece G's terminal view does not open the CLI in a subprocess; it talks to the daemon directly through JS. That is correct for a browser terminal. Not a defect.

The subtle mismatch: a user running `substrate` in a real terminal (piece D) gets the CLI's slash router (cli.py:1053); a user opening the browser terminal (piece G) gets terminal.ts's slash router (_slashRoute:555). Two implementations, one contract. Sprint 036f (parity test) is meant to gate this. Its scope currently names the five 036 controls only; parity needs to extend to the slash router — `/model` via cli.py vs `/model` via terminal.ts must produce the same manifest state.

**Fix.** Amend sprint 036f's scope to include a slash-router parity smoke: for each of the fourteen slashes, drive both cli.py (subprocess) and terminal.ts (Playwright), assert equal manifest state after.

## SPEC-3 — Product spec §13 View B (desktop) five controls still pending.

Sprint 036a-e are the queued cards. Each has a substrate wire; each has a card body; none have dispatched. Piece G's terminal-view work satisfies View A; desktop-view is next.

The 035w work (create-controls in the terminal) partially anticipates the 036 controls' scope: bundle picker (035w before first turn) vs 036b (session-header attach mid-session). Not a duplicate — different mount site, same wire. 036 sprints should recognize the shared wire and reuse the terminal-side helpers where possible (`_fetch<T>`, the emit-after-ack pattern).

**Fix.** Amend each 036 card's context_files to include the analogous 035 sprint's terminal-side helpers so the 036 implementation shares the wire helper rather than reimplements.

## SPEC-4 — Tech spec §10 "Piece G — substrate-ui two-view shape" tables fulfilled for the terminal half.

Tech spec §10's "Desktop-view five controls" table is scoped to `#view-desktop`. Sprint 035s/t/u/v/w's work sits in `#view-terminal` — orthogonal to the tech-spec table. Tech spec §10 says nothing about the terminal-view's own control surface; it names `web/terminal.ts` as "integrated terminal DOM promoted from docked bar to real column" and leaves the surface implicit.

The product spec §13 was the authoritative source for View A's surface; the tech spec §10 table was authoritative for View B's. Both got their answers. Piece G's execution correctly weighted product spec §13 View A after the feature-map fold.

## SPEC-5 — Deferred product-spec items match tech-spec deferrals.

Product spec §15 lists what the daily-driver is NOT: real PTY, standalone-app wrapper, MCP-protocol wrapping in v1, thinking capture, movable panes, six-tier compaction, graphite skin. Tech spec §14 mirrors the list. Nothing landed in piece G that exceeds the deferrals.

## SPEC-6 — One product-spec surface unshipped and unqueued: `/replay <record>` scrub-and-play in the terminal.

Product spec §2a: "`/replay <record>` — open a record for scrub-and-play in the terminal." Sprint 035s wired `/replay <record>` in the terminal per the feature map — but the current slash reads `api.assert_replayable(Path(args[0]), "3a")` (per the feature-map's substrate side row) and prints a byte-identical-replay confirmation. That is validation, not scrub-and-play.

The CLI's `/replay` at cli.py:1191 has the same behavior — validation, not scrub. Product spec §2a's language ("scrub-and-play") suggests a live replay driver (the desktop view's `renderGraph` playing back at controlled speed). No sprint queues that.

**Fix.** Ratify the current shape (`/replay` validates, does not scrub) as a v1 acceptable interpretation, or queue a sprint 035y for scrub-and-play in the terminal view. Recommend ratification: scrub-and-play in a text terminal is awkward; the desktop view's transport at app.ts already provides this. `/replay` as validation-in-terminal is the honest terminal interpretation.

---

# Sequencing recommendation

Actionable findings across the five lenses, ranked by whether they block or unblock the remaining piece-G work:

1. **SDD-1 (status: pending on 037c and 034b)** — two-line edits. Cannot dispatch sprint 038 (piece-G fold) without accurate card statuses; the fold reads which cards are open.
2. **SDD-2 (034 meta card `pending`)** — one-line edit.
3. **CQ-1 (2 tsc errors + no typecheck in signals chain)** — under an hour. Do before dispatching 036a to prevent the drift from compounding.
4. **CQ-2 (`capture_terminal_slash_router.js` has 6 sleeps)** — replace with `waitForFunction`. One harness edit.
5. **SUB-1 (SessionStarted emit)** — substrate-side sprint 240. Unblocks two-vocabulary redundancy; simplifies terminal.ts by ~15 lines.
6. **SUB-5 (retired-tag preservation)** — one lock edit + rationale-doc update. Ratify choice in ## Decisions.
7. **ARCH-1 (`_slashRoute` 308-line chain-of-if)** — one sprint. Do before piece G closes (sprint 038's window is natural) or defer to a piece-G-follow-on.
8. **SPEC-2 (036f parity extends to slash router)** — amend the card scope before 036f dispatches.
9. **SPEC-3 (036 controls reuse terminal helpers)** — amend each 036 card's context_files.
10. **SPEC-6 (/replay ratification)** — one `## Decisions` entry.
11. **ARCH-2 continues** — Plan `web-app-ts-split.md`. After piece G closes.
12. **CQ-6 (`_slashRoute` copy-paste)** — folds into ARCH-1's split; not a separate item.

Next by the project's declared order: **sprint 036a (desktop-view driver picker)**. SDD-1 + CQ-1 + SPEC-3 amendment should land alongside as fold work; they cost minutes each and clear the audit-trail lens for 036 dispatch.

---

## What is on track

- Five feature-map sprints (035s/t/u/v/w) closed as one batch with per-card product-spec conformance blocks — the recommended discipline hit adoption on the first try.
- 037c's scope-discovery landed under one commit with rule-12-honoring closeout addendum.
- Vocabulary evolution stayed disciplined through four bumps.
- tsc error count dropped 33% (666 → 444) via app.ts trim + state.ts extraction — the ARCH-2 recommendation paid out.
- Sleep-based sync retired on six of eight new piece-G harnesses.
- Recursive rAF promptTick retired.
- Fetch error handling upgraded to typed FetchResult across terminal.ts.
- F-API-6 boundary tightened after `sendChatMessage` deletion.
- 44 substrate-side + substrate-ui-side sprint cards over four days of piece-G work, roughly one closeout every two hours, without a rule-12 violation on any body.

## What is off track

- Two sprint cards (037c, 034b) show `status: pending` after real close. Audit-trail signal drift (SDD-1).
- 034 meta card also stale (SDD-2).
- Two `tsc` errors from sprint 035 persist; `signals` gate does not run typecheck (CQ-1).
- Retired tags dropped from the schema rather than marked `retired:true` (SUB-5).
- `_slashRoute` at 308 lines reproduces the substrate cli.py antipattern the code-quality review named (ARCH-1).
- One harness (slash router) still uses sleep-based sync (CQ-2).
- Substrate-side `SessionStarted` emit still unqueued (SUB-1).

Nine actionable items; six are card-body or one-line edits; three (SUB-1, ARCH-1, ARCH-2's continuation) are sprint-scale. None block dispatching 036a.

---

*REVIEW-2026-08-28-piece-g-eod.md. Five lenses, twenty-eight findings — six SDD (four positive), five substrate philosophy (three positive), five architecture (three positive), seven code-quality (three positive), five spec-conformance (three positive). The mechanical translation the feature map called for landed clean; the audit-trail housekeeping and one architectural pattern-reproduction are the small drifts left. Piece G's terminal half satisfies product spec §13 View A; the desktop half (036 family) opens next. Author: Claude session 2026-08-28.*
