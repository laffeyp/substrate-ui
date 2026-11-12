# Sprint 480 — the reply brighter than the message

```yaml
---
id: 480
status: merged into 479
phase: code editor (roadmap r17), E19
pass_kind: functional
---
```

*Merged into sprint 479 on 2026-11-11 (the Architect: "479 and 480 can be done in the same sprint. Those are minor changes"); built and closed there.*

## scope

The Architect, 2026-11-11: the reply should be brighter than the person's message, or equal. `Row.tsx` `styleFor` draws the message #e2e5e9 (L* 90.8) and the reply #b9bec5 (L* 76.8). `RESEARCH-2026-11-11-pane-text-emphasis.md` (Material's high emphasis; Apple's primary label for content): the reply takes #e2e5e9, the message #d7dade. One verifiable property: on screen the reply's text is 3 to 8 L* brighter than the message's.

## prerequisites

- 479

## context_files

- `../sdd-kit-3/AGENTS.md`, `../sdd-kit-3/templates/SPRINT_CARD.md`, `../sdd-kit-3/ADDENDUMS.md` A1, A2
- `process/planning/2026-11-09-code-editor/ROADMAP-2026-11-09-code-editor-r17.md`
- `BLACKBOARD.md`: the user entries of 2026-11-11 on how text looks
- `process/planning/2026-11-09-code-editor/RESEARCH-2026-11-11-pane-text-emphasis.md`
- `web/reveal/transcript/Row.tsx` (`styleFor`), `harness/pixel/png.ts`

## signal contract

### Emits

No new tag.

### Consumes

- The rendered window.

### Invariants

- Tool, status and warning rows keep their colours.
- Code blocks inside replies keep theirs (code colours in replies are on the Later list).

## artifact contract

### Files created

- none

### Files modified

- `web/reveal/transcript/Row.tsx`: user `textColor` #d7dade, model `textColor` #e2e5e9
- `harness/shakeout/transcript_spacing.ts`: a step decoding both rows' text colour

### Content assertions

- `styleFor` returns `#e2e5e9` for `model` and `#d7dade` for `user`.

### Command exit codes

- `npm run build` returns 0
- `npm run test:unit` returns 0

## observation contract

### UI driving steps

Gate `transcript_spacing.ts`: in the pane, the glyph pixels of the message and of the reply are decoded (the brightest 15% of each row's pixels); the reply's L* exceeds the message's by 3 to 8.

### Expected screenshot / visual state

- The reply reads brighter than the message above it.

## done criteria

The model's reply is the brightest text in the pane, the message one step below it.

## notes

Two colours in one function.

## self-review checklist

Run 2026-11-11, before the work began.

- [x] Scope is concrete and bounded.
- [x] context_files cover the research note, the code and the design rule.
- [x] Signal contract names only tags in the vocabulary, or none.
- [x] Artifact contract is gradable.
- [x] Observation contract present.
- [x] Files: `Row.tsx` and the gate.
