# PLAN — decompose `web/app.ts` (piece-G follow-on)

**Author:** Claude session 2026-08-28.
**Trigger:** REVIEW-2026-08-28-piece-g-full ARCH-1.
**Dispatch:** AFTER piece G closes (sprint 038). Every open piece-G
sprint touches `web/app.ts`; splitting mid-piece-G would spawn merge
conflicts against 034b (rail), 036a-e (session-header mounts), 037c
(legacy dock removal). Landing the split after 037c gives a smaller
surface to split.

## Problem

`web/app.ts` at review open is 1,285 lines, ~40 functions, one 23-field
module-level `STATE` object (typed after ARCH-2 via `web/state.ts`),
one `render()` function dispatching to eight `renderX` helpers. Every
downstream sprint adds mount code, event handlers, and glue at the
seams where the console features live. That growth is the friction the
substrate-side hygiene-splits plan addresses on the daemon side; this
plan does the same on the browser side.

## Target shape

Move each console feature to its own file under `web/console/`. Each
export follows the `mountX(root: HTMLElement, opts?)` shape
`terminal.ts` established (ARCH-5, ARCH-3). `app.ts` shrinks to a
bootstrap file: import each mount, resolve its root element, call once.

```
web/
  app.ts                     boot: import + mount + STATE wire (target ≤200 lines)
  state.ts                   AppState + createAppState (landed 2026-08-28)
  view-ids.ts                closed set + ViewId (landed 2026-08-28)
  observability.ts           installObservabilitySurface (landed 2026-08-28)
  terminal.ts                mountTerminal (landed 2026-08-28)
  console/
    rail.ts                  mountRail (sprint 034b lands this — first split)
    graph.ts                 mountGraph (run-as-graph + structure toggle)
    stream.ts                mountStream (event stream)
    inspector.ts             mountInspector (provenance panel)
    transport.ts             mountTransport (cursor + play + speed)
    health.ts                mountHealth (verdict + health-bar)
    launch.ts                mountLaunchBar (topology launcher)
    diff.ts                  mountDiff (record vs record diff)
  controls/
    driver_picker.ts         mountDriverPicker (sprint 036a)
    bundle_picker.ts         mountBundlePicker (sprint 036b)
    workspace_picker.ts      mountWorkspacePicker (sprint 036c)
    tools_drawer.ts          mountToolsDrawer (sprint 036d)
    isolate_toggle.ts        mountIsolateToggle (sprint 036e)
```

## Sprint chain

Eight extraction sprints, one per concept, ≤2 files each, one
`web/console/<name>.ts` extracted + `web/app.ts` shrunk to import.
Each closes on `npm run e2e` green (regression gate — the observation
contract is that the console behaves identically after the split).

- **splits-1** — rail (034b landed this early as part of piece G; the
  precedent is the shape every split follows).
- **splits-2** — graph.
- **splits-3** — stream.
- **splits-4** — inspector.
- **splits-5** — transport (cursor + play + speed + toStart/toEnd).
- **splits-6** — health.
- **splits-7** — launch (launchbar + topology dispatch).
- **splits-8** — diff.

Sequence: bottom-up by dependency. Health + transport read STATE and
call render(); no downstream deps. Rail + graph + stream + inspector
depend on each other via record load — extract stream last inside that
cluster to preserve the load-then-render order. Launch + diff are
independent.

## Observation contract per sprint

- Existing `npm run e2e` (console fixture) passes before and after —
  every UI-driving assertion still lands.
- `npm run signals` (full chain — parity + capture + grade for
  console, studio, view-toggle, terminal-session) passes.
- `npx tsc --noEmit` error count does not grow. New file(s) at ≤5 tsc
  errors each (the `check:tsc-new` gate).
- No functional signal-tag additions per split (the extraction is
  behavior-preserving); if a split surfaces a gap the split needs
  its own follow-on sprint, not a scope creep.

## Rollout risk

Low. `terminal.ts` (325 lines) landed as a fresh module in one commit
without breaking the console fixture; the extraction pattern is
proven. The failure mode to watch: `render()` currently mutates STATE
in ways splits may not preserve. Read each extraction against the
current `render()` control flow before landing.

## Wall-clock estimate

Eight sprints × ~1 hour each once the discipline is in gear. One
work-day end-to-end if serial; less with parallel dispatch after the
first split proves the shape.

## Landing decision

Dispatch after sprint 038 (piece-G review fold) closes. Extract the
plan as sprint cards under `sprints/sprint-04Xa..h-web-app-ts-split-*.md`
once the piece-G fold pass names any additional surfaces the split
should account for.
