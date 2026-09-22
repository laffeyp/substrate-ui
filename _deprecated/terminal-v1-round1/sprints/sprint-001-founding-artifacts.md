# Sprint 001 — founding artifacts

*Backfilled 2026-08-14 — the artifacts landed before the card. Recording here so the audit trail is honest. Sprint dispatched, executed, and closed under the same session.*

---

## Frontmatter

```yaml
---
id: 001
status: closed
phase: 0
pass_kind: docs
---
```

## scope

Land the three founding SDD artifacts for terminal-v1 as a sub-project of substrate-ui, per Addendum A10 (sub-project gets its own home + core artifacts before its second increment). Three files under `substrate-ui/terminal-v1/`: `WORKING_AGREEMENT.md` (project identity, canonical home registry, tone canon, cadence policy, halt conditions), `BLACKBOARD.md` (seven-section scaffold with `## Decisions` pre-seeded from the session's eight rulings), `KIT_DIARY.md` (four hypotheses drawn from `../../design/terminal-v1/sprint-plan.md`).

## prerequisites

- Wave 0 dispatch (this is the first sprint).

## context_files

- `../../sdd-kit-2/AGENTS.md`
- `../../sdd-kit-2/ADDENDUMS.md` (Addendum A, A9 + A10 especially)
- `../../sdd-kit-2/templates/{WORKING_AGREEMENT,BLACKBOARD,KIT_DIARY}.md`
- `../../design/terminal-v1/visual-redesign.md`
- `../../design/terminal-v1/sprint-plan.md`

## signal contract

### Emits

None — this is a docs sprint. Terminal-v1 emits no signals of its own (A9).

### Consumes

- The kit templates
- The two `design/terminal-v1/` docs

### Invariants

- Terminal-v1 has no `signals/0.1.json` file (A9 — reader/projector UI needs no vocabulary lock).
- Nothing under `substrate-ui/web/` is edited.

## artifact contract

### Files created

- `substrate-ui/terminal-v1/WORKING_AGREEMENT.md`
- `substrate-ui/terminal-v1/BLACKBOARD.md`
- `substrate-ui/terminal-v1/KIT_DIARY.md`

### Content assertions

- Each file exists with size > 0.
- `WORKING_AGREEMENT.md` contains `## Project identity`, `## Canonical home registry`, `## Vocabulary discipline overrides`, `## Tone canon`.
- `BLACKBOARD.md` contains all seven sections: `## Surfaced for review`, `## Decisions`, `## Built`, `## Deferred`, `## Open questions`, `## Drift watchlist`, `## Sprint tail`.
- `KIT_DIARY.md` contains `## Hypothesis tracking` with at least four hypotheses.
- No file under `substrate-ui/terminal-v1/signals/` exists.

### Command exit codes

- `test -s substrate-ui/terminal-v1/WORKING_AGREEMENT.md && test -s substrate-ui/terminal-v1/BLACKBOARD.md && test -s substrate-ui/terminal-v1/KIT_DIARY.md` returns 0
- `test ! -d substrate-ui/terminal-v1/signals` returns 0

## done criteria

Three files exist, non-zero, with the templates' section headers verbatim; no `signals/` folder created; the founding-act artifacts are on disk before any other sprint dispatches.

## close notes

Landed. Content assertions verified. The `BLACKBOARD.md ## Decisions` section carries eight pre-seeded rulings from the session; `## Surfaced for review` carries the COMPREHENSION_AFFIRMATION written for hard rule 5. Sprint 002 (harness stubs) dispatches next.
