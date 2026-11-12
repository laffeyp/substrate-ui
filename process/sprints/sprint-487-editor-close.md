# Sprint 487 — the code editor's close

```yaml
---
id: 487
status: pending
phase: code editor (roadmap r16), E26
pass_kind: functional
---
```

## scope

The roadmap's close: the full suites once; the runbook's build and install, steps 1 to 20, with the gates against the bundle (10 to 16); every editor frame beside the running app; the table of the editor's hand actions against their session tools (save → `write_file`; replace → `edit_file`; step back → `write_file`; search → `grep`; quick open → `glob`), with where "by hand only" is drawn; the evidence reported in chat.

## prerequisites

- 477 to 486

## context_files

- `../sdd-kit-3/AGENTS.md`, `../sdd-kit-3/templates/SPRINT_CARD.md`, `../sdd-kit-3/ADDENDUMS.md` A1, A2
- `process/planning/2026-11-09-code-editor/ROADMAP-2026-11-09-code-editor-r16.md`
- `BLACKBOARD.md`: the user entries of 2026-11-11 on how text looks
- `RUNBOOK-2026-11-11-project-r7.md`

## signal contract

### Emits

No new tag.

### Consumes

- The rendered window.

### Invariants

- Nothing in the product changes in this sprint unless a gate finds a defect.

## artifact contract

### Files created

- none

### Files modified

- none

### Content assertions

- The runbook's steps 1 to 20 logged under `runs/packaged/`.

### Command exit codes

- Runbook steps 1 to 20 return the codes the runbook names

## observation contract

### UI driving steps

The runbook's gates against the bundle; the editor frames rendered beside screenshots of the running app.

### Expected screenshot / visual state

- Each frame beside its screenshot.

## done criteria

The code editor is built, installed, and checked end to end.

## notes

Runs once, after every other card.

## self-review checklist

Run 2026-11-11, before the work began.

- [x] Scope is concrete and bounded.
- [x] context_files cover the research note, the code and the design rule.
- [x] Signal contract names only tags in the vocabulary, or none.
- [x] Artifact contract is gradable.
- [x] Observation contract present.
- [x] Files: none in the product.
