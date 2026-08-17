# SDD instrumentation arc — sprint plan

*Written 2026-08-14. Revised 2026-08-15 after `REVIEW-2026-08-14-sdd-arc-plan.md` surfaced twelve findings; all twelve addressed inline below (see § Revision log). The arc takes substrate-ui from vanilla-JS reader UI to fully-instrumented signal emitter with a parity gate and per-run capture grader. Sprints 018 (TS conversion) + 019 (vocab lock) + 020 (SDD scaffold) landed 2026-08-14; sprints 021–029 scope what remains.*

---

## Where we are

Vocabulary v0.1 is locked: 44 tags across 11 categories, `signals/versions/0.1.json`. Emitter (`web/instrumentation/sdd.ts`), parity gate (`tools/check-vocabulary-parity.ts`), grader (`tools/capture-grade.ts`) are on disk. Two emits fire on every page load: `SESSION_INIT` and `RECORDS_LOADED`.

42 tags remain to wire. They map to the categories below. Each sprint touches one subsystem, keeps to ≤2 source-file edits (typically `web/app.ts` + `tools/capture-grade.ts`), and closes against four gates: parity gate green, `npm run build` green, parent `npm run e2e` green, `tools/capture-grade.ts` green against a JSONL fixture at `captures/sprint-NNN/<harness>.jsonl`.

## Sprint plan (021 → 029)

### Sprint 021 — session close + records + record subsystem (5 tags)

Adds `SESSION_ENDED`, `RECORD_SELECTED`, `RECORDS_PRUNED`, `RECORD_LOAD_BEGIN`, `RECORD_LOADED`. Trigger sites: `window.addEventListener("beforeunload", …)` for SESSION_ENDED; rail click handler; prune button; `selectRecord()` entry; `selectRecord()` post-fetch. Grader invariant, verbatim from `signals/versions/0.1.json § invariants`: "every RECORD_SELECTED is followed within 5s by **exactly one** RECORD_LOADED with **matching name** (staleness guard drops earlier in-flight loads)." The grader's pairing check enforces the exactly-one + matching-name + staleness-drop semantics, not just "some RECORD_LOADED within 5s." Also adds SESSION_ENDED coverage (addresses F3).

### Sprint 022 — view subsystem (10 tags)

Adds `VIEW_SWITCHED`, `CURSOR_MOVED`, `PLAY_STARTED`, `PLAY_STOPPED`, `SPEED_CHANGED`, `GRAPH_RENDERED`, `TOPOLOGY_RENDERED`, `SCENE_RENDERED`, `IO_RENDERED`, `HEALTH_RENDERED`. Ten tags (previous plan miscounted). Trigger sites: `$("gvRun").onclick` etc., seq input handler, transport buttons, each `render*()` function tail. Grader invariant: `VIEW_SWITCHED{to_view: V}` is followed within one paint by exactly one pane-render tag whose `pane_id` matches V and whose `subject_record` matches `STATE.name`.

### Sprint 023 — stream + inspector (3 tags)

Adds `STREAM_RENDERED`, `EVENT_INSPECTED`, `PRODUCER_INSPECTED`. Trigger sites: `renderStream()` tail, `.ev` click handler, `.lane` click handler. Grader invariant: `EVENT_INSPECTED.seq` and `EVENT_INSPECTED.kind` match a real event on the current subject_record; `PRODUCER_INSPECTED.instance` matches a real producer instance in `STATE.graph`.

### Sprint 024 — terminal subsystem (6 tags)

Adds `TERMINAL_OPENED`, `TERMINAL_CLOSED`, `CHAT_ENTERED`, `CHAT_EXITED`, `MODEL_SELECTED`, `PARAMS_CHANGED`. Trigger sites: `termSetOpen()`, chat mode enter/exit branches in `runTerm()`, model picker `onchange`, param strip inputs. Grader invariant (vocab #7): `TURN_SUBMITTED` only fires inside a `CHAT_ENTERED` → `CHAT_EXITED` window; any TURN_SUBMITTED outside is a fail.

### Sprint 025 — agent subsystem (5 tags)

Adds `TURN_SUBMITTED`, `AGENT_LAUNCH_REQUESTED`, `AGENT_LAUNCHED`, `AGENT_TURN_STREAMED`, `FINAL_ANSWER_RENDERED`. Trigger sites: `sendChatMessage()` entry, pre-fetch, post-fetch, `streamAgentTurns()`, FinalAnswer handling. Grader invariants (verbatim from vocab § invariants #5 + #6):
- "AGENT_LAUNCH_REQUESTED is followed within 1s by either AGENT_LAUNCHED or LAUNCH_REJECTED with kind=agent."
- "Every AGENT_LAUNCHED is followed by 1..N AGENT_TURN_STREAMED events and terminated by **exactly one** FINAL_ANSWER_RENDERED or POLL_TIMEOUT with the same run_name." Two terminations for one launch is a fail (addresses F6).

### Sprint 026 — topology + launch (5 tags)

Adds `TOPOLOGY_LAUNCH_REQUESTED`, `TOPOLOGY_LAUNCHED`, `RESUME_REQUESTED`, `RESUMED`, `STUDIO_OPENED`. Trigger sites: `$("launchbtn").onclick`, `$("resumebtn").onclick`, studio link click. Grader invariant: `TOPOLOGY_LAUNCH_REQUESTED{topology_name: T}` is followed within 5s by exactly one `TOPOLOGY_LAUNCHED{topology_name: T}` OR one `LAUNCH_REJECTED{kind: topology}`.

### Sprint 027 — diff + assay (5 tags)

Adds `DIFF_REQUESTED`, `DIFF_RENDERED`, `ASSAYS_LOADED`, `ASSAY_SELECTED`, `ASSAY_REPORT_LOADED`. Trigger sites: diff selector `onchange`, `renderDiff()` tail, `loadAssays()` tail, `selectAssay()` entry, `selectAssay()` post-fetch. Grader invariant: `DIFF_REQUESTED{a, b}` is followed within 5s by exactly one `DIFF_RENDERED{a, b}` with matching pair.

### Sprint 028 — incident coverage (3 tags)

Adds `FETCH_FAILED`, `LAUNCH_REJECTED`, `POLL_TIMEOUT`. Trigger sites: `.catch()` on every `api()` call (small helper wrap so every fetch reports the same shape), launch/resume error branches, agent poll ceiling. Grader invariant (payload-content, per Layer 7): every `FETCH_FAILED` carries non-empty `endpoint` and non-empty `status_or_error`; every `LAUNCH_REJECTED` carries `kind ∈ {agent, topology, resume}` and non-empty `reason`; every `POLL_TIMEOUT` carries non-empty `run_name` and `elapsed_ms > 0`. Payload-content constraint, not a counter (addresses F7).

### Sprint 029 — harness integration + Wave close

Extends each existing `harness/e2e_*.js` script with three tail steps: (a) `const signals = await page.evaluate(() => window.__signals)`; (b) write `captures/sprint-029/<harness>.jsonl`; (c) exec `npx tsx tools/capture-grade.ts captures/sprint-029/<harness>.jsonl`. Each fixture is captured on the first clean run under REFREEZE semantics per `SDD-HARNESS-PORT-PLAN.md § Fixture policy`; subsequent runs diff against the committed fixture. Harness files stay `.js` (Node scripts, run outside the TypeScript build); `tsconfig.json`'s `include` drops `harness` in the same sprint (addresses F9). Wave close per technique #16 (N.INT integration).

## Fixture policy

Cross-reference to `SDD-HARNESS-PORT-PLAN.md § Fixture policy` — canonical there, not duplicated here. Summary: one committed JSONL per harness under `captures/sprint-NNN/<harness>.jsonl`; contains-in-order + declared pairing invariants; drift fails the harness; `REFREEZE=1 npm run capture:...` bumps the fixture deliberately. `captures/` currently empty; Sprint 021 bootstraps the first sprint-021/ subdirectory (addresses F12).

## Cadence

Every sprint dispatches under plan-mode-per-sprint per `WORKING_AGREEMENT.md § Sprint cadence policy`. No auto-band gate on this arc; each sprint's card is reviewed before dispatch (addresses F8; the earlier "auto after four clean closes" was invented, not documented).

## Companion doc updates required before Sprint 021 dispatches

- **`WORKING_AGREEMENT.md`**: the clause "The UI EMITS no signals of its own … there is no `signals/*.json` here" (line ~25) is stale; substrate-ui now emits signals and `signals/versions/0.1.json` is on disk. The clause needs a replacement stating the current posture: "substrate-ui emits a locked vocabulary from `signals/versions/0.1.json`; every emit call site validates at the speaker's mouth via `web/instrumentation/sdd.ts`; the parity gate `tools/check-vocabulary-parity.ts` is the standing CI check." Landing this replacement is a prerequisite for Sprint 021 (addresses F10).
- **`tsconfig.json`**: `include` currently reads `["web", "harness", "tools"]`. `harness/*.js` files are Node scripts that run outside the TS build; `tsc` treats them as excluded-by-omission because `allowJs` is off, but the intent is confusing. Drop `harness` from `include`; the file becomes `["web", "tools"]`. One-line edit; land alongside the WORKING_AGREEMENT edit as Sprint-020-follow-on (addresses F9).

## Revision log

- **2026-08-14 v1.** Initial arc plan; sprints numbered 008–019.
- **2026-08-15 v2 (this file).** Twelve findings from `REVIEW-2026-08-14-sdd-arc-plan.md` addressed:
  - F1 sprint-number collision: renumbered arc to 018–029 (was 008–019); the three landed sprints renamed on disk (`sprint-018-typescript-conversion.md`, `sprint-019-vocabulary-lock.md`, `sprint-020-sdd-scaffold.md`) and moved to `substrate-ui/sprints/` (the canonical folder per prior sprint activity).
  - F2 no cards for landed sprints: cards written for 018, 019, 020 with `status: closed` and rubber-duck-pass observations. Built entries added to `substrate-ui/process/BLACKBOARD.md`.
  - F3 tag count mismatch + SESSION_ENDED unowned: SESSION_ENDED wired into Sprint 021's scope; sprint counts now sum to 5+10+3+6+5+5+5+3 = 42 remaining, +2 already fired = 44 total. Match.
  - F4 Sprint 022 header 9 vs body 10: corrected to 10.
  - F5 Sprint 021 grader too weak: rewritten verbatim from vocab invariant with exactly-one + matching-name + staleness-drop.
  - F6 Sprint 025 termination clause missing: rewritten verbatim with exactly-one termination.
  - F7 Sprint 028 metric vs invariant: rewritten as payload-content constraint.
  - F8 cadence gate self-referential: dropped; every sprint plan-mode-per-sprint per WORKING_AGREEMENT.
  - F9 tsconfig includes harness: drop-harness edit added as Sprint-020-follow-on companion.
  - F10 WORKING_AGREEMENT contradicts plan: WORKING_AGREEMENT replacement clause named as prerequisite for Sprint 021.
  - F11 fixture policy vague: cross-referenced to `SDD-HARNESS-PORT-PLAN.md § Fixture policy`.
  - F12 `captures/` empty: noted; Sprint 021 bootstraps first subdirectory.
