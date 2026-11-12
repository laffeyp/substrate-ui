# Sprint 486 — the code editor's close

```yaml
---
id: 486
status: closed
phase: code editor (roadmap r20), E25
pass_kind: functional
---
```

## scope

The roadmap's close: the full suites once; the runbook's build and install, steps 1 to 20, with the gates against the bundle (10 to 16); every editor frame beside the running app; the table of the editor's hand actions against their session tools (save → `write_file`; replace → `edit_file`; step back → `write_file`; search → `grep`; quick open → `glob`), with where "by hand only" is drawn; the evidence reported in chat.

## prerequisites

- 477 to 485

## context_files

- `../sdd-kit-3/AGENTS.md`, `../sdd-kit-3/templates/SPRINT_CARD.md`, `../sdd-kit-3/ADDENDUMS.md` A1, A2
- `process/planning/2026-11-09-code-editor/ROADMAP-2026-11-09-code-editor-r20.md`
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

## close

The evidence is `process/planning/2026-11-09-code-editor/CLOSE-2026-11-11-code-editor.md`:

- **Runbook:** steps 1 to 20 all exit 0, on bundle 1794463909, now installed.
- **Hand actions:** each hand action that changes a file has a session tool behind it (D92). `bash` covers the file encodings and the bytes that the UTF-8 file tools do not, so nothing is labelled "by hand only".
- **Frames:** each frame sits beside the app as its gate draws it. The differences are listed as rulings (teal text, `vs head`, the default keys, the search bar, ⌘↵ behind, the hint as a tooltip) or as not built: the inspector's `⌃⇧`` chip, the top bar's worktree chip and ▾, the footer's `clean · record`, the record column's header and chip, and an all-folded capture for 16c.

Rubber Duck Pass: no tag changed in the close. The shakeouts' tag coverage was 5/5 on axis C and 29/29 on axis A, with no dead tags.

Installed: CFBundleVersion 1794463909.
