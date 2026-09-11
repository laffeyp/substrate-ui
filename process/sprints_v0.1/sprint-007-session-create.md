# Sprint 007 — session create round-trip

---
id: 007
epic: C — Substrate binding
status: closed
phase: 2
pass_kind: architecture
spec_reference: signals/0.1.json § bridge SESSION_CREATE_*; PANE_UNBOUND_BOUND; substrate/session_registry.py SessionManifest 96-149; Layer 4 5s bridge timeout
prerequisites: 006 closed
---

## scope

WORKSPACE_PICKER_COMMITTED triggers a bridge round-trip. The bridge op `session_create` calls `SessionRegistry.create(workspace, workspace_shape, driver="deterministic", …)` and returns the manifest. On ack the pane binds to `session_id`, status flips to "parked (fresh)", and PANE_UNBOUND_BOUND fires. Bridge timeout 5s; failure surfaces as SESSION_CREATE_FAILED with a typed reason.

## signal contract

### Emits

- `SESSION_CREATE_REQUESTED` (`{request_id, pane_id, session_id, name, driver, workspace_path, workspace_shape, bundle, seed}`) — nine fields per Layer 2 schema; `session_id` minted shell-side before the ask (Layer 0 review); `seed` is `""` per session_registry.py:421-431 deprecation (Layer 7 constraint)
- `SESSION_CREATED` (`{request_id, session_id, session_name, manifest_path}`) — bridge_reply
- `SESSION_CREATE_FAILED` (`{request_id, reason: "workspace_invalid"|"name_collision"|"registry_error"|"timeout"}`) — bridge_reply
- `WORKSPACE_BOUND` (`{pane_id, session_id, workspace_path, workspace_shape}`) — fires same-step as SESSION_CREATED
- `PANE_UNBOUND_BOUND` (`{pane_id, session_id}`) — Layer 5 pairing

### Consumes

- `WORKSPACE_PICKER_COMMITTED` (from Sprint 006)

## artifact contract

### Files

- `bridge/main.py` — op `session_create`; wraps SessionRegistry.create; 5s timeout via `concurrent.futures.Future.result(timeout=5)`
- `src/observability/BridgeClient.ts` — request_id minting (uuid4 12-char), REQUESTED/ACKED/FAILED correlation
- `src/reducer/ShellReducer.ts` — CREATE_SESSION action; binding transition
- `src/state/ShellState.ts` — `Pane.boundSessionId: string|null`; `Pane.status: "unbound"|"parked"|"running"|"interrupted"|"ended"`
- `tests/harness/e2e_session_create.js`

### Content assertions

- `SessionRegistry.create` signature verified against `substrate/src/substrate/session_registry.py`
- Layer 4 invariant: BRIDGE reply within 5s asserted in the bridge
- Nine-field payload validates against Layer 2 SESSION_CREATE_REQUESTED schema (harness runs Ajv against the emitted JSON before comparing)
- `seed` field emitted as `""` (session_registry.py:421-431 deprecates non-empty seed)

### Command exit codes

- `node tests/harness/e2e_session_create.js` returns 0

## observation contract

### Driving steps

1. Commit workspace picker
2. Assert SESSION_CREATE_REQUESTED emits with request_id
3. Assert SESSION_CREATED arrives within 5s with same request_id
4. Assert PANE_UNBOUND_BOUND fires same-step as SESSION_CREATED
5. Assert pane status ring flips to "parked"

### Three-channel agreement

- Structural: pane's `[data-testid="pane-status"]` reads "parked" post-bind
- Perceptual: `anchor-pane-<id>-status` byte flips 0 → 64 (parked encoding per Layer 7)
- Log ↔ signal: sequence REQUESTED → CREATED → PANE_UNBOUND_BOUND correlated by request_id → session_id in bridge.log line `[bridge] session_create session_id=<id>`

## done criteria

Fresh sessions create end-to-end; the pane binds and shows parked status. Sprint 008 (driver probe) dispatches next.
