# REVIEW — SDD-ARC-PLAN.md (2026-08-14)

*Reviewer role. Target: `process/SDD-ARC-PLAN.md` (50L). Read against `signals/versions/0.1.json` + `-rationale.md`, `sprints/`, `process/BLACKBOARD.md`, `process/KIT_DIARY.md`, `process/WORKING_AGREEMENT.md`, `process/SDD-HARNESS-PORT-PLAN.md`, `tsconfig.json`, `web/instrumentation/`, `tools/`, `harness/`, and current disk state. New dated file per no-in-place-edits.*

---

## Findings

### F1 — Sprint-number collision across the range the plan claims

`SDD-ARC-PLAN.md:3`: "Sprint 008 (TypeScript conversion) and sprints 009 + 010 (vocabulary lock + SDD scaffold) landed 2026-08-14." The plan then schedules 011–019.

Disk state (`ls -lt sprints/`): every number 008–017 is already taken by a closed sprint on a different topic — `sprint-008-scene-panel.md` (Jun 22), `sprint-009-replay-transport.md` (Jun 22), `sprint-010-terminal.md` (Jun 22), `sprint-011-content-views.md` (Jun 22), `sprint-012-drift-polish.md` (Jun 22), `sprint-013-assay-projection.md` (Jun 26), `sprint-014-assay-view.md` (Jun 26), `sprint-015-agent-parameters.md` (Jul 30), `sprint-016-terminal-dock-polish.md` (Jul 31), `sprint-017-delegate-branch-in-flow.md` (Aug 3).

Every number the plan uses collides with an existing sprint. The next free number is 018. As written, Sprint 011 in the plan and Sprint 011 on disk are two different things; grep for "sprint 015" now returns two projects; a downstream reader chasing "the RECORD_SELECTED sprint" hits the Jun-22 content-views card. The plan's whole sprint chain needs re-numbering from 018 onward, or a formal renumbering + `_deprecated/` move of the prior meanings.

### F2 — Three sprints claimed as landed without cards or Built entries

`SDD-ARC-PLAN.md:3`: "Sprint 008 ... and sprints 009 + 010 ... landed 2026-08-14."

Disk: no `sprint-008-typescript*.md`, no `sprint-009-vocabulary*.md`, no `sprint-010-scaffold*.md`. `sprints/` newest card is `sprint-017-delegate-branch-in-flow.md`, 2026-08-03. `BLACKBOARD.md ## Built` newest entry is 2026-08-04. Code exists — `web/app.ts`, `web/studio.ts`, `web/instrumentation/sdd.ts`, `web/instrumentation/vocabulary.ts`, `tools/check-vocabulary-parity.ts`, `tools/capture-grade.ts`, `tsconfig.json`, `vite.config.ts`, `signals/versions/0.1.json`. Ceremony is missing for every one of the three landings the plan cites.

This is the exact pattern `KIT_DIARY.md` 2026-07-31 named: "Lesson (KIT_DIARY): code-first on 'small' UI items is the same trap review #39 named — a visual tweak still needs a card." Recorded once at 2026-06-17 (`BLACKBOARD.md` "OBSERVATION-CONTRACT DISCIPLINE FAILURE"), once at Sprint 012 close, now recurring on the arc that is supposed to install the discipline.

### F3 — Tag count inside the plan does not sum to 42

Vocab total: 44 (per earlier review). Already fired: 2 (SESSION_INIT, RECORDS_LOADED). Remaining: 42.

Plan sprint sum by stated per-sprint counts: 4 + 9 + 3 + 6 + 5 + 5 + 5 + 3 = 40.
Plan sprint sum by actually enumerated counts (Sprint 012 lists 10 tags in its body but calls them "9 tags" in its header): 4 + 10 + 3 + 6 + 5 + 5 + 5 + 3 = 41.

Missing from every sprint: SESSION_ENDED (`signals/versions/0.1.json:36`, session category, note "Page unload"). No sprint schedules its emission site. The stated total misses by two; the actual enumeration misses by one; the unowned tag is SESSION_ENDED.

### F4 — Sprint 012 header says 9 tags; body enumerates 10

`SDD-ARC-PLAN.md:20`: "**Sprint 012 — view subsystem (9 tags)** Adds VIEW_SWITCHED, CURSOR_MOVED, PLAY_STARTED, PLAY_STOPPED, SPEED_CHANGED, GRAPH_RENDERED, TOPOLOGY_RENDERED, SCENE_RENDERED, IO_RENDERED, HEALTH_RENDERED." Count in title: 9. Count in enumeration: 10. Ten tags, one wrong header, sums to F3.

### F5 — Sprint-011 grader invariant is weaker than the vocab-locked one

`signals/versions/0.1.json:95`: "Every RECORD_SELECTED is followed within 5s by **exactly one** RECORD_LOADED **with matching name** (staleness guard drops earlier in-flight loads)."

`SDD-ARC-PLAN.md:18` Sprint 011 grader invariant: "RECORD_SELECTED → RECORD_LOADED within 5s (staleness guard)." Missing: exactly-one, matching-name, and the drop-earlier semantics that the parenthetical merely hints at. Grader accepts a pair the vocabulary forbids (two RECORD_LOADED for one RECORD_SELECTED; a RECORD_LOADED with a different name).

### F6 — Sprint-015 grader summary drops the "exactly one terminal" clause

`signals/versions/0.1.json:97`: "Every AGENT_LAUNCHED is followed by 1..N AGENT_TURN_STREAMED events and terminated by **exactly one** FINAL_ANSWER_RENDERED or POLL_TIMEOUT with the same run_name."

`SDD-ARC-PLAN.md:30` Sprint 015: "Grader invariants: two — the launch pairing and the terminal pairing already stubbed in the grader; extends them with `run_name` matching." The exactly-one termination is not named. Two FINAL_ANSWER_RENDERED for one AGENT_LAUNCHED would pass the plan's stated check.

### F7 — Sprint 018 lists a metric, not an invariant

`SDD-ARC-PLAN.md:39` Sprint 018 grader invariant: "any incident tag increments an assertable count the grader reports as noise-vs-signal." Counting is not an invariant; Layer 5 wants a pairing or ordering rule, Layer 7 wants a payload-content constraint. Nothing constrains a `FETCH_FAILED` payload's shape at grade time under this rule; a well-formed FETCH_FAILED with an empty endpoint would tick the counter and pass.

### F8 — Cadence gate is self-referential

`SDD-ARC-PLAN.md:50`: "Sprints 011–018 dispatch under plan-mode-per-sprint by default; if 011–014 all close clean in one shape, cadence auto-bands to auto-within-phase for 015–018 per WORKING_AGREEMENT.md standing policy."

`WORKING_AGREEMENT.md:117-119` says: "From the Studio increment forward: each increment gets a real sprint card ... **Cadence is auto-within-phase**." No "auto-bands after four clean closes" rule appears in WORKING_AGREEMENT. The plan cites a standing policy the standing policy does not carry.

"Close clean in one shape" is also undefined. Same close shape means: same dual-contract? Same grader-invariant style? Same trigger-site count? The gate reads as personal judgement dressed as procedure.

### F9 — Sprint-019 references `harness/e2e_*.js`; tsconfig includes `harness` as typed

`SDD-ARC-PLAN.md:42` Sprint 019: "Extends each existing `harness/e2e_*.js` script with three tail steps." Disk: twelve scripts under `harness/`, all `.js` (verified). `tsconfig.json:"include": ["web", "harness", "tools"]` lists harness among typed-source dirs; `allowJs` is not set. The tsconfig treats `harness/*.js` as excluded-by-omission; Sprint 019's target files are outside the TypeScript build entirely. Either harness converts to `.ts` (Sprint 019 renames its targets) or tsconfig drops harness from `include` (a two-line WORKING_AGREEMENT-adjacent decision).

### F10 — WORKING_AGREEMENT contradicts the plan's basis; the plan does not close the contradiction

`WORKING_AGREEMENT.md:25`: "The UI EMITS no signals of its own ... **there is no `signals/*.json` here** (a second vocabulary would be ceremony)."

`SDD-ARC-PLAN.md` treats the vocabulary lock as settled. Every sprint 011–018 emits tags declared in `signals/versions/0.1.json`. WORKING_AGREEMENT is the project-specific override doc every session reads at open; the arc cannot proceed cleanly against a project-specific override that denies its foundation. The plan needs a WORKING_AGREEMENT-update sprint (call it 018-pre or 020) or the WORKING_AGREEMENT clause needs a companion edit landed alongside Sprint 008's re-numbered replacement.

### F11 — Fixture policy is named "(c) add a JSONL fixture" and not fleshed out

`SDD-ARC-PLAN.md:15`: "(c) add a JSONL fixture under `captures/sprint-NNN/` produced by a Playwright harness reading `window.__signals`."

Which harness produces the fixture — one, some, all twelve? Is the fixture reproducible (a deterministic capture that regrades byte-identically) or a snapshot? `SDD-HARNESS-PORT-PLAN.md:71-76` had a "Fixture policy" section naming contains-in-order + pairing invariants + a REFREEZE mode. The ARC-PLAN doesn't cross-reference it. Two plans, two implicit fixture disciplines.

### F12 — `captures/` directory does not exist yet

`ls captures/` returns empty. Sprint 011's dual-contract cites "capture-grade green against the fixture." No fixture path exists to grade against. Fine as a chicken-and-egg (fixture created in Sprint 011); flag so the first dispatch handles the empty-directory bootstrap.

---

## Consistency checks that pass

- Sprint chain 011–019 maps cleanly onto the vocab's category structure (records+record, view, stream, terminal, agent, topology, diff+assay, incident, harness) with no category left uncovered EXCEPT the SESSION_ENDED gap in F3.
- Trigger-site names in each sprint (rail click handler, `selectRecord()`, `$("gvRun").onclick`, transport buttons, `sendChatMessage()`, launch/resume buttons, `.catch()` on `api()` calls) point at real function shapes visible in the current `web/app.ts` header.
- Dual-contract shape ("parity gate green + build green + parent e2e green + capture-grade green against the fixture") is a clean four-gate that maps to `SDD-HARNESS-PORT-PLAN.md`'s tools + the parent e2e chain.
- Every sprint stated in one-line form; sprint sweet spot ≤2 files honored in the "(a) emit calls; (b) extend capture-grade.ts" shape.
- Emitter + parity gate + grader are on disk (`web/instrumentation/sdd.ts`, `tools/check-vocabulary-parity.ts`, `tools/capture-grade.ts`); the plan's "Where we are" § 7 line checks against the tree.
- Two page-load emits confirmed live: `grep -n "\bemit(" web/app.ts` returns exactly two — line 9 (SESSION_INIT) and line 54 (RECORDS_LOADED).

---

## One-line summary

Every number the arc plan schedules (008–019) is taken by a closed sprint under a different meaning; three of the four sprints the plan says already landed have no card and no Built entry; Sprint 012's header and body disagree on tag count; SESSION_ENDED is unaccounted for; two grader invariants are weaker than the vocab they claim to enforce; the cadence gate cites a WORKING_AGREEMENT rule the WORKING_AGREEMENT does not carry; and the WORKING_AGREEMENT clause that denies the vocab's existence is still live.

---

*Reviewer: Claude, this session. Additive to `substrate-ui/process/` alongside SDD-ARC-PLAN.md and the 2026-08-14 vocab+port-plan review.*
