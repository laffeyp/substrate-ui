# Sprint 479 — the code's lines at 1.54

```yaml
---
id: 479
status: pending
phase: code editor (roadmap r16), E18
pass_kind: functional
---
```

## scope

The code editor draws 13 px type on 23 px lines (1.77; `Centre.tsx` `.cm-scroller`). It takes 20 px (1.54), the transcript's spacing, as `RESEARCH-2026-11-11-colour-spacing-wrap.md` sets it. One verifiable property: the code's line pitch on screen is 20 px.

## prerequisites

- 478

## context_files

- `../sdd-kit-3/AGENTS.md`, `../sdd-kit-3/templates/SPRINT_CARD.md`, `../sdd-kit-3/ADDENDUMS.md` A1, A2
- `process/planning/2026-11-09-code-editor/ROADMAP-2026-11-09-code-editor-r16.md`
- `BLACKBOARD.md`: the user entries of 2026-11-11 on how text looks
- `process/planning/2026-11-09-code-editor/RESEARCH-2026-11-11-colour-spacing-wrap.md`
- `web/app/editor/Centre.tsx` (`THEME`, `.cm-scroller`), `web/app/editor/BytesView.tsx` (its row height)

## signal contract

### Emits

No new tag.

### Consumes

- The rendered window.

### Invariants

- The gutter's numbers stay on their lines.
- The bytes view's rows keep their own height.

## artifact contract

### Files created

- none

### Files modified

- `web/app/editor/Centre.tsx`: `.cm-scroller` `lineHeight: "20px"`
- `harness/shakeout/transcript_spacing.ts`: a step for the code

### Content assertions

- `Centre.tsx` contains `lineHeight: "20px"` in `.cm-scroller`.

### Command exit codes

- `npm run build` returns 0
- `npm run test:unit` returns 0

## observation contract

### UI driving steps

Gate `transcript_spacing.ts`: a file of ten lines opened in the editor; the pitch between its lines, decoded from the screenshot, is 20 px ± 1; each gutter number shares its line's row.

### Expected screenshot / visual state

- Ten lines of code 20 px apart, numbers aligned.

## done criteria

The code's lines sit 20 px apart.

## notes

One value in `THEME`.

## self-review checklist

Run 2026-11-11, before the work began.

- [x] Scope is concrete and bounded.
- [x] context_files cover the research note, the code and the design rule.
- [x] Signal contract names only tags in the vocabulary, or none.
- [x] Artifact contract is gradable.
- [x] Observation contract present.
- [x] Files: `Centre.tsx` and the gate.
