---
id: 242
status: closed
phase: shell-to-react B6.1
pass_kind: functional
---

# Sprint 242 — the top bar loses Studio's button

## scope

Plan round 5, row B6 (F353). Studio's page was inert ("coming soon…", `opacity:.4; pointer-events:none`) and posted to `/api/validate` and `/api/build`, which the server no longer has. The top bar's "studio" button opened it. `TopBar.tsx` drops the button; `top_bar.ts` drops `studioColor` and `openStudio`.

## artifact contract

- Modified: `web/app/TopBar.tsx`, `web/app/state/top_bar.ts` (no `studio`). `npm run build` 0.

## result

Closed 2026-11-05; checked with sprint 245.

## Rubber Duck pass

No signals.
