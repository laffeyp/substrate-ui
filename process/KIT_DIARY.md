# KIT_DIARY.md — substrate-ui

*What the kit does well, what gets in the way, what the next kit version should change. Per-increment or per-phase. The diary is this project's accumulating memory about how sdd-kit-2 serves the work. Started fresh 2026-06-17 from the Studio increment forward (review #39: rounds #30–#38 are not retrofitted into the diary — their record is the review envelopes).*

---

## Hypothesis tracking

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | A reader/projector UI built with tests + live E2E + independent review, but WITHOUT the kit's git+artifact ledger, will accumulate a real defect the ledger would have caught. | **confirmed** | Review #39: the Studio seam shipped live with zero tests because no sprint card forced its artifact contract. The substance was otherwise sound; the missing discipline cost exactly one untested live seam. |
| H2 | A UI that only READS a locked vocabulary needs no vocabulary of its own; the tone canon is the binding contract instead. | **falsified 2026-08-17** | H2 held for reader-only UIs but substrate-ui was reader-AND-controller from the start (POST /api/launch, /api/resume, /api/agent). REVIEW-2026-08-15-vocab-mapping-to-substrate.md § F6 named the boundary. Sprints 018–032 wired an own vocabulary (v0.5, 54 tags across console + studio); v0.4's `notes[0]` rewrote the framing honestly. The Addendum A9 carve-out applies to pure readers only. |

---

## Entries

### 2026-09-01 (later) — License pivot to PolyForm Noncommercial

**The AGPL relicense that landed on `feat/license-agpl-with-ai-terms` (see the entry below) is superseded.** The Architect rebuilt the bundle on PolyForm Noncommercial 1.0.0 and directed a direct-to-main landing with no feature branch. Same shape as the substrate-side pivot; sibling lesson lives in that repo's `KIT_DIARY.md` finding 72 ("a procedure with more approval gates than committers is theater"). Second lesson (substrate-side finding 73) applies here too: when the arc closes, the report is "done"; reaching for the next thing to look useful buries the state under noise.

---

### 2026-09-01 — Sprints 056/057 + the AGPL relicense: three kit-worthy lessons

**Sprint 056 (test hygiene) and sprint 057 (test migration off private substrate helpers) closed on this side; the paired substrate-side work is in that repo's diary at findings 68-71. Three additional lessons landed on this side.**

**Test staleness is a signal about the ledger, not just about the test.** Two substrate-ui tests (sprint 056) drifted past shipped changes on the same side: `test_resolver_returns_distinct_responders_per_params` asserted `_think is False` for the daily-driver default after sprint 045 flipped that default to `True`; `test_patch_deferred_field_returns_400_naming_the_field` probed `bundle` against `_NOT_YET` after `bundle` had moved to `_PATCHABLE`. Both had been red on the substrate-ui side for at least one sprint. Neither shipping sprint (045, the bundle-PATCH sprint) had a checklist item that read "grep the test files for stale expectations against fields I touched." Class: any sprint that changes a default value or moves a field across a boundary set (`_NOT_YET` ↔ `_PATCHABLE`, `_PRIVATE_TOOLS` ↔ `_PUBLIC_TOOLS`) has a matching test-audit responsibility; if the sprint card doesn't name it, the cards drift.

**"Never called shim" is a real discipline, and this repo's `session_registry.py` re-export module is the standing example.** The word "shim" is banned in the substrate context (memory `feedback-no-shim-word` and this repo's WORKING_AGREEMENT). The 66-line file at `substrate-ui/session_registry.py` was tempting to call one during sprint 054 planning. Naming it a "re-export module" (which is what it is) kept the discipline visible and the file's purpose named. Class: a file's docstring is a public commitment about what class of thing it is; euphemism there rots faster than in code.

**A machine-facing legal notice at the top of a README is a different genre than the rest of the doc.** Round-1 `NOTICE.md` used the same friendly register the rest of `substrate-ui/README.md` uses (voice: "The console runs against substrate's venv", "read this before changing the bind address"). Warm, contributor-facing, second-person in spirit. That register works for the ongoing README but breaks at the top of it, where the notice's audience is training crawlers and their operators, not humans. Fix: a distinct register — direct address ("Notice to operators of AI and machine learning systems"), directive verbs ("must honor"), no announced permissions. The rest of the README stays in its own voice. Class: when two audiences share one document, they need distinct register in their respective blocks, or the doc reads as one thing to both and mis-serves both.

---

### 2026-06-17 — Review #39 (whole-arc sanity check) + the artifact-discipline retrofit

**What happened.** The Architect called for a start-to-finish recenter: is this real, is it working, have we lost anything, are we chasing ghosts. The independent duplex-pipe reviewer ran both gates, cross-checked disk-vs-API, and built a real authored topology through the Studio seam. Verdict: the substance is REAL and green — but substrate-ui was under no version control and had none of the kit artifacts, and that breach had already produced a live Studio seam with zero tests. Retrofit: own git repo + baseline commit + the three core artifacts (this diary, BLACKBOARD, WORKING_AGREEMENT).

**What worked.**
- **Independent review verified by RUNNING caught the gap the builder's "green" hid.** The builder's session reported 18 server tests passing; true — but the newest seam (`/api/build`, `/api/validate`) had no coverage at all, so "18 green" was technically honest and substantively misleading. Only a reviewer that re-read the tree and grepped for `test_build`/`test_validate` (zero) surfaced it. This is the runbook's meta-finding (§9) reproduced exactly: the reviewer earns its keep where it runs/inspects the thing the builder only described.
- **The dual-contract SPIRIT, held informally, kept the substance sound.** Even without sprint cards, every #30–#38 increment had an artifact contract (`test_server.py`) + an observation contract (`e2e_console.js`) + an independent grader (the pipe). So the retrofit is LIGHT — a home and a ledger, not a rebuild. The discipline's substance and its ceremony came apart cleanly here.

**What got in the way.**
- **The kit has no explicit rule "a new sub-project gets its own git home + artifacts on day one."** Hard rule 12 covers vocabulary materialization at Sprint 0; there is no equivalent for "version control + the three core artifacts exist before the second increment." substrate-ui ran nine review rounds of real code with no git history — one `rm` from losing all of it. The kit assumes a project adopts the templates at the start (README step 1–4); it is silent on a UI/companion sub-project that grows OUT of a disciplined parent and silently inherits none of the parent's discipline.
- **Category leak into the parent's blackboard.** With no board of its own, the UI's build history landed in substrate's `## Built` — polluting a published repo's audit trail with a different codebase's increments. The single-writer-per-section discipline says nothing about single-PROJECT-per-board.

**What this says about the next kit version.**
1. Add a hard rule (or a README step): **a companion/sub-project that grows out of a disciplined project gets its own git home + the three core artifacts (BLACKBOARD, WORKING_AGREEMENT, KIT_DIARY) before its SECOND increment** — not retroactively. The trigger is "this code now has more than one increment and lives in its own directory."
2. The dual contract's three legs (signal/artifact/observation) transmit fine informally for a reader/projector UI; what does NOT transmit informally is the GIT LEDGER. The kit treats version control as ambient; for a sub-project it should be an explicit founding act, like the vocabulary lock.
3. A reader-only project legitimately has no `signals/` of its own. The kit's templates assume every project locks a vocabulary; it should name the reader/projector case explicitly (bind the tone canon instead).

---

### 2026-06-17 — Observation-contract skip (Architect-caught) + repo-scoped test tooling

**What happened.** After landing sprint 001 I declared the live Chrome E2E "not run — Playwright absent in this env, backend-only change" and proposed continuing to the next sprint. The Architect halted hard: a behavior-touching UI cannot be claimed working without its observation contract actually executing; skipping it is the finished≠worked failure the kit exists to stop. The fix had two parts: (1) the tooling was in ephemeral `/tmp/pw-substrate` (a prior session's install that vanished) — re-scoped it INTO the repo as a lockfile-pinned devDependency; (2) RAN the E2E — 22 checks pass in real Chrome.

**What got in the way (the real finding).** The kit names the observation contract as REQUIRED for behavior-touching sprints (hard rule 9), but it is silent on where the contract's TOOLING lives. When the tooling is ad-hoc and out-of-repo (a `/tmp` install, a globally-installed binary), "I can't run it right now" becomes an available rationalization — and a rationalization for skipping a REQUIRED contract is the most dangerous kind, because it ships a lie that looks like a pass. The `/tmp` location and the discipline skip were the same failure: un-scoped tooling makes the contract skippable.

**What this says about the next kit version.**
4. The observation contract's TOOLING is part of the contract. The kit should require that a behavior-touching project's observation harness be reproducible FROM THE REPO (a pinned devDependency + lockfile, a documented one-command setup) — not an ambient/global/temp install. If the harness can vanish, the contract can be skipped, and a REQUIRED contract that can be skipped is not required.
5. "Environment doesn't have the tool" is never a license to skip a required contract — it is an instruction to make the environment have the tool (scoped to the repo) and then run it. Add this explicitly to hard rule 9's failure modes.

| H3 | Un-scoped (out-of-repo) observation tooling makes a REQUIRED observation contract skippable, and it will be skipped under time pressure. | confirmed | This session: the `/tmp` harness "couldn't be run" twice became a proposed skip; only an Architect halt corrected it. Repo-scoping removed the excuse. |

---

### 2026-06-17 — The perceptual track was skipped for the whole UI (Architect full-stop) — and it found a real bug

**What happened.** After the E2E was scoped in and run, the Architect called a full stop and a re-centering: was I even set up to verify SDD-style, perceptually? I was not. For nine review rounds (#30–#38) and three more this session, I had run only the STRUCTURAL track (DOM text assertions) and never the PERCEPTUAL one (looking at a screenshot). I re-read all of sdd-kit-2, built `capture_console.js`, captured 11 key frames, and viewed each. The console looked right — but the look-pass found a real bug the DOM E2E had no way to catch: the inspector/diff pane never cleared on record switch, so one record's provenance/diff bled into the next.

**What got in the way (the finding).** The kit names the perceptual requirement in three places — hard rule 9 ("expected screenshot / visible behavior"), foundation 01 signal type #2 ("Screenshots at Key Frames"), TECHNIQUES "Two-track visual grading" ("perceptual requires the human OR a vision-model judge"). I am a vision-model judge. I read all three and still ran only track one, because the DOM E2E *felt* like "the observation contract" — it drives the real app, asserts real state, goes green. A green structural track is the most seductive possible cover for skipping the perceptual one: it is real, it is rigorous, and it is half. The exact soundfield-round-23 failure, reproduced: graded the contents, never looked at the pixels.

**What this says about the next kit version.**
6. For any VISUAL surface, the observation contract is not satisfied by DOM/structural assertions alone — the agent (a vision-model judge) MUST capture key-frame screenshots and VIEW them. Make this an explicit, separate checkbox in the SPRINT_CARD observation contract: "[ ] Track 1 structural (asserted)  [ ] Track 2 perceptual (screenshots captured AND viewed by the agent)". A single "observation contract: pass" line lets the perceptual half hide.
7. A green structural test is the most dangerous cover for a skipped perceptual pass, precisely because it is genuinely rigorous. The kit should warn: "the DOM passing is necessary, not sufficient; if you cannot point to a screenshot you looked at, the visual observation contract is unmet."
8. When the perceptual pass finds a defect, pin it with a structural assertion (so it can't regress silently) AND keep the perceptual pass (text cannot fully encode "looks right"). Both, not either.

| H4 | The perceptual track catches real defects the structural (DOM) track cannot, and a green structural track makes skipping the perceptual one feel safe. | confirmed | This session: DOM E2E green at 22 checks; the screenshot pass found the stale-inspector bug (a prior record's diff/provenance bleeding across switches) that no text assertion was looking for. |

---

### 2026-06-17 — The Studio to full parity under full discipline (sprints 002–007) + review #42

**What happened.** With the discipline finally in force (sprint card → build → BOTH observation tracks → LOOK at the screenshots → fold), the Studio went from a tested build seam to E2-ruling "full parity" in six clean increments: static topology view (002), form-first authoring (003), Routes + `any_of`/`all_of` composition (004), drag-canvas (005), model-backed Producer seam (006), model authoring UI (007). Then an independent review (#42) of the canvas + model Producers ruled it REAL and HONEST and folded two findings.

**What worked.**
- **Once the full discipline was running, the Architect stopped having to catch me.** The first half of the session was three Architect interventions (artifact discipline, observation-contract skip, perceptual-track skip). The second half — six increments — needed none: every front-end sprint ran the structural E2E AND captured-and-viewed the frames, every card declared its contract first, every close ran the Rubber Duck pass. The failures of the first half were failures of *skipping* the discipline; running it is what made the second half boring (the good kind).
- **The two-track + adversarial-review stack catches honesty defects, not just bugs.** Review #42's load-bearing finding was not a crash — it was that the canvas drew Route edges to every triggered Producer, *implying data flow that doesn't occur* (the stub consumes no slot). A structural test passes that; a perceptual look might miss it; an adversarial reviewer asking "could this misrepresent the spec?" caught it. Three different lenses, and only the third saw it. The model-seam check was the same shape: the reviewer's job was to prove it *could* ship a fake, and proving it couldn't (byte-for-byte against the runtime's own DeterministicResponder; Ollama fails loud) is what earned the "HONEST" verdict.
- **Building the authoring UI against the runtime's OWN seam kept it honest by construction.** Model Producers call `substrate.reference`'s real `Responder` (the same one the reference topologies use); the deterministic responder is the runtime's CI mode, not a fake I wrote. There was no opportunity to ship a fake because I reused the runtime's truth.

**What got in the way.**
- **A perceptual-track tooling gotcha: fullPage × deviceScaleFactor:2 screenshots blew past the image-view size limit** (>2000px), so a frame I "captured" I couldn't actually VIEW — which is the whole point of the track. Fixed by element-screenshotting bounded surfaces (the canvas) and viewport-only shots. Minor, but it's exactly the kind of thing that silently degrades the perceptual track back into "captured but not looked at".

**What this says about the next kit version.**
9. The perceptual track needs a tooling note: capture VIEWABLE artifacts (element or viewport screenshots of bounded surfaces; cap dimensions), because a screenshot too large to open is a screenshot not looked at — the track quietly fails closed.
10. The strongest defect net for a visual/authoring surface is THREE lenses, not two: structural (does the wiring work), perceptual (does it look right), and adversarial-review (could it misrepresent / ship a fake). #42's only real finding lived in the gap only the third lens covers. Name the trio.

| H5 | Once the full discipline (card → both tracks → look → review) is actually running, the build proceeds without the failures that needed Architect catches. | confirmed | The session's two halves: three Architect interventions while skipping discipline; zero across six increments while running it. |

---

### 2026-06-22 — The scene panel: a generic domain-visual surface for the lens

**What happened.** `game_of_life` (built in the parent substrate repo) exposed a gap the console's generic panels can't fill: its output is a grid that *means* a board of cells, and the run-as-graph / event stream render the substrate's shape, not the domain's. Built a third graph view, "scene", that detects a renderable payload shape (a 2-D numeric array) and renders it as a cursor-driven cell grid — opt-in by shape, no per-app code, read-only over the record's events. Verified both tracks: structural (tab shows/hides by shape, 25 cells, 3 live) + perceptual (viewed three frames; the blinker oscillates vertical -> horizontal -> vertical).

**What worked.**
- **"Opt-in by shape, not app code" kept the lens contract intact.** The temptation for a custom-visual panel is a per-app renderer — which couples the UI to the application. Detecting a generic shape (a 2-D numeric array) instead means the panel reads only the record's public events, declares nothing about semantics, and changes no run — still a lens. One detector covers game_of_life today and any board / heatmap / matrix topology tomorrow.
- **Reusing the one-cursor architecture made the animation free.** The hard part of a visual — a time axis — already existed: the seq-cursor that drives the graph + stream. Hanging the scene on it meant scrubbing animates the generations with zero new machinery, in lock-step with the other panels. A new surface that composes with the existing invariant rather than adding its own.
- **The perceptual track did the load-bearing verification, exactly as the discipline says.** The structural assertions (25 cells, 3 live) prove the wiring; they do NOT prove the blinker oscillates — three frames each with 3 live cells are structurally identical. Only LOOKING (vertical -> horizontal -> vertical) confirmed the thing works. A domain-visual surface is the purest case for why the perceptual track is non-optional.

**What this says about the next kit version.**
11. For a runtime whose demos emit domain artifacts (a grid, a board, a waveform), a generic SHAPE-DRIVEN viewer (detect a known payload shape -> render it, read-only, driven by the existing cursor) extends a lens-style console without breaking the lens contract — no per-app code, no semantic claims. Name this as the pattern for "custom visual output" so a per-app plugin (which couples) is not the default reach.
12. The perceptual track is most load-bearing exactly where the structural track is weakest: when the domain meaning is positional, structurally-identical frames (same cell count) carry different meaning (different positions). A surface whose correctness is positional CANNOT be closed on counts/structure alone — looking is not optional, it is the only thing that checks the actual claim.

| H6 | A generic shape-driven scene panel (detect a 2-D numeric payload field -> render, read-only, cursor-driven) gives a lens-style console custom visual output without per-app code or a breach of the lens contract. | tentative-confirmed | This session: game_of_life's Generation.grid renders + animates correctly via one shape detector; the tab hides for no-grid records; no backend change, no semantic coupling. One topology, one data point. |

---

### 2026-06-22 — Deterministic pixel anchors: making the perceptual track mechanical (how the LLM "sees")

**What happened.** Review #49 caught the scene's structural assertions riding outside CI (in `capture_scene.js`, not the gated `e2e`); folded that into `e2e_console.js`. Then the Architect pushed on the perceptual track: don't eyeball the screenshot — use the SDD visual-verification technique (deterministic pixel anchors) so the agent reads decoded STATE. Rebuilt `capture_scene.js` to screenshot the rendered grid, decode the PNG pixels (Node `zlib`, no deps) at each cell's known coordinate, classify alive/dead, reconstruct the grid, and assert it equals the record's `Generation.grid` — emitting the decoded grid as a signal.

**What worked.**
- **The decode is strictly higher-fidelity than viewing the PNG.** For a vision-model judge, eyeballing a screenshot is lossy and subjective; checking the `.on` class proves the DOM, not the paint. Decoding the actual rendered pixels at known coordinates and asserting against ground truth proves the thing on screen IS the data — catching a CSS/color/layout regression a class-check would miss. The agent "sees" by reading a decoded state snapshot (`..#..` / `.###.` ASCII + `match=true`), which is a signal, not an image.
- **The visualization was already a deterministic anchor.** The scene grid paints green-at-a-known-coordinate per the data; that IS the technique's "deterministic pixel colors at known coordinates." The decoder is the other half — no instrumentation change was needed, the render was already legible to a decoder; it just needed one written.
- **Two-track stayed intact, sharper.** The decode is the mechanical (deterministic-judgment) half; the PNGs remain for the polish look (vision-model-judge half). Both, as the technique says — the decode does not replace the look.

**What this says about the next kit version.**
13. For any visual whose meaning is decodable state (a grid, a board, a chart with known anchors), the perceptual observation contract should DECODE the rendered pixels and assert against ground truth — not stop at "captured and viewed." "Viewed" is the polish check; "decoded" is the state check, and a vision-model judge eyeballing a PNG is the weaker of the two where the state is mechanically recoverable. Make the perceptual contract name BOTH (decode + look) for decodable visuals.

| H7 | Decoding the rendered pixels at known coordinates and asserting against ground truth is higher-fidelity visual verification than a vision-model judge eyeballing the screenshot, for any visual whose state is mechanically recoverable. | tentative-confirmed | The scene decode reconstructs the blinker (vertical/horizontal/vertical) from the actual screenshot pixels and matches the record grid cell-for-cell; a color/layout regression a `.on`-class check passes would be caught here. One surface, one data point. |

### 2026-06-23 — Sprint 012 drift polish + a discipline-correction (code-first is a trap even for "small" items)

**What happened.** Cleared the drift watchlist (rAF replay, rail grouping + prune, the glider decode). Two items were built CODE-FIRST (no sprint card); the Architect flagged it ("make sure we're following SDD style"), and a card was written declaring the contract for the rest. Along the way the gates caught two real bugs the surface looked fine without: the rail `source` tag mis-grouped the `demo_*` fixtures as "your runs" (a `name in bundled.names()` shortcut that did not match the real fixture-vs-session-run distinction), and the pixel-decode harness read `STATE.scene` before the record loaded (a race that grabbed the PREVIOUS record's seqs). Separately, the run-as-graph spawn-dot confusion was diagnosed by CORRELATING the `run_graph` log with the screenshot (dot@0.96 = the producer queued for 94% of its bar), not by guessing — the Architect's explicit standard.

**What worked.**
- **The two-track gates caught the bugs the look didn't.** The source mis-tag rendered a plausible rail (it grouped *something*); only checking which records were tagged what surfaced it. The harness race produced a plausible decode (7×7, asymmetric) but at the wrong seqs; only asserting decoded == record-at-the-right-seq surfaced it. Green-looking is not proven.
- **A real bug found in the verification harness ITSELF.** `capture_scene`'s race was in the *observer*, not the observed — fixed at root (API ground-truth seqs + a `STATE.events`-matches-max-seq wait), not papered with a sleep. A PASS from a buggy harness is worth nothing.
- **Correlate the log with the image; don't narrate the pixels.** The spawn-dot fix came from reading `run_graph` (fired/started/ended) and lining it up against the rendered geometry — a mechanical correlation (53/53 lanes), the higher-fidelity move the Architect insisted on.

**What this says about the next kit version.**
14. "Small" / "LOW-priority" is not a license to skip the sprint card. Code-first on the drift items skipped the contract that would have named the fixture-vs-session-run distinction up front (the source mis-tag) — the card is cheap and it is where the edge cases get named BEFORE the code hides them.
15. A verification harness is code too — it has its own races and bugs, and its PASS is only as trustworthy as the harness is correct. Hold the observer to the same "verify, don't trust" bar as the observed; fix its races at root.

| H8 | Skipping the sprint card on "small" drift items doesn't save time — it removes the step where edge cases (fixture vs session-run; the decode race) get named before the code obscures them; the gates then catch them later, at higher cost. | tentative-confirmed | This session: two drift items built code-first, two real bugs (source mis-tag, harness race) surfaced only by the gates afterward, not named up front; the card written for C2/A named the distinction cleanly. |

### 2026-07-30 — the chat seam starved its models (finding 16)

**What happened.** A month-later live session made the agent chat look broken: a top-assayed model announced work and never did it. The record showed the truth (answers cut at a colon where the tool call would begin); an A/B on the runtime's own script flipped the verdict from model problem to orchestration problem; the fix landed as substrate's uncapped default plus this seam's timeout and step budget.

**What worked.** Reading the record instead of judging the model — the diagnosis was mechanical, not impressionistic. And the Architect's escalating verification demands ("prove it's hardcoded"; "fully research it") corrected three over-claims before they could ossify into the docs.

**What this says for the kit.**

16. **Config parity between the assay and the product surface is a contract.** The seam ran models at 512 tokens; the assay that ranked those same models ran them at 8192. Every impression of model quality formed through the seam was formed through a configuration the assay never validated. When an assay blesses a capability, the surface must run the blessed configuration — or the blessing is void and the product quietly slanders its own models.

17. **A committed observation contract that no gate runs is not a contract, and "small" visual commits still skip the card (2026-07-31 review, F-27/F-28).** The application-parity review's substrate-ui findings were both process, not code: (a) `harness/e2e_assay.js` — the assay-matrix structural E2E, sprint 014's own load-bearing contract (both currencies present, the metric-splice guard) — was committed but absent from `package.json` and `ci.yml`, so a regression in `renderAssayFrom` would ship green (Addendum A7, the exact defect the repo folded once at review #49 for `capture_scene.js`, recurred). It is now `e2e:assay`, run in CI, verified PASS against the live server. (b) Three terminal commits shipped with no card / no Built entry / no diary line, and one (`49af067`, rigid dock head) silently reversed another (`81c8f2d`, responsive dock head) — the ledger read as two contradicting commits with no reason. This is finding 8's "skipping the card on 'small' items just defers the discovery to the gates" recurring: a visual tweak is still a sprint, and a committed test is still nothing until a gate runs it. Both closed with a retroactive card (sprint 016) + the wiring, and the canonical-home registry corrected (the backend-test path went stale in the folder reorg — the row and the build command both named a file that had moved, F-29).

---

### 2026-08-14 through 2026-08-17 — the SDD instrumentation arc (Sprints 018–032)

**What happened.** The Architect's 2026-08-14 directive "initiate the sddification of substrate-ui" started a three-day arc that took the project from H2's tentative-confirmed "no own vocabulary" to a locked 54-tag signal vocabulary covering both console and studio surfaces. Fifteen sprints landed in three waves: Wave-1 (018 TS + Vite conversion, 019 vocab lock v0.1, 020 emitter + parity gate + grader, 021–028 per-subsystem wiring, 029 wave close); Wave-2 (030 substrate_kind foreign-key enforcement, 031 optional signal-capture tail on the standing e2e harnesses); Wave-3 (032 studio surface instrumentation, closing a scope gap the Architect surfaced when the arc plan had scoped only web/app.ts). Five review passes filed dated files under `process/`; every finding on record with a fix or a discard reason. Vocabulary bumped five times (v0.1 → v0.5) as merited review findings folded in.

**What worked.**
- **The vocabulary lock caught what DOM and pixel-decode gates could not.** Sprint 022's initial grader mis-modeled the paint-cycle invariant (71 SCENE_RENDERED matches piled up under play-frame paints); Sprint 028's initial topology-launch check double-counted a later LAUNCH_REJECTED against an earlier successful launch. Both surfaced at rubber-duck close, before shipping. The same pattern (window-bounded-at-next-request) fixed both.
- **The 2026-08-16 comprehensive review turned invisible-drift into fixable-drift.** Fifteen findings, ten fixed at v0.4 (five discarded with reason on the record). Two categories the review named — grader stricter than lock (M2), invariants declared in prose but never enforced (M3) — got lifted into the vocabulary itself, and `checkSessionBookends` in the grader enforces the promoted invariants against the whole capture.
- **`signals/versions/current.json` symlink centralizes the version pointer.** Before v0.4, a bump touched the version literal in three files across two directories; after, `ln -sf` is the one edit. Sprint 032 rubber-duck named the class of foot-gun; v0.4 closed it.
- **Namespace-split foreign-key enforcement (Sprint 030).** `substrate_kind` values in the `substrate.*` namespace must be in the substrate mirror's closed set; application-namespace values (CodeChunk, ToolCall, Critique) need only be non-empty strings. A monolithic closed-set check broke the CodeChunk inspection e2e at first landing; the split was two lines and fixed the class.

**What this says for the kit.**

18. **Reader-AND-controller UIs do not get the pure-reader carve-out.** Addendum A9's "no own vocabulary" clause held for what it named; it did not stretch to UIs that call `/api/launch`, `/api/resume`, `/api/agent`. The bright line: if the UI CAUSES substrate events, it has behavior that is not just observed but authored, and its actions need typed grading. Fold this into A9 as a distinction, not an exception.

19. **The Architect's ratification of a locked vocabulary must land in `## Decisions`, not in the vocab file's own `locked_by` prose.** Sprints 019–029 dispatched against a lock whose `locked_by` was agent-authored language ("Architect ratified on read-through"). `REVIEW-2026-08-16 § F5 / § S1` named the discipline breach. The v0.4 `entity_merges_ratification` block is a retroactive audit trail; the pattern going forward is Architect-writes-Decisions, then vocab file cites the Decision by date.

20. **A surfaced halt is only a halt if the next sprint reads it.** Sprint 032 dispatched two days after a "no implementation sprint dispatches until ratified" halt; the halt existed, the ratification did not, the sprint ran anyway. `REVIEW-2026-08-16 § S2` named it. The fix is not a stronger halt file — it is the session-start ritual actually reading `## Surfaced for review` and treating open halts as blocking.

21. **"Small" / "cheap" sprints inherit the arc's scope discipline.** Sprint 033 was reverted the same day it landed: the Agent read "continue" after a one-tag fix as authorization to jump work streams (UI-NEXT item 1). The revert cost nine prose edits and three e2e assertion updates. Cost of the mis-scoped sprint: one turn. Cost if it had shipped without notice: harder to unwind. The reflex to keep spinning under "continue" is a Sprint-033-class bug in the human-in-the-loop.

| H9 | An agent-authored locked_by string in a vocabulary file does not substitute for an Architect entry in `## Decisions`; rule 12's Sprint-0 gate is discharged by the Decision, not the file's own prose. | **confirmed** | REVIEW-2026-08-16 § F5 caught v0.1's `locked_by: "Architect ratified on read-through"` as agent language. `## Decisions` carried no matching entry. Sprints 020–029 dispatched against the file, not the Decision. v0.4's `entity_merges_ratification` block is the retroactive audit trail. |

| H10 | Reader-AND-controller UIs need their own vocabulary; the pure-reader carve-out (Addendum A9) does not apply. | **confirmed** | Substrate-ui makes POSTs (launch/resume/agent) that CAUSE substrate events. REVIEW-2026-08-15 mapping § F6 named the boundary. Sprints 018–032 wired 54 tags across console + studio. The alternative — Addendum A9 kept, no vocabulary — was on the table (Option E in the mapping review's candidate shapes) and rejected. |

22. **Product-spec conformance block hits adoption on the first try when the sprint template names it.** Every 035s/t/u/v/w card opened with `## Product-spec conformance` naming which PRODUCT-SPEC section the sprint fulfills, which TECH-SPEC clause it consumes, and (for 035w) "silence in the spec is not exclusion." The observation-contract-vs-spec discipline the daily-driver-terminal review called for landed on the same batch that introduced it. **For the kit:** hoist the block into `sdd-kit-2/templates/SPRINT_CARD.md` as a first-class section between `## scope` and `## artifact contract`, so new projects inherit the shape by default. Ratified per REVIEW-2026-08-28-piece-g-eod SDD-4.

23. **Named coordination artifacts (feature map, closeout addendum, plan doc) work alongside sprint cards.** `FEATURE-MAP-2026-08-28-agent-terminal-to-daily-driver.md` enumerated nineteen features × nine sections; nine UI cards + three substrate cards closed as a direct chain against it. The mechanical-translation reviews caught a bifurcation between agent-terminal and daily-driver terminal BEFORE it hardened. Sprint cards alone would have missed it — the feature map was the surface the bifurcation showed up on. **For the kit:** name this as a technique-in-waiting in `sdd-kit-2/TECHNIQUES.md` under "coordination artifacts." Ratified per REVIEW-2026-08-28-piece-g-eod SDD-5.

24. **Vocabulary retirement stays disciplined only when the schema keeps the tags with `retired: true`, not when they are dropped.** V0.7.3 initially DROPPED the eleven dock-tied tags from `signals/versions/0.7.3.json`'s tag list — the schema shrank from 69 to 58. An old fixture on disk referencing `TERMINAL_OPENED` would then fail vocab-parity as "unknown tag" rather than "retired tag." REVIEW-2026-08-28-piece-g-eod SUB-5 flagged this as violating grammar/PRINCIPLES.md commitment 1 ("old names are retired explicitly, never silently") + TECHNIQUE #45 ("deprecation entries instead of removals"). Fix landed same day: eleven tags restored with `retired: true`, `retired_at`, `retired_in`, `replaced_by` fields; `check:vocab-parity` grew a second drift class (retired-emit fails distinctly). **For the kit:** name silent-retirement as a class-of-bug in `sdd-kit-2/TECHNIQUES.md` #45, and add a `retired: true` example to the vocabulary schema template.

25. **A "surface it to the blackboard" resolution is often a form of deferral.** The 037c prep discovered eleven vocab tags whose sole emit sites lived inside the dock code the card would delete. The initial move was to write a BLACKBOARD entry surfacing the scope-gap and defer 037c to a follow-on. Architect pushed back: "why sit on blackboard, do something about it." The full-scope 037c landed same turn — vocab bump + code deletion + grader trim + legacy-harness trim — under one commit. **For the kit:** the "halt-and-articulate" pattern's real teeth is "halt-and-articulate-and-execute-in-the-same-turn-if-bounded." Surfacing something to the blackboard AND executing on it is disciplined; surfacing WITHOUT executing is deferment wearing SDD dress.

| H11 | Product-spec conformance blocks in sprint cards land the observation-contract-vs-spec discipline reliably; hoisting the block to the template scales the discipline to future projects. | **confirmed** | Every 035s/t/u/v/w card opened with the block; every implementation matched the spec section it named. REVIEW-2026-08-28-piece-g-eod SDD-4. |
| H12 | Vocabulary retirement without `retired: true` markers silently breaks historical fixtures; disciplined retirement keeps the entry with a `retired` flag + `replaced_by` pointer. | **confirmed** | REVIEW-2026-08-28-piece-g-eod SUB-5. V0.7.3 initial shape dropped 11 tags; same-day fix restored them with markers; `check:vocab-parity` grew a distinct retired-emit drift class. |
| H13 | Surfacing a gap to the blackboard without executing on it in the same turn is deferment. | **confirmed** | Architect directive "why sit on blackboard, do something about it" 2026-08-28. Sprint 037c's full-scope retirement landed same-turn once the pattern was named. |

26. **Sprint cards decompose FROM the product spec. If a card is spec-invented, the entire downstream chain inherits the invention — and every card downstream will pass its own tests while missing the ask.** Piece G (2026-08-27 through 2026-08-29) shipped 28 cards, 20+ vocab-tag changes, and a full E2E harness + parity gate against an assumption ("desktop-view carries session controls") that appears nowhere in the product spec. The 036 series was the fork; nothing corrected it because reviews measured SDD discipline (tag validity, tsc-cleanness, harness pattern) but not correctness-of-scope. The Architect's actual ask — "move the CLI terminal to its own page and put session_topology behind it, that's all" — never got pinned as source of truth in my working set. I read sprint cards. Full post-mortem at `process/planning/POSTMORTEM-2026-08-29-piece-g-architectural-miss.md`. **For the kit:** every review needs a correctness-of-scope pass BEFORE the discipline passes. Every sprint card needs a `spec_reference:` frontmatter field that points at the exact product-spec section it derives from. When no such reference exists, the card is spec-invented — halt-and-articulate before writing code.

27. **Green tests + tsc-clean + all-harnesses-passing proves internal consistency, not correctness against intent.** Piece G shipped with 17 JS fixtures + 10 pytest parity cases + 1 session grader all green, zero tsc errors, a pre-commit hook, and tsc in the build. Every one of those tests was written against the wrong architecture. Passing them proved the architecture was self-consistent; nothing tested "does this match what the user asked for." Type-clean wrong code is still wrong. **For the kit:** a correctness-of-scope harness is different from a discipline harness. Both are needed. The discipline harness runs `tsc --noEmit`; the correctness-of-scope harness runs a Playwright pass that OBSERVES what a user would see and cross-checks against a spec-derived rubric. There is currently no such rubric artifact in the kit.

28. **Perceptual capture catches pixel bugs and misses model bugs.** Sprint 037b's screenshots showed a terminal header with a "+ new session" button. The correct read was "why is there a new-session button — you're already in the terminal?" The read I made was "the tools input is too wide; narrow it." Symptom-fix while the structural wrongness went past. **For the kit:** the perceptual observation contract should include a step that asks "would this shape make sense to a user who read the product spec and expected the CLI ported to the browser?" The instrumentation didn't exist; a rubric-driven visual-review would have caught the button.

29. **Every user push-back turns into a smaller and smaller adjustment when the underlying is architecturally wrong.** After the user said "session controls belong with the session in the terminal," I moved the mounts. When they said "no + new session button," I removed the button. When they said "no deterministic in the picker," I filtered it out. The reflex is to fix in place. The correct reflex is: two pushes on the same surface = back out to the model layer, not the next widget. **For the kit:** two consecutive user corrections against the same surface should trigger an architectural halt-and-articulate. Explicit rule needed.

30. **Discipline gates (pre-commit hook, tsc-in-build, vocab-parity, ui-parity, signals chain) protect the mechanics; they don't protect the model.** They're worth keeping. They just don't do what I hoped they did. A separate class of gate — "matches spec" — needs to exist and doesn't yet.

| H14 | Sprint cards without a `spec_reference:` frontmatter field are spec-invented and their downstream inherits the invention. | **hypothesized 2026-08-29** | Piece G is the demonstration case. No card in the 036 family cites a product-spec section; the whole family is invention. Testing hypothesis: after rollback, require the field on every card, dispatch is blocked without it. |
| H15 | Green tests + zero tsc errors + all harnesses passing does not imply correctness against intent when the tests were written against the same wrong architecture the code implements. | **confirmed** | Piece G, 2026-08-29. Every discipline gate was green at 038 close; the app itself doesn't do what was asked. |
| H16 | Two consecutive user corrections against the same UI surface = architectural miss on that surface. | **hypothesized 2026-08-29** | Piece G's terminal-header surface received five corrections this turn ("controls belong on terminal" → "no + new session" → "no deterministic in picker" → "layout crowded" → "same conceptual model as before, and that framing is still wrong"). Each patched a symptom. Rule: after correction #2 on the same surface, halt and articulate the model, don't propose the next patch. |

### 2026-08-31 — piece G audit arc, sprint 044-051 (bring-up and bug hunt)

Piece G's mechanical translation completed at sprint 038 (2026-08-29). The 2026-08-31 arc
is a different mode: bring the daily driver up, use it live, close the bugs a real user
finds. Eight sprints landed across substrate + substrate-ui in one day; five load-bearing
lessons for the kit sit under the finding-30 series above.

31. **A silent SSE means "the app is broken" to the user.** Sprint 048. The terminal opened
   an EventSource on session-open and never reconnected. A server restart (sprint 046/047
   deploy) left every open tab permanently deaf; the server kept receiving turns and
   producing events, the browser rendered nothing, the user watched their message vanish.
   Fix: reconnect on error with a 1s backoff resuming at `h.lastSeq`, a visible
   "· reconnecting…" line so the transition is legible, plus a local echo of the user's
   Enter (the SSE UserMessage envelope's round-trip echo took seconds under kimi; that
   also read as hung). **For the kit:** any long-lived stream in a UI harness needs
   reconnect + resume-cursor + a visible transition line, not silence.

32. **A default-visible pre-session picker is worth more than a hidden post-session one.**
   Sprint 045 batch. The desktop `mountDriverPicker` was `display:none` pre-session so
   `pickerSelect?.value` was empty on the very first open — the terminal fell through to
   the "deterministic" literal. User's real ask ("driver dropdown ready to go before I type
   anything") required the picker to render visibly at page load, pre-selected to the
   `/api/models` default, and to WIN over any historical hardcode. Fix touched three
   files (`app.ts` dropped its hardcoded default, `terminal.ts` widened the empty-sentinel
   fallback, `driver_picker.ts` stopped hiding pre-session). **For the kit:** a picker
   that's meaningful pre-session should render pre-session; hiding a control until state
   arrives is a footgun when its value is read at open time.

33. **`?driver=` URL param is a clean way to keep a token-paying CI harness token-neutral
   when the runtime default rightfully points at a paid model.** Sprint 045. Once the
   daily-driver default became `kimi-k2.7-code:cloud`, the sprint 035 lifecycle harness
   started paying tokens on every run. Adding `?driver=deterministic` to the URL (read
   in `terminal.ts` via `URLSearchParams`) gave the harness a per-request pin that no
   server env var or restart could get wrong. **For the kit:** URL-param pins for
   CI-cost-sensitive harnesses are cheaper than env vars because they live in the exact
   request that needs the pin.

34. **When a control the user asks for exists but nobody uses it, delete it from the
   default UI.** Sprint 045. The "tools" text input in the terminal header let users pass
   a comma-separated tool restriction on session creation. Every user reads it as a
   required field; nobody types into it because "all tools" is the daily-driver default.
   Fix: dropped the mount span; sessions default unrestricted; `/tools <list>` remains
   for mid-session restriction. **For the kit:** a control that reads as required and is
   used ~0% of the time is worse than no control.

35. **Live-session rows in the rail need onclick.** Sprint 045. `_mkSession` in `rail.ts`
   built a row for each live/parked/interrupted session but attached no click handler.
   The record was reachable via `/api/records/<session_id>/…` (server routes
   `s_<id>` to `~/.substrate/sessions/<id>/record`), so a one-line `div.onclick =
   () => selectRecord(s.session_id)` was the whole fix. **For the kit:** a UI listing
   items that resolve to a viewable target should default to clickable; a bare row that
   looks selectable but isn't reads as broken.

36. **A bottom-dock terminal alongside the record view beats a toggle-only split.** Sprint
   045. The user's ask was "let me watch the record grow while I type." The two-view
   toggle satisfied "I can see both" only if the user kept flipping. Fix: mount the terminal
   DOM ONCE into a movable `.terminal-column` element, re-parent it between the
   fullscreen `#view-terminal` host and a `#terminal-dock` inside `#view-desktop` on
   view flip. Same DOM, so the session, the SSE EventSource, and the input focus survive
   the flip. **For the kit:** a UI needing "both surfaces visible" is not the same
   requirement as "either surface visible." Toggle is not a substitute for dock.

---

*KIT_DIARY.md for substrate-ui. Nine entries. Ten hypotheses: five confirmed (H1, H4, H6 by prior entries; H9, H10 by the SDD arc); four tentative-confirmed (H3, H5, H7, H8); one falsified (H2 — the pure-reader carve-out did not apply to substrate-ui once it was reader-AND-controller). The SDD arc (Sprints 018–032, three days, five vocab bumps, five review passes) instrumented both surfaces of the app under one vocabulary and closed every review finding with an outcome. The diary starts where formal discipline starts — the review-#39 retrofit — not at the project's true beginning, by ruling.*
