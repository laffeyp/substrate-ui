---
id: 219
status: closed
phase: shell-to-react B2.1b
pass_kind: functional
---

# Sprint 219 — first run's rows as a pure function

## scope

Plan round 5, row B2, logic step for first run. `web/app/derive/first_run.ts` builds the driver rows from the roster, the default driver and the CLIs found; `cliAgents` reads the CLIs from the snapshot's "cli agents" driver group (the server's `cli` list, `session_controller.ts` `loadDriverRoster`). The template read `controllerSnapshot.cli`, which no snapshot has, and fell back to `['claude', 'gemini']`; its `detOn = … || true` always added deterministic, which the function does without the test.

## context_files

`web/reveal_component.ts` (`frRows`), `web/vm/session_controller.ts` (`loadDriverRoster`), `server.py` (`/api/models`: `cli`, `cli_versions`).

## artifact contract

- Created: `web/app/derive/first_run.ts` (contains `firstRunRows`, `cliAgents`), `web/app/__tests__/first_run.spec.ts`.
- `npm run test:unit` 0.

## signal contract

Emits: none.

## observation contract

Carried by sprint 226's gate.

## result

Closed 2026-11-05. Spec 5/5.

## Rubber Duck pass

No signals. Observations: none. Disposition: none needed.
