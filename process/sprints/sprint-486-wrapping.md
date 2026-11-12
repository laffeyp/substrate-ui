# Sprint 486 — wrapping long lines, as a setting

```yaml
---
id: 486
status: pending
phase: code editor (roadmap r16), E25
pass_kind: functional
---
```

## scope

`RESEARCH-2026-11-11-colour-spacing-wrap.md`: wrapping off for code, on for Markdown and plain text; ⌥Z switches it for the file shown, as in VS Code; a wrapped line takes its first line's indentation. One verifiable property: a Markdown file's long line wraps at the view's width, and ⌥Z unwraps it.

## prerequisites

- 479

## context_files

- `../sdd-kit-3/AGENTS.md`, `../sdd-kit-3/templates/SPRINT_CARD.md`, `../sdd-kit-3/ADDENDUMS.md` A1, A2
- `process/planning/2026-11-09-code-editor/ROADMAP-2026-11-09-code-editor-r16.md`
- `BLACKBOARD.md`: the user entries of 2026-11-11 on how text looks
- `process/planning/2026-11-09-code-editor/RESEARCH-2026-11-11-colour-spacing-wrap.md`
- `web/app/editor/Centre.tsx`; `web/app/keymap.ts`; `web/app/state/settings.ts`

## signal contract

### Emits

Any key routing reads through the existing key tags; a new tag goes through a vocabulary proposal first.

### Consumes

- The rendered window.

### Invariants

- Code files open unwrapped.

## artifact contract

### Files created

- none

### Files modified

- `web/app/editor/Centre.tsx` (a wrap compartment), `web/app/keymap.ts` (⌥Z), `web/app/state/settings.ts` (the default per kind)

### Content assertions

- `Centre.tsx` reconfigures `EditorView.lineWrapping` through a compartment.

### Command exit codes

- `npm run build` returns 0
- `npm run test:unit` returns 0

## observation contract

### UI driving steps

A Markdown file with a 300-character line opens wrapped; ⌥Z unwraps it; a .rs file opens unwrapped.

### Expected screenshot / visual state

- The Markdown line on several rows, indented as its first.

## done criteria

Long prose lines wrap by default and a key switches it.

## notes

Three files: the view, the key and the setting each hold their part.

## self-review checklist

Run 2026-11-11, before the work began.

- [x] Scope is concrete and bounded.
- [x] context_files cover the research note, the code and the design rule.
- [x] Signal contract names only tags in the vocabulary, or none.
- [x] Artifact contract is gradable.
- [x] Observation contract present.
- [x] Files: the view, the key map and the settings.
