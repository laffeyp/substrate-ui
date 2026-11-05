---
id: 249
status: closed
phase: shell-to-react B5 opener
pass_kind: functional
---

# Sprint 249 — View ▸ Assays

## scope

No control opened the assay page (`openAssay` was bound to nothing). Design D86 gives it ⌘3. `electron/menu.js` adds View ▸ Assays (`menu-toggle-assays`), which sends `toggle-assays`; like Meta and Settings… it carries no accelerator, since the renderer's keydown owns ⌘3 (the menu's one-owner-per-key rule). `electron/preload.js` forwards the channel.

## artifact contract

- Modified: `electron/menu.js` (contains `menu-toggle-assays`), `electron/preload.js` (contains `menu:toggle-assays`).

## result

Closed 2026-11-05; checked by sprint 257's gate.

## Rubber Duck pass

No signals.
