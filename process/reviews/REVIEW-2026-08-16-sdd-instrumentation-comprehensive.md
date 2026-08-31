# REVIEW — substrate-ui SDD instrumentation, full pass (2026-08-16)

*Reviewer role. Scope: whether substrate-ui has been fully and correctly SDD-instrumented across the console and the studio after Sprints 018–032. Targets read in full: `signals/versions/0.3.json` (742 lines), `signals/versions/0.3-rationale.md` (54 lines), `web/instrumentation/sdd.ts` (96 lines), `web/instrumentation/vocabulary.ts` (42 lines), `web/studio.ts` (288 lines), `tools/capture-grade.ts` (556 lines), `tools/check-vocabulary-parity.ts` (169 lines), `tools/sync-substrate-vocab.ts` (30 lines), `harness/capture_studio_signals.js` (65 lines), `process/WORKING_AGREEMENT.md` (127 lines), `process/planning/ROADMAP-2026-08-16.md` (63 lines), sprint cards 030/031/032. Emit-site verification via `grep -oE '\bemit\("([A-Z_]+)"' web/app.ts web/studio.ts | sort -u`. New dated file per no-in-place-edits.*

---

## Severity

Nothing on fire. Coverage is complete. The parity gate, emitter, grader, and both harnesses run green end-to-end. The findings sort into three bands.

**Two discipline breaches.** Five entity_merges landed in the vocab file without a proposal-step audit trail. The 2026-08-15 halt's four v0.2 proposals sit unratified while Sprint 032 shipped v0.3 on top of them.

**Three documentation-and-version drifts.** WORKING_AGREEMENT.md carries three claims about which vocabulary version exists (v0.1/44 in the body, "no vocabulary" in the trailer, v0.3/53 on disk). The `0.3.json` literal sits hardcoded in three files across two directories. The v0.3 rationale is a delta ledger where BOOTSTRAP calls for a full rationale including the dual-contract audit for the nine studio tags.

**Ten minor items.** Grader-vs-lock mismatches. Un-graded fixture files from the optional Sprint 031 tail. A harness gap on the target="_blank" click path. Docstring rot in the parity gate. A superseded plan doc missing its `-superseded` rename. Worth cleaning; none blocks anything.

## The tally

- 53 declared tags; 44 unique tags fire in `web/app.ts`; 11 unique tags fire in `web/studio.ts`; union equals 53; declared minus emitted is empty; emitted minus declared is empty.
- Category `view` renamed to `pane`; `PANE_SWITCHED` closes the tone-canon collision with substrate's `View` primitive.
- `entity_merges[]` names all four merges the mapping review flagged plus a fifth (Spec/authored_topology) added at Sprint 032.
- `external_vocabulary_ref` points at substrate's `0.2.json`; Sprint 030 promoted `substrate_kind` typing from documentary to runtime-enforced via namespace-split closed-set membership.
- `runtime_operators[]` (Layer 6) names four operators: SubstrateReader, SubstrateController, ReplayEngine, AgentTurnAccumulator.
- v0.3 header carries `locked: true`, `locked_at`, `locked_by`; hard rule 12's Sprint-0 gate satisfied at wave dispatch.

---

## Serious — two findings

### Five entity_merges arrived in the vocab without passing through ENTITY_MERGE_PROPOSED

`signals/versions/0.3.json:39-64` lists five entity_merges (Record/Run, Topology/Topology, AgentRun/Run, Event/Envelope, Spec/authored_topology). `sdd-kit-2/grammar/PRINCIPLES.md` names `ENTITY_MERGE_PROPOSED` in the eight-proposal taxonomy: "Surfaced for explicit Architect reconciliation rather than silent collapsing." Substrate-ui has no `signals/proposals.json` under any path. `process/BLACKBOARD.md ## Decisions` names no ratified merge proposal. The five merges appear in the lock as accomplished fact; the proposal-then-ratification step is absent. The taxonomy names this class by name; substrate-ui produced it anyway.

### The 2026-08-15 vocabulary halt's four proposals sit unratified; v0.3 dispatched on top of them

The topmost `## Surfaced for review` entry filed at Wave-1 close reads `VOCABULARY_CHANGE_REQUIRED (Wave-1 close, four v0.2 proposals ... unratified)` and gates the next implementation sprint on Architect ratification. Sprint 032 dispatched two days later and locked v0.3 without any of the four proposals landing: INSPECTOR_RENDERED, FRAME_RENDERED, and the TAG_SPLIT for TOPOLOGY_LAUNCHED remain deferred; `TURN_SUBMITTED.turn_index` sits in `optional_payload` at `signals/versions/0.3.json:470` against the recommend-promote. The halt's own gate ("No implementation sprint dispatches until the ruling lands") did not hold. Whether the four proposals should have ratified is a separate question; the record shows the halt filed, then bypassed.

---

## Documentation-and-version drift — three findings

### WORKING_AGREEMENT.md describes three different vocabularies in one file

Line 25: "The UI EMITS its own locked vocabulary at `signals/versions/0.1.json` (44 tags across 11 categories)." Line 126 trailer: "No own vocabulary (it reads substrate's v0.2); the eight-word tone canon binds instead." Tree state: v0.3, 53 tags, 12 categories. Three claims, three states, one file. A reader lands on whichever paragraph loads first.

### The v0.3 version literal sits hardcoded in three files

`tools/check-vocabulary-parity.ts:9` (docstring), `:48` (LOCK_PATH constant), `:159` (error string); `web/instrumentation/vocabulary.ts:4` (import path). Every v0.4 bump touches three files across two directories. Sprint 032's rubber duck named this class of foot-gun ("`replace_all` on version strings is brittle when the same version number appears in unrelated paths") and closed only the mirror instance — the same class sits in the parity gate and the loader.

### v0.3 rationale is a delta ledger where BOOTSTRAP calls for a full rationale

`signals/versions/0.3-rationale.md` runs 54 lines: per-change ledger against v0.2, one entity-merge paragraph, signatures. `sdd-kit-2/grammar/BOOTSTRAP.md § Step 11` names the required sections: intent+scope, per-layer decisions (Layers 0–7), dual-contract audit table, project-specific overrides, open proposals. The v0.3 rationale skips the audit table for the nine new studio tags. Which behavior tag pairs with which pane-render tag for SPEC_ROW_ADDED/REMOVED, CANVAS_TOGGLED, SPEC_VALIDATE_REQUESTED, or SPEC_BUILT: none of that is on the record.

---

## Minor — ten findings

### The chat-turn-count check accepts both shapes it exists to distinguish

`tools/capture-grade.ts:208`: `if (declared !== turnsInWindow * 2 && declared !== turnsInWindow)`. Comment: "We accept both shapes to survive an in-flight assistant reply." The vocab defines `CHAT_EXITED.turns_in_conversation` at line 434 without pinning either shape. A future emit that consistently reports the wrong shape passes.

### The grader enforces a global frame-monotonic invariant the vocab does not lock

`tools/capture-grade.ts:414-430` asserts monotonically increasing `frame` across every pane-render tag. `signals/versions/0.3.json:730-740` (`invariants[]`) lists 10 invariants, none of them this one. Grader stricter than lock.

### Two locked SESSION invariants have no runtime check

`signals/versions/0.3.json:730-731`: "SESSION_INIT is the first signal in any capture", "SESSION_ENDED, when it fires, is the last signal." `containsInOrder` at `capture-grade.ts:315` verifies position in EXPECTED_ORDER; it does not enforce absolute-first or absolute-last against the whole capture. Two vocab-locked invariants without enforcement.

### Sprint 030's fallback drops a valid user click rather than surfacing the race

Sprint 030 rubber duck: "`inspectProducer`'s 'unknown' fallback drops instead of emits when the lane click races the graph mutation." A user click that landed before the graph loaded produces no PRODUCER_INSPECTED emit. The vocab has no field for the race condition and no `PRODUCER_INSPECTION_RACED` tag; Layer-7 evidence for the race is absent from the capture.

### Sprint 031's optional tail writes four fixtures no gate reads

`harness/lib/capture-tail.js` writes JSONL to `captures/e2e-<name>.jsonl` when `CAPTURE_SIGNALS=1`. Sprint 031 close explicitly frames the tail as "a diagnostic seam, not a contract" — files sit un-graded and un-referenced by any retention policy. `e2e-studio.jsonl` at 0 signals is evidence of a state Sprint 032 has since closed.

### The studio harness verifies the console-link emit under `preventDefault`, not under target="_blank"

`harness/capture_studio_signals.js:52-57` adds a capture-phase `preventDefault` before `link.click()`. `web/studio.ts:179` sets `target="_blank"` on the anchor. Production behavior opens a new tab and keeps the studio page put; the harness proves the listener works under `preventDefault` but does not exercise the real production path.

### The parity gate scans `web/` and `harness/` but not `tools/`

`tools/check-vocabulary-parity.ts:49`: `SCAN_DIRS = ["web", "harness"];`. `tools/` holds `capture-grade.ts` and `check-vocabulary-parity.ts` (neither emits today); a future tool script that emits would slip the gate. No comment names the choice.

### The parity gate's docstring cites the old sprint numbering

`tools/check-vocabulary-parity.ts:15-17`: "Pre-Sprint 010: web/ has no emit() calls yet ... Sprint 010+: every code-side emit must reference a locked tag." Actual first-emit sprint under current numbering is 019; Sprint 018 is TS conversion. Sprint cards renumbered on disk; the docstring did not.

### The console↔studio transition is not on the record

The console harness (`capture_signals.js`) drives `web/app.ts`; the studio harness (`capture_studio_signals.js`) drives `web/studio.ts`. `STUDIO_OPENED` emits from the console when the user clicks the studio link; `CONSOLE_LINK_FOLLOWED` emits from the studio when the user returns. Neither harness follows the transition to the other page. The two-tab flow between them stays off the record.

### SDD-ARC-PLAN.md sits alongside ROADMAP-2026-08-16.md without a superseded marker

`process/` holds `SDD-ARC-PLAN.md` (2026-08-14, sprint numbers 011–019) and `ROADMAP-2026-08-16.md` (2026-08-16, current). The port-plan supersession was renamed with the `-superseded` suffix (`SDD-HARNESS-PORT-PLAN-2026-08-16-superseded.md`); the arc plan was not. A reader opening SDD-ARC-PLAN.md first hits the wrong sprint numbers. The earlier `REVIEW-2026-08-14-sdd-arc-plan.md § F8` already flagged its cadence-gate citation as bogus.

---

## What did not carry forward

Twelve findings from `REVIEW-2026-08-14-vocab-v01-and-harness-port.md` and seven from `REVIEW-2026-08-15-vocab-mapping-to-substrate.md` resolved at v0.2 or v0.3: TS pivot in WORKING_AGREEMENT, build-step language, `tag_count` matching actual tags, sprint-numbering in vocab notes, locked-vocab flag, `substrate_kind` foreign-key enforcement (Sprint 030), external SDK bridge mapping, reader-controller framing, Addendum A9 carve-out framing, Layer 6 populated, View collision resolved via PANE_SWITCHED + category rename, four entity_merges declared. Two carried forward: the WORKING_AGREEMENT trailer contradiction (folds into the WORKING_AGREEMENT drift finding above), and the paired-authoring vocabulary session (v0.3 header cites Architect directive but the twelve-step BOOTSTRAP session shape stayed unpaired).

---

*Reviewer: Claude, this session. Additive to `substrate-ui/process/` alongside the four prior dated reviews.*
