---
id: 321
status: closed
phase: shell-to-react E2.1
pass_kind: functional
---

# Sprint 321 — the panes view's store

## scope

Plan row E2. `web/app/state/panes.ts` holds what the panes view draws: the grid's track lists, the transcript's type size, each pane's id, grid placement, opacity, whether it draws a session or its picker, and its focus action, and the gutters' places with their grab actions. DCLogic owns the panes until App does (E4) and writes the view after each render.

## artifact contract

- Created: `web/app/state/panes.ts`. `npx tsc --noEmit` 0.

## result

Closed 2026-11-05.

## Rubber Duck pass

No signals.
