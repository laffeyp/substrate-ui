---
id: 258
status: closed
phase: shell-to-react C1.1
pass_kind: functional
---

# Sprint 258 — the slash menu, hint and Tab completion as pure functions

## scope

Plan row C1. `web/app/derive/slash.ts`: `slashRows` (the commands the text starts, or a command's choices with their notes and the current one; a pick sends the line or fills the bar), `slashHint` (the one named command's argument part and description, in one column), `tabComplete`. Moved from `reveal_component.ts` (UI sprints 162–166). `web/app/derive/control_notes.ts` takes the choices' one-line notes and the bar's placeholder, which the slash menu and the pane picker both read.

Three files, one over the two-file rule: the notes moved with the functions that read them, and the spec. Recorded on BLACKBOARD.

## artifact contract

- Created: `web/app/derive/slash.ts`, `web/app/derive/control_notes.ts`, `web/app/__tests__/slash.spec.ts`. `npm run test:unit` 0.

## result

Closed 2026-11-05. Spec 4/4.

## Rubber Duck pass

No signals.
