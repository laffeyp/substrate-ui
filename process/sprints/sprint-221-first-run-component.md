---
id: 221
status: closed
phase: shell-to-react B2.2b
pass_kind: functional
---

# Sprint 221 — the first-run component and its store

## scope

`web/app/FirstRun.tsx` draws first run with the template's styles; `web/app/state/first_run.ts` holds whether it is done and which driver was picked. A pick sets both and calls `__vm.pickDriver`; DCLogic, which owns the panes, reads `picked` and gives pane 1 the driver, as the template's pick did. Two fixture texts are gone: the top bar's "s-1a04", where no session exists yet, and the workspace "~/Documents/substrate · default · created on bind", which is now "fresh per-session sandbox · default · or pick a folder in the pane", the default the bind uses (`reveal_component.ts`, the `isDefault` branch).

## context_files

`web/reveal.html` (first-run block), `web/reveal_component.ts` (`showFirstRun`, `frRows`), `web/app/derive/first_run.ts`; design: `design/received/handoff 5/docs/DESIGN-SPEC -2026-11-04- r6.md` (first run, turn 19).

## artifact contract

- Created: `web/app/state/first_run.ts` (contains `pickFirstRun`, `firstRunAsked`; store on `globalThis.__substrateFirstRun`), `web/app/FirstRun.tsx`.
- `npm run build` 0.

## signal contract

Emits, through the controller: `DRIVER_PICKED` on a pick.

## observation contract

Carried by sprint 226.

## result

Closed 2026-11-05. Build 0.

## Rubber Duck pass

No signals in this sprint. Observations: none. Disposition: none needed.
