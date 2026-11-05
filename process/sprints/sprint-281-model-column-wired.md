---
id: 281
status: closed
phase: shell-to-react C6.2
pass_kind: functional
---

# Sprint 281 — DCLogic's model column uses the pure functions

## scope

`_resolveDriverLabel` calls `driverLabel`; `_buildDriverOpts` maps `modelRows` to its item shape and carries out each row's pick (the pane's driver, `pickDriver`, `pickDriverVersion`) and toggle (a group, a CLI, a family); the top bar's chip label calls `chipLabel`.

## artifact contract

- Modified: `web/reveal_component.ts` (contains `modelRows(`, `driverLabel(`, `chipLabel(`). `npm run build` 0.

## observation contract

`model_down_drills`, `left_folds_parent`, `no_default_model`, `model_half_starts_session`, `model_chip_indicator`, `driver_chip_on_resume`, `cli_version_picker`, `length_tone_rows` exit 0.

## result

Closed 2026-11-05. All eight 0.

## Rubber Duck pass

`DRIVER_PICKED` and `DRIVER_VERSION_PICKED` in the gates' picks as before.
