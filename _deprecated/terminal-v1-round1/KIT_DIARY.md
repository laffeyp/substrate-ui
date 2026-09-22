# KIT_DIARY — terminal-v1

*Working diary of what the kit does well, what gets in the way, and what the next kit version should change. One entry per sprint close. Parent project's diary (`../process/KIT_DIARY.md`) carried H1–H4 from the prior substrate-ui build and produced Addendum A of `../../sdd-kit-2/ADDENDUMS.md`. This file extends that lineage as the second increment of substrate-ui, per Addendum A10.*

---

## Hypothesis tracking

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | An eight-tab arrangement of the existing panes reads more legibly than the current dock-plus-rail layout, without changing any pane's internals. | _pending_ (partial 006) | Sprint 003–005 landed the tabs + panes; the arrangement paints, harness grades it. Legibility question is a human judgment that resolves once a real user (Architect) uses it — deferred until Wave 2 completes and the front door actually works. |
| H2 | The subject rule (Records selection drives all read tabs) removes the "which record am I looking at" confusion the current UI has when the terminal dock is running one record and the graph shows another. | _pending_ | Sprint 3.1 (Wave 3) will wire this. Not yet exercised. |
| H3 | Wave 2's port-a-pane-per-sprint pattern lets Wave 2 run auto-within-phase after Sprint 2.1 verifies the pattern, at parent substrate-ui's pace of the prior build. | **partially falsified (Sprint 006)** | Sprint 006 (agent-terminal skeleton) surfaced that "one pane, one sprint" is under-scoped. The parent's agent terminal is a five-sprint sub-arc: 007 wire /api/agent, 008 model picker, 009 params strip, 010 live-follow, 011 multi-turn. The other seven panes each have their own sub-arcs of similar depth. Cadence policy updated: Wave 2 stays plan-mode-per-sprint (not auto), because each pane's port has real design decisions the Architect must weigh. |
| H4 | Addendum A9's "reader UI needs no vocabulary lock" holds in practice — terminal-v1 ships without a `signals/0.1.json` and the harness still grades cleanly through DOM + pixel-anchor decode alone. | **confirmed (Sprints 001–006)** | No `signals/` directory exists. Six sprints closed with full dual-contract + observation-contract grading via structural (Playwright DOM) + perceptual (element-shot + pixel decode) lenses. A9 holds — the tone canon in `WORKING_AGREEMENT.md` was the only vocabulary needed. |

---

## Entries

---

### 2026-08-14 — Sprint 001 (founding artifacts) closed

**What happened:** Three founding files landed under `substrate-ui/terminal-v1/`: `WORKING_AGREEMENT.md` (project identity, canonical home pre-seeded, tone canon, cadence, halt conditions), `BLACKBOARD.md` (seven sections, eight decisions pre-seeded from the session), `KIT_DIARY.md` (four hypotheses). Sprint card written after the fact (backfilled) — a hard rule 5 slip caught by the Architect.

**What worked:**

- Addendum A9's ruling that a reader/projector UI needs no `signals/` lock let Sprint 001 skip the Vocabulary Session (usually 2.5–4 hours of Architect+agent work per BOOTSTRAP.md). The tone canon in WORKING_AGREEMENT.md is enough.
- Addendum A10's "own home + core artifacts before second increment" was the trigger. Without A10 I would have piled terminal-v1's work into the parent's BLACKBOARD and diluted its audit trail.
- Pre-seeding the canonical home registry with 11 render function rows meant Sprint 006's addition of `renderTerm` didn't need a "where does this live" halt — the answer was already there.

**What got in the way:**

- The hard-rule-5 comprehension affirmation slip: I wrote the founding artifacts before writing an affirmation to `## Surfaced for review`. The Architect had to catch it. The kit says the affirmation goes first; I skipped straight to the artifacts because they felt like the more "real" work. That was wrong. The affirmation IS load-bearing (per AGENTS.md § "Why the 'in your own words' matters mechanically" — it primes serial compute + in-window attention).

**What this says about the next kit version:**

- The affirmation is easy to skip when a project's first sprint has visible artifacts. A friendlier version of AGENTS.md could put "write the affirmation FIRST — before any Write call" in the hard-rules list as a numbered step, not just in the § "Session-start step". As-is it reads as background context; the rule content is buried.

---

### 2026-08-14 — Sprint 002 (harness stubs + placeholder + server route) closed

**What happened:** Landed a placeholder `web/index.html`, the two Playwright harness scripts (`e2e_terminal_v1.js` structural + `capture_terminal_v1.js` perceptual), a `/terminal-v1/` route in `substrate-ui/server.py` (refactored `_static` → `_static_root(root, path)` so both routes share containment logic), and two `npm run` script entries in the parent `substrate-ui/package.json`. Card written BEFORE code — hard rule 5 discipline restored.

**What worked:**

- Copying `decodePNG` verbatim from `../harness/capture_scene.js` (per A2's zero-dep decoder, ~30 lines) meant zero design work on the PNG reader. Battle-tested, no `pngjs` install.
- Inheriting the parent's pinned `playwright` devDep via `package.json` meant no fresh `npm install` — A5's "repo-scoped, not `/tmp`" applied automatically because the parent already scoped it.
- The `_static_root(root, path)` refactor was necessary for the server to serve two static roots; doing it as a rename-and-parameterize kept the existing `/` route byte-for-byte identical, verified by regression-running the parent `npm run e2e` (all checks still green).

**What got in the way:**

- A favicon 404 surfaced on the first harness run (the harness's `no console/page errors` assertion caught it). The fix at root (inline `data:` favicon URI) is honest — suppressing the check would have been a spot fix per D4.

**What this says about the next kit version:**

- The parent's `harness/*.js` collection is a de-facto pattern library for reader-UI observation. The kit should name that explicitly — a section in TECHNIQUES.md § Web/frontend called "Adopt the parent's pinned Playwright harness when growing a sub-project" would formalize what A10 already implies.

---

### 2026-08-14 — Sprint 003 (tab-bar shell) closed

**What happened:** Replaced the placeholder with a top tab bar of eight `<button role="tab">` elements, an initial-active state on Agent Terminal, and an eight-slot deterministic pixel-anchor strip (A2). Extended both harnesses.

**What worked:**

- The pixel-anchor strip (eight 4×4 divs) is a small load-bearing addition. The perceptual harness decodes 8 pixels to reconstruct which tab is active; DOM assertion alone would have missed a CSS bug that painted the wrong tab as active while `aria-selected` was correct on the intended tab. This is A2 applied to a UI-native surface (not just a game grid).
- Using stable `data-testid` per tab (leaves, not the tabbar container) honored the accessibility-identifier propagation hazard from Cascade Addendum B.

**What got in the way:**

- The Sprint 002 root-marker gate broke: I set `.root-marker { display: none }` so it wouldn't visually pollute the page, but Playwright's `waitForSelector` defaults to `state: 'visible'` — the harness timed out 14× on a hidden element. Fix at root: switch both harnesses to gate on the tab bar (visible element). A4 in reverse: verify the observer isn't waiting on the wrong condition either.

**What this says about the next kit version:**

- The A4 rule ("verify the observer") should include an explicit sub-rule: **when a marker element goes non-visible for design reasons, ANY harness that waits on it must be updated in the same sprint**. Splitting the "hide the marker" edit from "update the wait target" makes the harness silently wrong until the next run. A card note or a template check would catch this before the harness times out.

---

### 2026-08-14 — Sprint 004 (tab-switch mechanics) closed

**What happened:** Wrote `web/app.js` with one delegated click handler on `.tabbar` that toggles `aria-selected` on tabs and `.active` on anchors. Added `<script src="app.js" defer>`. Extended both harnesses to click each of 8 tabs and grade the transition structurally + perceptually.

**What worked:**

- One delegated handler (~15 lines) captures the whole tab-switch semantics. No framework, no state manager, no re-render engine.
- The perceptual harness clicking through all 8 tabs (nine total captures — one boot + eight click-throughs) is A3-adjacent: the tab strip is L-R asymmetric under click (slot i lights per tab i), so a hypothetical mirror bug that inverted the strip would fail 4 of 8 assertions.
- `waitForSelector` on `[aria-selected="true"]` is a real condition per A4 — no `sleep`.

**What got in the way:**

- Nothing. Wave 1 closed clean.

**What this says about the next kit version:**

- The pattern "one delegated event handler on a container, gate on data-attribute" is the correct default for a reader UI's chrome. TECHNIQUES.md § Web/frontend could name it: **event delegation on stable containers over per-element listeners**, both for perf and for the "handler ran, not accident" PATH check (B3).

---

### 2026-08-14 — Sprint 005 (multi-pane skeleton) closed

**What happened:** Replaced the single `<main>` pane with eight `<section class="pane" data-pane-for="tab-...">` blocks under a `.pane-region` wrapper. Extended `activate()` to toggle a `.pane-active` class per section on tab click.

**What worked:**

- Absolute-positioned panes with `display:none` on inactive ones means only one pane is in the layout at a time. Cheaper than removing/inserting DOM per swap; state (like the terminal input's cursor position) survives because the DOM stays.
- The refactor was purely additive — Sprint 004's `activate()` gained one loop, no existing behavior changed. #43 (refactor as chain of behavior-preserving sprints) applied cleanly.

**What got in the way:**

- Split from the original Sprint 005 card. My first draft of the Sprint 005 card was "agent terminal shell" — bundled the multi-pane refactor and the terminal port together. On execution I saw they were two concepts and split into 005 (multi-pane) + 006 (terminal skeleton). Hard rule 6 (≤2 files, one concept) held me honest.

**What this says about the next kit version:**

- A helpful rule of thumb for card composition: **when a card's `## scope` paragraph contains the word "and" between two component-scoped changes, split the card**. The heuristic isn't in TECHNIQUES.md today.

---

### 2026-08-14 — Wave 2 close (sprints 010–016): reader tabs + Studio + walkthrough

**What happened:** Seven port sprints landed in one push. Sprint 010 wired the subject rule (selectRecord fetches events, event stream reads STATE.events, inspector reads STATE.selectedEvent) — the load-bearing subject rule works end-to-end. Sprint 011 I/O tab reads RunStarted's resolved_input + filters artifact kinds. Sprint 012 topology structure fetches `/api/records/<n>/topology_graph` and renders 5 group headers. Sprint 013 run-as-graph text summary reads `/run_graph` and renders producer-instance rows. Sprint 014 Assays reads `/api/assays` + `/api/assay/<name>` — cross-record subject via own picker. Sprint 015 folds `/studio.html` into the Studio tab as an iframe (flagged deviation). Sprint 016 is the walkthrough — the shipped harness IS the wave-boundary proof.

**What worked:**

- The port pattern from Sprint 006 held for every subsequent pane. Extract render function from parent, add stable data-testid on leaves, wire to STATE, extend both harnesses with N+V+P. Consistent shape sprint after sprint.
- The subject rule (STATE._currentRecord + selectRecord fetch + downstream renders) was proven three times in one harness run: event count from events array; group count from topology_graph; row count from run_graph.instances. Three independent projections agreeing on the same subject is a real assurance.
- Fixture regression on the stable shots (00–07, plus tab-bar strip transitions) stayed rock-solid across 7 more sprints. Zero drift on hashes that shouldn't drift.

**What got in the way:**

- Sprint 015 (Studio) forced a deviation from "iframes are dead." Full port is a multi-day sub-project; link-out breaks single-window. Chose iframe-as-sub-app-host and flagged it for Architect ratification. A halt-and-articulate would have been cleaner mid-sprint; I documented in the card + BLACKBOARD instead.
- Records-content fixtures (08, 09, 10-15) can't be hash-regressed because the rail content varies per run (new agent runs land there). They're capture-only. This is a real gap: a CSS regression on those tabs would slip past the automated harness — only visible in human screenshot review. Named in Sprint 016's adversarial pass and added to the Drift watchlist.

**What this says about the next kit version:**

- The "capture-only, not hash-fixture" flag for variable-content screenshots is a useful pattern; TECHNIQUES.md #38 could name it as a sub-rule: **screenshots of variable-content surfaces stay capture-only until you can render a canned deterministic subject**. In terminal-v1's case, adding a `?fixture=1` mode to the server that returns a canned record set would close this.
- The wave-boundary walkthrough (#16) is easier than the plan suggested when the harness has been growing across every sprint. By Sprint 016 the walkthrough was already written — no new code, just the naming.

---

### 2026-08-14 — Sprint 008 (agent terminal: wired to /api/agent) closed

**What happened:** Terminal now talks to a model. Enter triggers `sendChat()` → `POST /api/agent` → `pollRun()` on 500 ms → `_agentLine()` per new event → termbody fills with the tool-loop. Deterministic model returns `20` for `compute (2+3)*4`. STATE tracks runName, agentSeq, polling. Terminput disabled during turn, re-enabled after. All six discipline items honored; e2e passes 60+ checks; capture regression clean across 8 fixtures.

**What worked:**

- Copying `_agentLine` verbatim from parent (`web/app.js:246`) was two lines of local variable renaming, semantically identical. Zero design work on rendering.
- Polling `/api/records/<name>` at 500 ms via a `while (polling)` loop with a real terminal condition (`FinalAnswer || substrate.RunFinalised`) worked first try. No missed events observed in the deterministic run.
- The A3 "color diversity" pixel-decode assertion (green + grey both > 20 pixels in termbody after turn) is a real bug-class check: it would fire on a CSS regression that dropped the `.tl-*` color rules. Not just "screenshot doesn't drift" — an actual property of the paint.

**What got in the way:**

- The e2e's `waitForFunction(polling === true)` timed out because the deterministic loop finishes in < 1 s and Playwright samples too slowly to catch the true-window. Removed the mid-flight check; only wait on completion state. Lesson: **for fast-completing async operations, do not assert a transient intermediate state via Playwright — wait only on the stable terminal condition.**
- A stale background server (running for hours from an earlier `run_in_background`) served old code that lacked the terminal-v1 route. Manual `pkill && restart` fixed it. Added to Drift watchlist as DW-5.

**What this says about the next kit version:**

- The "fast async transient state" gotcha (above) belongs in TECHNIQUES.md § Testing and validation as a sub-rule of #38: **assert reachable terminal states, not transient intermediate ones — Playwright is not fast enough to reliably observe sub-100ms window states**.
- The `_agentLine` copy-verbatim from parent was cheap because parent's function has no shared dependencies (`STATE.events`, `STATE.term.agentSeq` in parent map to different fields here, but the function only takes `e` and returns `{cls, text}`). Portability of parent's small helpers is a real property of substrate-ui's flat-vanilla-JS architecture. Worth naming: **flat-function architecture makes port-per-pane extraction cheap; monolithic state-mutating functions do not port**.

---

### 2026-08-14 — Sprint 007 (agent terminal: model picker) closed

**What happened:** Added the model picker to the Agent Terminal. `<select id="modelpicker">` at the top of the pane; populated on load from `GET /api/models` (parent's existing endpoint). Terminput starts `disabled`; picking a model enables it, updates `STATE.term.model`, writes `localStorage['terminal-v1.lastModel']`, changes `#termprompt` from `substrate$` to `<model> ›`. On reload the picker pre-highlights the last-selected model via `<option selected>` but `STATE.term.model` resets to `null` — user must click through the picker every launch (Architect ruling).

**What worked:**

- The parent's `/api/models` endpoint returned 20 real drivers (Ollama tags + CLI presets) with zero server changes needed; reader-UI-over-existing-API is the whole shape.
- Splitting "picker shows selected" (DOM) from "model chosen" (STATE) matched the Architect ruling exactly. LocalStorage carries the *hint*, not the *selection*.
- The N+V+P assertion on picker change caught a would-be error class: if I had written `STATE.term.model = ev.target.value` but forgotten `updatePromptForModel()`, the DOM would still show `substrate$` while STATE said `<model>`. Harness asserts BOTH.

**What got in the way:**

- Same "waiting on a hidden element" trap as Sprint 003. Playwright's `waitForSelector` on `option[selected]` inside a `<select>` waits for `visible`, which options inside a closed select never are. Fix: `waitForFunction` on `document.querySelector('#modelpicker')?.value === m`. The kit's A4 rule ("verify the observer") should really be extended: **any wait on an element inside a `<select>` / `<summary>` / any collapsible container must gate on state, not visibility.**
- The Sprint 006 fixture SHA-256s for 03-term-prompt and 04-terminal-after-input drifted intentionally — the picker changes the prompt string, so those PNGs' bytes are different. Deleted their `.sha256` files to let them re-record. The #38 pattern works: drift shouted, I decided if it was intentional, deleted the fixtures, re-recorded. That's the loop the technique wants.

**What this says about the next kit version:**

- The "waiting on hidden element" trap has now surfaced twice in this project alone (Sprint 003 root-marker, Sprint 007 select-option). Worth an explicit sub-item in TECHNIQUES.md § Visual/UI: **prefer `waitForFunction` over `waitForSelector` when the element you care about is inside a container that hides children by default (closed `<select>`, `<summary>`, `hidden` region).**
- The Sprint 006 fixture drift-on-intentional-change flow was as I hoped: no fixture magic, no `--update-snapshots` flag, just delete the SHA file. Zero-dep, git-friendly, works. Worth naming in the diary as a shipped pattern.

---

### 2026-08-14 — Sprint 006 (agent terminal skeleton) closed

**What happened:** Ported the terminal DOM (`#termbody`, `#termprompt`, `#terminput`, `.term-*` CSS) from parent `web/index.html` into the Agent Terminal pane; ported `renderTerm()` + `termPush()` + a keydown Enter handler from parent `web/app.js`. Typing echoes to `#termbody` with a `substrate$` prompt; state preserved across tab switches.

**What worked:**

- Copying the parent's `.term-*` CSS block verbatim (adapted only the color variables to terminal-v1's palette) meant zero design work on the terminal's visuals.
- The parent's `renderTerm()` shape (~20 lines) ported clean because it depends only on `STATE.term.lines` — no global DOM state.

**What got in the way:**

- Capture script hit a JS syntax error the first run: I declared `const dec` inside a scope where the outer `const dec` (from Sprint 002 code) was still live. Renamed to `termDec`. This is the "assertions in the capture script instead of the CI-gated harness" pattern flagged by A7 — the capture script has been accreting logic. Should factor the shared decoder + assertions into a helper module when it gets one sprint bigger.

**What this says about the next kit version:**

- A7 says structural assertions live in the CI-gated harness, not the capture script. As the capture script grows, this becomes a real risk: every added assertion in `capture_*.js` is one the CI E2E doesn't gate. TECHNIQUES.md § Visual/UI should sharpen A7 into an actionable rule: **any assertion in a capture script is a bug — move it to the E2E, or move its check into a decoder helper the E2E also imports**.

---

## Phase boundary syntheses

### Wave 0 close (Sprints 001–002)

Wave 0 (per A10) is the founding-artifact wave. Two sprints closed cleanly, but Sprint 001 slipped hard rule 5 (comprehension affirmation). Lesson: the affirmation isn't ceremony, it's the priming step per AGENTS.md's four-mechanism framing. In practice it needs to be visible in the hard-rules list as an ordered step ("BEFORE any Write call in a first session"), not filed under a separate § heading.

### Wave 1 close (Sprints 003–004)

Wave 1 (tab-bar shell + switch mechanics) closed under 40 minutes of active work. The A2 pixel-anchor strip added modest scope (one CSS rule, eight divs, one loop in the capture script) and pays out across every future sprint that touches tab state. A3 (asymmetric fixtures) landed for free — the strip's slot-per-tab identity IS asymmetric. If Wave 1 had used symmetric anchors (all identical) the A3 rule would need explicit design work; here it fell out of the domain shape.

### Wave 2 first-sprints (005–006)

Sprint 006's diary entry surfaces the real Wave 2 finding: **the plan's "one sprint per pane" undercount is the biggest kit-methodology gap in the terminal-v1 build so far**. The parent's agent terminal is a five-sprint sub-arc; extrapolated across 7 more panes, terminal-v1 is closer to 40 sprints than the plan's 14. This isn't a bug in the sprint pattern — it's a plan-authoring failure: the plan should have named that pane depth varies and each pane deserves its own sub-plan doc. Amended: Wave 2 stays plan-mode-per-sprint (not auto), each pane's port gets a sub-plan when its dispatch approaches.

---

## Project-close synthesis

*(pending — at project close: top structural findings for the next kit revision, propagated to `../../sdd-kit-2/ADDENDUMS.md` as an amendment to Addendum A or a new Addendum entry when a second project confirms.)*

---

*KIT_DIARY.md — terminal-v1. Second increment of substrate-ui per Addendum A10. Maintain per sprint / per wave; without it, kit-improvement insights evaporate.*
