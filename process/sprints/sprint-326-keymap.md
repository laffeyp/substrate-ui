---
id: 326
status: closed
phase: shell-to-react E3.2
pass_kind: functional
---

# Sprint 326 — `keymap.ts`: the window's keys as a pure function

## scope

`web/app/keymap.ts`: `windowKey(key, context)` gives the action a key takes: the records list's arrows, the focused picker's keys, the language lens's keys (only while it has turns), ⌘M, ⌘E, ⌘D, ⌘⇧D, ⌘F, ⌘, and ⌘3, Escape's order (find, a dialog, a top-bar card, a page, then a running turn's interrupt, ⇧ softly), and Ctrl+C with a caret in a text box. ⌘C is no key here (F336).

## artifact contract

- Created: `web/app/keymap.ts`, `web/app/__tests__/keymap.spec.ts`. `npm run test:unit` 0.

## result

Closed 2026-11-05. Unit 143/143.

## Rubber Duck pass

No signals.
