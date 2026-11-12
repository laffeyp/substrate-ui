# Sprint 481 — the reply's prose at 72 characters

```yaml
---
id: 481
status: pending
phase: code editor (roadmap r16), E20
pass_kind: functional
---
```

## scope

`RESEARCH-2026-11-11-pane-legibility.md`: a reply row runs to 840 px, about 107 characters of 13 px monospace; comprehension favoured about 55 characters a line and readers prefer 45 to 72 (Dyson and Haselgrove 2001). The reply's paragraphs and lists take `maxWidth: 72ch`; code blocks, tables and tool cards keep the row's width. One verifiable property: no line of a reply's paragraph is longer than 72 characters on screen.

## prerequisites

- 480

## context_files

- `../sdd-kit-3/AGENTS.md`, `../sdd-kit-3/templates/SPRINT_CARD.md`, `../sdd-kit-3/ADDENDUMS.md` A1, A2
- `process/planning/2026-11-09-code-editor/ROADMAP-2026-11-09-code-editor-r16.md`
- `BLACKBOARD.md`: the user entries of 2026-11-11 on how text looks
- `process/planning/2026-11-09-code-editor/RESEARCH-2026-11-11-pane-legibility.md`
- `web/reveal/transcript/ModelReply.tsx` (`blockElement`: paragraphs, lists, headings)

## signal contract

### Emits

No new tag.

### Consumes

- The rendered window.

### Invariants

- Code blocks, tables and tool cards keep the row's 840 px.

## artifact contract

### Files created

- none

### Files modified

- `web/reveal/transcript/ModelReply.tsx`: paragraphs, lists and headings `maxWidth: "72ch"`
- `harness/shakeout/transcript_spacing.ts`: a step reading a long reply's line boxes

### Content assertions

- `ModelReply.tsx` contains `72ch`.

### Command exit codes

- `npm run build` returns 0
- `npm run test:unit` returns 0

## observation contract

### UI driving steps

Gate `transcript_spacing.ts` with Claude Code (`claude`; a model that can do the task, BLACKBOARD 2026-11-11): asked for two paragraphs of plain prose and a fenced code block with a line of 100 characters. Each paragraph line's width, read from its client rects, is at most 72 characters; the code block's line is not wrapped short of the row's width.

### Expected screenshot / visual state

- Prose in a column about half the pane's width; code beside it wider.

## done criteria

A reply's prose reads in lines of at most 72 characters.

## notes

One file; the gate's model is Claude Code because the deterministic driver's reply is one short line.

## self-review checklist

Run 2026-11-11, before the work began.

- [x] Scope is concrete and bounded.
- [x] context_files cover the research note, the code and the design rule.
- [x] Signal contract names only tags in the vocabulary, or none.
- [x] Artifact contract is gradable.
- [x] Observation contract present.
- [x] Files: `ModelReply.tsx` and the gate.
