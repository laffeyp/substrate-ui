# Sprint 483 — code in replies in the editor's palette

```yaml
---
id: none (later)
status: later
phase: later (roadmap r17, "Later")
pass_kind: functional
---
```

*Moved to later on 2026-11-11 (the Architect: "Those things need to be pushed to the future so they don't fuck up what we're trying to do"). Kept as written; it takes an E number and a sprint id when it is taken up.*

## scope

`RESEARCH-2026-11-11-pane-legibility.md`: a fenced block in a reply is one grey (#b9bec5). A block with a language is highlighted by the editor's parsers and palette (`lezer/highlight` `highlightCode`, the language from `codemirror/language-data`), and the palette moves to one shared home both draw from; the pane keeps wrapping code. One verifiable property: a Rust block in a reply draws its keyword in the keyword colour.

## prerequisites

- 482

## context_files

- `../sdd-kit-3/AGENTS.md`, `../sdd-kit-3/templates/SPRINT_CARD.md`, `../sdd-kit-3/ADDENDUMS.md` A1, A2
- `process/planning/2026-11-09-code-editor/ROADMAP-2026-11-09-code-editor-r16.md`
- `BLACKBOARD.md`: the user entries of 2026-11-11 on how text looks
- `process/planning/2026-11-09-code-editor/RESEARCH-2026-11-11-pane-legibility.md`
- `web/reveal/transcript/ModelReply.tsx`; `web/app/editor/Centre.tsx` (`HIGHLIGHT`); `node_modules/lezer/highlight/dist/index.d.ts` (`highlightCode`)

## signal contract

### Emits

No new tag.

### Consumes

- The rendered window.

### Invariants

- A block without a language stays one grey.
- The editor's colours are unchanged.

## artifact contract

### Files created

- `web/app/derive/palette.ts` (the shared palette)

### Files modified

- `web/reveal/transcript/ModelReply.tsx`, `web/app/editor/Centre.tsx`

### Content assertions

- `Centre.tsx` and `ModelReply.tsx` both import the palette from `derive/palette.ts`.

### Command exit codes

- `npm run build` returns 0
- `npm run test:unit` returns 0

## observation contract

### UI driving steps

A gate with Claude Code asked for a Rust block: the keyword's pixels decode within 40 of the keyword colour.

### Expected screenshot / visual state

- A reply's Rust block coloured as the editor colours main.rs.

## done criteria

Code in a reply reads in the same colours as in the editor.

## notes

Three files: the shared home is new, and both readers of the palette must use it, or the two drift.

## self-review checklist

Run 2026-11-11, before the work began.

- [x] Scope is concrete and bounded.
- [x] context_files cover the research note, the code and the design rule.
- [x] Signal contract names only tags in the vocabulary, or none.
- [x] Artifact contract is gradable.
- [x] Observation contract present.
- [x] Files: the new palette home and its two readers.
