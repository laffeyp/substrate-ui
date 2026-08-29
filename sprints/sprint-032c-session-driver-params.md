# Sprint 032c — SessionManifest.driver_params + PATCH surface

```yaml
---
id: 032c
status: closed
phase: 5
pass_kind: functional
---
```

## Product-spec conformance

**Fulfills:** PRODUCT-SPEC-2026-08-17-round12.md §4 "call parameters
for the driver" (implicit — the agent terminal today exposes `think` /
`tokens` / `timeout` via bare-word setters; the mechanical translation
carries them into session-world). §13 View A "just the agent terminal,
filling the window" — the terminal's params row cannot exist without a
session-side field to write to.

**Enables:** substrate-ui sprint 035v (params drawer + `/set` slash in
`web/terminal.ts`).

## Scope

`OllamaResponder.__init__` (substrate `adapters/models.py:133-165`)
accepts `think`, `max_tokens`, `timeout`, `num_ctx` at construction.
The daemon's `_daemon_driver_resolver(name)` at server.py:141 baked
fixed defaults; `SessionManifest` at session_registry.py:78 had no
field to carry them; `_session_patch` at server.py:2265 had no wire.
This sprint closes those three gaps.

Piece G mechanical-translation fold identified this as the ONE real
substrate-side gap.

**Rule-6 stretch acknowledged:** three code files
(`session_registry.py` + `server.py` + `tests/…`). One concept:
"SessionManifest gains driver_params surface." Precedent: sprint 032b
bundle-PATCH lift.

## Artifact contract → Files created/modified

- `session_registry.py` — `SessionManifest.driver_params` field;
  `set_driver_params(sid, params)` new method; `create` kwarg;
  round-trip through `_manifest_to_dict` / `_manifest_from_dict`.
- `server.py` — `_RESPONDER_CACHE` retyped to `(name, params_tuple)`
  key; `_daemon_driver_resolver(name, params)` extended;
  `_session_create` accepts `driver_params` with rollback on bad
  shape; `_session_patch` lifts `driver_params` into `_PATCHABLE`;
  POST + PATCH response bodies carry it;
  `_build_session_topology_from_manifest` threads it.
- `tests/test_server_session_driver_params.py` — new; 9 test cases.
- `signals/versions/0.7.2.json` + `0.7.2-rationale.md` — new lock
  with `DRIVER_PARAMS_PATCHED{session_id, params, prior_params}`;
  `current.json` symlink repointed.

## Signal contract → Emits

- `DRIVER_PARAMS_PATCHED{session_id, params, prior_params}` — new
  v0.7.2 tag. Not emitted by this sprint (server-side change);
  emitted by sprint 035v.

## Observation contract

- POST `/api/session {driver_params:{...}}` → 200 with echo.
- PATCH `/api/session/<id> {driver_params:{...}}` → 200 with updated.
- PATCH bad key → 400 with `driver_params: unknown keys [...]; allowed: [...]`.
- Tests: 9/9 PASS.
- Live daemon verified: create + PATCH + bad-PATCH round-trips.
- Resolver cache: same driver + different params → distinct instances.
- Regression: `npm run signals` full chain PASS on v0.7.2.

## Halt conditions

- `dual_contract_fail` if response body's `driver_params` diverges
  from manifest state.

## Definition of done

Manifest field persists. PATCH accepts + validates + lands. Resolver
rebuilds Responder with new params. Vocab v0.7.2 locked. Tests 9/9
PASS. Full signals chain PASS. Sprint 035v cleared to dispatch.
