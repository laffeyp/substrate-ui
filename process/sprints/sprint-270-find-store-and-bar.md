---
id: 270
status: closed
phase: shell-to-react C3.2
pass_kind: functional
---

# Sprint 270 — find's store and the FindBar component

## scope

Plan row C3. `web/app/state/find.ts` holds whether find is open, its query, its scope (the transcript or meta's stream) and the stream's match count, which DCLogic writes while it builds the stream's rows (until plan row D1). `web/app/FindBar.tsx` draws the bar with the template's styles; its count reads the focused pane's transcript rows, or the stream count, as the template's did. Every pane's bar shows the focused pane's count, as before.

## artifact contract

- Created: `web/app/state/find.ts` (store on `globalThis.__substrateFind`; contains `toggleFind`, `closeFind`, `setFindScope`, `findQuery`), `web/app/FindBar.tsx` (contains `export function FindBar`, `findCount`). `npx tsc --noEmit` 0.

## result

Closed 2026-11-05.

## Rubber Duck pass

No signals.
