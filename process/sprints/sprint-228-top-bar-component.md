---
id: 228
status: closed
phase: shell-to-react B3.2
pass_kind: functional
---

# Sprint 228 — the top bar as a React component, with its store

## scope

Plan round 5, row B3. `web/app/TopBar.tsx` draws the one top bar (UI sprint 136) with the template's styles: dot, crumb and its rename input, the driver chip and model card, the workspace chip and card, the escape hint, records, studio and the view button. It carries the template's `data-top-bar`, `data-fake-lights`, `data-crumb`, `data-dropdown-region`, `data-model-chip`, `data-model-card` and `data-model-card-driver`, which the gates, DCLogic's outside-click handler and the Electron rules find it by. `web/app/state/top_bar.ts` holds the fields (flat, so a write that changes nothing notifies no one) and the actions DCLogic registers, since DCLogic owns the panes, the open page and the view until plan group E. The rename input keeps its text in the component; ↵ and Escape call `finishEdit`.

ModelCard and WorkspaceCard, which the plan names as components, are drawn inside `TopBar`: each is one absolutely placed span under its chip, with no state of its own.

## context_files

`web/reveal.html` (top bar), `web/reveal_component.ts` (the bar's render fields, `nameKey`), `web/reveal.ts` (Electron rules); design: `design/received/handoff 5/docs/DESIGN-SPEC -2026-11-04- r6.md` (identical pane headers, one bar).

## artifact contract

- Created: `web/app/state/top_bar.ts` (contains `setTopBarActions`, `topBarActions`; store on `globalThis.__substrateTopBar`), `web/app/TopBar.tsx` (contains `export function TopBar`, `data-model-card-driver`).
- `npm run build` 0.

## result

Closed 2026-11-05. Build 0.

## Rubber Duck pass

No signals. Observations: none. Disposition: none needed.
