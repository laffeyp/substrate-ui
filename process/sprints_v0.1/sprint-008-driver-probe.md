# Sprint 008 — driver probe

---
id: 008
epic: C — Substrate binding
status: closed
phase: 2
pass_kind: architecture
spec_reference: signals/0.1.json § bridge PROBE_DRIVER_*; Layer 4 (10s bridge timeout — Ollama cold model); D69
prerequisites: 007 closed
---

## scope

Fail-fast pre-create check: before SESSION_CREATE_REQUESTED, probe the chosen driver via `PROBE_DRIVER_REQUESTED` (Ollama `/api/show`, CliResponder version check, deterministic no-op). Probe result gates create. First-run enumeration walks all local drivers via repeated probe.

## signal contract

### Emits

- `PROBE_DRIVER_REQUESTED` (`{request_id, driver_name, driver_params}`) — bridge_request; driver_params secret-stripped per Layer 7
- `PROBE_DRIVER_PROBED` (`{request_id, driver_name, available: true, context_tokens?, model_families?}`) — bridge_reply
- `PROBE_DRIVER_FAILED` (`{request_id, driver_name, reason: "not_installed"|"model_missing"|"http_error"|"timeout"}`) — bridge_reply

### Consumes

None (Sprint 007's SESSION_CREATE_REQUESTED now gated on PROBE_DRIVER_PROBED).

## artifact contract

### Files

- `bridge/main.py` — op `probe_driver`; dispatches to DriverResolver's probe method; RESPONDER_CACHE keyed by `(name, params)`
- `bridge/drivers.py` — DriverResolver + probe implementations (Deterministic no-op; OllamaResponder `/api/show`; CliResponder `--version`)
- `src/observability/BridgeClient.ts` — probe_driver correlation
- `tests/harness/e2e_probe_driver.js`

### Content assertions

- driver_params secret-stripping via key regex `/key|token|secret|password/i` at any depth
- 10s timeout on probe (Layer 4)

### Command exit codes

- `node tests/harness/e2e_probe_driver.js` returns 0

## observation contract

### Driving steps

1. Attempt create with `deterministic`; assert PROBE succeeds
2. Attempt create with `ollama:missing-model`; assert PROBE_DRIVER_FAILED{reason:"model_missing"}
3. Assert failed probe blocks SESSION_CREATE_REQUESTED

### Three-channel agreement

- Structural: failure surfaces as error banner in the unbound picker
- Perceptual: pane status anchor stays byte 0 (unbound) on probe failure
- Log ↔ signal: bridge.log carries `[bridge] probe_driver driver=<n> available=<bool>`; JSONL carries the pair

## done criteria

Probe gates create; failures typed; secret-stripping verified. Sprint 009 (resume attach) dispatches next.
