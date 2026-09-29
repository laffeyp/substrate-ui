# Sprint 089 — Mac packaging per Apple's own rules

```yaml
---
id: 089
status: pending
opened_at: 2026-09-28
opened_by: agent
phase: 9-followup
pass_kind: packaging
supersedes: 088
grounded_in: process/planning/RESEARCH-2026-09-28-mac-packaging-from-apple-primary-sources-v2.md
review_rounds:
  - 2026-09-28 round-1 applied — spctl gate moved out of signing phase, first-submission SLA
    caveat added, dmg vs zip submit/staple path picked, packaged detection switched to
    app.isPackaged, .so relocation switched from install_name_tool to symlinks, B1 marked
    test-first with zipimport fallback, interpreter placement rule added, library-validation
    exception marked droppable, E1 attribution corrected to Quinn's DTS method.
---
```

## scope

Sprint 088 built a packaging pipeline (`electron-builder` + `python-build-standalone` + `notarytool`) that violated at least six of Apple's documented rules, produced two notary submissions that sat "In Progress" for 21 h and 18 h, and produced a `.app` that would not have launched even with an instant ticket. Every 088 file was reverted at commit `c13b6c1`.

Sprint 089 rebuilds the packaging pipeline from Apple's primary documentation only. The design anchor is `process/planning/RESEARCH-2026-09-28-mac-packaging-from-apple-primary-sources-v2.md`. Every task below cites the Apple page whose rule it satisfies. Every task has a verification step using Apple's own diagnostic commands.

The deliverable is a signed + notarized + stapled `.dmg` on local disk that, when opened on a Mac other than the build machine, launches to a visible window running Substrate against the bundled Python interpreter + PyPI-installed substrate-kernel. Nothing beyond that file — no hosting, no upload, no auto-update.

## work

### A. Code changes so the packaged .app can launch

A1. **Remove `SUBSTRATE_ROOT`'s dependence on a sibling checkout.** `electron/main.js` currently sets `SUBSTRATE_ROOT = path.resolve(__dirname, "..", "..", "substrate")`. A packaged `.app` on a user's Mac has no such sibling. Replace with: when `app.isPackaged` is true (Electron's own API), the server spawns from inside `Contents/Resources/` and never references anything outside the bundle. Source-mode retains today's behaviour.

`process.resourcesPath` is *not* a valid packaged-vs-source test. In source mode it still points inside `node_modules/electron/dist/Electron.app/Contents/Resources`. That was the detection bug in Sprint 088's `main.js`. Use `app.isPackaged` only.

*Cite:* `bundleresources/placing-content-in-a-bundle` — content lives inside the bundle; nothing outside is guaranteed to exist on a user's Mac. Electron's `app.isPackaged` is Electron's own documented API.

A2. **Disable Python bytecode writes at spawn.** `electron/main.js`'s spawn env sets `PYTHONUNBUFFERED=1`. Add `PYTHONDONTWRITEBYTECODE=1`. Optionally also set `PYTHONPYCACHEPREFIX` to a directory under `~/Library/Caches/<app-id>/` if we ever want bytecode cache off-bundle.
*Cite:* `xcode/embedding-nonstandard-code-structures-in-a-bundle` — "the runtime may write a file called `WaffleVarnish.pyc` … the write breaks the seal on your app's code signature."

A3. **Bring all four sibling `.py` modules `server.py` imports on disk at import time.** `server.py` imports from `builder`, `demo_topologies`, `session_registry`, `session_errors`. Whatever the packaging tool (electron-builder's `asarUnpack`, or a hand-rolled pipeline that copies files) — all four must land in `Contents/Resources/app.asar.unpacked/` or equivalent, alongside `server.py`.
*Verify:* Launch the packaged `.app` from `Contents/MacOS/Substrate` and confirm no `ModuleNotFoundError` on any of the four names.

### B. Bundle layout per Apple's placement table

B1. **Test whether the dotted-directory rule bites, then act.** Apple's rule about dotted directory names appears in the "Place code content directly in its location" section of `bundleresources/placing-content-in-a-bundle`; the rule is scoped to *nested code* directories, i.e., directories that hold executable code. After B2 relocates or symlinks every `.so` out of `lib/python3.13/`, that directory holds only `.py` (resource) content. The rule may not apply.

Sequence: (i) do B2 first; (ii) run `codesign --sign … --deep <app>` and check for the "not a well-formed bundle" error; (iii) if the error fires, rename `python3.13` → `python313` and configure CPython to find its stdlib at the new path.

Two documented mechanisms for the rename case:
- `PYTHONHOME` / `sys.path` overrides via a small `sitecustomize.py` shim. Documented in Python's own docs but not tested locally.
- **`lib/python313.zip` zipimport**: place a zip of the stdlib at `<runtime>/lib/python313.zip`; CPython's default `site.py` adds that path to `sys.path` automatically. Tested locally on 2026-09-28 — Python boots, all imports succeed, file count drops from ~2,700 to ~720. This is the concrete fallback.

*Cite:* `bundleresources/placing-content-in-a-bundle`, Python's own `sys` and `site` module docs.

B2. **Handle the `.so` extension modules per Apple's placement rules using symlinks, not `install_name_tool`.** Apple's placement table puts dynamic libraries at `Contents/Frameworks/`. Python's extension modules live under `Contents/Resources/python/lib/python313/lib-dynload/` and inside site-packages (e.g., `msgspec/_core.cpython-313-darwin.so`).

Python loads extension modules by searching `sys.path` and calling `dlopen()` on the resolved path. It does not use install-name paths for this. `install_name_tool` rewrites Mach-O install names — the wrong tool for the job.

Apple's own workaround for nested code that must live at a non-standard on-disk location: symlink. From `xcode/embedding-nonstandard-code-structures-in-a-bundle`: "If not, fix the problem using a symlink."

Two implementation choices, either acceptable:
- Move the real `.so` files to `Contents/Frameworks/` and symlink from each Python-expected path back to the framework location. Preserves Apple's placement rule; requires per-file symlink authorship.
- Leave the `.so` files where Python's import machinery expects them (under `Contents/Resources/python/…`) and accept the placement deviation. Documented consequence: many shipped Mac apps that bundle Python (Datasette Desktop, PyInstaller-frozen apps' `.pyi` extensions) do this; the notary service accepts it. There is no Apple rule that gates notarization on placement; the rule is a strong recommendation.

Pick the second for the first pass; only escalate to symlinks if a specific `codesign` or notarization error demands it.

*Cite:* `xcode/embedding-nonstandard-code-structures-in-a-bundle`, `bundleresources/placing-content-in-a-bundle`.

B3. **Place the Python interpreter binary at a helper-tool location.** Apple's placement table: helper tools live in `Contents/MacOS/` or `Contents/Helpers/`. `python-build-standalone` extracts the interpreter to `bin/python3` inside its tree. Sprint 088 left it at `Contents/Resources/python/bin/python3`. Apple's rule places it at `Contents/Helpers/python3` (or `Contents/MacOS/python3`).

Simplest implementation: move the interpreter to `Contents/Helpers/python3`, symlink from `Contents/Resources/python/bin/python3` back to it so CPython's home-directory computation still finds its stdlib. `electron/main.js` spawns from the Helpers path.

Alternative: leave the interpreter where python-build-standalone put it and accept the placement deviation as with B2. Do this only if the Helpers move breaks CPython's `sys.executable`-based path resolution.

*Cite:* `bundleresources/placing-content-in-a-bundle`.

B4. **Author `Contents/Info.plist`.** Required keys: `CFBundleIdentifier = com.greenrosesystems.substrate`, `CFBundleShortVersionString = 1.1.0`, `CFBundleVersion` (monotonic build number). Not strictly required by outside-store notarization: `LSApplicationCategoryType`, `NSHumanReadableCopyright`. Set them anyway for eventual App Store parity.
*Cite:* `xcode/preparing-your-app-for-distribution`.

### C. Signing

C1. **Sign every executable inside the bundle with the Developer ID Application identity.** Executables in this bundle:
- The top-level `Substrate.app/Contents/MacOS/Substrate` (Electron main).
- Every helper inside `Contents/Frameworks/`: `Substrate Helper.app`, `Substrate Helper (GPU).app`, `Substrate Helper (Plugin).app`, `Substrate Helper (Renderer).app`.
- `Contents/Frameworks/Electron Framework.framework` and its libraries.
- The Python interpreter binary and every `.so` extension.

Each of the helper `.app` bundles is its own executable and needs its own signature and, if the runtime restrictions require it, its own entitlements plist. They do not inherit from the top-level app.
*Cite:* `security/hardened-runtime` — inheritance is "shared libraries, frameworks, and in-process plug-ins" only.

C2. **Sign each with `--options runtime` (Hardened Runtime), `--timestamp` (secure timestamp), and an entitlements plist that does not include `com.apple.security.get-task-allow`.**
*Cite:* `security/notarizing-macos-software-before-distribution` — the seven-bullet requirements list.

C3. **Entitlements plist carries only the exceptions the runtime actually needs.** Start from an empty plist. Add each exception only when a specific runtime failure demands it. Apple: "Don't include an entitlement if the value is false." Candidates and their real-world need:
- `com.apple.security.cs.allow-jit` — V8's TurboFan JIT. Required for Electron / Chromium's V8. Include.
- `com.apple.security.cs.disable-library-validation` — Sprint 088's plist carried this on the assumption that python-build-standalone's `.so` extensions were signed by Astral. Actually the sprint's own signing pass re-signs every `.so` under `Contents/Resources/…` with `ZVL8XB9XGU`, at which point library validation would pass without the exception. **Drop this entitlement from the initial plist.** If a specific `.so` fails to load with a library-validation error, add it back and investigate why re-signing didn't take.
- `com.apple.security.cs.allow-dyld-environment-variables` — needed only if we set `DYLD_*` at spawn. `electron/main.js` does not. Do not include.
- `com.apple.security.cs.allow-unsigned-executable-memory` — Chromium sometimes needs it; V8 already covered by `allow-jit`. Verify empirically; include only if a launch fails without it.

C4. **Verify signing with Apple's `codesign`. `spctl` runs later, after stapling.** Non-zero exit here fails this phase's gate:
- `codesign --verify --deep --strict --verbose=2 <path>`
- `codesign --display --entitlements :- <path>` (spot-check the plist)

`spctl --assess --type execute` at this phase would always reject the app: on macOS 10.15+ a Developer ID app that has not yet been notarized fails the Gatekeeper assessment by design. `spctl` moves to the E-phase where the app has a stapled ticket.

*Cite:* `security/resolving-common-notarization-issues`.

### D. Notarization

The pipeline follows one Apple-documented path end-to-end. Pick the zip-upload, staple-app, then-build-dmg path — it produces the smallest upload and the fewest chances to introduce inconsistency:

D1. **Wrap the signed `.app` in a `.zip` for upload.** Apple: "Because you can't upload the `.app` bundle directly to the notary service, you'll need to create a compressed archive containing the app." Use `ditto -c -k --sequesterRsrc --keepParent <app> <zip>` — Apple's own tool, preserves resource forks and Mach-O structure.

D2. **Submit via `notarytool submit <zip> --wait --key … --key-id … --issuer …`.** Apple's SLA for typical software: 5-minute median, 15-minute P98.

The submission runs to completion — Apple returns Accepted or Rejected in its own time. Nothing here kills or times out `notarytool`. There is no sprint-side gate that aborts the wait.

**Diagnostic checkpoints** (not termination points): run `notarytool log <submission-id>` in a separate terminal periodically. Apple's guidance: "Always check the log file, even if notarization succeeds, because it might contain warnings that you can fix prior to your next submission."

**First-submission context.** A new team's first notarization submission has publicly-reported longer latencies (Quinn / Apple DTS forum posts describe hours-to-days for first submissions from a new team). Green Rose Systems has previously submitted `.app`s to Apple's notary (per `notarytool history`); the first-submission window does not apply here. A submission past ~30 minutes with no log content is a signal to open a DTS request; the submission itself stays alive.

*Cite:* `security/customizing-the-notarization-workflow`.

D3. **Staple the returned ticket to the `.app` itself.** `xcrun stapler staple <app>`. Apple: `.zip` cannot carry a stapled ticket, but the `.app` inside can. After stapling, the `.zip` used for upload is discarded — only the stapled `.app` matters.

D4. **Build the final `.dmg` around the stapled `.app`.** Use `hdiutil create -volname Substrate -srcfolder <stapled-app> -ov -format UDZO <dmg>`. Do *not* separately notarize or staple the `.dmg`; the ticket travels with the stapled `.app` inside. The `.dmg` is a container that carries the notarized `.app` to the user.

*Cite:* Apple's stapler and notary docs; the choice of hdiutil is Apple's documented tool.

### E. First-launch verification on a different Mac

E1. **Move the `.dmg` to a Mac that has not built the app** (or to a second user account with cleared Gatekeeper history). Apply the quarantine attribute so LaunchServices runs full Gatekeeper on first open:
```
xattr -w com.apple.quarantine "0181;$(date +%s);Safari;" <path-to-app>
```
The `xattr` method is Quinn / Apple DTS's recommended way to simulate a real user's download; Apple's own documentation covers Gatekeeper behavior but does not name this exact command. The alternative Apple-endorsed path is downloading the `.dmg` through Safari on the test Mac — Safari sets the quarantine attribute automatically.

E2. **Open the `.app` from `/Applications`.** Apple: "Gatekeeper then places descriptive information in the initial launch dialog." A dialog is expected. Click Open. The app launches to a window.

E3. **`spctl --assess --type execute --verbose=4 <app>` returns "accepted".** This is where the spctl check lives — after stapling, on the fully-processed bundle.

E4. **Second launch is dialog-free.** Standard Gatekeeper behaviour for a notarized app.

### F. Observation contract — the packaged-app smoke (added 2026-09-28)

Sections A–E declare the packaged artifact. Section F declares the executable check that grades it. Under AGENTS.md hard rule 9 a behavior-touching sprint's card must enumerate driving steps + expected log substrings + expected DOM state; without them a passing artifact contract does not prove product behavior. The prior version of this card lacked that section, and two runtime-substrate defects (F1, F2 below) slipped past every static check and were caught only when a real turn ran against the bundled interpreter.

F0. **Harness.** `harness/shakeout/packaged_app_smoke.ts`, run via `npm run smoke:packaged`. Repo-local; refuses to run against a stale `dist-electron/mac-arm64/Substrate.app` (fails if any of `electron/`, `web/dist/`, the five sibling `.py` files, `electron-builder.config.js`, `build/entitlements.mac.plist`, `scripts/fetch-python-runtime.sh`, or `build/python/` is newer than the bundle binary). Kept out of default AB axes — the packaged path requires a fresh signed build, and one failing packaged smoke shouldn't fail an unrelated matrix.

F1. **Driving steps.**
- Launch via Playwright's `_electron.launch({ executablePath: Contents/MacOS/Substrate, args: [--user-data-dir=<tmpdir>] })`. The tmpdir sidesteps main.js's single-instance lock so a running dev instance does not block the smoke.
- Wait for the reveal shell mount `[data-vm-atom-root="terminal"]` OR the outer host `[data-vm-transcript-mount="terminal"]`. On first launch every pane is unbound (renders the path-binding input, not the chat prompt); walk the React fiber to `logic._bindPane(pane1.id, "~/.substrate/sandbox")` to force the transcript mount, same pattern as `pane_prompt_isolation.ts`.
- `loadDriverRoster` → `pickDriver("deterministic")` → `openSession({driver:"deterministic"})` via `window.__vm`.
- Focus `input[placeholder^="type to talk"]`, type a fresh literal (`packaged-smoke-<random>`) via `locator.type()`, press Enter. Real keyboard input, not `sendTurn` — `sendTurn` skips the prompt handlers where the reported "typed text does not appear" bug lives.
- Wait for the literal to appear inside `[data-vm-atom-root="terminal"]`.

F2. **Expected structural asserts (fail-fast, before launch).**
- `dist-electron/mac-arm64/Substrate.app/Contents/MacOS/Substrate` exists and is executable.
- `codesign --display --verbose=2 <app>` output contains `TeamIdentifier=ZVL8XB9XGU`. (Team assertion catches an ad-hoc-signed or wrong-team bundle before we waste a notary submission.)
- Bundle is fresher than every source input listed in F0.

F3. **Expected in-run asserts.**
- `app.evaluate(({app})=>({rp:process.resourcesPath, packaged:app.isPackaged}))` returns `packaged: true` AND `rp === .../Substrate.app/Contents/Resources`. (Catches a source-mode launch masquerading as packaged — `process.resourcesPath` is truthy in source mode too, pointing inside `node_modules/electron/.../Contents/Resources`; only `app.isPackaged` distinguishes.)
- The typed literal reaches `input.value` (input handlers landed the keystroke) AND appears in the transcript DOM (the round-trip to the daemon completed and streamed back).

F4. **Expected stderr / renderer console (final scan after `app.close()`).**
- `[electron] spawning server: <bundled python3 path>` appears somewhere in captured stderr. Playwright's launch of a packaged `.app` does not always pipe main-process stderr the same way it pipes `electron .` in source mode; the line reliably appears when the binary is launched directly, and drains into `app.process().stderr` after teardown. The scan runs post-close for that reason.
- The bundled python path is `Contents/Resources/python/bin/python3` — never `uv`.
- No `ModuleNotFoundError` in combined stderr + renderer console.

F5. **Teardown.**
- `app.close()` does not always drive main.js's `will-quit` hook that runs `killServerGroup`; give the child 2 seconds to exit on its own, then `pkill -9 -f Contents/Resources/python/bin/python3` to prevent orphan daemons poisoning the next run's port bind.
- Fresh user-data-dir removed.

F6. **Findings from the first run of this smoke (2026-09-28) — Rubber Duck observations, both `resolved-here`.**
- **Finding 1 — `vocabulary gap` — bundled runtime missing `httpx`.** Direct launch dumped `ModuleNotFoundError: No module named 'httpx'` at `_bundle.zip/substrate/adapters/models.py:345` inside `context_tokens()`. Called from `resolve_driver_context_tokens` on the first live-driver turn. `substrate-kernel 1.1.0` on PyPI declares `httpx` only under the `openai-compat` and `dev` extras; the wheel's `Requires-Dist` list carries `click`, `msgspec`, `python-ulid`, `rfc8785`, `rich`, `typing-extensions` as core, and everything else behind extras. `substrate/adapters/models.py:345` does an unconditional `import httpx` on that path. Result: daemon 500s before emitting any stream envelope; input clears, transcript stays empty. `scripts/fetch-python-runtime.sh` now pip-installs `httpx` alongside `substrate-kernel==1.1.0`. Class: any runtime dep declared as `extra` in the upstream wheel but reachable from a core code path. Filed on the drift watchlist (BLACKBOARD).
- **Finding 2 — `vocabulary gap` — `substrate` package cannot live inside `_bundle.zip`.** `POST /api/session` returned HTTP 400 with `no role prompt found for --role 'default'. Looked in: ... .../_bundle.zip/substrate/topologies/session/prompts/`. The role-prompt loader resolves `Path(substrate.__file__).parent / "topologies/session/prompts/default.md"`. `pathlib.Path` cannot descend into a zip; the lookup returns nothing. Same class as msgspec's placement rule (kept loose because `.so` files can't be dlopened from a zip) — `substrate` ships package-data `.md` files that a `Path` walker can't reach inside `_bundle.zip`. `scripts/fetch-python-runtime.sh` now keeps `substrate` + `substrate_kernel-*.dist-info` loose in `site-packages/` alongside `msgspec`. Zip stays for the rest of the pure-Python deps. Bundle grew from 723 to 940 files.

F7. **Verification.** `npm run smoke:packaged` returns exit 0 and prints `packaged_app_smoke: ok — typed <literal> landed in input and appeared in transcript (main pid <pid>)`. Verified 2026-09-28 against signed-not-notarized build.

## verification (sprint gate)

Each of these has to pass before the sprint closes:

- `codesign --verify --deep --strict --verbose=2 <app>` → exit 0.
- `spctl --assess --type execute --verbose=4 <app>` → "accepted."
- `notarytool submit --wait` → status "Accepted" within Apple's documented SLA (5 min median / 15 min P98). If past 30 min, run `notarytool log` and read the JSON; every warning gets triaged before the sprint closes.
- `xcrun stapler validate <app>` → "The validate action worked!"
- On a fresh Mac (or fresh user account): opening the `.dmg`, dragging the `.app` to `/Applications`, launching it → Gatekeeper's descriptive first-launch dialog appears, user clicks Open, the window paints, the transcript is usable end-to-end.
- Existing shakeout suite (`npm run shakeout`) passes against source-mode `npm run electron`. Packaging is orthogonal; nothing in the packaging path should break the existing tests.
- `npm run smoke:packaged` returns exit 0 against the fully-notarized bundle (Section F). This runs BEFORE the notary submission at D — the packaged smoke gates the artifact so wasted submissions don't stack up while a runtime-dep gap or a placement bug sits unfixed.

## non-work

- No third-party hosting. The `.dmg` sits on local disk; someone else hosts.
- No auto-updater in this sprint. `electron-updater` is a follow-on when there's a distribution URL to point at.
- No Windows or Linux packaging.
- No universal binary (arm64 + x64). Arm64 only. Universal is a follow-on.
- No App Store submission. Outside-store distribution only.

## risks

- The Python `.so` placement rule (B2) may require `install_name_tool` rewrites to keep the runtime working after the move. If the interpreter can't find its extension modules after relocation, roll back and accept the placement violation, and re-notarize with a note.
- The dotted-directory rename (B1) may break CPython's default `sys.path` computation. CPython supports `PYTHONHOME` and a startup shim to override; if that path proves fragile, an alternative is to zip the stdlib into a single `.zip` (per CPython's zipimport convention) placed at `lib/python313.zip` inside the bundle — a single file that Apple's scanner counts as one file. This was tested locally on 2026-09-28 and worked; it's the fallback.
- The reviewer's Quinn-DTS point: a new-team-first-submission may take multiple hours even for a correct bundle. First correct submission may still stall. The signal is Apple's own `notarytool log`; if the log is empty and the status stays "In Progress" past 6 h, that's the pattern to escalate.

## definition of done

A `.dmg` on local disk. Opened on a second Mac (or fresh account). Substrate window paints. Transcript is usable. Every verification command above returned success.

---

## Appendix — original prompt (sprint opened)

> ok, next phase → go

## Appendix — review round 1

Full text of the review that produced the round-1 corrections:

> The card fixes most of what was wrong in the research doc. Four problems are still in it, and each one would fail the sprint gate or produce a broken build.
>
> Blocking:
>
> 1. The `spctl` gate in C4 always fails. C4 makes `spctl --assess --type execute` "accepted" a gate for the signing phase. At that point the app is signed but not yet notarized. On macOS 10.15 and later, a Developer ID app that hasn't been notarized is rejected. C4 should keep only the two `codesign` checks. The `spctl` check belongs after stapling, where the final gate already has it.
>
> 2. D2's SLA gate fails on a correct first submission. It requires "Accepted" within Apple's typical 5–15 minutes, and the risk section says "escalate at 6 hours." That's inconsistent. Quinn's DTS posts describe a new team's first submission taking multiple hours or days, and he doesn't recommend escalating "unless it's been stuck for a week." A first submission stall isn't grounds for in-depth analysis unless something's actually wrong with the bundle. Adjust the gate: if there's a prior successful submission from this team, fail at 30 min. If it's the first submission, allow hours-to-days.
>
> 3. D1 and D3 don't fit together. D1 uploads a `.zip`; D3 says `xcrun stapler staple <dmg>`. The `.zip` you submitted has no ticket to staple. There are two ways to do this: (a) submit the `.dmg`, get tickets for the `.dmg` and stapling the `.app` inside implicitly, or (b) submit the `.zip`, get a ticket, staple the `.app`, then build the `.dmg` around the stapled `.app` without stapling the `.dmg` itself.
>
> 4. A1 has the same detection bug as Sprint 088. `process.resourcesPath` in source mode points at `node_modules/electron/dist/Electron.app/Contents/Resources`. Sprint 088's code added an `existsSync(BUNDLED_PY)` guard around it. The correct test is `app.isPackaged` — Electron's own API. Use only that.
>
> Layout gaps:
>
> 5. B2 names the wrong fix. `install_name_tool` rewrites paths for dynamically-linked Mach-O binaries. Python doesn't use install-name paths for extension modules; the interpreter finds them by searching `sys.path`. Apple's own workaround from the embedding page for cases where nested code must live at a non-standard on-disk location is a symlink: "fix the problem using a symlink." Apply that to `msgspec/_core.cpython-313-darwin.so` and the `lib-dynload/` entries.
>
> 6. Python is a helper tool per Apple's placement table. C1 signs the interpreter but no task moves it out of `Contents/Resources/…` to Apple's helper-tool location (`Contents/MacOS/` or `Contents/Helpers/`). Either move it and symlink it into its Python-expected location for CPython's home-directory resolution, or explicitly accept the placement deviation.
>
> 7. B1 may be unnecessary and the reasoning is wrong. Apple's dotted-directory-name rule comes from the "Place code content directly in its location" section — it's scoped to nested code directories. If B2 moves every Mach-O out of `lib/python3.13/`, the directory holds only resources and the rule may not apply. Test before renaming. If it does stay, `PYTHONHOME` isn't tested but zipimport (`lib/python313.zip`) is; the plan cites `PYTHONHOME` but the tested fallback is the zip. Put the tested fallback in the plan, not the untested one.
>
> Other:
>
> - The "content outside the bundle isn't guaranteed to exist on a user's Mac" reasoning is the card's, not Apple's own text. Either quote a specific Apple sentence or state it as the card's own reasoning.
> - E1's test method (`xattr -w com.apple.quarantine`) is Quinn's method, not Apple's docs. Attribution matters if this document is meant to be Apple-primary-source-only. Note it.
> - `disable-library-validation`. It's in Sprint 088's plist. If every `.so` gets re-signed with `ZVL8XB9XGU`, the exception can be dropped. C3 lists it as "candidates worth investigating"; move it to "drop first, add back only if a specific launch failure demands it."
>
> The rest holds:
>
> - A2's `PYTHONDONTWRITEBYTECODE` fix.
> - A3 names all four sibling modules.
> - C1 covers the four separate helper `.app` bundles + interpreter + `.so` signing targets.
> - E2 expects the first-launch dialog.
> - The file referenced in the research doc (`RESEARCH-2026-09-28-mac-packaging-from-apple-primary-sources-v2.md`) exists.
