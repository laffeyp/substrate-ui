---
id: 250
status: closed
phase: shell-to-react B5 opener
pass_kind: functional
---

# Sprint 250 — the boot script forwards toggle-assays

## scope

`web/app/state/shell.ts`'s `ShellCommand` gains `toggle-assays`; `web/reveal.ts` forwards it from the menu to the shell channel, as it does `toggle-meta`.

## artifact contract

- Modified: `web/app/state/shell.ts`, `web/reveal.ts`. `npm run build` 0.

## result

Closed 2026-11-05.

## Rubber Duck pass

No signals.
