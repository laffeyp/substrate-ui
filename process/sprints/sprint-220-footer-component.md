---
id: 220
status: closed
phase: shell-to-react B2.2a
pass_kind: functional
---

# Sprint 220 — the footer component and the chrome store

## scope

`web/app/Footer.tsx` draws the footer with the template's styles from `footerText`; it reads `web/app/state/chrome.ts` (focused pane, unbound, title, page open), which DCLogic writes until the pane grid moves (plan group E), and the focused pane's snapshot from `shell.ts`. The footer carries `data-footer` and its status span `data-footer-status`, so the gate reads it without matching its text. The status span is drawn when empty, as the template drew it, so the gaps do not move.

## context_files

`web/reveal.html` (footer line), `web/app/state/shell.ts`, `web/app/derive/footer.ts`.

## artifact contract

- Created: `web/app/state/chrome.ts` (store on `globalThis.__substrateChrome`), `web/app/Footer.tsx` (contains `export function Footer`).
- `npm run build` 0.

## signal contract

Emits: none.

## observation contract

Carried by sprints 224 and 226.

## result

Closed 2026-11-05. Build 0.

## Rubber Duck pass

No signals. Observations: none. Disposition: none needed.
