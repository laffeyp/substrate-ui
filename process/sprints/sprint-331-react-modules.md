---
id: 331
status: closed
phase: shell-to-react E5
pass_kind: functional
---

# Sprint 331 — React is bundled from node_modules; the UMD copies go (F321)

## scope

Plan row E5. `vite.config.ts` loses `vendorReact` and its table of UMD files; the build emits the page, one stylesheet and one script, which carries React 18.3.1 and ReactDOM 18.3.1 once each, as production builds. The plugin's text is in `_deprecated/dc-runtime/vite-plugins.ts`.

## artifact contract

- Modified: `vite.config.ts` (no `vendor`, no `createHash`), `_deprecated/dc-runtime/vite-plugins.ts`. `npm run build` 0; `web/dist/` holds `reveal.html` and `assets/` only.

## result

Closed 2026-11-05. No harness, Electron or packaging file names `vendor/`.

## Rubber Duck pass

No signals.
