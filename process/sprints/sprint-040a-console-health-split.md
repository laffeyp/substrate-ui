# Sprint 040a — extract `web/console/health.ts`

```yaml
---
id: 040a
status: closed-2026-08-29
phase: 6
pass_kind: refactor
---
```

## Product-spec conformance

**Fulfills:** The zero-tsc-errors baseline the Architect ratified
2026-08-29 ("no compilation errors are acceptable"). Also
PLAN-2026-08-28-web-app-ts-split.md's splits-6 (health) — landing
BEFORE 038 rather than after, per the ratification.

## Scope

Extract `renderHealth()` and `renderVerdict()` from `web/app.ts` into
`web/console/health.ts`. New module exports `mountHealth(root, deps)`
returning a `HealthHandle` with `.render(snapshot)`. app.ts calls it
from its render() dispatcher. Type-clean at extraction time — every
STATE field the module reads is typed on the snapshot.

Two files: `web/console/health.ts` (new); `web/app.ts` (shrinks by
~50 lines, gains a `mountHealth` import + call).

## Prerequisites

- 035x closed (proves the extraction pattern to a third module).
- ARCH-2 Decisions ratification 2026-08-29 dispatches splits NOW.

## Artifact contract → Files created/modified

- `web/console/health.ts` — new. Exports `mountHealth(root, deps)`,
  `HealthHandle`, `HealthSnapshot`. Zero tsc errors.
- `web/app.ts` — `renderHealth()` + `renderVerdict()` deleted;
  replaced by `_healthHandle.render(snapshot)` at render()'s tail.
- `check:tsc-new` regex extended to include `console/` (already
  matches on the fragment; verify).

## Signal contract → Emits

- `HEALTH_RENDERED{pane_id:"health", frame, visible, subject_record, verdict}`
  — unchanged from the current renderHealth site.

## Observation contract

- `npx tsc --noEmit` reports ZERO errors on `web/console/health.ts`.
- `npx tsc --noEmit` total error count for `web/app.ts` drops by at
  least the health/verdict lines' current contribution.
- Full `npm run signals` chain PASS — health-render tag still fires
  at the expected point per capture_signals.js's assertions.

## Halt conditions

- `dual_contract_fail` if any prior harness's HEALTH_RENDERED
  assertion regresses.

## Definition of done

`web/console/health.ts` exists, tsc-clean. `web/app.ts` no longer
contains `renderHealth` or `renderVerdict`. Full signals green.
