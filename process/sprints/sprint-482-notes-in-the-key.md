# Sprint 482 — the palette's notes tuned within its key

```yaml
---
id: 482
status: pending
phase: code editor (roadmap r16), E21
pass_kind: functional
---
```

## scope

`RESEARCH-2026-11-11-colour-spacing-wrap-r2.md`, built for regular vision: keep sprint 475's key (coloured classes in the 260°–340° hue arc at chroma at most 35, greys tinted to it); give each class its own note: the pairs that share one (keyword #82a5c8 and type #a9c0d8 at 261°/260°; string #b7a4d8 and meta #9c8fc4 at 306°/302°) are moved apart in hue within the arc or by a clear lightness step; keyword, string and number get small lightness steps; no colour moves more than 10 ΔE2000. One verifiable property: on decoded pixels every pair of coloured classes is at least 8 ΔE2000 apart and every hue lies in the arc.

## prerequisites

- 479

## context_files

- `../sdd-kit-3/AGENTS.md`, `../sdd-kit-3/templates/SPRINT_CARD.md`, `../sdd-kit-3/ADDENDUMS.md` A1, A2
- `process/planning/2026-11-09-code-editor/ROADMAP-2026-11-09-code-editor-r16.md`
- `BLACKBOARD.md`: the user entries of 2026-11-11 on how text looks
- `process/planning/2026-11-09-code-editor/RESEARCH-2026-11-11-colour-spacing-wrap-r2.md`
- `web/app/editor/Centre.tsx` (`HIGHLIGHT`); `harness/shakeout/editor_highlight_seen.ts`

## signal contract

### Emits

No new tag.

### Consumes

- The rendered window.

### Invariants

- D7: no green, no yellow; red for failures only.
- No colour moves more than 10 ΔE2000 from sprint 475's.

## artifact contract

### Files created

- none

### Files modified

- `web/app/editor/Centre.tsx` (`HIGHLIGHT`)
- `harness/shakeout/editor_highlight_seen.ts`: the new colours, and the pairwise ΔE2000 and arc checks

### Content assertions

- Every `HIGHLIGHT` colour lies in LCh hue 260°–340° (coloured classes) at chroma ≤ 35.

### Command exit codes

- `npm run build` returns 0
- `npm run test:unit` returns 0

## observation contract

### UI driving steps

Gate `editor_highlight_seen.ts`: main.rs, main.c and Cargo.toml opened; each token's colour decoded; every pair of coloured classes at least 8 ΔE2000 apart; each within 40 of its palette colour.

### Expected screenshot / visual state

- Keywords, types, strings, meta and numbers each a separate note of one blue-violet family.

## done criteria

Every coloured class in the code reads as its own note within one key.

## notes

The ΔE2000 check is computed in the gate from decoded pixels, CIEDE2000 as published (Sharma, Wu and Dalal 2005).

## self-review checklist

Run 2026-11-11, before the work began.

- [x] Scope is concrete and bounded.
- [x] context_files cover the research note, the code and the design rule.
- [x] Signal contract names only tags in the vocabulary, or none.
- [x] Artifact contract is gradable.
- [x] Observation contract present.
- [x] Files: `Centre.tsx` and the gate.
