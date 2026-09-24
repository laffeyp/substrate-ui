# Phase 9 — Electron wrapping (v2)
## Ship the reveal shell as a macOS .app that launches, spawns its own substrate server, and owns its own menu bar

*v2 opened 2026-09-24. v1 (`PLAN-2026-09-24-phase-9-electron-wrapping.md`) stays on disk per hard rule 12. v2 folds in the eight review findings against v1: 2.3 self-contradiction, understated port work, R2's missing spawn options, sandbox preload allowlist, Sprint 078's port collision, drift-shaped SUBSTRATE_UI_SKIP_SPAWN env var, empty-folder git behaviour, unshown 30-tag claim.*

| Field | Value |
| --- | --- |
| Opened | 2026-09-24 |
| Status | Drafted, awaiting Architect ratification |
| Owner | Agent (Peter Architect) |
| Preceded by | `PLAN-2026-09-23-phase-8-transcript-atom-migration.md` (Phase 8, closed 2026-09-24) |
| Ratified rulings | `RESEARCH-2026-09-24-electron-integration-v2.md` §6 |
| Runs under | Electron 33/34 (Chromium 130/132) on macOS arm64 primary; renderer identical across platforms |
| Affects | `electron/`, `app/`, `bridge/`, `src/observability/`, `server.py` (CLI parse), `web/reveal.ts` (two OS-integration wire-up sites in Sprints 080 and 081), `package.json`, `harness/`, `_deprecated/` |
| Does not affect | `substrate/*`, `web/vm/**` (SessionController, BrowserSubstrateClient, kinds, signals), `web/reveal/**` (atom transcript tree), `web/reveal.html`, the HTTP + SSE surface of `server.py`, the vocabulary lock at `web/vm/signals/versions/0.1.json` |

---

## 1. Shape

Electron becomes a Chromium window that boots `server.py` as a subprocess, waits for it healthy on `127.0.0.1:<port>`, `loadURL`s the reveal shell, owns the native macOS menu bar, and registers `substrate://` as a deep-link handler. The renderer is the same code that runs in a Chrome tab today. The preload is small and exposes one namespace (`window.native`) for OS integration that the browser cannot give.

The old paths — `bridge/main.py`, `bridge/vocab.py`, `app/prototype-v7.html`, `app/build.js`, `app/support.js`, `app/index.html`, `src/observability/bridge-ops.ts`, the 2026-09-12 `electron/main.js` + `electron/preload.js` — move to `_deprecated/electron-bridge-2026-09-12/` per hard rule 12. The audit trail of the direction that was tried and abandoned stays on disk.

The wrapping produces a dev-runnable .app on a developer's machine (`electron .` from the repo root, or `npm run electron`). It does not ship a bundled Python interpreter — the developer's `uv` + `substrate` install is what the main process spawns. The bundled-interpreter path opens a separate Phase 10 (Distribution) when there is a v1 worth shipping externally.

Auto-update, Windows/Linux packaging, and multi-window all sit outside Phase 9 by construction — each is its own epic.

---

## 2. Constraints

### 2.1 Security (hard gate)

`webPreferences` on every `BrowserWindow`: `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, `webSecurity: true`, `preload: path.join(__dirname, 'preload.js')`. No exceptions. The Electron 44 security guide names disabling any of these as an anti-pattern. `contextBridge.exposeInMainWorld` is the only way `window.native` reaches the renderer; the preload never passes raw `ipcRenderer` or event objects to page code.

Under `sandbox: true`, the preload imports only `electron` and Electron's small sandboxed allowlist (`path`, `events`, `timers`, `url`, `buffer`, `process` in a restricted shape). Any Node built-in outside that list — `node:fs`, `node:child_process`, `node:os` — lives in the main process and reaches the preload only through IPC. The 2026-09-12 preload freely `require`d Node built-ins; the new preload cannot. The retired code stands as a counter-example under `_deprecated/`.

### 2.2 Vocabulary lock (hard gate)

`signals/0.1.json` unchanged. Every runtime signal that fires today still fires. No new tags, no retirements. The wrapping introduces no substrate-side changes. Sprint 077's exit output records the parity gate line verbatim; the number the plan cites lives in the audit trail, not in this header.

### 2.3 Renderer, VM, and transport untouched (hard gate)

`web/vm/**` — no code changes. `web/reveal/**` — no code changes. `web/reveal.html` — no code changes. The HTTP + SSE surface of `server.py` (routes, response shapes, envelope stream) — no code changes.

Two OS-integration wire-up sites in `web/reveal.ts` are the only exception: Sprint 080 adds a menu-command listener (`window.native?.onMenuCommand?.(cb)`), Sprint 081 adds a deep-link listener (`window.native?.onDeepLink?.(cb)`). Both are optional-chain guards that no-op in a plain browser. They are not renderer rewrites; they are the Electron-only touch points named here in advance so the gate does not lie.

### 2.4 Runtime dependencies

Adds `electron` (pinned) and `@electron-forge/*` to `package.json` devDependencies. `@electron/osx-sign` and `@electron/notarize` are Phase 10 (Distribution), not Phase 9. No new runtime dep in the renderer.

---

## 3. Sprints

Each sprint is a single-commit unit. Each closes with the six-gate observation contract (§5) green.

### Sprint 077 — retire the 2026-09-12 Electron/bridge trees + Electron spike

**Deliverables.**
- `_deprecated/electron-bridge-2026-09-12/` created. Moved under it: `bridge/main.py`, `bridge/vocab.py`, `app/prototype-v7.html`, `app/build.js`, `app/support.js`, `app/index.html`, `src/observability/bridge-ops.ts`, and the current `electron/main.js` + `electron/preload.js` (the 2026-09-12 versions).
- `_deprecated/electron-bridge-2026-09-12/ARCHIVED.md` — short note: what was retired, why (superseded by the reveal shell over HTTP), commit that retired it, pointer to `RESEARCH-2026-09-24-electron-integration-v2.md`.
- The `electron/` and `app/` directories at the repo root cease to exist after the move; Sprint 078 creates them fresh with real files. Git tracks files, not empty directories, so no placeholder scaffolding is checked in.
- `package.json` cleaned of any `"main"` entry pointing at the retired path.
- **Playwright `_electron.launch` spike.** A five-line script (`harness/_electron_spike.ts`) launches a trivial hello-world Electron app that itself spawns and manages a subprocess (`sleep 30`), asserts Playwright can see the window and clean-kill the whole tree. This proves R4 up front rather than deferring it to Sprint 082. If the spike fails, Phase 9's harness shape changes before Sprint 078 opens; there is no `SUBSTRATE_UI_SKIP_SPAWN=1` back door under a test env — a drift-shaped hidden state axis SDD discipline treats as a defect.

**Exit.**
- `git status` clean after commit; the move set matches the list above.
- Full parity gate stdout captured in the sprint's Signal Report:
  `[vm-vocab-parity] OK — vocabulary 0.1 (30 tags: 30 live + 0 retired, locked=true); code emits 30 distinct live tag(s), all locked.`
- `npm run build`, `typecheck`, `lint` green. No renderer change; reveal shell in Chrome unchanged.
- `_electron.launch` spike passes: window mounts, subprocess PID visible via `ps`, close-window kills subprocess (verified by `ps` after 3 s).

### Sprint 078 — spawn-and-load skeleton

**Deliverables.**
- `electron/main.js` — new. `app.whenReady` spawns:
  ```
  spawn('uv', ['run', 'python', 'server.py', '--port', '8765'],
        { cwd: <substrate>, stdio: ['ignore','pipe','pipe'], detached: true })
  ```
  The `detached: true` puts the child in its own process group; `process.kill(-child.pid, 'SIGTERM')` on shutdown takes down uv and its Python child together. Pattern matches `harness/shakeout/lib/server.ts:22-45`.
  Polls `http://127.0.0.1:8765/` every 200 ms until 200 or 15 s timeout, then `createWindow` with `titleBarStyle: 'hiddenInset'`, `trafficLightPosition: { x: 12, y: 16 }`, `backgroundColor: '#212327'`, `loadURL('http://127.0.0.1:8765/?atom-transcript=1')`.
  On `window-all-closed` and `before-quit`: `process.kill(-child.pid, 'SIGTERM')`, wait up to 3 s, then `SIGKILL`. On subprocess exit while the window is open: `webContents.send('server:dead')`.
- `electron/preload.js` — new. Tiny. `contextBridge.exposeInMainWorld('native', { platform: process.platform, isElectron: true })`. No IPC yet. Imports only `electron`; nothing outside the sandboxed allowlist.
- `package.json` — adds `electron` (pinned to a stable major matching Chromium 130/132), `"main": "electron/main.js"`, `"electron"` script `"electron ."`.
- `README.md` (or a short section) — how to run: `npm install`, `npm run electron` (assumes `uv` and `substrate` on PATH). Names the prerequisite explicitly.

**Assumptions the exit test enforces.** Sprint 078 pins port 8765. The exit test must run against a fresh environment: no other `npm run electron`, no `uv run python server.py`, no `ServerHandle` from the shakeout, nothing else on 8765. Otherwise a stale server answers the poll and the launch reads green for the wrong reason. Sprint 079 removes the collision surface; until then the exit test opens with `lsof -iTCP:8765 -sTCP:LISTEN -t | xargs -r kill -9` and re-verifies port free before the launch. Sprint 079 lands next, not later.

**Exit.**
- `lsof -iTCP:8765` returns nothing before launch.
- `npm run electron` opens a window that shows the reveal shell at DPR 2. `titleBarStyle` inset visible; traffic lights at design offset.
- The pane header chip row (from Phase 8's `pane_header_clip` assertion shape) still passes with top edges aligned — one screenshot check captured to the sprint's signal report.
- Closing the window: `ps -p <server-pid>` returns nothing within 3 s. No orphan `python server.py`.
- Static gates green.

### Sprint 079 — dynamic port

**Deliverables.**
- `server.py` — real work. Currently line 720–722 reads `SUBSTRATE_UI_PORT` from the env at module import and passes `(HOST, PORT)` into `ThreadingHTTPServer` at line 3077. Sprint 079 replaces that with:
  - `argparse` at `main()` entry accepting `--port N` (default `int(os.environ.get("SUBSTRATE_UI_PORT", "8765"))`) and `--host H` (default `"127.0.0.1"`).
  - Defers the `HOST, PORT = …` module-level binding: the values become local to `main()` after `argparse` runs.
  - `srv = ThreadingHTTPServer((host, port), Handler)` at what is currently line 3077.
  - Immediately after binding, before `serve_forever()`: read the actual bound port via `srv.server_address[1]`, emit a stable single stdout line `substrate-ui port=<n>\n`, `sys.stdout.flush()`. This is the readback contract Electron depends on.
  - `--port 0` binds an ephemeral port; the readback line carries the chosen one.
- `electron/main.js` — spawns with `--port 0` instead of `--port 8765`. Reads the first stdout line, matches `/^substrate-ui port=(\d+)$/`, extracts the port, uses it for the health-check poll and the `loadURL`. If the pattern does not match within 5 s of spawn, kill the subprocess and surface a first-run banner.
- The Playwright harness (`harness/shakeout/lib/server.ts`) continues to pin 8765 for its own `ServerHandle` (unchanged; it owns its lifecycle from spawn to kill and doesn't need the readback).

**Exit.**
- Two concurrent `npm run electron` invocations open two independent windows against two independent servers on two ephemeral ports; `lsof -iTCP` shows both listening; killing one leaves the other running.
- `curl -s "http://127.0.0.1:$(uv run python server.py --port 0 & sleep 2; lsof -iTCP -sTCP:LISTEN -a -p $! -Fn | grep '^n' | head -1 | cut -d: -f2)/"` returns 200 (or equivalent scripted check that consumes the readback line).
- Shakeout still passes on 8765 (its `ServerHandle` continues to spawn without `--port`, defaulting to 8765).
- Static gates green.

### Sprint 080 — native menu bar + `window.native` menu events

**Deliverables.**
- `electron/menu.js` — `Menu.buildFromTemplate` with File (New Session · Open Record… · Recent Records · Close Window), Edit (Undo/Redo/Cut/Copy/Paste), View (Toggle Reveal · Zoom In · Zoom Out · Reload), Window (Minimize · Zoom · Bring All to Front), Help.
- `electron/main.js` — `Menu.setApplicationMenu(...)`; each menu item's `click` handler `webContents.send('menu:<command>', payload)`.
- `electron/preload.js` — expose `window.native.onMenuCommand(cb)` that subscribes to `ipcRenderer.on('menu:*', ...)` behind a wrapper that receives only the payload, never the event (Electron 44 security guide's approved `contextBridge` pattern). Returns an `off()` unsubscriber. All under the sandboxed-preload allowlist.
- `web/reveal.ts` — the first of the two OS-integration wire-up sites named in §2.3. Adds a single block: if `window.native?.onMenuCommand` exists, wire the commands to their real handlers (New Session → `registry.spawn` + focus; Toggle Reveal → the same code path Ctrl+` triggers today; etc). Non-Electron browsers see `undefined` and the block no-ops.

**Exit.**
- Every menu item fires its intended effect in the shell (one behavior assertion per item, six items).
- The renderer runs identically in a plain Chrome tab; the `pixel:diff` gate stays 12/12 flag-on and flag-off.
- Static gates green.

### Sprint 081 — deep-link protocol handler

**Deliverables.**
- `electron/main.js` — `app.setAsDefaultProtocolClient('substrate')`. macOS handles `open-url`; Windows/Linux handle `second-instance`. Both extract the URL and push to the renderer as `webContents.send('deep-link', url)`. Reuses the buffered-pending pattern from the 2026-09-12 `electron/main.js:51-72` (a `pending = []` list, `rendererReady = true` on `did-finish-load`, flush loop) so a deep-link fired before the renderer is ready gets replayed on load.
- `electron/preload.js` — expose `window.native.onDeepLink(cb)`.
- `web/reveal.ts` — the second OS-integration wire-up site. Single block: on deep-link `substrate://record/<id>`, call `controller.attachRecordRoot(id)` on the focused pane (the same code path the descend affordance triggers).
- macOS `Info.plist` entry via `electron-forge` config for the `substrate` protocol declaration.

**Exit.**
- `open substrate://record/<real-id>` from a terminal opens the app (or focuses it if running) and attaches the focused pane to that record.
- Cold launch → deep-link → renderer-ready path: script sends the deep-link before `did-finish-load` (via a `--url` fixture on first launch) and asserts the pane attached to the record.
- Static gates green.

### Sprint 082 — Electron smoke harness

**Deliverables.**
- `harness/electron_smoke.ts` — Playwright `_electron.launch({ args: ['.'] })`, wait for window, assert reveal shell mounts (`[data-vm-transcript-mount]` present), drive one deterministic turn through `window.__vm`, assert `snapshot().parkReason` non-null, close.
- `harness/electron_menu_test.ts` — same launch, trigger a menu command via `app.getApplicationMenu().getMenuItemById(id).click()`, assert the renderer received the `menu:<command>` event and acted on it.
- `harness/electron_deeplink_test.ts` — same launch, drive `app.emit('open-url', 'substrate://record/<id>')` from the main process, assert the renderer received the `deep-link` event.
- `package.json` — `"electron:smoke"` script wraps the three.
- `harness/shakeout/run.ts` — register the three flows under a new `AXIS_C` (Electron-only) that runs only when `SHAKEOUT_AXIS` includes `C`. AXIS_A and AXIS_B stay unchanged.

**Exit.**
- `npm run electron:smoke` returns 0 across 5/5 runs each.
- `SHAKEOUT_AXIS=ABC npm run shakeout` returns 0.
- Static gates green.

---

## 4. Signal preservation

The wrapping introduces zero new signals. Every emit site in the controller and the shell fires unchanged. `signals/0.1.json` is untouched. The parity gate at `web/vm/tools/check-vocabulary-parity.ts` continues to pass at whatever count it reports; that count lives in the sprint Signal Reports, not in this plan's header. `_deprecated/electron-bridge-2026-09-12/` is outside the parity gate's scan tree (which scans `web/vm/`, `web/reveal.ts`, `web/reveal_component.ts`).

---

## 5. Observation contract

Every sprint above closes only when all six gates return zero:

1. `npm run typecheck` — TypeScript strict, zero errors.
2. `npm run lint` — ESLint, zero errors.
3. `npm run test:unit` — 14/14.
4. `npx tsx web/vm/tools/check-vocabulary-parity.ts` — full stdout line captured in the sprint's Signal Report.
5. `npm run smoke:vm` — 11/11.
6. Sprint-specific behavior gate — the exit test named in each sprint's Exit section.

Sprint 082 additionally requires: full shakeout (AXIS A + B + C) at 5 runs each, all green.

---

## 6. Risk register

| # | Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- | --- |
| R1 | `uv` or `substrate` missing on the developer's machine at Sprint 078 launch | High | Medium | The health-check poll times out; main.js surfaces a first-run banner naming the missing dependency and the exact install command. `README.md` names the prerequisites explicitly. |
| R2 | Subprocess orphan on abrupt Electron exit | Medium | Medium | Handled in Sprint 078's deliverable — `spawn(..., { detached: true })` + `process.kill(-child.pid, 'SIGTERM'/'SIGKILL')` targeting the whole group. Not a risk left to run-time; a spec item. |
| R3 | Dynamic port readback race — Electron `loadURL`s before the server binds | Medium | High | The health-check loop polls; `loadURL` only after 200. Sprint 079 flow includes a stress test that spawns and kills 20 times in a row. |
| R4 | Playwright `_electron.launch` does not play nice with an app that itself spawns a subprocess | Was Medium | Was High | Removed. Sprint 077's spike proves the shape works before Sprint 078 opens. No `SUBSTRATE_UI_SKIP_SPAWN` back door; a test-toggled behavior fork is drift. If the spike fails, the harness shape changes before Sprint 078; Phase 9 stops at Sprint 077 pending a re-plan. |
| R5 | `titleBarStyle: 'hiddenInset'` + `trafficLightPosition` misalign against the reveal shell's header chip row | Low | Low | Sprint 078 exit criterion includes a header chip alignment check reusing Phase 8's `pane_header_clip` assertion shape. |
| R6 | Deep-link fires before the renderer is ready | Medium | Low | Same buffered-pending pattern the 2026-09-12 `electron/main.js:51-72` implemented (pending list, flush on `did-finish-load`). Sprint 081's cold-launch → deep-link → renderer-ready exit test covers it. |
| R7 | (retired) — `window.native` branching in the renderer proliferates | — | — | Replaced by §2.3's explicit enumeration of the two wire-up sites. The plan names them; the gate does not lie about them. |

---

## 7. Non-Phase-9 (each its own future epic)

- **Distribution / bundled interpreter.** python-build-standalone + venv install + `@electron/osx-sign` + `@electron/notarize` + release automation.
- **Auto-update.** `electron-updater` + hosted feed + signed cert.
- **Multi-window.** Tear-off panes, per-window pane registry, layout persistence.
- **Windows and Linux packaging.** Chromium renderer is portable; entitlements, signing, and update feeds are per-OS.

---

## 8. References

- `RESEARCH-2026-09-24-electron-integration-v2.md` — rulings this plan builds on.
- `PLAN-2026-09-24-phase-9-electron-wrapping.md` — v1 of this plan, superseded here.
- Electron security: <https://www.electronjs.org/docs/latest/tutorial/security>
- Electron process model: <https://www.electronjs.org/docs/latest/tutorial/process-model>
- Electron BrowserWindow: <https://www.electronjs.org/docs/latest/api/browser-window>
- Sandboxed preload allowlist: <https://www.electronjs.org/docs/latest/tutorial/sandbox>
- `harness/shakeout/lib/server.ts:22-45` — the detached-spawn / process-group-signal pattern Sprint 078 reuses.
- Current `server.py:720-722` and `:3077` — the port-binding call sites Sprint 079 rewrites.
- Retired `electron/main.js:51-72` — the buffered-pending pattern Sprint 081 reuses.
- Phase 8 close: `process/BLACKBOARD.md` sprint-tail 2026-09-24 entry.

---

*End of document.*
