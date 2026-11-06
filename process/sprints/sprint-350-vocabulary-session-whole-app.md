# Sprint 350 — Vocabulary Session for the whole app (v0.7)

```yaml
---
id: 350
status: active
phase: SDD re-centre
pass_kind: architecture
---
```

## scope

Run `../sdd-kit-3/grammar/BOOTSTRAP.md` Steps 0–12 on substrate-ui as built, every process and every user action, and lock v0.7 of `web/vm/signals/versions/` with its rationale and sign-off. Starts from v0.6's 42 locked tags; every change to them is a typed proposal; kernel entities are joined by `ENTITY_MERGE_PROPOSED`, not redeclared. Plan: `process/planning/2026-11-05-sdd-signals/PLAN-2026-11-05-sdd-signals-r3.md`, item 1. Content sprint: no code changes.

## prerequisites

- v0.6 ratified (BLACKBOARD, agent-resolved, 2026-11-05); `WORKING_AGREEMENT.md` names v0.6 (commit `0f0ed79`).

## context_files

- `../sdd-kit-3/AGENTS.md`, `grammar/PRINCIPLES.md`, `grammar/BOOTSTRAP.md`, `foundations/01`–`04`, `TECHNIQUES.md`, `ADDENDUMS.md`
- `web/vm/signals/versions/0.6.json`, `0.6-rationale.md`, earlier rationales
- `../substrate/process/signals/0.4.json`, `../substrate/process/signals/session-vocabulary.md`
- `BLACKBOARD.md` decisions and tail; `WORKING_AGREEMENT.md`
- `process/planning/2026-11-05-sdd-signals/RESEARCH-2026-11-05-vocabulary-inventory.md` (Step 0)
- `../design/received/handoff 5/README.md`, `docs/DESIGN-SPEC -2026-11-04- r6.md`, `docs/DESIGN-DECISIONS -through 2026-11-04-.md` (design canon, hard rule 8)
- the code each step types, named in the inventory

## signal contract

### Emits

None at runtime: a content sprint. The Signal Report narrates the session's decisions.

### Invariants

- v0.6 is not edited; v0.7 is a new file.
- No tag in v0.7 lacks a source citation (a code path or a design decision).
- No kernel entity is redeclared.

## artifact contract

### Files created

- `web/vm/signals/versions/0.7.json`, `web/vm/signals/versions/0.7-rationale.md`
- `web/vm/signals/proposals.json` (the typed proposals, ratified and open)

### Files modified

- `web/vm/signals/versions/current.json` → `0.7.json` (at sign-off only)

### Content assertions

- `0.7.json` parses; every tag has `name`, `category`, `stratum`, `payload`, `optional_payload`, `note`; every category is in `categories`.
- `0.7.json` carries `sessions`, `temporal_invariants`, `state_transitions`, `operators`, `evidence_constraints`, `report_binding`, `grammar_growth` (Layers 3–10).
- `0.7-rationale.md` has the dual-contract audit table, the payload rule, the validator posture, the agent-resolved decisions and the sign-off.

### Command exit codes

- `python3 -c "import json; json.load(open('web/vm/signals/versions/0.7.json'))"` returns 0

## observation contract

Not applicable at this sprint: no runtime behaviour changes. The tags it locks are observed in the packaged app from item 4 on.

## done criteria

v0.7 is locked with rationale and sign-off; every user action and process decision in the inventory has a tag, a view pair or a typed proposal.

## notes

The session works step by step; each step's self-review runs against the file on disk. Steps are recorded on the BLACKBOARD as they close.
