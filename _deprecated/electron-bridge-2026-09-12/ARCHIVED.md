# ARCHIVED — 2026-09-12 Electron/bridge/prototype trees

Moved here 2026-09-24 by Sprint 077 (Phase 9 wrapping).

## What lived here

- `bridge/main.py` + `bridge/vocab.py` — a Python daemon that imported `substrate` in-process and spoke a newline-delimited JSON-RPC protocol on stdin/stdout. The daemon owned its own op vocabulary (`BridgeOp` StrEnum) that had to be kept in sync by hand with the substrate vocabulary already frozen at 30 tags in `signals/0.1.json`.
- `main.js` + `preload.js` — the Electron main and preload that spawned `bridge/main.py`, piped JSON between it and the renderer, and exposed `window.bridge.request(op, payload)` + `window.substrate.onMessage(cb)` on a `contextBridge`.
- `prototype-v7.html` + `support.js` + `build.js` + `index.html` — the 1947-line shell that talked to `window.bridge` and rendered records, tool cards, reveal-view lenses, records and studio surfaces. Predates the reveal-shell extraction.
- `bridge-ops.ts` — the TypeScript mirror of `bridge/vocab.py:BridgeOp`, the hand-maintained typed constant the renderer read from.

## Why it retired

The reveal shell (`web/reveal.html` + `web/reveal/**` + `web/vm/**`) went a different way: an HTTP + SSE surface served by `server.py` (which also imports substrate in-process), a `SessionController` presentation model in `web/vm/session_controller.ts`, and a `BrowserSubstrateClient` that talks to the server over fetch and `EventSource`. Two IO models — stdio JSON-RPC and HTTP+SSE — is one too many, and the reveal shell's shape carries the Phase 8 atom transcript, the pixel and shakeout harnesses, and the 30-tag vocabulary lock the parity gate enforces.

Nothing in the retired path had a route into that architecture: `main.js:100-101` loaded `prototype-v7.html` by `loadFile`, not the reveal shell. Every test through the retired path went through preload + `ipcRenderer`; the reveal shell's harness (Playwright against `127.0.0.1:8765` in real Chrome) does not.

The 2026-09-11 through 2026-09-12 commit window in `electron/`, `app/`, and `bridge/` is the whole history of this direction. It stopped when the reveal-shell branch opened three days later.

## What replaces it

`process/planning/RESEARCH-2026-09-24-electron-integration-v2.md` and `process/planning/PLAN-2026-09-24-phase-9-electron-wrapping-v2.md` document the replacement shape: Electron becomes a Chromium window that spawns `server.py`, waits for it healthy on `127.0.0.1:<port>`, `loadURL`s the reveal shell, owns the native macOS menu bar, and registers `substrate://` as a deep-link handler. Phase 9 Sprints 077–082 stand it up.

## What survives from here

Two patterns the plan explicitly reuses:

- The buffered-pending dispatch pattern at `main.js:51-72` (a `pending = []` list, `rendererReady = true` on `did-finish-load`, flush loop). Sprint 081's deep-link handler reuses it verbatim so a deep-link fired before the renderer is ready gets replayed on load.
- The `detached: true` + `process.kill(-pid, 'SIGTERM')` pattern used by the shakeout at `harness/shakeout/lib/server.ts:22-45`, itself lifted from this era's `startBridge` logic.

Everything else stays here as the audit trail of the direction that was tried and abandoned.

## Do not import from this directory

Nothing in the live tree references `_deprecated/`. The parity gate at `web/vm/tools/check-vocabulary-parity.ts` does not scan here. The build does not read here. This directory is history, not source.
