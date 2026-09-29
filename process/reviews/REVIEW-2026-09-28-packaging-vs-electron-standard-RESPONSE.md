# Response to REVIEW-2026-09-28-packaging-vs-electron-standard.md

*2026-09-28, late session. Written by the implementer who took over Sprint 089 after the previous implementer signed off. The previous implementer applied F1, F2, F5, F6, F7, F9 and F10 in code (see `BLACKBOARD.md ## Sprint tail`, Sprint 089 "STILL OPEN" entry). This response records what was checked, what was wrong in that pass, and what changed. Nothing is committed; nothing is notarized.*

## Gate that now runs

`harness/shakeout/packaged_app_smoke.ts`, extended this pass, runs the same steps against both builds:

- `SMOKE_TARGET=source`: `electron .` from the tree.
- default: the signed bundle at `dist-electron/mac-arm64/Substrate.app`, launched with launchd's PATH (`/usr/bin:/bin:/usr/sbin:/sbin`), as Finder launches it.

Each run:

1. Types a literal through the real prompt input and waits for it in the transcript DOM.
2. Runs one turn on a real model (`SMOKE_DRIVER`, default `llama3.2:1b`) and waits for it to park.
3. Asserts the pane's `topologyGraph` holds producers. That is the field Reveal → Structure renders (`reveal_component.ts:2092-2093`); when it is empty the pane says "no topology loaded".
4. Asserts every CLI driver on the harness's own PATH appears in the app's roster.
5. After quit, fails if the bundle's `python3` is still running.

Results with `SMOKE_DRIVER=claude`, logs under `runs/packaged/`:

```
packaged_app_smoke[source]:   ok — typed packaged-smoke-mum9o7ez reached the transcript, claude turn parked, Structure graph populated, cli roster ["claude","codex","cursor-agent"]
packaged_app_smoke[packaged]: ok — typed packaged-smoke-mum9pfry reached the transcript, claude turn parked, Structure graph populated, cli roster ["claude","codex","cursor-agent"]
```

Both exit 0. The default `llama3.2:1b` driver could not be used this pass. Ollama held the model resident (6.47 GB VRAM) but did not answer a 5-token `/api/generate` within 60 s, and both source and packaged turns stalled at the identical point: the model producer started after `PromptComposed` and never completed. That is Ollama on this machine, not either build. Ollama was not restarted, because another user shares the machine.

## Verdict per finding

**F1, run records inside the bundle.** Fixed by the previous implementer. `server.py` sets `RUNS = Path.home() / ".substrate" / "runs"`, created at import. Side effect in source mode: the 84 development records in `substrate-ui/runs/` are no longer served by `/api/records`. They stay on disk.

**F2, GUI PATH.** Fixed by the previous implementer; hardened this pass. Their `restoreShellPath` took an interactive shell's entire stdout as PATH, so anything an rc file prints would have landed in PATH. `electron/main.js` now brackets the value with markers and extracts it, the method `sindresorhus/shell-env` uses, sets `DISABLE_AUTO_UPDATE=true` for oh-my-zsh, allows 5 s, and logs when it does not restore. Probed from a bare launchd environment: 538 bytes of raw output, 502 bytes of extracted PATH, containing `~/.local/bin` and `~/.nvm`. The packaged smoke, launched with launchd's PATH, finds `claude`, `codex` and `cursor-agent`.

**F3, a different Python environment.** Not touched by the previous implementer. Fixed this pass in `scripts/fetch-python-runtime.sh`:

- The bundled interpreter is python-build-standalone `cpython-3.14.4+20260414`, the version source mode runs. It was 3.13.7.
- Runtime dependencies come from `uv export --frozen --no-dev --no-emit-project --extra openai-compat` against `../substrate/uv.lock`. That gives 16 pins, installed with `--no-deps`, then `pip check`. The `openai-compat` extra supplies `httpx`, previously added by hand.
- `substrate-kernel==1.1.0` still comes from PyPI with `--no-deps`.
- Two tripwires fail the build: when `uv run` in `../substrate` reports a Python other than `PY_VER`, and when `git rev-list v1.1.0..HEAD -- src/` in `../substrate` is non-zero.

The built bundle's environment is Python 3.14.4 with `anyio==4.13.0, certifi==2026.5.20, click==8.4.1, h11==0.16.0, httpcore==1.0.9, httpx==0.28.1, idna==3.18, markdown-it-py==4.2.0, mdurl==0.1.2, msgspec==0.21.1, pygments==2.20.0, python-ulid==3.1.0, rfc8785==0.1.4, rich==15.0.0, substrate-kernel==1.1.0, typing_extensions==4.15.0`. Those are the lock's versions; `python-ulid` was 4.0.1 before.

**F4, cwd and checkout paths.** Open. `resolve_role_prompt(repo_root=Path.cwd())` searches `<repo>/.substrate/prompts/` first. `../substrate/.substrate/prompts/` does not exist, so source and packaged resolve roles identically today. `BENCH_RESULTS` still defaults to a sibling-checkout path.

**F5, protocol in `Info.plist`.** Fixed by the previous implementer. The built `Info.plist` lists `CFBundleURLSchemes => ["substrate"]`. Opening a `substrate://` link has not been exercised.

**F6, window close kills the backend.** Fixed by the previous implementer. On macOS `window-all-closed` no longer kills the server. Close-then-Dock-click is not yet driven by any gate.

**F7, no log file.** Fixed by the previous implementer: `~/Library/Logs/Substrate/substrate.log` receives the main-process and server stream, and startup failure shows `dialog.showErrorBox`. The dialog path has not been exercised.

**F9, shutdown cut short.** The previous implementer raised `KILL_GRACE_MS` from 3 s to 45 s. That change had no effect. `before-quit` sent `SIGTERM` and Electron exited at once, so neither grace period ever elapsed inside a live process. The server then finished its shutdown unsupervised. Measured: the packaged smoke found the bundle's `python3` still alive 2 s after quit, mid-way through a shutdown that walked 3,054 sessions (`skipped_ended=3054`).

Fixed this pass:

- `before-quit` now calls `preventDefault()`, sends `SIGTERM` to the group, and quits once the server's `exit` event fires. `SIGKILL` stays as the fallback after `KILL_GRACE_MS`.
- The fallback timer tested `serverProc.killed`, which Node sets only for `ChildProcess.kill()`, never for the `process.kill(-pid)` group kill used here. It now tests `serverExited`, set from the `exit` event.
- `window-all-closed` on non-macOS calls `app.quit()`, which runs the same path.

The packaged smoke now reports no surviving `python3` after quit.

**F10, bundle hygiene.** Fixed by the previous implementer: a final `__pycache__` sweep (the built bundle has 0) and `buildVersion` in epoch seconds (`CFBundleVersion` is `1790660812`). Open: the default Electron icon, and the interpreter and `.so` files sitting in `Contents/Resources`.

**F8, shared daemon socket.** Open.

**F11, no parity gate.** Partly closed. The smoke above runs identical steps against both builds and both pass. The nine Axis-A shakeout flows still run against source mode only.

## Structure pane

`web/vm/session_controller.ts` fills `topologyGraph` in one place, `loadTopologyGraph`, called at session open (`:415`) and on attach (`:524`). The call at open runs before the session's first turn creates its record, and the server answers 404 until that record exists. Measured on both servers, with the `deterministic` driver and with `llama3.2:1b`.

The controller now also calls `loadTopologyGraph` when the `SessionStarted` envelope arrives on the stream, and only if no graph is loaded yet. That envelope is read off the session's record, so the record exists when the fetch runs. The smoke's Structure assertion passes in both builds with this change.

## Defects in the previous pass, beyond the findings

- **The smoke's orphan sweep ran `pkill -9 -f "Contents/Resources/python/bin/python3"`.** That pattern matches the backend of any Substrate app on the machine, including an installed `/Applications/Substrate.app` someone is using. It now matches the absolute interpreter path of the bundle under test, and reports survivors as a failure (exit 4) instead of silently killing them.
- **The smoke drove the `deterministic` driver and inherited the harness's shell PATH.** It could see neither F2 nor the Structure data.
- **Every fix was checked with `curl` and `plutil`.** None went through the app the way a user drives it, and the F9 change was inert because of that.

## Still open, in order of user impact

1. The nine Axis-A shakeout flows against the packaged build (F11).
2. Close-then-Dock-click and `substrate://` deep links driven by a gate (F6, F5).
3. F8, the shared daemon socket and concurrent boot scans.
4. F4's `BENCH_RESULTS` path.
5. F10's icon and bundle placement.
6. The smoke runs with the real `HOME`, because the Claude CLI's login lives there, so each run adds a session to `~/.substrate/sessions/`. This pass added four: two `llama3.2:1b` sessions stalled on Ollama, one of them still marked `running`, and two `claude` sessions.
7. Notarization, last, after the above.

## Correction (same session)

Two statements above are wrong.

- **"Ollama is hung."** Ollama was healthy. The smoke's hard-coded default driver, `llama3.2:1b`, is a 1B model. Substrate's `OllamaResponder` requests `num_ctx=32768` on every call (`substrate/adapters/models.py:152`), which is the 6.47 GB resident footprint. The 1B model was still working through the tool loop when the smoke's 180 s wait expired, and the 5-token probe queued behind that request.
- **"A session is still marked `running`."** No session is running. The value is a stale status in the manifest of a session whose server the smoke killed mid-turn.

The smoke no longer names a model. Unless `SMOKE_DRIVER` overrides it, it drives the app's own default driver, the `default` field of `/api/models`. Rerun with no override (logs `runs/packaged/smoke-*`):

```
packaged_app_smoke[source]:   ok — typed packaged-smoke-muma7zut reached the transcript, kimi-k2.7-code:cloud turn parked, Structure graph populated, cli roster ["claude","codex","cursor-agent"]
packaged_app_smoke[packaged]: ok — typed packaged-smoke-muma9lws reached the transcript, kimi-k2.7-code:cloud turn parked, Structure graph populated, cli roster ["claude","codex","cursor-agent"]
```
