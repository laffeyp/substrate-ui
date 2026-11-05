---
id: 229
status: closed
phase: shell-to-react B3.2b
pass_kind: functional
---

# Sprint 229 — the top bar's hover rules

## scope

The template's four `style-hover` attributes in the top bar (driver chip, workspace chip, records, studio) become four classes in `web/app/hover.css`, `!important` as dc-runtime drew them; `TopBar.tsx` imports the sheet and sets the classes.

## artifact contract

- Modified: `web/app/hover.css` (contains `.hover-top-bar-model-chip:hover`, `.hover-top-bar-ws-chip:hover`, `.hover-top-bar-records:hover`, `.hover-top-bar-studio:hover`), `web/app/TopBar.tsx`.
- `npm run build` 0.

## result

Closed 2026-11-05. Build 0.

## Rubber Duck pass

No signals. Observations: none.
