---
id: 301
status: closed
phase: shell-to-react D4.2
pass_kind: functional
---

# Sprint 301 — `StructureLens`, its stylesheet and its store field

## scope

`web/app/StructureLens.tsx` draws the seven sections from `structureView`, with the template's styles and hooks (`data-topo-*`, `.st-h`). `web/app/structure.css` holds the `.st` container query, moved from the template's helmet: rows stack when the lens's own container is under 530px, so the rule holds in any column the lens sits in (D81). `web/app/state/stream.ts` gains the focused session's `topology`.

## artifact contract

- Created: `web/app/StructureLens.tsx`, `web/app/structure.css`. Modified: `web/app/state/stream.ts`. `npm run build` 0.

## result

Closed 2026-11-05. Three files: the stylesheet travels with the component that uses its classes (drift entry).

## Rubber Duck pass

No signals.
