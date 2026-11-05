---
id: 310
status: closed
phase: shell-to-react D6.3
pass_kind: functional
---

# Sprint 310 — `LanguageLens` and its mount

## scope

`web/app/LanguageLens.tsx` draws the stream tabs, the view tabs, the empty line or the note, the group and lane headers, the rows (rules and turns, each turn's cells), the dividers, guides and curves, and the readout row, from `buildLanguageLens` (web/reveal/language_lens.ts) with the template's styles and `data-lang-*` hooks. The readout's label carries `data-lang-readout-label`. `web/reveal.ts` registers the `language` mount. The template's `<svg width="{{ lang.width }}">` logged an invalid-length error on every load before dc-runtime filled it; React sets the numbers directly.

## artifact contract

- Created: `web/app/LanguageLens.tsx`. Modified: `web/reveal.ts`. `npm run build` 0.

## result

Closed 2026-11-05.

## Rubber Duck pass

No signals.
