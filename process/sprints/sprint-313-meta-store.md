---
id: 313
status: closed
phase: shell-to-react D7.1
pass_kind: functional
---

# Sprint 313 — the meta view's state in a store

## scope

Plan row D7. `web/app/state/meta.ts` holds the lens on show, the stream's direction and level, the selected seq and the split, moved from DCLogic's state (`mode`, `dir`, `level`, `sel`, `revealL`). `setMode` resets the direction to down on leaving the stream, as the lens chips did; `pickSeq` toggles, `selectSeq` sets; `splitAfterDrag` is the gutter's rule (the weight moves by the drag's share of the window, a window under 300px counting as 300, held to 0.5–3).

## artifact contract

- Created: `web/app/state/meta.ts`, `web/app/__tests__/meta.spec.ts`. `npm run test:unit` 0.

## result

Closed 2026-11-05. Unit 135/135.

## Rubber Duck pass

No signals.
