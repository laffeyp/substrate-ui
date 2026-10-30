# Phase 9 — Electron wrapping
## Ship the reveal shell as a macOS .app that launches, spawns its own substrate server, and owns its own menu bar

| Field | Value |
| --- | --- |
| Opened | 2026-09-24 |
| Status | Drafted, awaiting Architect ratification |
| Owner | Agent (Peter Architect) |
| Preceded by | `PLAN-2026-09-23-phase-8-transcript-atom-migration.md` (Phase 8, closed 2026-09-24) |
| Ratified rulings | `RESEARCH-2026-09-24-electron-integration-v2.md` §6 |
| Runs under | Electron 33/34 (Chromium 130/132) on macOS arm64 primary; renderer identical across platforms |
| Affects | `electron/`, `app/`, `bridge/`, `src/observability/`, `server.py` (port CLI), `package.json`, `harness/`, `_deprecated/` |
| Does not affect | `substrate/*`, `web/vm/signals/versions/0.1.json` (locked at 30 tags), `web/reveal.html`, `web/reveal/**`, the SessionController public API, or the HTTP + SSE surface of `server.py` |

---

## 1. Shape

Electron becomes a Chromium window that boots `server.py` as a subprocess, waits for it healthy on `127.0.0.1:<port>`, `loadURL`s the reveal shell, owns the native macOS menu bar, and registers `substrate://` as a deep-link handler. The renderer is the same code that runs in a Chrome tab today. The preload is small and exposes one namespace (`window.native`) for OS integration that the browser cannot give.

The old paths — `bridge/main.py`, `bridge/vocab.py`, `app/prototype-v7.html`, `app/build.js`, `app/support.js`, `app/index.html`, `src/observability/bridge-ops.ts` — move to `_deprecated/electron-bridge-2026-09-12/` per hard rule 12. Nothing gets deleted. The retired stdio JSON-RPC vocabulary and the 2026-09-12 prototype shell remain on disk as the audit trail of the direction that was tried and abandoned.

The wrapping produces a dev-runnable .app on a developer's machine (`electron .` from the repo root, or `npm run electron`). It does not ship a bundled Python interpreter — the developer's `uv` + `substrate` install is what the main process spawns. The bundled-interpreter path opens a separate Phase 10 (Distribution) when there is a v1 worth shipping externally.

Auto-update, Windows/Linux packaging, and multi-window all sit outside Phase 9 by construction — each is its own epic.

---

## 2. Constraints

### 2.1 Security (hard gate)

`webPreferences` on every `BrowserWindow`: `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, `webSecurity: true`, `preload: path.join(__dirname, 'preload.js')`. No exceptions. The Electron 44 security guide names disabling any of these as an anti-pattern. `contextBridge.exposeInMainWorld` is the only way `window.native` reaches the renderer; the preload never passes raw `ipcRenderer` or event objects to page code.

### 2.2 Vocabulary lock (hard gate)

`signals/0.1.json` unchanged. Every runtime signal that fires today still fires. No new tags, no retirements. The wrapping introduces no substrate-side changes.

### 2.3 The reveal shell is untouched (hard gate)

`web/reveal.html`, `web/reveal/**`, `web/vm/**` — no code changes. The renderer's only contract with the wrapping is: it loads at some URL over HTTP+SSE and can optionally read `window.native` if present.

### 2.4 Runtime dependencies

Adds `electron` (pinned) and `@electron-forge/*` to `package.json` devDependencies. Adds `@electron/osx-sign` and `@electron/notarize` for Phase 10 but the wrapping sprint itself does not sign — a dev build is unsigned. No new runtime dep in the renderer.

---

## 3. Sprints

Each sprint is a single-commit unit. Each closes with the six-gate observation contract (§5) green.

### Sprint 077 — retire the 2026-09-12 Electron/bridge trees

**Deliverables.**
- `_deprecated/electron-bridge-2026-09-12/` created; moves under it: `bridge/`, `app/prototype-v7.html`, `app/build.js`, `app/support.js`, `app/index.html`, `src/observability/bridge-ops.ts`, and `electron/main.js` + `electron/preload.js` (the current 2026-09-12 versions).
- `_deprecated/electron-bridge-2026-09-12/ARCHIVED.md` — short note: what was retired, why (superseded by the reveal shell over HTTP), commit that retired it, pointer to `RESEARCH-2026-09-24-electron-integration-v2.md`.
- `electron/` and `app/` re-created empty (kept as placeholders for the Sprint 078 rewrite).
- `package.json` cleaned of any `main:` entry pointing at the retired path.

**Exit.** `git status` clean after commit. `find _deprecated/electron-bridge-2026-09-12/ -type f | wc -l` matches the list above. `npm run build`, `typecheck`, `lint` green. No renderer change; reveal shell in Chrome unchanged.

### Sprint 078 — spawn-and-load skeleton

**Deliverables.**
- `electron/main.js` — new. `app.whenReady` → `spawn('uv', ['run', 'python', 'server.py'], { cwd: <substrate>, stdio })`, poll `http://127.0.0.1:8765/` until 200 or 15s timeout, `createWindow` with `titleBarStyle: 'hiddenInset'`, `trafficLightPosition: { x: 12, y: 16 }`, `backgroundColor: '#212327'`, `loadURL('http://127.0.0.1:8765/?atom-transcript=1')`. On `window-all-closed`, kill the subprocess before quit. On subprocess exit while the window is open, `webContents.send('server:dead')`.
- `electron/preload.js` — new. Tiny placeholder that exposes `window.native = { platform, isElectron: true }`. No IPC yet.
- `package.json` — adds `electron` (pinned to a stable major matching Chromium 130/132), adds `"main": "electron/main.js"`, adds `"electron"` script `"electron ."`.
- `README.md` (or short section) — how to run: `npm install`, `npm run electron` (assumes `uv` and `substrate` on PATH).

**Exit.** `npm run electron` launches a window that shows the reveal shell at DPR 2. `titleBarStyle` inset is visible; traffic lights sit at the design's inset offset. Killing the window kills the subprocess (no orphan `python server.py`). All static gates green.

### Sprint 079 — dynamic port

**Deliverables.**
- `server.py` — accepts `--port N`, defaults to 8765. When `--port 0`, bind to an ephemeral port and print the chosen port as the first stdout line in a stable format (`substrate-ui port=<n>`).
- `electron/main.js` — spawns with `--port 0`, reads the first stdout line, extracts the port, uses it for both the health-check poll and the `loadURL`.
- The Playwright harness continues to pin 8765 for its own server (unchanged).

**Exit.** Two `npm run electron` invocations on the same machine open two independent windows against two independent servers on two ephemeral ports without collision. Shakeout still passes on 8765 (its own `ServerHandle` is unchanged). Static gates green.

### Sprint 080 — native menu bar + window.native menu events

**Deliverables.**
- `electron/menu.js` — `Menu.buildFromTemplate` with File (New Session · Open Record… · Recent Records · Close Window), Edit (Undo/Redo/Cut/Copy/Paste), View (Toggle Reveal · Zoom In · Zoom Out · Reload), Window (Minimize · Zoom · Bring All to Front), Help.
- `electron/main.js` — `Menu.setApplicationMenu(...)`; each menu item's `click` dispatches `webContents.send('menu:<command>', payload)`.
- `electron/preload.js` — expose `window.native.onMenuCommand(cb)` that subscribes; returns an `off()` unsubscriber. `contextBridge` wraps `ipcRenderer.on` per the security doc's approved pattern; the callback receives the payload only, never the event.
- `web/reveal.ts` — small addition: if `window.native?.onMenuCommand` exists, wire the commands to their real handlers (New Session → registry.spawn + focus; Toggle Reveal → the same code path Ctrl+` triggers today; etc). Non-Electron browsers see `undefined` and do nothing new.

**Exit.** Every menu item fires the expected effect in the shell. The renderer runs identically in a plain Chrome tab (menu items simply don't exist there). Static gates green.

### Sprint 081 — deep-link protocol handler

**Deliverables.**
- `electron/main.js` — `app.setAsDefaultProtocolClient('substrate')`; handle `open-url` (macOS) and `second-instance` (Windows/Linux) to extract the URL and push it to the renderer as `webContents.send('deep-link', url)`. Route while the window is opening (queue then flush on `did-finish-load`, same buffered pattern the old main.js used at line 49).
- `electron/preload.js` — expose `window.native.onDeepLink(cb)`.
- `web/reveal.ts` — small addition: on deep-link `substrate://record/<id>`, call `controller.attachRecordRoot(id)` on the focused pane (the same code path the descend affordance triggers).
- macOS Info.plist entry via electron-forge config for the protocol declaration.

**Exit.** From a terminal, `open substrate://record/<real-id>` opens the app (or focuses it if running) and attaches the focused pane to that record. If the app is not running, the deep-link fires after `did-finish-load`. Static gates green.

### Sprint 082 — Electron smoke harness

**Deliverables.**
- `harness/electron_smoke.ts` — Playwright `_electron.launch({ args: ['.'] })`, wait for window, assert reveal shell mounts (`[data-vm-transcript-mount]` present), drive one deterministic turn through `window.__vm`, assert `snapshot().parkReason` non-null, close.
- `harness/electron_menu_test.ts` — same launch, trigger a menu command via `webContents.executeJavaScript` or via `_electron` API, assert the renderer received the `menu:<command>` event and acted on it.
- `harness/electron_deeplink_test.ts` — same launch, invoke `app.emit('open-url', 'substrate://record/<id>')` from the main process, assert the renderer received the `deep-link` event.
- `package.json` — `"electron:smoke"` script wraps the three.

**Exit.** `npm run electron:smoke` returns 0 across 5/5 runs each. The three tests join the shakeout registry (`harness/shakeout/run.ts`) under a new `AXIS_C` (Electron-only) that runs only when `SHAKEOUT_AXIS` includes `C`. Static gates green.

---

## 4. Signal preservation

The wrapping introduces zero new signals. Every emit site in the controller and the shell fires unchanged. `signals/0.1.json` is untouched. The parity gate at `web/vm/tools/check-vocabulary-parity.ts` continues to pass at 30/30. `_deprecated/electron-bridge-2026-09-12/` is out of the parity gate's scan tree (it already scans only `web/vm/`, `web/reveal.ts`, `web/reveal_component.ts`).

---

## 5. Observation contract

Every sprint above closes only when all six gates return zero:

1. `npm run typecheck` — TypeScript strict, zero errors.
2. `npm run lint` — ESLint, zero errors.
3. `npm run test:unit` — 14/14.
4. `npx tsx web/vm/tools/check-vocabulary-parity.ts` — 30/30.
5. `npm run smoke:vm` — 11/11.
6. Sprint-specific behavior gate: Sprint 077 the `git status` + file-inventory assertion; Sprint 078 the "launch → reveal shell mounts" smoke; Sprint 079 the "two windows two ports no collision" test; Sprint 080 the "every menu item fires" test; Sprint 081 the "deep-link routes correctly" test; Sprint 082 the three Electron flows at 5/5.

Sprint 082 also adds a shakeout requirement: the full shakeout (30 flows × 5 runs from Phase 8) plus AXIS_C stays green.

---

## 6. Risk register

| # | Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- | --- |
| R1 | `uv` or `substrate` missing on the developer's machine at Sprint 078 launch | High | Medium | The health-check poll times out; main.js surfaces a first-run banner naming the missing dependency and the exact install command. Docs in `README.md` name the prerequisites explicitly. |
| R2 | Subprocess orphan on abrupt Electron exit | Medium | Medium | `app.on('window-all-closed')` and `app.on('before-quit')` both kill the subprocess. Use process-group signalling (negative pid) so the substrate `uv run` wrapper takes its child down too, matching the pattern the shakeout harness's `ServerHandle` already uses. |
| R3 | Dynamic port readback race — Electron `loadURL`s before the server binds | Medium | High | The health-check loop polls; `loadURL` only after 200. Sprint 079 flow includes a stress test that spawns and kills 20 times in a row. |
| R4 | The Playwright Electron launcher (`_electron.launch`) does not play nice with an app that itself spawns a subprocess | Medium | High | Sprint 082 verifies this early. Fallback: mock the subprocess by setting an env var (`SUBSTRATE_UI_SKIP_SPAWN=1`) and running the shell against an externally started server; Electron smoke covers the wrapper's OS integrations, HTTP smoke covers the substrate handshake. |
| R5 | `titleBarStyle: 'hiddenInset'` + `trafficLightPosition` misalign against the reveal shell's header chip row | Low | Low | Sprint 078 exit criterion includes a screenshot check: header chip row (from Phase 8's `pane_header_clip` flow) still passes with top edges aligned. |
| R6 | Deep-link handler fires before the renderer is ready | Medium | Low | Same buffered pattern the 2026-09-12 main.js used (`pending: []`, flush on `did-finish-load`). Sprint 081 covers the cold-launch → deep-link → renderer-ready path in its exit test. |
| R7 | `window.native` present in Electron, absent in plain browser; renderer code branches proliferate | Medium | Low | The renderer touches `window.native` in exactly two files (Sprints 080 and 081) — a menu wire-up and a deep-link wire-up. Both use `window.native?.onX?.(cb)`; the guard is one `?.` on each site, not a branch. |

---

## 7. Non-Phase-9 (each its own future epic)

- **Distribution / bundled interpreter.** python-build-standalone + venv install + `@electron/osx-sign` + `@electron/notarize` + release automation. Opens when v1 is ready to ship externally.
- **Auto-update.** `electron-updater` + hosted feed + signed cert.
- **Multi-window.** Tear-off panes, per-window pane registry, layout persistence.
- **Windows and Linux packaging.** Chromium renderer is portable; entitlements, signing, and update feeds are per-OS.

---

## 8. References

- `RESEARCH-2026-09-24-electron-integration-v2.md` — rulings this plan builds on.
- Electron security: <https://www.electronjs.org/docs/latest/tutorial/security>
- Electron process model: <https://www.electronjs.org/docs/latest/tutorial/process-model>
- Electron BrowserWindow: <https://www.electronjs.org/docs/latest/api/browser-window>
- `_deprecated/electron-bridge-2026-09-12/` (created in Sprint 077).
- Phase 8 close: `process/BLACKBOARD.md` sprint-tail 2026-09-24 entry.

---

*End of document.*
