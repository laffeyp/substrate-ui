# REVIEW — the 2026-08-15 VOCABULARY_CHANGE_REQUIRED entry at BLACKBOARD ## Surfaced for review

*Reviewer role. Target: the topmost entry at `process/BLACKBOARD.md ## Surfaced for review`, dated 2026-08-15, filed by Claude at Wave-1 close. Read against `signals/versions/0.1.json`, `signals/versions/0.1-rationale.md § Open proposals for v0.2`, `sdd-kit-2/AGENTS.md` (hard rules + halt taxonomy), `sdd-kit-2/grammar/PRINCIPLES.md` (eight proposal types), the twelve Wave-1 sprint cards (018–029), and my three prior 2026-08-14/15 review files. New dated file per no-in-place-edits.*

---

## What the entry claims

1. Halt reason: `VOCABULARY_CHANGE_REQUIRED` (uppercase).
2. Wave-1 (12 sprints, 018–029) closed; "All 44 tags in v0.1 fire at real emit sites and grade green."
3. Four v0.2 proposals copied from `signals/versions/0.1-rationale.md § Open proposals for v0.2`, each carrying an Agent-authored "Recommend" (three defers, one promote).
4. Cites AGENTS.md hard rule 2 (vocabulary is the contract) and hard rule 12 (Sprint-0 vocabulary materialization).
5. Gates the next implementation sprint on Architect ratification of the halt.

---

## Findings

### F1 — The entry recommends four times; the reviewer/Agent doesn't decide

Each of the four proposals ends with "Recommend defer" or "Recommend promote." `sdd-kit-2/AGENTS.md` § "The BLACKBOARD protocol" and § "Halt conditions" name the discipline: the Agent surfaces to `## Surfaced for review` with a typed reason; the Architect resolves via `## Decisions`. Recommendation is one step short of resolution. The standing memory rule `feedback-report-do-not-prescribe` is explicit: "no 'honest next work' / 'next steps' / 'options going forward' — enumerating or recommending is deciding; that's the user's role."

Four "Recommend" lines are four decisions the Agent is casting a vote on. The right form of the halt names the proposals, cites the evidence, and stops there.

### F2 — Halt reason casing does not match the closed set

`AGENTS.md` § "Halt conditions" declares six typed halts, each in lowercase snake_case: `vocabulary_change_required`, `dual_contract_fail`, `comprehension_failed`, `bridge_mapping_required`, `observation_contract_missing`, `awaiting_architect_decision`. The entry types the reason `VOCABULARY_CHANGE_REQUIRED` (uppercase). The halt taxonomy is a closed set (small vocabulary lock in its own right); the wire form is one of six strings. Case drift on a taxonomy is the same class as the retyped-literal drift the substrate arc has been fighting (Sprints 143/176 CellSource/reason).

### F3 — Proposal #3's evidence does not support "promote to required"

The proposal: `PAYLOAD_FIELD_PROPOSED: TURN_SUBMITTED.turn_index required`.

The evidence: "the Sprint 025 fixture always carries it (Math.floor(convo.length/2) is defined for turn 0); no observed edge case where the field is absent."

Absence of a counterexample in one fixture is not evidence that no counterexample exists elsewhere. `Math.floor(convo.length/2)` is defined for every non-negative integer including 0, so the value is always computable — but that is a claim about the emitter's expression, not about whether the field belongs in `optional_payload`. If a future emit site (e.g., a mid-conversation reset that surfaces TURN_SUBMITTED without a convo counter) legitimately omits it, promoting to `required` breaks that call.

The rationale-doc reason the field was in `optional_payload` in v0.1 was "currently optional; likely promotes to required once multi-turn observation matters" — a stated intention, not a locked plan. "One fixture always carries it" is weak grounds to lock. The stronger evidence would be: every current AND every planned emit site carries it. That evidence is not in the entry.

### F4 — The four proposals do not include the four ENTITY_MERGE cases my prior review flagged

`REVIEW-2026-08-15-vocab-mapping-to-substrate.md` F1 named four Layer-0 entities the current vocab silently merges with substrate's: Record ↔ Run, Topology ↔ Topology, AgentRun ↔ Run-with-tool-loop-topology, Event ↔ Envelope. `grammar/PRINCIPLES.md`'s Layer-10 proposal taxonomy names `ENTITY_MERGE_PROPOSED` for exactly this case. Four proposals belong on the pending queue.

The halt entry lists four proposals — three deferrable, one promote — and none touches the entity-merge shape. If the halt is the natural place to gather the pending vocabulary queue for the Architect (which it is), and the four ENTITY_MERGE cases are the load-bearing structural work (which they are per the mapping review), a halt at Wave-1 close that lists four low-consequence tweaks and no entity merge is a de facto deprioritization of the entity merges without saying so.

### F5 — The halt's rule-12 citation is answered by the Wave-1 close it sits on top of

`AGENTS.md` hard rule 12: "Implementation sprints do not dispatch until `signals/0.1.json` exists and the Architect has signed off."

`signals/versions/0.1.json` header: `"locked": false`, `"locked_by": "Agent-drafted (Claude Opus 4.7, 2026-08-14); awaiting Architect ratification."`

Sprints 018 through 029 dispatched between 2026-08-14 23:24 and 2026-08-15 02:27 against the unsigned v0.1. The halt entry cites rule 12 to gate the NEXT wave; the same rule was already at issue for the wave that just closed. Filing the halt after 12 sprints ran against the unratified base is the horse-and-barn pattern — the gate is being installed where it should have been installed on 2026-08-14 before Sprint 018 dispatched.

### F6 — "All 44 tags in v0.1 fire at real emit sites and grade green" verifies

Confirmed on grep: `grep -oE '\bemit\("([A-Z_]+)"' web/app.ts | sort -u` returns 44 unique tag names; every tag declared in `signals/versions/0.1.json` appears in the emit set; every emit tag appears in the declared set. Set-difference is zero in both directions. This one factual claim in the entry checks.

### F7 — Bundling twelve sprint closes and a halt in one entry hides two separate readings

The entry opens with "VOCABULARY_CHANGE_REQUIRED (Wave-1 close, four v0.2 proposals drafted at Sprint 019, unratified)." One entry carries two events: (a) Wave 1 closed, 12 sprints landed; (b) four v0.2 proposals need ratification. A reader parsing the surfaced-for-review section for pending halts sees one entry when the ledger holds two.

Convention across the rest of the section (the 2026-06-17 through 2026-06-23 entries) is one event per bullet. The Wave-1 close should live in `## Built` (the append-only sprint-close section); the halt should live here. Splitting the two also gives the halt a shorter title that the Architect can grep for.

### F8 — The proposals mirror the rationale-doc list; the halt adds no fresh review

`signals/versions/0.1-rationale.md § Open proposals for v0.2` at line 71 lists four items:
- INSPECTOR_RENDERED — matches proposal #1.
- FRAME_RENDERED — matches proposal #2.
- TURN_SUBMITTED.turn_index — matches proposal #3.
- TOPOLOGY_LAUNCHED split — matches proposal #4.

The halt is a re-surfacing of what the rationale already carries, plus the Agent's four "Recommend" votes. If the rationale doc surfaces the four proposals as v0.2 candidates and the halt re-surfaces them at wave close, one of the two documents is redundant. The rationale doc lives at the vocab lock; the halt lives at the wave close; both point at the same four items.

The load-bearing thing a wave-close halt could add — fresh evidence gathered during Wave 1 that pushes any of the four one way or the other, plus proposals the wave itself generated — is not on the entry. Twelve sprints of real emit-site landing produced no new proposals? Possible, but a wave close is where that evidence would normally surface.

---

## Consistency checks that pass

- Proposal-type nomenclature matches `grammar/PRINCIPLES.md`'s eight-type taxonomy (`NEW_TAG_PROPOSED`, `PAYLOAD_FIELD_PROPOSED`, `TAG_SPLIT_PROPOSED`).
- The entry cites AGENTS.md hard rule 2 (vocabulary is the contract) and rule 12 (Sprint-0 vocabulary materialization) accurately.
- Sprint 025 is a real sprint card on disk (`sprints/sprint-025-agent-subsystem.md`, Aug 15 02:11); its close entry is in `## Built` and the halt's Evidence line for proposal #3 refers to a real fixture that exists.
- The Wave-1 close claim checks: sprint cards 018 through 029 all exist on disk with Aug 14–15 mtimes; the corresponding `## Built` entries land alongside the halt.
- The halt gates future dispatch — an appropriate response to unratified changes, and the right conservative posture for the Architect to receive.

---

## One-line summary

The entry names its halt correctly and its 44-tags claim verifies; it also recommends four times against the standing no-prescription rule, mis-cases the halt reason against the six-string closed set, bundles a 12-sprint wave close with a halt in one bullet, mirrors the rationale doc's four proposals without adding fresh Wave-1 evidence, and omits the four ENTITY_MERGE proposals the mapping review named — the wave closed against a still-unlocked v0.1, and rule 12 is being invoked at the gate after twelve sprints already passed through it.

---

*Reviewer: Claude, this session. Additive to `substrate-ui/process/` alongside the three prior dated reviews.*
