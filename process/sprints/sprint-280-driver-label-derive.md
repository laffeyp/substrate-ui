---
id: 280
status: closed
phase: shell-to-react C6.1
pass_kind: functional
---

# Sprint 280 — a driver's label and the model column as pure functions

## scope

Plan row C6. `web/app/derive/driver_label.ts`: `driverLabel` (a CLI reads "<cli> <family> <pin>" for its pick; anything else its name), `chipLabel` (on a CLI's Auto mode the chip names the CLI only, UI sprint 139), `modelRows` (groups folded at first, drivers one level in, a CLI opening to its families and a family to its pins; each row's pick and toggle as data). Moved from `_resolveDriverLabel` and `_buildDriverOpts`.

## artifact contract

- Created: `web/app/derive/driver_label.ts`, `web/app/__tests__/driver_label.spec.ts`. `npm run test:unit` 0.

## result

Closed 2026-11-05. Spec 5/5.

## Rubber Duck pass

No signals.
