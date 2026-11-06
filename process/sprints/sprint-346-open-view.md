---
id: 346
status: closed
phase: editor shared work 0(a)
pass_kind: refactor
---

# Sprint 346 — one field for the open view

## scope

Plan `process/planning/2026-11-05-editor-shared-work/PLAN-2026-11-05-editor-shared-work.md`, item 0(a). A refactor: nothing a user sees or does changes. `web/app/derive/open_view.ts` holds the open view (`panes`, `meta`, or a page) and the view a page returns to, with today's transitions one for one: ⌘M and the view button swap panes and meta and close a page; a page's key or button opens it over the base view or closes it; Escape and a session opened from the records page close the page; a split shows panes; `/language` and the design tool's `view` prop show meta. `web/app/App.tsx` holds one `vs` field in place of `revealed` and `surface`. The keys already go to the open view first (the keymap's records, picker and language branches come before the window's keys), so the keymap is unchanged.

## artifact contract

- Created: `web/app/derive/open_view.ts`, `web/app/__tests__/open_view.spec.ts`. Modified: `web/app/App.tsx` (no `revealed:` or `surface:` field). `npm run build` 0; `npm run test:unit` 0.

## observation contract

Every `gates:electron` script run alone exits 0; pixels equal the last capture on a clean tree (20 of 28 equal to `baseline-2026-11-04`, the same 8 logged-fix differences with the same pixel counts).

## result

Closed 2026-11-05. Unit 142; every `gates:electron` script run alone 0 (60 of 60), Axis C bugs 0. Pixels on the clean tree after the commit: see the BLACKBOARD entry.

## Rubber Duck pass

No signals change.
