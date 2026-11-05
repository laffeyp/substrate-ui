---
id: 213
status: closed
phase: shell-to-react A7b follow-up
pass_kind: functional
---

# Sprint 213 — one settings store per window

## scope

Sprint 212 found that a store in `web/app/state/` read by both bundles must keep one instance on the window. `web/app/state/settings.ts` is read only by the component today, but B1 moves the settings dialog into a React component in the Vite bundle while `DCLogic` still reads the type size. It keeps its store on the window (`globalThis.__substrateSettings`), as `shell.ts` does. Nothing else changes.

## artifact contract

- Modified: `web/app/state/settings.ts`.
- `npm run build` 0, run alone; `npm run test:unit` 0.

## observation contract

`npx tsx harness/shakeout/dialogs.ts` exits 0 (size 13 → 14px, kept across a reload); pixel captures equal to the baseline.

## result

Closed 2026-11-05. `settings` is created once per window on `globalThis.__substrateSettings`. `npm run build` 0, run alone; `npm run test:unit` 0; `dialogs.ts` exit 0 ("settings 13px → 14px, Escape closes; after reload 14px"); pixel capture `sprint-213-check` 28 of 28, 0 pixels.

## Rubber Duck pass

No signals. Observations: none. Disposition: none needed.
