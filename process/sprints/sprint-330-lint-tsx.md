---
id: 330
status: closed
phase: shell-to-react E4.3
pass_kind: functional
---

# Sprint 330 — lint reads the React files

## scope

`eslint.config.mjs` lints `web/**/*.tsx` as well as `.ts`, with JSX parsing; its glob had read `.ts` only, so neither the short-name rule nor the raw-envelope-kind rule had checked any React area. The override for the retired `reveal_component.ts` goes; the kind rule's message names `web/vm/kinds.ts`. The rule found 16 one-letter names (`web/app/App.tsx` 14, `AssayPage.tsx` 1, `web/reveal/transcript/Row.tsx` 1), renamed, and no raw kind string.

## artifact contract

- Modified: `eslint.config.mjs`, `web/app/App.tsx`, `web/app/AssayPage.tsx`, `web/reveal/transcript/Row.tsx`. `npx eslint web/` 0; `npx tsc --noEmit` 0.

## result

Closed 2026-11-05. Four files: the rule change and the names it found (drift entry).

## Rubber Duck pass

No signals.
