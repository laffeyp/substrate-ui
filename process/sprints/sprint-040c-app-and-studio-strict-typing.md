# Sprint 040c — app.ts + studio.ts → tsc-clean; typecheck in signals gate

```yaml
---
id: 040c
status: closed-2026-08-29
phase: 6
pass_kind: refactor
---
```

## Ratification

Architect 2026-08-29: "you understand, baseline, no compilation errors
are acceptable?" — yes. Zero tsc errors is the standing baseline.
This sprint closes the corpus (472 errors down to 0) and lands the
gate so regressions fail fast.

## What landed

- **`web/state.ts` widened.** New exports `RunEvent`, `RunSummary`,
  `RunGraph`, `RunGraphInstance` — the shapes the UI actually reads.
  `AppState.events` / `graph` / `summary` moved from `unknown` to
  these typed shapes. `[k: string]: unknown` on `RunGraph` +
  `RunGraphInstance` preserves the F-API-6 boundary (UI never mirrors
  substrate's full schema; typed fields are those the UI reads).
  `_EMPTY_SUMMARY` + `_EMPTY_GRAPH` used at `createAppState` so
  boot-state has the right shape, not `null`.

- **`web/app.ts` typed.** `$` retyped as generic asserting-non-null
  (`<T extends HTMLElement>(id) → T`). Every `$("id")` call site
  that reads `.value` / `.max` / `.selectedIndex` gets the specific
  subtype via `$<HTMLInputElement>("seq")` / `$<HTMLSelectElement>`.
  `api()` gained explicit `(p: string): Promise<any>` + typed error
  handling. Function signatures across `category`, `shortKind`,
  `gist`, `relT`, `selectRecord`, `selectAssay`, `renderDiff`,
  `followLive`, `inspectEvent`, `inspectProducer`, `_switchView`,
  `openDelegateChild`, `_delegateChildRoot`, `gistPayload`,
  `findGrids`, `_fmtD`, `_pct`, `_pctD`, `_kfmt`, `_term`,
  `isGrid` all got typed params. `renderVerdict`'s
  `_setVariant` preserved (from 037b). Cast sites: `document
  .querySelectorAll<HTMLElement>` for callbacks that access
  `dataset` / `onclick` / `style`. Local narrowings with `!` where
  the surrounding filter already gated (`fired_seq!`, `started_seq!`).
  `_healthHandle` + `_transportHandle` declared with typed handles
  from `console/health.js` + `console/transport.js`.
  Error count in app.ts: 289 → 0.

- **`web/studio.ts` typed.** Same-shape pass. `$` widened to
  asserting-any (documented deviation): studio.ts is a leaf module,
  not imported anywhere else, so widening its DOM helper
  buys tsc-cleanness without the per-call typing overhead that
  app.ts got. Function signatures typed. `CANVAS_POS` widened from
  `{}` to `Record<string, {x, y}>`. Cast sites where needed.
  Error count in studio.ts: 156 → 0.

- **`check:tsc-new` widened + `typecheck` added to the signals
  gate.** New pattern includes `console/` alongside the existing
  whitelist (health.ts + transport.ts land under it). A full
  `typecheck` script (`tsc --noEmit`) now runs BEFORE any capture
  in `npm run signals`. Any regression fails the chain at the
  gate before minutes of browser runs.

## Card-vs-close deviations

- **`web/studio.ts` traded strict-typing for asserting-any at `$`.**
  A proper strict pass on studio's canvas + form surfaces is
  separate work — a future sprint 040d if the studio surface
  regains attention. Recorded here rather than pretending it's
  strict.

- **The five console/*.ts split sprints in the plan (inspector,
  stream, graph, launch, diff) are NOT dispatched.** The
  in-place typing pass ended the corpus at zero without the full
  extraction. Splits stay queued as pure hygiene — the tsc-error
  motivation is gone; the value now is per-module boundaries +
  clean per-file testability. Ratified in Decisions.

## Observation contract — what passed

- `npx tsc --noEmit` returns 0 errors across the whole repo.
- `npm run typecheck` exit 0.
- `npm run signals` PASS across seventeen JS fixtures + 10 pytest
  parity cases + 1 session grader.
- Grep for `error TS` in the current tree: not found.

## Definition of done — satisfied

Zero tsc errors baseline achieved. Typecheck wired into the signals
gate. Every fixture green. Regression on any file will fail the gate
at the pre-capture stage (~5s cost) rather than after minutes of
browser runs.
