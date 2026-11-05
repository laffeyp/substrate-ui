---
id: 262
status: closed
phase: shell-to-react C1 fix
pass_kind: functional
---

# Sprint 262 — `react-dom` resolves to the window's ReactDOM

## scope

`web/shims/react-dom.ts` re-exports `flushSync` from the window's ReactDOM, as `react-dom-client.ts` does `createRoot`, and `vite.config.ts` aliases `react-dom` to it, after `react-dom/client`. Bundling node_modules' `react-dom` would add a second ReactDOM, whose `flushSync` cannot flush roots the window's copy made.

## artifact contract

- Created: `web/shims/react-dom.ts`. Modified: `vite.config.ts` (alias `react-dom`). `npm run build` 0; the bundle is 116 kB (a second ReactDOM would add about 130 kB).

## result

Closed 2026-11-05.

## Rubber Duck pass

No signals.
