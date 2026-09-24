# Research — Electron and the reveal shell

*Opened 2026-09-24. First-principles pass on what Electron is, what our current code is, where the two touch, and what the shape of a real desktop shell for substrate-ui would be. Not a plan yet; the plan waits on ratification of a direction.*

---

## 1. What we have

The reveal shell today runs in a plain Chrome tab. `server.py` at the substrate-ui root is a 3115-line HTTP+SSE daemon that imports `substrate` in-process and serves the real read API (`read_record`, `run_graph`, `topology_graph`, `narration_summary`, `narrate`, plus turn / session / tool endpoints and the live envelope stream). It listens on `127.0.0.1:8765` and is started by hand from the substrate venv: `cd substrate && uv run python ../substrate-ui/server.py`. The renderer is `web/dist/reveal.html` — the Vite-built shell with the React atom transcript from Phase 8 — which the server serves at `/`.

The renderer talks to substrate through one file: `web/vm/session_controller.ts` behind `BrowserSubstrateClient`, all fetch and `EventSource`. Nothing in the runtime path depends on being inside a wrapper. The Playwright shakeout drives the same shell in real Chrome against the same HTTP surface. Phase 8 closed with 30 flows × 5 runs green.

There is a second, older path in the repository. `electron/main.js` (179 lines) spawns `bridge/main.py` and pipes newline-delimited JSON on stdin and stdout. `electron/preload.js` (114 lines) exposes `window.bridge.request(op, payload)` and `window.substrate.onMessage(cb)` to a renderer that loads `app/prototype-v7.html` (1947 lines) with `loadFile`. The bridge is a second Python process that also imports substrate — parallel to `server.py`, with its own hand-maintained op vocabulary (`BridgeOp` in `bridge/vocab.py`, mirrored in `src/observability/bridge-ops.ts`). The commit history in `electron/`, `app/`, `bridge/` runs from 2026-09-11 through 2026-09-12 and stops. The reveal shell branch started three days later and went a different way.

The concrete cost of the old path, evident in the code and the commit trail:

- Two competing IO models — stdio JSON-RPC and HTTP+SSE — each with its own implementation of "how the renderer talks to substrate."
- A hand-maintained `BridgeOp` StrEnum that must stay in sync with the real vocabulary that `signals/0.1.json` already froze at 30 tags.
- A shell (`app/prototype-v7.html`) that only runs under the preload; `web/reveal.html` — the shell we shipped — has no way to load inside that Electron main.
- Two Python processes wanting to import substrate simultaneously if both paths were live.
- Test surface bifurcated: harness for the reveal shell is Playwright-against-8765, harness for the Electron shell was an in-Electron JSONL sink (`SUBSTRATE_HARNESS=1` at `electron/main.js:20`) that nothing else understands.

None of that is worth carrying. Any Electron shell that starts here should wrap the reveal shell, not preserve the bridge.

---

## 2. What Electron is, as of 2026

Sources: [`electronjs.org/docs/latest/tutorial/security`](https://www.electronjs.org/docs/latest/tutorial/security), [`electronjs.org/docs/latest/tutorial/process-model`](https://www.electronjs.org/docs/latest/tutorial/process-model), [`electronjs.org/docs/latest/api/browser-window`](https://www.electronjs.org/docs/latest/api/browser-window), primary docs pulled 2026-09-24.

Electron is a Chromium renderer plus a Node.js main process, packaged as one binary. The main process owns the OS surface — windows, menus, tray, protocol handlers, subprocess lifecycle. Each `BrowserWindow` is one renderer process; renderers cannot `require` and cannot see the filesystem directly. A preload script runs in the renderer's process but on a privileged JavaScript context; it can `require`, and it uses `contextBridge.exposeInMainWorld` to hand a narrow, pre-shaped API to page scripts.

The security defaults have hardened since Electron 12/20. `contextIsolation: true` (default since 12), `sandbox: true` (default since 20), `nodeIntegration: false` (default since 5), `webSecurity: true`. Disabling context isolation also disables sandbox regardless of what you set on the sandbox flag. The doc's own anti-pattern list names `allowRunningInsecureContent`, `experimentalFeatures`, `enableBlinkFeatures`, `<webview allowpopups>`, and `shell.openExternal(untrusted)` — all disallowed for a shipping app.

There is a `utilityProcess` API (main-process-only) that spawns Node.js child processes designed to hold "untrusted services, CPU intensive tasks or crash prone components." It can hand a `MessagePort` to a renderer for direct message passing. It is not the right tool for spawning a Python interpreter — for that, the main process spawns via `child_process` (or `execFile`) and manages the lifecycle.

The document explicitly names an anti-pattern I care about: it now recommends against `file://` loads in favor of a custom protocol handler, "to be more aligned with classic web url behavior." For our purposes the alternative to `file://` is even simpler — `loadURL('http://127.0.0.1:8765/…')` against a real HTTP server, which is what the reveal shell already runs against.

Packaging and distribution on macOS in 2026: hardened runtime is required for notarization, every binary in `.app` — every native module, every helper, every bundled interpreter, every .dylib and .so — must be codesigned individually, and the minimum entitlement for a JS-only Electron app is `com.apple.security.cs.allow-jit` (because V8 compiles). One unsigned .dylib fails the whole notarization. Automation lives in `@electron/osx-sign` 3.1.x and `@electron/notarize` 3.1.x (scoped; the unscoped packages are deprecated). A first-time setup runs "a couple of focused weeks" per one 2026 write-up ([forasoft, 2026](https://www.forasoft.com/blog/article/the-pain-of-publishing-electron-apps-on-macos-303)); once the pipeline works, releases take 12–18 minutes end-to-end.

---

## 3. What Electron actually buys us

The reveal shell in a Chrome tab already has: fetch, SSE, storage, keyboard events, DPR-2 rendering, DevTools, the whole browser. What Electron adds, over a Chrome tab:

- A .app icon in the Dock, no browser chrome, no tab bar. The window is the app.
- A native macOS menu bar (File / Edit / View / Window / Help) — the browser's menu bar belongs to Chrome, not to us.
- `titleBarStyle: 'hiddenInset'` plus `trafficLightPosition` — the traffic lights we want, at the offset we want, no address bar above them.
- Deep-link handling via `app.setAsDefaultProtocolClient('substrate')` — `substrate://record/xyz` from anywhere on the system opens the app to that record.
- Native file/directory pickers with real filesystem access (Chrome's File System Access API works but is more constrained and prompts every session).
- Auto-update via `electron-updater` or the built-in `autoUpdater` with Squirrel — the app pulls its own new versions and installs them on relaunch.
- OS-level keyboard shortcuts that don't collide with the browser's; the app owns Cmd-N, Cmd-W, Cmd-Q, Cmd-Shift-P.
- Tray icon (optional).
- Custom window management: multi-window, drag-and-drop of records between windows, saving window layouts to disk.
- Shipping as a single .app the user launches — no "run a server first, then open a URL" step.

The PWA install path in current Chrome ([`web.dev/window-controls-overlay`](https://web.dev/articles/window-controls-overlay), [MDN `display_override`](https://developer.mozilla.org/en-US/docs/Web/Manifest/display_override)) gets us a Dock icon, a standalone window with no browser chrome, and four CSS environment variables — `titlebar-area-x/y/width/height` — for placing content next to the traffic lights. The traffic lights themselves stay browser-controlled; the app cannot move or remove them and cannot install a native menu bar. The PWA also cannot spawn `server.py`; the user still has to start the daemon by hand. PWA install is a real intermediate step for a shell that people run against an already-running server, and it costs nothing to add. It does not replace Electron for a shippable one-launch desktop app.

Tauri is the other candidate. It substitutes the platform's native web view (WKWebView on macOS, WebView2 on Windows, WebKitGTK on Linux) for Chromium and runs Rust in the main process. The .app is 5–10 MB versus Electron's 100+ MB. The cost is three rendering engines to test against, not one, and Rust in the main process where our team's fluency is Python and TS. For an app that already produces the same output in Chrome and would still need to spawn Python either way, the size win doesn't buy back the testing surface. Tauri is worth revisiting if a specific size or memory pressure surfaces later; not for v1.

---

## 4. The Python problem

The reveal shell needs substrate, which is Python. VS Code, Cursor, and Zed sidestep this: they're code editors, so they discover the user's Python. We can't do that — substrate is the app, not a project the user is editing.

Three paths, from cheapest to most work:

The cheapest is to require `uv` on the system and `substrate` installed as a uv tool. The Electron shell, on launch, runs `uv tool run substrate ui-server` (or spawns the same command inline), waits for `127.0.0.1:8765` healthy, then loads it. If uv or substrate is missing, the app shows a first-run install screen with a one-click "install substrate" that runs the uv commands. Ship a small .app (~120 MB Electron plus a few MB of our JS). No Python signing pain. Cost: users need `uv` on PATH; the first launch has a network install step; we don't control the substrate version the user runs.

The intermediate path is python-build-standalone. Astral now maintains it ([github.com/astral-sh/python-build-standalone](https://github.com/astral-sh/python-build-standalone)); it publishes redistributable interpreters for aarch64-apple-darwin, x86_64-apple-darwin, universal2, Windows, and Linux, MPL-2.0. We bundle the interpreter under `Contents/Resources/python/`, install substrate + deps into a `.venv` at build time, and codesign every .dylib and .so with hardened runtime. `@electron/osx-sign` walks the tree. Simon Willison's Datasette Desktop uses this exact shape ([til.simonwillison.net/electron/python-inside-electron](https://til.simonwillison.net/electron/python-inside-electron)), spawning via `execFile(path_to_python, [...])`. The .app grows by ~40–60 MB. Signing every binary is the sharp edge — one unsigned .so blocks notarization. Once the pipeline works, it works; but the first release takes weeks.

The most work is compiling `server.py` + substrate through PyInstaller into a single executable, so signing is one binary. PyInstaller has its own hell (dynamic imports don't resolve, hidden imports need manual declaration, plugin discovery fails silently). Not worth exploring until the intermediate path is proven infeasible.

---

## 5. The recommended shape

Put the shell together like this:

**Electron main process.** On `app.whenReady`, spawn the substrate server subprocess (path chosen by whichever Python path we picked in §4), poll `http://127.0.0.1:<port>/` until it returns 200 or times out, then create a `BrowserWindow` and `loadURL(http://127.0.0.1:<port>/)`. On `window-all-closed`, kill the subprocess before quitting. If the subprocess dies while the app is open, surface an error banner in the renderer and offer to restart. The port is chosen dynamically on launch (bind to 0, read back) so multiple installs coexist and CI doesn't collide with a dev server.

**Preload.** Small. Expose `window.native` with the OS integrations the renderer actually needs — file/directory picker, "reveal in Finder," "open external URL," menu-command events pushed from main, deep-link events pushed from main. Nothing about substrate. The renderer already knows how to talk to substrate over HTTP.

**Renderer.** Untouched. It loads a URL, same as in a Chrome tab.

**Window styling.** `titleBarStyle: 'hiddenInset'` with `trafficLightPosition: { x: 12, y: 16 }` matching the design's traffic-light inset. `backgroundColor: '#212327'` (already the current default). `webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false, preload: path.join(__dirname, 'preload.js') }`.

**Menu bar.** Native `Menu.setApplicationMenu(menuTemplate)` with a real menu: File (New Session · Open Record · Recent Records · Close Window), Edit (Undo/Redo/Cut/Copy/Paste), View (Toggle Reveal · Zoom In · Zoom Out · Reload), Window, Help. Menu items dispatch events via `webContents.send('menu:<command>', payload)` that the preload forwards to the renderer.

**Deep links.** `app.setAsDefaultProtocolClient('substrate')`. macOS fires `open-url`; Windows/Linux fire `second-instance`. Both push through to the renderer as `deep-link` events.

**Retire.** `electron/main.js` (rewrite), `electron/preload.js` (rewrite, much smaller), `bridge/main.py` (delete or move to `_deprecated/`), `bridge/vocab.py` (same), `app/prototype-v7.html` (same), `app/build.js`, `app/support.js`, `app/index.html`, `src/observability/bridge-ops.ts` (mirror of the retired op vocab).

Everything the old Electron path was is now the reveal shell over HTTP. What Electron becomes is a Chromium window that boots the server, loads the URL, owns the menu bar, handles deep links, and ships as a signed .app.

---

## 6. Open questions before drafting a sprint plan

1. **Python distribution — which of §4's three paths?** The intermediate path (python-build-standalone bundled) is where a shippable product lands; the cheapest path (require uv) is where a testable dogfood build lands in one sprint. Do we ship dev builds via uv-required and only stand up the signing pipeline when the app is ready for external distribution?

2. **Server port strategy.** Fixed 8765 (current) is simple but collides with dev workflow; bind-to-0-and-read-back is right for shipping but adds a first-launch handshake step. Do dev and prod share port strategy?

3. **Multi-window.** Every pane today is inside one BrowserWindow. Real multi-window (tear off a pane into its own OS window) is a genuine design choice, not a shim; it changes how the pane grid, the pane registry, and the header chip row work. Out of scope for the wrapping sprint; needs its own epic.

4. **Auto-update.** `electron-updater` needs a code-signing cert plus a hosted feed (GitHub Releases works). Do we set that up as part of the first Electron sprint or as a follow-up once there is a v1 to update?

5. **Windows and Linux.** macOS is the primary; the current reveal shell renders in Chromium regardless of OS. Are Windows/Linux ports first-class from day one, or macOS-first with Windows as a follow-up (which changes the packaging, entitlements, and update-feed shape)?

6. **The old app/ + bridge/ + electron/ trees.** Per hard rule 12 nothing gets deleted; the retired paths land in `_deprecated/` with an ARCHIVED note. Confirmed?

---

## 7. Sources

- Electron security tutorial: <https://www.electronjs.org/docs/latest/tutorial/security>
- Electron process model: <https://www.electronjs.org/docs/latest/tutorial/process-model>
- Electron BrowserWindow API: <https://www.electronjs.org/docs/latest/api/browser-window>
- Electron code signing: <https://www.electronjs.org/docs/latest/tutorial/code-signing>
- Chrome window-controls-overlay: <https://web.dev/articles/window-controls-overlay>
- MDN `display_override`: <https://developer.mozilla.org/en-US/docs/Web/Manifest/display_override>
- python-build-standalone (Astral): <https://github.com/astral-sh/python-build-standalone>
- Datasette Desktop bundling notes (Willison): <https://til.simonwillison.net/electron/python-inside-electron>
- macOS publishing failure modes (forasoft, 2026): <https://www.forasoft.com/blog/article/the-pain-of-publishing-electron-apps-on-macos-303>
- Repo code read: `server.py`, `electron/main.js`, `electron/preload.js`, `bridge/main.py`, `bridge/vocab.py` (header), `app/prototype-v7.html:539-546` and `:916-917`, `web/vm/session_controller.ts` (via reference), `package.json`, commit history 2026-09-11 → 2026-09-12 in `electron/` `app/` `bridge/`.
