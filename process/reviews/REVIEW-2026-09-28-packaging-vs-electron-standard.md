# Review — Substrate's macOS packaging against standard Electron practice

*2026-09-28. Scope: `substrate-ui` at `ee53899` (Sprint 089), the built bundle at `substrate-ui/dist-electron/mac-arm64/Substrate.app`, and the installed copy at `/Applications/Substrate.app`. Premise, stated by the Architect and not re-examined here: `npm run electron` works; the packaged `Substrate.app` does not.*

---

## 0. Verdict

The packaging copies files and signs them correctly. It does not carry over the conditions the app runs under. Source mode runs `server.py` from a writable git checkout, with the developer's shell PATH, inside the `substrate` repo's locked `uv` environment, from the `substrate` repo as working directory. The packaged app changes all four, and nothing in `electron/main.js`, `electron-builder.config.js` or `scripts/fetch-python-runtime.sh` compensates for any of them. Standard Electron practice has a known answer to each: writable state goes to `app.getPath('userData')`, a GUI-launched app restores the shell PATH, the backend ships from the same lockfile the developers run, and nothing resolves paths from the source tree or the working directory.

The worst consequence is measured. Every topology launch, Studio build, resume and delegated child run in the packaged app tries to create its record inside the signed bundle. macOS refuses with `PermissionError: [Errno 1] Operation not permitted`. The API still answers `200` with `"status":"incomplete"`. No record is written, so every view that reads a record, Structure included, has nothing to show. The same launch in source mode returns `"status":"finalised"`, writes its record, and `/api/records/<name>/topology_graph` returns its producers.

Signing and notarization are sound. `codesign --verify --deep --strict` passes, and `spctl -a -vv` reports `accepted, source=Notarized Developer ID` for both the built and the installed copy.

---

## 1. Findings, ranked

| # | Finding | Standard practice | Evidence | Effect in the packaged app |
|---|---|---|---|---|
| 1 | Run records are written inside the app bundle | Writable app state goes under `app.getPath('userData')` | Measured | Topology launch, Studio build, resume and delegation produce no record; the API reports success-shaped `incomplete` |
| 2 | The app never restores the user's shell PATH | `fix-path` / `shell-path`: GUI apps on macOS do not inherit the dotfile PATH | Measured | CLI drivers (`claude`, `codex`, `cursor-agent`) disappear; the agent's `bash` tool loses `uv`, `node`, `npm`, Homebrew tools |
| 3 | The backend runs in a different Python environment | Ship the backend from the lockfile the developers and tests use | Measured | Python 3.13.7 vs 3.14.4; 16 packages vs 113; unpinned versions, including a `python-ulid` major bump |
| 4 | Paths resolve from the source tree and the working directory | Resolve bundled data from the bundle and user data from `userData`; never from `cwd` | Code | Role lookup, bench results and served dev records all depend on the checkout layout |
| 5 | `substrate://` is registered at runtime only | Electron: on macOS a protocol must be declared in `Info.plist` | Measured (plist) | Deep links cannot reach the packaged app |
| 6 | The backend dies when the last window closes; the app stays alive | Electron's macOS lifecycle: the app lives until Cmd-Q; `activate` reopens a window | Code | Close window, click Dock icon: a window opens against a dead server |
| 7 | No log file; silent quit on startup failure | `app.getPath('logs')` exists for this | Code | A Finder-launched failure leaves no trace; the only message names `uv`, which a user's Mac lacks |
| 8 | Dev and packaged instances share one daemon socket and one session store | Separate instances do not steal each other's sockets | Code | Whichever server starts last takes `~/.substrate/daemon.sock`; both rewrite the same manifests |
| 9 | Kill grace (3 s) is shorter than the server's shutdown (10 s per session) | The backend gets the shutdown time it asks for | Code | Sessions open at quit are killed mid-shutdown (applies to source mode too) |
| 10 | Bundle hygiene | Standard layout, real icon, build number | Measured | `__pycache__` shipped; interpreter and `.so` files in `Resources`; Electron's default icon; `CFBundleVersion` never changes |
| 11 | No parity test between source and packaged builds | The packaged artifact runs the same suite as the dev build | Repo | Findings 1–8 were invisible to every gate that ran |

Findings 1–3 each break core function on their own. Findings 4–8 break specific features. Findings 9–11 are defects of hygiene and process.

---

## 2. Method

Every claim below comes from one of three sources, and each finding says which.

- **Measured.** Commands run against the built bundle, a copy of it, or the source tree. Both servers were run with a throwaway `HOME`, so the Architect's `~/.substrate` was never read or written. One launch test ran against a `ditto` copy of the bundle at `/tmp/sc.iAt7/Substrate.app`; the built and installed bundles were not modified.
- **Code.** Read from the repo at `ee53899` with file and line numbers. Code-only findings were not exercised at runtime; the review stopped at the Architect's instruction before the window-lifecycle probe ran.
- **Docs.** Electron's own documentation, fetched raw from `github.com/electron/electron/main/docs`; the option descriptions in `node_modules/app-builder-lib/scheme.json` (electron-builder 26.15.3, the installed version); the `sindresorhus/fix-path` and `shell-path` READMEs. The last two are third-party packages, cited because Electron's ecosystem converged on them for this problem and their READMEs state the macOS behaviour plainly.

---

## 3. Findings in detail

### F1. Run records are written inside the signed app bundle

**Standard.** Electron's `app.getPath` documentation defines `userData` as "the directory for storing your app's configuration files … By convention files storing user data should be written to this directory," and recommends a subdirectory such as `path.join(app.getPath('userData'), 'my-app-data')`. An app bundle is read-only at runtime; nothing the app produces belongs inside it.

**What Substrate does.** `server.py:1432-1434` sets `RUNS = Path(__file__).resolve().parent / "runs"`. In source mode that is `substrate-ui/runs/`, a writable, gitignored folder that already holds 84 development records. In the packaged app `server.py` lives at `Contents/Resources/app.asar.unpacked/server.py`, so `RUNS` points inside the signed bundle. Five write sites create records there:

| Line | Handler | Route | Caller |
|---|---|---|---|
| 3028 | `_launch` (def 3010) | `POST /api/launch` | topology launch |
| 3219 | `_agent_legacy` (def 3165) | `POST /api/agent` | `delegate` child records |
| 3268 | `_agent_legacy` (def 3165) | `POST /api/agent` | agent run record |
| 3321 | `_resume` (def 3299) | `POST /api/resume` | resume |
| 3387 | `_build` (def 3366) | `POST /api/build` | Studio build, `web/vm/session_controller.ts:656` |

Each hands the root to `api.Runtime(root).run(...)`, whose `RecordWriter` calls `self.root.mkdir(parents=True, exist_ok=True)` (`substrate/record/record.py:90`).

**Evidence (measured).** On the bundle copy, `POST /api/launch?topology=game_of_life` returned:

```
{"name":"launch_game_of_life_7a9a5028348a","status":"incomplete","launched":"game_of_life"}
```

The server's stderr ended:

```
PermissionError: [Errno 1] Operation not permitted:
  '/private/tmp/sc.iAt7/Substrate.app/Contents/Resources/app.asar.unpacked/runs'
```

No `runs/` directory exists afterwards, and the copy's signature still verifies because nothing was written. `EPERM` (errno 1), not `EACCES`, is macOS protecting a signed app bundle, not a file-mode problem; `chmod` does not fix it. The same request against the source server returned `{"status":"finalised"}`, wrote `runs/launch_game_of_life_a1320adbbdca.record/` (`blobs/`, `sidecar/`, `events-000001.open.jsonl`, `manifest.json`), and `GET /api/records/<name>/topology_graph` returned the `world` and `cell` producers.

**Effect.** In the packaged app every topology launch, Studio build, resume and delegated child run fails in a background thread with no record. The HTTP layer answers as though the run started. Every surface that reads a run record — Structure, the record views, `topology_graph`, `run_graph` — finds nothing for these runs.

`server.py:1896` has a related write: `WEB.mkdir(exist_ok=True)` on a bundle path. It is harmless today only because `web/dist` is unpacked into the bundle and already exists.

### F2. A Finder-launched app gets no user PATH

**Standard.** The `fix-path` README: "Useful for Electron apps as GUI apps on macOS and Linux do not inherit the `$PATH` defined in your dotfiles (.bashrc/.bash_profile/.zshrc/etc)." `shell-path` gives the same reason, and shows `process.env.PATH` as `'/usr/bin'` inside a GUI app. An app launched from Finder or the Dock gets launchd's default PATH, `/usr/bin:/bin:/usr/sbin:/sbin`. On this machine `launchctl getenv PATH` is empty, so nothing overrides that default.

**What Substrate does.** `electron/main.js:106` passes `{ ...process.env, PYTHONUNBUFFERED: "1", PYTHONDONTWRITEBYTECODE: "1" }` to the server and never repairs PATH. `npm run electron` runs from a terminal, inherits the shell PATH, and never shows the difference.

Everything downstream resolves programs through that PATH:

- **CLI drivers.** Discovery is `shutil.which(cmd[0])` (`server.py:1157`) over the catalog entries `["claude", "-p"]` (`:652`), `["codex", "exec"]` (`:691`) and `["cursor-agent", "-p"]` (`:720`). On this machine `claude` is at `~/.local/bin/claude`; `codex` and `gemini` are under `~/.nvm/versions/node/v25.9.0/bin/`. `codex` is a Node script and also needs `node` from that same directory.
- **The agent's `bash` tool.** It runs `subprocess.run(..., shell=True)` (`substrate/topologies/tool_loop/tools.py:294-307`) with the inherited environment, so inside the packaged app the agent's shell has no `uv`, `node`, `npm` or Homebrew tools.
- **Unaffected:** `git` at `/usr/bin/git` (used for worktrees, `server.py:1455-1476`), and Ollama, which the server reaches over HTTP rather than through PATH.

**Evidence (measured).** The packaged server was run twice, differing only in PATH, and `GET /api/models` was compared:

| PATH | `cli` | `cli_login_supported` |
|---|---|---|
| `/usr/bin:/bin:/usr/sbin:/sbin` (Finder) | `[]` | `[]` |
| shell PATH | `['claude', 'codex', 'cursor-agent']` | same three |

The Ollama model lists matched in both runs.

**Effect.** Opened from Finder, the Dock or Launchpad, the packaged app offers no CLI drivers, and any agent session's shell commands run without the user's toolchain. Launched from a terminal (`open` inherits the shell environment in some setups; running `Contents/MacOS/Substrate` directly always does), the same app works. That makes the failure depend on how the app was opened.

### F3. The packaged backend runs in a different Python environment

**Standard.** A shipped backend is built from the same dependency lock the developers and tests run, so the tested bytes are the shipped bytes. `substrate` has a `uv.lock`; source mode runs inside it (`electron/main.js:91-93`: `uv run python server.py`, cwd the `substrate` repo).

**What Substrate does.** `scripts/fetch-python-runtime.sh:63-66` runs `pip install substrate-kernel==1.1.0 httpx` into python-build-standalone 3.13.7. There is no lockfile and no constraints file, and every transitive dependency resolves to whatever PyPI serves on build day. The script then rewrites the environment's layout:

- zips the standard library into `lib/python313.zip` (lines 81-83);
- zips every pure-Python dependency except `substrate` and `msgspec` into `site-packages/_bundle.zip`, loaded through a `.pth` file (lines 107-121).

**Evidence (measured).** `importlib.metadata.distributions()` in each interpreter:

| | Source (`uv run`, `substrate` repo) | Packaged (`Contents/Resources/python`) |
|---|---|---|
| Python | 3.14.4 | 3.13.7 |
| Distributions | 113 | 16 |
| `python-ulid` | 3.1.0 | **4.0.1** (major version) |
| `anyio` | 4.13.0 | 4.15.1 |
| `click` | 8.4.1 | 8.5.0 |
| `pygments` | 2.20.0 | 2.21.0 |
| `typing-extensions` | 4.15.0 | 4.16.0 |
| `certifi`, `idna` | 2026.5.20, 3.18 | 2026.7.22, 3.20 |

A static scan of every import in `substrate/src/substrate` and the five shipped `substrate-ui` modules, checked against the packaged interpreter's `sys.path`, finds one unresolvable module: `swebench`, used by `assay/swebench.py` and `topologies/swebench_solver/select_docker.py`. It is an optional extra and doesn't matter for the app. The kernel source itself matches today: `git rev-list v1.1.0..HEAD -- src/` returns `0` in the `substrate` repo. The next kernel commit ends that match, because source mode tracks the working tree and the packaged app tracks PyPI.

**Effect.** Two failures of this kind have already surfaced, and the script's own comments record both:

- Lines 54-62: `httpx` sits behind the `openai-compat` extra, so the first live-driver turn raised `ImportError` until `httpx` was pinned by hand.
- Lines 97-106: zipping `substrate` broke the role-prompt lookup, `no role prompt found for --role 'default'`, because `pathlib` cannot descend into a zip.

What remains untested is every behaviour that differs between Python 3.13 and 3.14 and between `python-ulid` 3 and 4. The shipped runtime has never run the substrate test suite.

### F4. Paths that assume the checkout layout or the working directory

**Standard.** Bundled read-only data is found relative to the bundle (`process.resourcesPath`, or the package through `importlib.resources`). User data goes to `userData`. Nothing resolves from `cwd`, because a GUI app's working directory is not a meaningful place.

**What Substrate does.**

- `electron/main.js:89` sets the packaged server's `cwd` to `Contents/Resources`; source mode uses the `substrate` repo root (`:93`).
- `server.py:2063` resolves roles with `resolve_role_prompt(role, repo_root=Path.cwd())`. In source mode that searches the `substrate` repo; packaged, it searches `Contents/Resources`. The `default` role resolves in both (a session opened successfully on both servers). Any role kept in the repo tree is found in source mode only.
- `server.py:1690-1699` defaults `BENCH_RESULTS` to `Path(__file__).resolve().parent.parent / "substrate" / "process" / "bench_results"`, a sibling-checkout path. Packaged, it resolves to `Contents/Resources/substrate/process/bench_results`, which does not exist.
- `server.py:1431` points `TERMINAL_V1` at a checkout path (currently empty in both modes).
- `server.py:1516` and `:1532` serve `runs/*.record` ahead of bundled records. Measured: `/api/records` returned 25,694 bytes in source mode (84 dev records plus the bundled demos) against 4,929 bytes packaged (bundled demos only).

**Effect.** Any feature that reads role files, bench results or run records from the checkout behaves differently packaged, with no error: the lookups return empty.

### F5. Deep links are registered at runtime only

**Standard.** Electron's `app.setAsDefaultProtocolClient` documentation: "On macOS, you can only register protocols that have been added to your app's `info.plist`, which cannot be modified at runtime." The deep-link tutorial adds that "when you package your app you'll need to make sure the macOS `Info.plist` … [is] updated to include the new protocol handler." electron-builder's `protocols` option (scheme: "The URL protocol schemes", with `name`, `schemes`, `role`) writes `CFBundleURLTypes`.

**What Substrate does.** `electron/main.js:232` calls `app.setAsDefaultProtocolClient("substrate")`. The comment at `:229-231` notes that a shipping build needs the `Info.plist` entry. `electron-builder.config.js` has no `protocols` key.

**Evidence (measured).** `plutil -p Contents/Info.plist` on the built app shows `CFBundleIdentifier`, `CFBundleShortVersionString`, `LSApplicationCategoryType`, `NSHumanReadableCopyright` and `ElectronAsarIntegrity`, and no `CFBundleURLTypes`.

**Effect.** `substrate://record/<id>` links, the Sprint 081 feature, cannot open the packaged app.

### F6. The backend dies when the last window closes, but the app does not quit

**Standard.** Electron's first-app tutorial: on macOS, closing all windows does not quit the app (`if (process.platform !== 'darwin') app.quit()`), and "activating the app when no windows are available should open a new one" through `app.on('activate', …)`. The backend must therefore live as long as the app, not as long as a window.

**What Substrate does.** `electron/main.js:276-279`:

```js
app.on("window-all-closed", () => {
  killServerGroup();
  if (process.platform !== "darwin") app.quit();
});
```

The server is killed and the app keeps running. `:271-273` then recreates the window on `activate`, and `createWindow()` (`:218`) loads `http://127.0.0.1:<serverPort>/` for the port of the server that was just killed. Nothing respawns it. The renderer's last-pane Cmd-W (`native:close-window`, `:285-287`) reaches this path directly.

**Evidence.** Code only. The runtime probe for this finding was stopped before it ran.

**Effect.** Close the window, then click the Dock icon: a window opens against a dead port. This matters only for a packaged app, because a developer running `npm run electron` stops the process from the terminal.

### F7. No log file, and a silent quit on startup failure

**Standard.** Electron provides `app.getPath('logs')` ("Directory for your app's log folder"). A GUI app's stdout and stderr go nowhere visible when it is launched from Finder.

**What Substrate does.**

- All diagnostics are written to `process.stderr` (`electron/main.js:56`, `:110`, `:117`), including everything the Python server prints.
- On a startup failure the app logs two lines and calls `app.quit()` (`:262-267`). The second line reads "check that `uv` and `substrate` are on PATH (see README)", which is a source-mode message: the packaged app uses neither.
- No `dialog.showErrorBox` or equivalent appears.

**Effect.** When the packaged app fails at launch, it vanishes with no message and no file to read. Every packaged failure in F1–F3 raises its Python traceback into a stream that no one sees unless the app was started from a terminal.

### F8. A dev instance and a packaged instance collide

**What Substrate does.**

- Both servers bind `~/.substrate/daemon.sock` (`server.py:3955-3962`), and each startup first unlinks any existing socket ("Stale socket file from a crashed prior daemon: unlink so bind can succeed"). A second server therefore silently takes the socket from a live first one, and the `substrate` CLI, which tries the socket first, then talks to whichever started last.
- Both run a boot scan over `~/.substrate/sessions`. The server's own comment (in `main`, before `SessionRegistry` construction) says the scan "rewrit[es] manifests whose stored status disagrees", marking records with a hot segment as `interrupted`.

**Evidence.** Code only.

**Effect.** Running `npm run electron` and the packaged `Substrate.app` at the same time, which is the normal state while a developer tests a build, lets each server take the other's socket and rewrite session statuses the other still holds. This finding concerns concurrent instances only. It does not question the app using `~/.substrate` as its session store.

### F9. Shutdown is cut short (both modes)

`electron/main.js:26` sets `KILL_GRACE_MS = 3_000`. The server's `_sigterm_handler` calls `_shutdown_all_sessions(per_session_timeout=10.0)`. Any session still running at quit gets `SIGKILL` 3 s after `SIGTERM`, part-way through a shutdown that allows 10 s per session, and the next boot scan finds it `interrupted`. The same happens in source mode. It is listed here because a packaged app is quit through Cmd-Q far more often than a dev process.

### F10. Bundle hygiene

- **`__pycache__` ships inside the signed bundle.** `fetch-python-runtime.sh:71` deletes the caches, then lines 127 and 138 import `substrate`, `msgspec` and the adapters with the bundled interpreter, which writes them back into `build/python`. They exist under `msgspec/`, `substrate/` and `substrate/adapters/` in both the built and installed apps. The signature covers them, so nothing breaks today; `PYTHONDONTWRITEBYTECODE=1` at runtime (`main.js:106`) prevents new writes.
- **Code sits in `Resources`.** The interpreter is at `Contents/Resources/python/bin/python3`, and `.so` modules sit under `Resources/python/lib/`. Apple's placement table puts helper executables in `Contents/MacOS` or `Contents/Helpers` and libraries in `Contents/Frameworks`. `main.js:80-82` records this as a deferred deviation. Notarization accepted the bundle anyway.
- **Default icon.** `CFBundleIconFile` is `electron.icns`, Electron's own icon; the config sets no `mac.icon`.
- **Static build number.** `CFBundleVersion` equals `CFBundleShortVersionString`, `1.1.0`. Apple requires Mac build strings to increase from release to release, and this configuration cannot produce a second build with a higher one.
- **Tooling.** Electron's packaging and code-signing tutorials recommend Electron Forge, which wraps `@electron/packager`, `@electron/osx-sign` and `@electron/notarize`. The Phase 9 plan (`PLAN-2026-09-24-phase-9-electron-wrapping-v2.md:51`) named `@electron-forge/*`. The repo uses electron-builder 26.15.3. electron-builder is a legitimate choice; the divergence from the plan is not recorded anywhere.

### F11. No gate compares the two builds

`harness/shakeout/packaged_app_smoke.ts` runs one deterministic-driver turn in the packaged app. The nine Axis-A shakeout flows run only in source mode (`process/KIT_DIARY.md:29` records this). None of F1–F8 fails that smoke:

- F1 needs a topology launch or build.
- F2 needs a Finder launch; the smoke inherits the harness's PATH.
- F3 needs a code path that differs between Python versions.
- F5–F8 need deep links, window lifecycle or concurrent instances.

This review found F1 and F2 by running the same request against both builds and comparing the answers.

---

## 4. What standard practice asks, set against what exists

| Standard Electron packaging requirement | Status in Substrate |
|---|---|
| Writable state under `app.getPath('userData')` | Missing: run records target the bundle (F1) |
| Restore the shell PATH in a GUI launch (`fix-path` / `shell-env`) | Missing (F2) |
| Backend built from the project's lockfile | Missing: unpinned `pip install` (F3) |
| No `cwd`- or checkout-relative paths | Missing: roles, bench results, dev records (F4) |
| URL schemes declared in `Info.plist` | Missing (F5) |
| Backend lifetime tied to the app, not the window, on macOS | Missing (F6) |
| Log file under `app.getPath('logs')`; visible startup errors | Missing (F7) |
| Code signing with hardened runtime, timestamp, entitlements | Present: `codesign` verifies, notarized |
| Notarization and stapling | Present: `spctl` accepts, `Notarized Developer ID` |
| `asar` with native or foreign files unpacked | Present: all five `.py` modules and `web/dist` unpacked (`electron-builder.config.js` `asarUnpack`) |
| `app.isPackaged` as the packaged-mode test | Present (`main.js:79`) |
| Packaged artifact runs the dev test suite | Missing (F11) |

---

## 5. Record of this review's own errors

Earlier in the same session, this reviewer made three claims that are withdrawn here:

- **"The packaged smoke is a sufficient gate."** Retracted by F11.
- **"`blobs/` and `sidecar/` were amputated from the bundle."** Refuted: every such folder in `substrate/src/substrate/topologies/*/records/ci_mode.record/` is empty in the source tree, so the bundle lost nothing.
- **An explanation of the Structure complaint based on which kind of session the Architect usually opens.** Invented, not measured, and withdrawn.

The measured mechanism in F1 replaces all three: a topology run in the packaged app writes no record, and the same run in source mode does.

---

## 6. Sources

- Electron, `docs/api/app.md` — `app.getPath` (`userData`, `logs`), `app.setAsDefaultProtocolClient` macOS note. https://github.com/electron/electron/blob/main/docs/api/app.md
- Electron, `docs/tutorial/launch-app-from-url-in-another-app.md` — "Packaging" section. https://github.com/electron/electron/blob/main/docs/tutorial/launch-app-from-url-in-another-app.md
- Electron, `docs/tutorial/tutorial-2-first-app.md` — `window-all-closed` and `activate` on macOS. https://github.com/electron/electron/blob/main/docs/tutorial/tutorial-2-first-app.md
- Electron, `docs/tutorial/asar-archives.md` — working-directory and `child_process` limitations. https://github.com/electron/electron/blob/main/docs/tutorial/asar-archives.md
- Electron, `docs/tutorial/code-signing.md` and `application-distribution.md` — Forge recommendation. https://github.com/electron/electron/blob/main/docs/tutorial/code-signing.md
- electron-builder 26.15.3, `node_modules/app-builder-lib/scheme.json` — `protocols`, `extraResources`, `asarUnpack`, `mac.binaries`, `mac.extendInfo`, `mac.icon`.
- `sindresorhus/fix-path` README. https://github.com/sindresorhus/fix-path
- `sindresorhus/shell-path` README. https://github.com/sindresorhus/shell-path
