# Sprint 475 — highlighting a person can see, graded by the pixels

```yaml
---
id: 475
status: closed
phase: code editor (roadmap r13), E15, found in use 2026-11-11
pass_kind: functional
---
```

## scope

BLACKBOARD 2026-11-11 `user` ("There is no syntax highlighting whatsoever … it's like it's all white text still") and `surfaced` entries. Sprint 472 loads every language's parser, but `HIGHLIGHT` in `Centre.tsx` draws keywords, types, names, numbers and punctuation in or near the text's own white (#d7dade, #b9bec5); only comments (dim, italic) and strings (#9aa0a8) differ, so a TOML or C file reads as white. Sprint 472's gate read computed styles, the structural lens. This sprint gives `HIGHLIGHT` a palette with distinct hues within D7 (no green, no yellow, red for failed only): keywords in the accent blue #82a5c8; strings, characters and regular expressions lavender #b7a4d8; numbers, booleans, null and escapes pink-violet #cc8fb8; types, classes and namespaces a pale blue-grey #a9c0d8; names being defined and called #e8eaee; properties and attributes #b9bec5; meta and annotations (`#include`, attributes) #9c8fc4; punctuation, brackets and operators #8a9099; headings the accent, bold; comments as before, #62676f italic. The gate decodes the screenshot's pixels inside each token's box and checks the colour drawn.

## prerequisites

- 472.

## context_files

- `../sdd-kit-3/AGENTS.md`; `../sdd-kit-3/ADDENDUMS.md` A1, A2 (three lenses; decode the pixels); `../sdd-kit-3/TECHNIQUES.md` two-track visual grading
- `BLACKBOARD.md`: the entries of 2026-11-11 on the editor broken in use; D7 (BLACKBOARD 2026-11-09, the modified dots)
- `web/app/editor/Centre.tsx` (`HIGHLIGHT`, `THEME`, `GROUND`, `ACCENT`); `harness/pixel/png.ts` (`decodePng`); `harness/shakeout/editor_highlight.ts`
- `node_modules/@lezer/highlight/dist/index.d.ts` (`tags`: a style on a parent tag applies to its children)

## signal contract

### Emits

No new tag.

### Consumes

- The parsers' highlight tags.

### Invariants

- D7: no green, no yellow; red stays for failures.
- Plain text (a variable's name) stays #d7dade.

## artifact contract

### Files created

- `harness/shakeout/editor_highlight_seen.ts`

### Files modified

- `web/app/editor/Centre.tsx` (`HIGHLIGHT`)
- `harness/shakeout/editor_highlight.ts`: its string colour is the new lavender

### Content assertions

- `HIGHLIGHT` styles `t.keyword` #82a5c8, `t.string` #b7a4d8, `t.number` #cc8fb8, `t.typeName` #a9c0d8.

### Command exit codes

- `npm run build`, `npm run test:unit` return 0

## observation contract

### UI driving steps

Gate `editor_highlight_seen.ts`, from source and on the bundle. A repository written by the gate holds main.rs, main.c and Cargo.toml. The deterministic driver; in the editor, for each file, once its language loads: a screenshot; for each named token (`fn`, `let`, `"text"`, `42`, a variable's name in main.rs; `int`, `return`, `"hello\n"`, `0` in main.c; `"demo"`, `name` in Cargo.toml) the glyph pixels inside the token's box are decoded from the PNG, and their colour is within 40 (RGB distance) of the palette's colour for that token; the keyword's colour is more than 60 from the variable's.

### Expected screenshot / visual state

- main.rs and main.c with blue keywords, lavender strings, pink-violet numbers, white names.

## done criteria

A file in a common language shows its keywords, strings, numbers and types in colours a person sees as different.

## notes

The palette is a build detail settled by the project's colour rule (D7) and contrast against #212327, not a design fork.

## self-review checklist

Run 2026-11-11, before the work began.

- [x] Scope is concrete and bounded: one verifiable property (tokens draw in distinct, visible colours).
- [x] context_files cover the palette's home, D7, the pixel decoder, the kit's grading lenses.
- [x] No tag needed.
- [x] Artifact contract is gradable.
- [x] Observation contract present, graded by decoded pixels.
- [x] ≤2 files: `Centre.tsx` and the gate.

## close

`HIGHLIGHT` now styles keywords #82a5c8, strings #b7a4d8, numbers and escapes #cc8fb8, types #a9c0d8, names defined and called #e8eaee, properties #b9bec5, meta #9c8fc4, punctuation and operators #8a9099, headings bold accent, comments #62676f italic as before.

Gate `editor_highlight_seen` from source and on the bundle (build 1794447087, packaged true), colours decoded from the screenshots' pixels: main.rs `fn` rgb(136,162,195), `let` rgb(135,162,194), `"text"` rgb(174,160,205), `42` rgb(195,146,182), `total` rgb(231,232,236); main.c `int` rgb(172,190,211), `return` rgb(134,160,193), `"hello"` rgb(176,162,208), `0` rgb(195,146,182); Cargo.toml `"demo"` rgb(179,164,211); each within 40 of its palette colour; `fn` and `total` more than 60 apart. Mutant: keywords drawn in the text's white #d7dade fails it (main.rs's `fn` never reaches the blue). `editor_highlight` (sprint 472) failed on the bundle on its old string grey and passes with the new lavender.

Seen in the main.c screenshot, outside this sprint's scope: OUTLINE lists `fn` with no name for main.c (BLACKBOARD `surfaced`, this date).

Command exit codes: unit specs 231/231; build 0. Gates on the bundle: `editor_highlight_seen`, `editor_highlight`, `editor_centre`, `editor_open_speed` 0.

Rubber Duck Pass. No tag was added or changed. Observations: none in the trace; the C outline is recorded.
