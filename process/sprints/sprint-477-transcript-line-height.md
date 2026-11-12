# Sprint 477 — the transcript's lines at 1.54

```yaml
---
id: 477
status: closed
phase: code editor (roadmap r15), E16, first card
pass_kind: functional
---
```

## scope

The Architect, 2026-11-11: the pane "looks like it's like 1.5 spaced"; measured at 2.0 (13 px on 26 px; `harness/shakeout/type_metrics.ts`). The transcript draws in three containers, each with its own line height: the pane (`PanesView.tsx`, 2), meta (`App.tsx`, 1.95) and the editor's terminal (`EditorView.tsx`, 1.7). All three take 1.54 (20 px on 13 px), from one constant, as `RESEARCH-2026-11-11-colour-spacing-wrap.md` sets it (Tinker's leading studies; WCAG 1.4.8's 1.5 for prose). One verifiable property: every transcript row's line box is 1.54 times its font size, in all three places.

## prerequisites

- none

## context_files

- `../sdd-kit-3/AGENTS.md`, `../sdd-kit-3/templates/SPRINT_CARD.md`, `../sdd-kit-3/ADDENDUMS.md` A1, A2
- `process/planning/2026-11-09-code-editor/ROADMAP-2026-11-09-code-editor-r15.md`
- `BLACKBOARD.md`: the user entries of 2026-11-11 on how text looks
- `process/planning/2026-11-09-code-editor/RESEARCH-2026-11-11-colour-spacing-wrap.md` (line spacing)
- `web/app/PanesView.tsx`, `web/app/App.tsx` (the meta transcript), `web/app/editor/EditorView.tsx` (the terminal); `web/reveal/transcript/Row.tsx`; `harness/shakeout/type_metrics.ts`

## signal contract

### Emits

No new tag.

### Consumes

- The rendered window.

### Invariants

- The transcript's font size is unchanged; only the line height moves.
- Box-drawing output in a tool card keeps its own line height (`ToolCard.tsx` 1.7 is not this sprint's).

## artifact contract

### Files created

- `harness/shakeout/transcript_spacing.ts` (gate)

### Files modified

- `web/app/PanesView.tsx`, `web/app/App.tsx`, `web/app/editor/EditorView.tsx`: the transcript container's `lineHeight` reads `TRANSCRIPT_LINE_HEIGHT`
- `web/reveal/transcript/Row.tsx`: exports `TRANSCRIPT_LINE_HEIGHT = 1.54`

### Content assertions

- `Row.tsx` contains `export const TRANSCRIPT_LINE_HEIGHT = 1.54`.
- None of the three containers has a literal `lineHeight: 2`, `1.95` or `1.7`.

### Command exit codes

- `npm run build` returns 0
- `npm run test:unit` returns 0

## observation contract

### UI driving steps

Gate `transcript_spacing.ts`, from source and on the bundle: the deterministic driver; a three-line message sent; the reply drawn. The message's and the reply's line boxes read in the pane, in meta (⌘M) and in the editor's terminal (⌘⇧E). In each, the screenshot's rows of the message are decoded and the pitch between their text lines is 20 px ± 1 at 13 px type.

### Expected screenshot / visual state

- The pane's message wraps on lines 20 px apart, where it was 26.

## done criteria

The pane, meta and the editor's terminal draw the transcript at 1.54, measured on the screen.

## notes

Three product files for one value: each container sets its own `lineHeight`, and leaving any at its old value draws one transcript at two spacings. The constant lives beside the rows it spaces (`Row.tsx`).

## self-review checklist

Run 2026-11-11, before the work began.

- [x] Scope is concrete and bounded.
- [x] context_files cover the research note, the code and the design rule.
- [x] Signal contract names only tags in the vocabulary, or none.
- [x] Artifact contract is gradable.
- [x] Observation contract present.
- [x] Files: three containers and the constant's home, one value; past the two-file limit for the reason in the notes.

## close

`Row.tsx` exports `TRANSCRIPT_LINE_HEIGHT = 1.54`. The three transcript containers read it in place of their own values: the pane (`PanesView.tsx`, 2), meta (`App.tsx`, 1.95) and the editor's terminal (`EditorView.tsx`, 1.7). The constant is imported from `reveal/transcript/Row` directly, so the transcript's `index.ts` is unchanged.

Gate `transcript_spacing.ts`, from source and on the bundle (build 1794452695, packaged true), pitch decoded from the screenshot rows of a wrapped message: pane 3 lines at 20, 20 px; meta 4 lines at 20, 20, 20.5 px; editor terminal 3 lines at 20, 20 px. Found writing the gate: the editor's terminal is short and had scrolled the message out of view, so its first reading (12 px) came from one cut line. The gate now scrolls the row to the top and measures only what the scroller shows.

Mutant: the pane left at 2 fails the gate at 26, 26 px.

Command exit codes: `npm run build` 0; `npm run test:unit` 231/231. Also passing on the bundle: `transcript_follow`, `editor_view`, `input_bar`, `narrow_text`.

Rubber Duck Pass. No tag changed; the change is layout. No observations.

Installed: CFBundleVersion 1794452695.
