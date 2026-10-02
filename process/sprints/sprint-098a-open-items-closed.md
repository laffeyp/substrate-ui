---
id: 098a
status: closed (retroactive card, written 2026-10-01 after the work)
class: G (Fowler, "Fix Broken Builds Immediately"); C (Humble & Farley, build once; Apple TN2206); II (Twelve-Factor, explicit dependencies)
---

# Sprint 098a — the open items of 097 and 098, closed

Work done on 2026-10-01 between the Sprint 098 card and Sprint 099, without a card at the time.

## realmodel tier (097 open)

- Loud truncation: `adapters/models.py` sets `num_predict` on every Ollama call (default cap `DEFAULT_MAX_TOKENS = 16384`; Ollama's own default is -1, unlimited, `api/types.go`) and `_content` raises when Ollama reports `done_reason == "length"`. A truncated reply used to pass as a complete one. `topologies/conversation.py` turns cap at `TURN_MAX_TOKENS = 1024`; the coding_flow and code_evolution walkthrough responders at 4,096.
- Loud truncation exposed a wedge: a coding_flow drafter whose model call raised left the run waiting. The drafter now records `Candidate("[model call failed: …]")`; a test drives a failing drafter.
- `test_instrument_ablation_delta`: 900 s timeout → 12 s.
- `test_list_records_read_back_by_model` and the jail test read the first successful result and grade where the file landed.
- `list_records`: 7.84 s → 1.79 s over 4,394 sessions. `record.read_first_envelope` reads and CRC-checks one line instead of whole segments; `_extract_application_name` reads `RunStarted.payload.name`, which `Runtime.run(topology, name=...)` now records (`session`, `build:<name>`, application names).

## coding gate PATH (097 open)

`coding_flow/gate.py` `_gate_env()` puts the running interpreter's scripts directory first on `PATH`, so `mypy` resolves to the venv's copy whether or not the venv is activated; exit 127 reports "gate tool not installed" instead of a type error. The 78 failures without the venv on `PATH` are gone.

## shakeout flows (098 open)

- `cli_version_picker` hung 15 minutes: it fetched the session's record endpoint as a JSON page with a `max_wait_ms` parameter the endpoint does not have, and that endpoint is an SSE stream that never ends. The flow now reads it with `client.streamRecord` and emits the `SESSION_OPEN_REQUESTED` tag its vocabulary declares; runs take 5–8 s. One of 14 runs stalled on a live CLI API call.
- `harness/shakeout/lib/client.ts`: `fetchJson`'s timeout covers the body read, not only the headers (30 s default). `run.ts` takes `SHAKEOUT_FLOWS` to run a subset.
- `cli_discovery`: 0 defects and 12 tags green in both Axis-A runs against the Sprint 099 bundles.

## packaging (F5, F6, F7, F10, bytecode, signing)

- `harness/shakeout/lifecycle_gates.ts` drives the three Sprint 089 fixes no gate had run: F6 close-all-windows then `activate` reopens on the same backend; F7 a backend that cannot start shows the dialog naming the log and leaves no process; F5 a `substrate://record/` deep link attaches and streams. 9/9, source and packaged.
- F10: `scripts/make_icon.py` builds `build/icon.icns` from `../substrate-art/MASCOT-canonical-oref.png` on Apple's 824-px icon grid.
- `fetch-python-runtime.sh` precompiles bytecode (`compileall -b`, unchecked-hash) before zipping the stdlib and site-packages: packaged backend start 0.52 s → 0.15 s. Mach-O files move to `Contents/Frameworks/python-native` (relative symlinks stay in Resources), so `codesign --verify --deep --strict` passes; a launch writes nothing into the bundle (1,537 files, 0 changed).
- Verification builds: `SUBSTRATE_WHEEL=<wheel>` builds the runtime from a local wheel and writes `build/python/VERIFICATION_BUILD`; `release.sh` refuses such a runtime.
- 15 orphan backends from earlier sessions killed; the running `/Applications/Substrate.app` was left alone.

## left for the Architect

Commit both repos; the kernel 1.1.2 PyPI release and the `SUBSTRATE_VERSION` bump that `npm run release` needs; the 147 session dirs in the real `~/.substrate/sessions`.
