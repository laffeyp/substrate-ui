# Sprint 483 — the ghost scheme

```yaml
---
id: 483
status: pending
phase: code editor (roadmap r18), E22
pass_kind: functional
---
```

## scope

`RESEARCH-2026-11-11-colour-spacing-wrap-r2.md`: ghost is the key with the colour taken out, all whites and greys (the Architect: "all whites and grays"): the same lightness steps as E21's notes, each in the tinted grey of its L*. A setting picks the scheme. One verifiable property: with ghost chosen, every token decodes to chroma below 5 and the classes keep E20's lightness order.

## prerequisites

- 482

## context_files

- `../sdd-kit-3/AGENTS.md`, `../sdd-kit-3/templates/SPRINT_CARD.md`, `../sdd-kit-3/ADDENDUMS.md` A1, A2
- `process/planning/2026-11-09-code-editor/ROADMAP-2026-11-09-code-editor-r18.md`
- `BLACKBOARD.md`: the user entries of 2026-11-11 on how text looks
- `process/planning/2026-11-09-code-editor/RESEARCH-2026-11-11-colour-spacing-wrap-r2.md`
- `web/app/derive/palette.ts`; `web/app/state/settings.ts`

## signal contract

### Emits

No new tag.

### Consumes

- The rendered window.

### Invariants

- The default scheme is unchanged.

## artifact contract

### Files created

- none

### Files modified

- `web/app/derive/palette.ts` (the ghost scheme), `web/app/state/settings.ts` (the setting)

### Content assertions

- The ghost scheme's colours have LCh chroma below 5.

### Command exit codes

- `npm run build` returns 0
- `npm run test:unit` returns 0

## observation contract

### UI driving steps

The setting set to ghost; main.rs's tokens decode with chroma below 5 and in E20's lightness order.

### Expected screenshot / visual state

- main.rs in greys only, its structure still visible by lightness.

## done criteria

A person can pick a scheme of whites and greys that keeps the code's structure.

## notes

Built on E20's notes, so ghost follows them.

## self-review checklist

Run 2026-11-11, before the work began.

- [x] Scope is concrete and bounded.
- [x] context_files cover the research note, the code and the design rule.
- [x] Signal contract names only tags in the vocabulary, or none.
- [x] Artifact contract is gradable.
- [x] Observation contract present.
- [x] Files: `palette.ts` and `settings.ts`.
