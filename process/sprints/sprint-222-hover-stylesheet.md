---
id: 222
status: closed
phase: shell-to-react B2.2c
pass_kind: functional
---

# Sprint 222 — the hover stylesheet

## scope

The plan moves the template's `style-hover` attributes to `web/app/hover.css`, one class per element. dc-runtime draws each as a generated `:hover` rule with every declaration `!important` (`support.js`, `createPseudoSheet`); the stylesheet does the same, so the rule beats the inline background. First run's driver row is the first: `.hover-first-run-row`. `FirstRun.tsx` imports the sheet; Vite emits it and links it from the page.

## artifact contract

- Created: `web/app/hover.css` (contains `.hover-first-run-row:hover`). Modified: `web/app/FirstRun.tsx` (imports `./hover.css`; the row has `className="hover-first-run-row"`).
- `npm run build` 0; the built page links one stylesheet, which holds the rule.

## result

Closed 2026-11-05. Build 0; `web/dist/assets/reveal-*.css` reads `.hover-first-run-row:hover{background:#2e3138!important}`, linked once from `web/dist/reveal.html`.

## Rubber Duck pass

No signals. Observations: none. Disposition: none needed.
