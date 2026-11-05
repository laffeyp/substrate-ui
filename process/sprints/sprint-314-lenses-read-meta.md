---
id: 314
status: closed
phase: shell-to-react D7.2
pass_kind: functional
---

# Sprint 314 — the stream lens and the side graph read the meta store

## scope

`web/app/StreamLens.tsx` reads the selection, level and direction from `web/app/state/meta.ts`; `web/app/SideGraph.tsx` reads the selection there and takes its scroller's ref and scroll handler from the meta view, so the scroll link no longer passes through DCLogic.

## artifact contract

- Modified: `web/app/StreamLens.tsx`, `web/app/SideGraph.tsx`. `npx tsc --noEmit` 0.

## result

Closed 2026-11-05.

## Rubber Duck pass

No signals.
