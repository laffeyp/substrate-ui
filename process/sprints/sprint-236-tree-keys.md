---
id: 236
status: closed
phase: shell-to-react B4.1b
pass_kind: functional
---

# Sprint 236 — the workspace tree's keys as a pure function

## scope

`web/app/derive/tree_key.ts` returns the step a key takes in the workspace tree (move, toggle, fold, pick) for the records page; `reveal_component.ts`'s `_treeKey` stays for the picker's workspace column until plan row C4 moves it.

## artifact contract

- Created: `web/app/derive/tree_key.ts` (contains `export function treeKey`), `web/app/__tests__/tree_key.spec.ts`.
- `npm run test:unit` 0.

## result

Closed 2026-11-05. Spec 3/3.

## Rubber Duck pass

No signals.
