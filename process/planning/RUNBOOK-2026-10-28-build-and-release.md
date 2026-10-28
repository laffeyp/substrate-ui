# RUNBOOK — build, test, package, install

*2026-10-28. Standard form: purpose, inventory, prerequisites, procedure, verification, troubleshooting, rollback, references. One row per command, one log per command, one path per output. Executed end to end on this machine on 2026-10-27, 21:16 — 21:24. The results of that run are in § 7.*

## 1. Purpose

Build the Substrate macOS app from source, run every automated check against the built bundle, install the result at `/Applications/Substrate.app`, and open it. The "no-Apple" path builds the bundle unsigned and does not contact Apple; the "release" path signs and submits the bundle to Apple's notary. This runbook covers both.

## 2. Inventory

The build reads two repositories side by side.

- `substrate-ui/` — the macOS app. HTTP backend (`server.py`), Electron main (`electron/`), the window (`web/`).
- `../substrate/` — the kernel. The runtime, bundled topologies, session-topology vocabulary, `uv.lock`.

The release reads three source files only:

- `scripts/release.sh` — the seven numbered stages, in order.
- `scripts/fetch-python-runtime.sh` — the bundled Python interpreter plus the kernel wheel.
- `electron-builder.config.js` — the macOS packaging.

`package.json` names the shortcuts. `WORKING_AGREEMENT.md` names the Apple identifiers.

## 3. Prerequisites

- macOS on Apple silicon.
- `uv` on `PATH` (`brew install uv`).
- `npm` on `PATH` (Node 20 or newer).
- `../substrate/` and `substrate-ui/` checked out as siblings.
- First run: `cd substrate-ui && npm install`.
- For the release path only: `APPLE_API_KEY`, `APPLE_API_KEY_ID`, `APPLE_API_ISSUER` in the environment. See § 9.

Nothing in sections 4–6 contacts Apple.

## 4. Inputs

Two commits.

- `substrate-ui` HEAD — the UI source.
- `substrate` HEAD — the kernel. `scripts/fetch-python-runtime.sh` builds the wheel from `git archive HEAD`. A dirty `substrate/src/` or `substrate/pyproject.toml` marks the result `VERIFICATION_BUILD`, and `scripts/release.sh` refuses it.

A dirty working tree in either repo fails `scripts/release.sh` at stage 1 (outside `process/`, `runs/packaged/`, `captures/`). The no-Apple path below runs the component commands directly and does not require clean trees, but it still refuses a dirty kernel `src/`.

## 5. Procedure — the no-Apple path

Run from `substrate-ui/`. Every command writes a log at `runs/packaged/sprint-190-<stamp>/NN-<name>.log` with its exit code on the last line.

| # | Command | Expected exit | Writes | Reads |
|---|---|---|---|---|
| 1 | `uv run --project ../substrate ruff check .` | 0 | — | the UI tree |
| 2 | `uv run --project ../substrate ruff format --check .` | 0 | — | the UI tree |
| 3 | `uv run --project ../substrate python scripts/gen_kinds.py --check` | 0 | — | `web/vm/*.gen.ts` |
| 4 | `npm run build` | 0 | `web/dist/reveal.html`, `web/dist/assets/reveal-*.js` | `web/`, `harness/` |
| 5 | `npm run test:unit` | 0 | — | `web/reveal/__tests__/*.spec.ts`, `web/vm/signals/versions/0.1.json` |
| 6 | `npx tsx harness/vm_smoke.ts` | 0 | — | starts a backend on an ephemeral port, drives `SessionController` |
| 7 | `npm run test:py` | 0 | — | `tests/`, under `mktemp HOME` |
| 8 | `npm run pack:runtime` | 0 | `build/python/`, `build/python-native/`, `build/python/KERNEL_SOURCE` | `../substrate` HEAD, `../substrate/uv.lock`, python-build-standalone |
| 9 | `npm run pack:dev` | 0 | `dist-electron/mac-arm64/Substrate.app`, `dist-electron/Substrate-1.1.0-arm64.dmg` | `build/`, `web/dist/`, `electron/`, `server.py` |
| 10 | `SMOKE_UNSIGNED=1 SMOKE_DRIVER=deterministic SMOKE_APP=$APP npx tsx harness/shakeout/packaged_app_smoke.ts` | 0 | — | the packaged `.app` |
| 11 | `SHAKEOUT_APP=$APP SHAKEOUT_AXIS=C SHAKEOUT_RUNS=1 npx tsx harness/shakeout/run.ts` | 0 | — | three Electron flows against the packaged `.app` |
| 12 | `SHAKEOUT_APP=$APP SHAKEOUT_AXIS=A SHAKEOUT_RUNS=1 npx tsx harness/shakeout/run.ts` | 0 (see § 8) | — | ten controller flows against the packaged `.app` |
| 13 | `LIFECYCLE_APP=$APP npx tsx harness/shakeout/lifecycle_gates.ts` | 0 | — | F5/F6/F7/F8 against the packaged `.app` |
| 14 | `SCROLL_APP=$APP npx tsx harness/shakeout/transcript_follow.ts` | 0 | — | the scroll gate |
| 15 | `TASKS_APP=$APP npx tsx harness/shakeout/tasks_gate.ts` | 0 | — | the background-tasks gate |
| 16 | `SMOKE_APP=$APP npx tsx harness/shakeout/resume_ended_session.ts` | 0 | — | the resume-ended-session gate |
| 17 | `osascript -e 'tell application "Substrate" to quit'` | 0 or non-zero (both allowed) | — | quits any running `/Applications/Substrate.app`; wait up to 60 s |
| 18 | `mv /Applications/Substrate.app $HOME/.Trash/Substrate-<old-CFBundleVersion>-replaced-<stamp>.app` | 0 | the Trash | /Applications |
| 19 | `ditto dist-electron/mac-arm64/Substrate.app /Applications/Substrate.app` | 0 | /Applications | `dist-electron/mac-arm64/` |
| 20 | (release path only; see § 9) | — | — | — |
| 21 | `open /Applications/Substrate.app` | 0 | — | the installed bundle |

`$APP = $PWD/dist-electron/mac-arm64/Substrate.app`.

### Order and parallelism

Serial. Each step reads the previous step's output. Steps 8 and 9 take 1–3 minutes each; steps 10–16 take 1–5 minutes each; the whole run is 20–40 minutes.

### What is skipped on this path

- `scripts/release.sh` stage 1 (clean trees). The component commands above do not refuse on a dirty tree outside `process/`.
- `scripts/release.sh` stage 5 (`codesign --verify --deep --strict`). The bundle is unsigned.
- `scripts/release.sh` stage 4 with `-c.mac.notarize=true`. The bundle is not submitted to Apple.
- `SHAKEOUT_AXIS=B` (real-model tool flows). The deterministic driver covers the controller; axis B requires a live Ollama or CLI and shifts the matrix.

## 6. Verification

- `/Applications/Substrate.app/Contents/Info.plist`: `CFBundleVersion` reads back equal to the epoch seconds at build time; strictly greater than the trashed version. `SubstrateKernelCommit` equals `../substrate`'s HEAD. `SubstrateKernelVersion` equals the version in `substrate/pyproject.toml`. `SubstrateKernelReleasable` is `true` when `../substrate/src/` and `pyproject.toml` are clean.
- `pgrep -f "/Applications/Substrate.app/Contents/MacOS/Substrate"` prints the main pid.
- `pgrep -f "/Applications/Substrate.app/Contents/Resources/python/bin/python3"` prints the backend pid.
- `~/Library/Logs/Substrate/substrate.log` carries `app boot`, `spawning server`, `server bound port=<n>`, `server up on http://127.0.0.1:<n>`.
- A `BrowserWindow` is visible with `titleBarStyle: hiddenInset` and the dark background. The Dock shows a Substrate icon.

### Screenshot

The runbook asks for a screenshot of the running window. `screencapture` on this box refuses from a non-interactive shell with "could not create image from display" — System Settings → Privacy & Security → Screen Recording does not grant the shell. The human takes the screenshot by hand (⇧⌘5 → Capture Selected Window → the Substrate window), and saves it alongside the logs if a record is wanted.

## 7. Verified 2026-10-27, 21:16 — 21:24

Executed in `substrate-ui/`, under sprint `process/sprints/sprint-190-build-release-runbook.md`. Every log sits at `substrate-ui/runs/packaged/sprint-190-20261027-211649/`.

| # | Command | Exit | Note |
|---|---|---|---|
| 1 | `ruff check .` | 0 | `All checks passed!` |
| 2 | `ruff format --check .` | **1** | `9 files would be reformatted, 62 files already formatted`. One of the two findings this run surfaced. |
| 3 | `gen_kinds.py --check` | 0 | — |
| 4 | `npm run build` | 0 | `dist/reveal.html 280.51 kB (gzip 64.06)`, `dist/assets/reveal-COEa9GEn.js 79.99 kB (gzip 24.64)`, 173 ms. |
| 5 | `npm run test:unit` | 0 | 62 tests pass, 0 fail, 97 ms. Signal-vocabulary parity ran first and found no drift against the 31-tag lock. |
| 6 | `vm_smoke.ts` | **1** | 11 steps ok; `/help renders a slash-command listing … FAIL — (no help row)`. The second finding this run surfaced. |
| 7 | `npm run test:py` | 0 | 257 passed, 5 skipped (live-driver only, opt-in), 2 min 11 s. |
| 8 | `npm run pack:runtime` | 0 | CPython 3.14.4 downloaded, kernel wheel `substrate_kernel-1.1.2` built from HEAD `8e5f8b90`, 15 locked dependencies installed. `build/python/KERNEL_SOURCE`: `{commit=8e5f8b905d50..., version=1.1.2, releasable=true}`. Adapters-import gate ok (4 modules). 4 Mach-O files moved to `build/python-native/`. 338 `.pyc` precompiled. |
| 9 | `npm run pack:dev` | 0 | `skipped macOS code signing  reason=identity explicitly is set to null`. `dist-electron/mac-arm64/Substrate.app` + `Substrate-1.1.0-arm64.dmg` written. Nothing to Apple. |
| 10 | `packaged_app_smoke.ts` (`SMOKE_UNSIGNED=1`) | 0 | Timing: window at 2.61 s, prompt visible at 4.24 s, turn sent at 5.33 s, turn parked at 5.47 s, Structure populated at 5.47 s. Quit-to-backend-gone: 858 ms. Backends before quit: 1; after: 0. CLI roster: `claude, codex, cursor-agent`. |
| 11 | shakeout Axis C, packaged | 0 | 3 flows all ok 1/1: `electron_smoke 2.49 s / 49 emits`, `electron_menu 2.21 s`, `electron_deeplink 3.64 s`. 5/5 tags green. |
| 12 | shakeout Axis A, packaged | **1** | 10 flows all ok 1/1. **One real defect: `slash_router` reports "no 'slash commands:' row", severity high.** Same bug the controller smoke caught at step 6 — `/help` does not render a listing. 29 of 29 tags green otherwise. |
| 13 | `lifecycle_gates.ts`, packaged | 0 | 13/13 checks pass. F6 window close + Dock activate on the same backend; F5 `substrate://record/<path>` deep link attached; F7 unusable `SUBSTRATE_HOME` → "Substrate could not start" dialog; F8 SIGKILL on backend → "backend stopped" dialog, "exited with code 137". No backend left after quit. |
| 14 | `transcript_follow.ts`, packaged | 0 | — |
| 15 | `tasks_gate.ts`, packaged | 0 | — |
| 16 | `resume_ended_session.ts`, packaged | 0 | `s_f472e0e6cd44... ended, re-attached, resumed; replies ["ok","yes"], status parked`. |
| 17 | `osascript ... Substrate quit` | 0 | No running `Substrate.app`. |
| 18 | trash old | 0 | Old `CFBundleVersion 1791973867` moved to `~/.Trash/Substrate-1791973867-replaced-20261027-212407.app`. |
| 19 | `ditto` new | 0 | `/Applications/Substrate.app` now carries `CFBundleVersion 1793161234`. |
| 21 | `open` | 0 | Main pid 60405; backend pid 60666. Log tail reads `[electron] server up on http://127.0.0.1:55546`. `[server] boot_scan: 92 manifest(s) in 0.03s`. |

**On disk after this run:** `/Applications/Substrate.app` is the unsigned build 1793161234, running, serving the window on `http://127.0.0.1:55546`. The trashed prior build sits at `~/.Trash/Substrate-1791973867-replaced-20261027-212407.app`.

**Two findings this run surfaced** (both repeat on rerun; both would fail `scripts/release.sh` at stage 2):

- `ruff format --check .` wants to reformat nine files. The release path's stage 2 reads `ruff format --check` and refuses on exit 1. A `ruff format .` run clears it; the diff is auto-formatter output, no logic change.
- `/help` renders nothing. Caught by `vm_smoke.ts` and by `shakeout/slash_router.ts`'s declared defect `help_no_listing: no 'slash commands:' row`, severity high. The release path's shakeout stage carries this out as a defect; the shakeout exits 1.

## 8. Known gates that exit non-zero on the current tree

- `vm_smoke.ts`: `/help` row missing (see § 7).
- `shakeout Axis A → slash_router`: same `/help` defect (see § 7).
- `ruff format --check .`: nine files out of format.

A green release path requires each of the above resolved. The no-Apple path still produces a working app with these open; the installed app runs, every other gate passes.

## 9. Procedure — the release path

Everything in § 5 plus:

- Stage 1 enforces clean `substrate-ui/` and clean `substrate/src/` and `substrate/pyproject.toml`.
- Stage 4 runs electron-builder with `-c.mac.notarize=true` and the Apple identity.
- Stage 5 runs `codesign --verify --deep --strict` on the built bundle, and `PlistBuddy` reads back `SubstrateUICommit` and `SubstrateKernelCommit`.
- Stage 7 runs `codesign --verify --deep --strict` on the installed `.app` after `ditto`.

One command: `scripts/release.sh --notarize --install` with the three Apple env vars set.

### Apple credentials

Not secrets:

- Team ID `ZVL8XB9XGU`.
- App Store Connect API key ID `C3977SD347` → `APPLE_API_KEY_ID`.
- App Store Connect issuer UUID `ce7e5b05-566f-4024-bdfc-e7de968b3218` → `APPLE_API_ISSUER`.

The one secret:

- `~/.appstoreconnect/private_keys/AuthKey_C3977SD347.p8` → `APPLE_API_KEY`. `chmod 600`. Never commits.

Verification without a notary submission: `xcrun notarytool history --key <p8> --key-id <id> --issuer <uuid>` returns a list, not HTTP 401.

## 10. Troubleshooting

- **`fetch-python-runtime.sh` dies with "source mode runs Python X.Y.Z; this script bundles 3.14.4".** `../substrate`'s `uv run python` is a different version. Align `uv.lock` and `.python-version` in `../substrate`, or bump `PY_TAG` and `PY_VER` at the top of `scripts/fetch-python-runtime.sh`.
- **`fetch-python-runtime.sh` prints `VERIFICATION BUILD`.** `../substrate/src/` or `../substrate/pyproject.toml` is dirty. Commit the kernel first, or accept the unsigned local bundle marked non-releasable.
- **`pack:dev` fails on `electron-builder.config.js` not finding `build/icon.icns`.** `scripts/make_icon.py` builds it; run it once.
- **`packaged_app_smoke.ts` dies with "wrong team: expected TeamIdentifier=ZVL8XB9XGU".** The bundle is unsigned. Pass `SMOKE_UNSIGNED=1` on the no-Apple path.
- **`packaged_app_smoke.ts` dies with "stale build".** The bundle is older than one of its inputs. Rerun `npm run pack:dev`.
- **`packaged_app_smoke.ts` dies with "driver <name> not in /api/models roster".** `SMOKE_DRIVER` names a driver not installed on the box. Omit the env var to use the app's own default, or pass `deterministic`.
- **A gate fails with "port already bound".** Kill the squatter the error names. The gates refuse a shared port by design.
- **`osascript ... Substrate quit` returns a modal "User canceled" error.** A dialog is open in the running app. Dismiss it by hand and rerun step 17.
- **The window does not appear after `open /Applications/Substrate.app`.** Read `~/Library/Logs/Substrate/substrate.log` — on packaged mode, the backend writes its startup errors there before the dialog fires.
- **Screenshot: `screencapture: could not create image from display`.** The shell lacks Screen Recording permission. System Settings → Privacy & Security → Screen Recording → add `Terminal` (or `iTerm`, `WezTerm`, etc.), or take the screenshot by hand with ⇧⌘5.

## 11. Rollback

- **Of the install.** `osascript -e 'tell application "Substrate" to quit'`; `mv /Applications/Substrate.app ~/.Trash/`; `mv ~/.Trash/Substrate-<prior-CFBundleVersion>-replaced-*.app /Applications/Substrate.app`; `open /Applications/Substrate.app`. The trashed `.app` always survives one install.
- **Of a release.** The notary ticket cannot be rescinded in the general case. Issue a new build with a higher `CFBundleVersion` and ship that; Apple's notary accepts the new one.
- **Of the Python runtime.** `rm -rf build/python build/python-native dist-electron && npm run pack:runtime && npm run pack:dev`.

## 12. References

- `substrate-ui/scripts/release.sh` — the seven stages.
- `substrate-ui/scripts/fetch-python-runtime.sh` — the Python bundle and the kernel wheel.
- `substrate-ui/electron-builder.config.js` — the macOS packaging.
- `substrate-ui/package.json` — the shortcut names.
- `substrate-ui/electron/main.js` — what the installed app does at launch.
- `substrate-ui/WORKING_AGREEMENT.md` — build commands and the Apple identifiers.
- `substrate-ui/harness/shakeout/*.ts` — every gate the release runs.
- `substrate-ui/tests/*.py` — every pytest the release runs.
- `substrate-ui/process/sprints/sprint-190-build-release-runbook.md` — the sprint card for this runbook's first execution.
- `substrate-ui/runs/packaged/sprint-190-20261027-211649/` — the log of every command in § 7.

---

*This file is dated. A new round lands as a new file beside it; it is not edited in place.*
