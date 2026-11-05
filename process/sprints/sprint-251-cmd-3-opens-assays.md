---
id: 251
status: closed
phase: shell-to-react B5 opener
pass_kind: functional
---

# Sprint 251 — ⌘3 and the menu command open the assays page

## scope

`reveal_component.ts`'s keydown toggles the assays page on ⌘3 (no other modifier), so the same key returns to the panes (D86); its command handler does the same for `toggle-assays`. Escape closes it, as it closes any page.

## artifact contract

- Modified: `web/reveal_component.ts` (contains `e.key === '3'` and `toggle-assays`). `npm run build` 0.

## result

Closed 2026-11-05; checked by sprint 257's gate.

## Rubber Duck pass

No signals.
