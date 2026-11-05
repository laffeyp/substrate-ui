---
id: 214
status: closed
phase: shell-to-react B1.2
pass_kind: functional
---

# Sprint 214 — the dialogs as a React component, mounted nowhere yet

## scope

Plan round 5, row B1, component step. The settings dialog and the end-session confirm become `web/app/Dialogs.tsx`, reading which dialog is open from a new store, `web/app/state/dialogs.ts`. The styles are the template's (`reveal.html:494–534`), copied as inline style objects. Nothing mounts the component in this sprint; sprint 216 swaps it in.

Two changes from the template, both from finding F351: the export dialog is not carried over (its "export ↵" set a flag and nothing else; no export endpoint exists, and no control opens it), and the end-session confirm names the session it ends in place of the fixed "fix-race-in-metering".

## context_files

- `web/reveal.html` (the dialog block), `web/reveal_component.ts` (the dialog fields, `doEndSession`, the Escape order).
- `web/app/state/settings.ts`, `web/app/store.ts`.
- Design: `design/received/handoff 5/docs/DESIGN-SPEC -2026-11-04- r6.md` (dialogs: confirms are UI, D40h).
- Plan: `process/planning/2026-11-04-shell-to-react/PLAN-2026-11-04-shell-to-react-r5.md`, B1.

## artifact contract

- Created: `web/app/state/dialogs.ts` (contains `openSettings`, `openEndSession`, `closeDialog`, `dialogOpen`; its store on `globalThis.__substrateDialogs`), `web/app/Dialogs.tsx` (contains `export function Dialogs`).
- `npm run build` exits 0, run alone.

## signal contract

Emits: none. The component calls `window.__vm.endSession("user_end")` as `doEndSession` does; `SESSION_END_REQUESTED` fires in the controller, checked when the component is mounted (sprint 216).

## observation contract

None in this sprint: the component is mounted nowhere, so the window is unchanged. Sprint 216 carries the dialogs gate and the pixel captures.

## result

Closed 2026-11-05. Both files written; `npm run build` 0 (tsc, harness tsc, eslint, vite).

## Rubber Duck pass

No signals. Observations: none. Disposition: none needed.
