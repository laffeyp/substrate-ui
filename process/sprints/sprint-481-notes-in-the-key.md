# Sprint 481 — the palette's notes tuned within its key

```yaml
---
id: 481
status: closed
phase: code editor (roadmap r17), E20
pass_kind: functional
---
```

## scope

`RESEARCH-2026-11-11-colour-spacing-wrap-r2.md`, built for regular vision: keep sprint 475's key (coloured classes in the 260°–340° hue arc at chroma at most 35, greys tinted to it); give each class its own note: the pairs that share one (keyword #82a5c8 and type #a9c0d8 at 261°/260°; string #b7a4d8 and meta #9c8fc4 at 306°/302°) are moved apart in hue within the arc or by a clear lightness step; keyword, string and number get small lightness steps; no colour moves more than 10 ΔE2000. One verifiable property: on decoded pixels every pair of coloured classes is at least 8 ΔE2000 apart and every hue lies in the arc.

## prerequisites

- 480

## context_files

- `../sdd-kit-3/AGENTS.md`, `../sdd-kit-3/templates/SPRINT_CARD.md`, `../sdd-kit-3/ADDENDUMS.md` A1, A2
- `process/planning/2026-11-09-code-editor/ROADMAP-2026-11-09-code-editor-r17.md`
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

## close

**The palette.** Found by a search over CIE LCh (`colour-science`) for the smallest total change, under the card's rules: hue 260°–340°, chroma at most 35 and within 3 of its own, no colour moved more than 9.5 ΔE2000, keyword, string and number at least 3 L* apart, the shared notes at least 10° apart in hue, sprint 475's lightness order kept, and every pair of coloured classes at least 10 ΔE2000 apart.

| Class | Was | Now | Moved (ΔE2000) | Hue |
|---|---|---|---|---|
| keyword | #82a5c8 | #7da3ca | 1.2 | 263° |
| type | #a9c0d8 | #b0bbd2 | 4.6 | 274° |
| meta | #9c8fc4 | #948dc5 | 2.3 | 298° |
| string | #b7a4d8 | #c7ade6 | 3.5 | 309° |
| number | #cc8fb8 | #d496c3 | 2.4 | 335° |

The closest pair is now 10.7 apart, where string and meta were 7.0 and keyword and type 8.8. Lightness: keyword 65.6, number 69.3, string 74.7. The other classes (comment, name, property, punctuation) are unchanged.

**Where it lives.** Both palettes are in `derive/look.ts`: `SYNTAX_475` for `original` and `SYNTAX_481` for `new`. `Centre.tsx` builds a HighlightStyle per look (`highlightFor`) and applies it through the look compartment, with the code's line height.

**Files beyond the card.**

- `derive/look.ts`: the palettes.
- `harness/pixel/ciede2000.ts` (new): CIEDE2000 after Sharma, Wu and Dalal 2005. It matches `colour-science` on four pairs: 8.8, 7.0, 11.3, 10.7.
- `harness/shakeout/editor_highlight.ts`: sprint 472's string colour, now #c7ade6.

**Gate `editor_highlight_seen`,** from source and on the bundle (build 1794456520, packaged true):

- Under `new`, every token decodes within 40 of its palette colour. main.c now holds `#include` for meta.
- Decoded pairs are at least 9.1 ΔE2000 apart. The screen's antialiasing pulls them below the palette's 10.7.

| Pair | Decoded ΔE2000 |
|---|---|
| string/number | 9.1 |
| string/meta | 9.9 |
| keyword/type | 10.3 |
| keyword/meta | 11.4 |
| string/type | 13.1 |
| number/meta | 14.4 |
| type/meta | 15.3 |
| keyword/string | 15.9 |
| number/type | 19.7 |
| keyword/number | 24.1 |

- Under `original`, picked in Settings, main.c decodes sprint 475's colours.

**Mutant.** The new look keeping sprint 475's palette fails: string and meta decode 5.4 apart.

**A slip in the mutant's restore, repaired before the close.** A `git checkout` put the gate back to its last commit, and a `sed` matched both palette lines in `look.ts`. Both were restored and the gate rerun green from source and on the bundle.

**Command exit codes.** `npm run build` 0; `npm run test:unit` 231/231. Also on the bundle: `editor_highlight`, `transcript_spacing`, `editor_centre`, `editor_open_speed` 0.

**Rubber Duck Pass.** No tag changed. No observations.

Installed: CFBundleVersion 1794456520.
