# RUNBOOK — substrate-ui

*2026-11-11, round 9. Earlier rounds: `process/archive/` and `process/planning/2026-10-11-before-distribution/superseded/`.*

| Owner | the Architect (Peter Laffey) |
| --- | --- |
| Last updated | 2026-11-11 |
| Last run end to end | 2026-11-11, 22:03 — 22:16, no-Apple build + install, steps 1 — 20 all 0, build 1794463909; logs at `runs/packaged/sprint-486-20261111-220313/` (sprint 486). |
| Scope | `substrate-ui/` only |
| Depends on | `../substrate/` |
| Workspace | `../README.md` says what every item around this repo is and where moved items went |
| Methodology | `../sdd-kit-3/` |

---

## 1. Orientation

"Read" means `Read` of the whole file, unless a line below says otherwise.

### 1.1 The methodology

`CLAUDE.md` at this repo's root imports `../sdd-kit-3/AGENTS.md`, so Claude Code loads it at session start and again after a compaction. Read the entire kit — every file in `../sdd-kit-3/` (excluding `_prior-2026-10-29/` and `example/`). The reading order:

1. `AGENTS.md` — the working agreement (auto-loaded, but read it in full if compacted).
2. `foundations/01-signal-driven-development.md`, `02-sdd-practice.md`, `03-sdd-team-model.md`, `04-sdd-claude-design.md` — the four canon documents.
3. `grammar/README.md`, `grammar/PRINCIPLES.md`, `grammar/BOOTSTRAP.md` — the vocabulary discipline.
4. `TECHNIQUES.md` — the full catalog of named development techniques.
5. `ADDENDUMS.md`, `ADDENDUM_PROMPT.md` — addenda.
6. `templates/` — `SPRINT_CARD.md`, `SIGNAL_REPORT.md`, `BLACKBOARD.md`, `KIT_DIARY.md`, `WORKING_AGREEMENT.md`, `VOCABULARY.json`.
7. `handoffs/README.md`, `handoffs/TEMPLATE-handoff.md`.
8. `process-not-prompt-research.md`, `process-not-prompt-summary.md`.

Read the whole kit first; after that, the reading list in `AGENTS.md` ("What you read at session start") is enough.

### 1.2 The record for this repo

- `README.md`
- `CLAUDE.md` — names where the records live.
- `WORKING_AGREEMENT.md`
- `BLACKBOARD.md` — one append-only stream, newest entry at the bottom (the section "The BLACKBOARD protocol" of `../sdd-kit-3/AGENTS.md`). Read its header; then every decision entry (`grep -nE '^- \*\*[0-9-]{10} (user|agent-resolved)\*\*' BLACKBOARD.md`); then its end (`tail -n 60 BLACKBOARD.md`).
- `KIT_DIARY.md` — newest entry last. Read its end: `tail -n 120 KIT_DIARY.md`.

### 1.3 The current direction

- `process/planning/README.md` — the index of every piece of work, its status and its sprints. Read it whole.
- Each folder it marks open, every file in it (not its `superseded/`). On 2026-11-11: `2026-10-08-lens-audit/`, `2026-10-10-model-picker/`, `2026-10-11-before-distribution/`, `2026-11-05-editor-shared-work/`, `2026-11-09-code-editor/`, `2026-11-09-feature-breakdown/`, all under `process/planning/`.
- `process/planning/OPEN-ITEMS-2026-10-10.md`
- `process/BACKLOG.md`
- `process/methodology/2026-09-24-autonomous-build-topology.md`

Open a file in a folder the index marks closed only when a current document points to it.

### 1.4 The code

- `electron/main.ts`, `electron/menu.ts`, `electron/preload.ts`
- `server.py`
- `web/reveal.html`, `web/reveal.ts`, `web/app/` (`App.tsx`, its components, `editor/`, `state/`, `derive/`)
- `web/vm/`
- `web/reveal/transcript/`
- `harness/shakeout/`
- `tests/`

### 1.5 The build system

- `scripts/release.sh`
- `scripts/fetch-python-runtime.sh`
- `electron-builder.config.js`
- `package.json`

### 1.6 The kernel

`../substrate/` has no runbook. Its `CLAUDE.md` imports the same kit and names its records under `process/`: `process/WORKING_AGREEMENT.md`, `process/BLACKBOARD.md`, `process/KIT_DIARY.md`.

---

## 2. Inventory

| Surface | Path |
| --- | --- |
| Electron main | `electron/main.ts` (compiled into `dist-main/`) |
| Backend | `server.py` |
| Window source | `web/` |
| Window built | `web/dist/` |
| Backend tests | `tests/` |
| Client specs | `web/reveal/__tests__/*.spec.ts`, `web/app/__tests__/*.spec.ts` |
| Gates | `harness/shakeout/*.ts` |
| Local bundle (unsigned) | `dist-electron/mac-arm64/Substrate.app` |
| Local test bundle (unsigned) | `dist-electron-next/mac-arm64/Substrate Next.app` |
| Installed bundle | `/Applications/Substrate.app` |
| Installed test bundle | `/Applications/Substrate Next.app` |
| Identity records | `electron/identity.json` (one per install: name, bundle id, executable, store, link scheme) |
| Dev state | `~/.substrate-dev/` |
| Installed state | `~/.substrate/` |
| Test install state | `~/.substrate-next/` |
| App logs | `~/Library/Logs/Substrate/substrate.log` (`Substrate Dev/` when `SUBSTRATE_HOME` is set) |
| Release logs | `runs/packaged/release-<stamp>-*.log` |

---

## 3. Prerequisites

- macOS, Apple silicon.
- `uv` on `PATH`.
- Node and `npm` on `PATH`. `package.json` names no minimum; this machine runs Node v25.9.0.
- `../substrate/` checked out beside this repo.
- First run of this repo: `npm install`.
- Release only: `APPLE_API_KEY`, `APPLE_API_KEY_ID`, `APPLE_API_ISSUER` in the environment. The three non-secret identifiers sit in the section "External SDK bridge mappings" of `WORKING_AGREEMENT.md`; the private key lives at `~/.appstoreconnect/private_keys/AuthKey_<id>.p8`, `chmod 600`, uncommitted.

---

## 4. Pick a chapter

| Trigger | Chapter |
| --- | --- |
| First day on this repo | Orientation |
| "Does the current tree build and install?" | Build and install — no Apple |
| "Make a tested build the one I work in" | Build and install — no Apple (it replaces `/Applications/Substrate.app`; Rollback puts the old one back) |
| "Build the next version and install it beside the one in use" | Build and install the test install |
| "Ship a signed, notarized build" | Build and release — with Apple |
| "Edit source and try it in a running app" | Day-to-day development |
| "Run only the automated checks" | Tests only |
| An installed Substrate crashed or hung | Troubleshooting |

---

## 5. Build and install — no Apple

Run from this repo's root. Each command's log goes to `runs/packaged/<sprint-id>-<stamp>/NN-<name>.log`. The bundle is unsigned. No step contacts Apple.

| # | Command | Exit | Notes |
| --- | --- | --- | --- |
| 1 | `uv run --project ../substrate ruff check .` | 0 | Lint. |
| 2 | `uv run --project ../substrate ruff format --check .` | 0 | Formatter. Fails if any file is out of format. |
| 3 | `uv run --project ../substrate python scripts/gen_kinds.py --check` | 0 | Generated kernel-name files are current. |
| 4 | `npm run build` | 0 | `tsc --noEmit`, `tsc -p harness`, `tsc -p electron` into a cleared `dist-main/`, mypy on `server.py`, eslint, `vite build` into `web/dist/`. |
| 5 | `npm run test:unit` | 0 | Signal-vocabulary parity (`npm run signals`), then `npx tsx --test web/reveal/__tests__/*.spec.ts web/app/__tests__/*.spec.ts`. |
| 6 | `npx tsx harness/vm_smoke.ts` | 0 | Controller against the harness's own server. |
| 7 | `npm run test:py` | 0 | `uv run --project ../substrate python -m pytest tests/ -q -p no:cacheprovider`. |
| 8 | `npm run pack:runtime` | 0 | `scripts/fetch-python-runtime.sh`: CPython 3.14.4, kernel wheel built from `../substrate` HEAD. A dirty kernel `src/` or `pyproject.toml` writes `build/python/VERIFICATION_BUILD` and marks the runtime not releasable. |
| 9 | `npm run pack:dev` | 0 | Runs steps 4 and 8 first, then electron-builder with `-c.mac.identity=null -c.mac.notarize=false`. The log prints `skipped macOS code signing  reason=identity explicitly is set to null`. Writes `dist-electron/mac-arm64/Substrate.app` and `Substrate-<v>-arm64.dmg`. |
| 10 | `SMOKE_UNSIGNED=1 SMOKE_DRIVER=deterministic SMOKE_APP=$APP npx tsx harness/shakeout/packaged_app_smoke.ts` | 0 | `$APP = $PWD/dist-electron/mac-arm64/Substrate.app`. |
| 11 | `SHAKEOUT_APP=$APP SHAKEOUT_AXIS=C SHAKEOUT_RUNS=1 npx tsx harness/shakeout/run.ts` | 0 | Electron flows against the bundle. |
| 12 | `SHAKEOUT_APP=$APP SHAKEOUT_AXIS=A SHAKEOUT_RUNS=1 npx tsx harness/shakeout/run.ts` | 0 | Controller flows against the bundle. |
| 13 | `LIFECYCLE_APP=$APP npx tsx harness/shakeout/lifecycle_gates.ts` | 0 | F5 deep link, F6 Dock activate, F7 bad `SUBSTRATE_HOME`, F8 backend killed. |
| 14 | `SCROLL_APP=$APP npx tsx harness/shakeout/transcript_follow.ts` | 0 | |
| 15 | `TASKS_APP=$APP npx tsx harness/shakeout/tasks_gate.ts` | 0 | |
| 16 | `SMOKE_APP=$APP npx tsx harness/shakeout/resume_ended_session.ts` | 0 | |
| 17 | `osascript -e 'tell application "Substrate" to quit'` | 0 or non-zero | Both allowed. Wait up to 60 s for the pid to go. |
| 18 | `mv /Applications/Substrate.app ~/.Trash/Substrate-<old-CFBundleVersion>-replaced-<stamp>.app` | 0 | Only when `/Applications/Substrate.app` existed. |
| 19 | `ditto dist-electron/mac-arm64/Substrate.app /Applications/Substrate.app && xattr -dr com.apple.quarantine /Applications/Substrate.app` | 0 | Install. The bundle is unsigned, so there is no `codesign --verify` after. |
| 20 | `open /Applications/Substrate.app` | 0 | Launch. |

### 5.1 Verification

- `/Applications/Substrate.app/Contents/Info.plist`: `CFBundleVersion` is strictly greater than the trashed version (`electron-builder.config.js` line 101). `SubstrateKernelCommit` equals `../substrate`'s HEAD. `SubstrateKernelVersion` equals the version in `../substrate/pyproject.toml`.
- `pgrep -f "/Applications/Substrate.app/Contents/MacOS/Substrate"` returns the main pid.
- `pgrep -f "/Applications/Substrate.app/Contents/Resources/python/bin/python3"` returns the backend pid.
- `~/Library/Logs/Substrate/substrate.log` tail reads `app boot`, `spawning server`, `server bound port=<n>`, `server up on http://127.0.0.1:<n>`.
- A Substrate window is visible with `titleBarStyle: hiddenInset`.

### 5.2 Rollback

```
osascript -e 'tell application "Substrate" to quit'
# wait for the pid to go
mv /Applications/Substrate.app ~/.Trash/
mv ~/.Trash/Substrate-<prior-CFBundleVersion>-replaced-*.app /Applications/Substrate.app
open /Applications/Substrate.app
```

---

## 5A. Build and install the test install

The test install is Substrate Next: its own name, bundle id (`com.greenrosesystems.substrate.next`), store (`~/.substrate-next`), data folder, logs (`~/Library/Logs/Substrate Next`) and link scheme (`substrate-next://`), from its record in `electron/identity.json`. It runs beside `/Applications/Substrate.app`. Run from this repo's root; per-command logs go to `runs/packaged/<sprint-id>-<stamp>/NN-<name>.log`. `$APP = "$PWD/dist-electron-next/mac-arm64/Substrate Next.app"`.

| # | Command | Exit | Notes |
| --- | --- | --- | --- |
| 1–8 | Steps 1–8 of "Build and install — no Apple" | 0 | Unchanged. |
| 9 | `npm run pack:next` | 0 | Builds with `SUBSTRATE_INSTALL=next` into `dist-electron-next/`, then renames the bundle to `Substrate Next.app`. |
| 10–16 | Steps 10–16 of "Build and install — no Apple" with `$APP` as above | 0 | The gates launch the bundle with their own `SUBSTRATE_HOME`, as for the working bundle. |
| 17 | `osascript -e 'tell application "Substrate Next" to quit'` | 0 or non-zero | Quits only the test install. Wait up to 60 s for its pid to go. |
| 17a | `npx tsx harness/shakeout/two_installs.ts` | 0 | Needs the working install running. Opens the new bundle beside it and checks that each keeps to its own lock, store and logs. |
| 18 | `mv "/Applications/Substrate Next.app" ~/.Trash/"Substrate Next-<old-CFBundleVersion>-replaced-<stamp>.app"` | 0 | Only when it existed. |
| 19 | `ditto "$APP" "/Applications/Substrate Next.app" && xattr -dr com.apple.quarantine "/Applications/Substrate Next.app"` | 0 | Install. |
| 20 | `open -g "/Applications/Substrate Next.app"` | 0 | Launch, in the background. |

### 5A.1 Verification

- `/Applications/Substrate Next.app/Contents/Info.plist`: `CFBundleName` Substrate Next, `CFBundleIdentifier` com.greenrosesystems.substrate.next, `CFBundleVersion` strictly greater than the trashed one.
- `~/Library/Logs/Substrate Next/substrate.log` tail reads `app boot`, `server up`; its trace's `APP_BOOTED` reads `app_name` Substrate Next.
- The working install's main pid is the one it had before step 1, and its `server.jsonl` for its boot holds one `SERVER_STARTED`.

### 5A.2 Rollback

```
osascript -e 'tell application "Substrate Next" to quit'
# wait for the pid to go
mv "/Applications/Substrate Next.app" ~/.Trash/
mv ~/.Trash/"Substrate Next-<prior-CFBundleVersion>-replaced-"*.app "/Applications/Substrate Next.app"
open -g "/Applications/Substrate Next.app"
```

---

## 6. Build and release — with Apple

`scripts/release.sh --notarize --install`, from this repo. Any stage fails, nothing lands. The stages, from the script's header (lines 14 — 27):

| Stage | What |
| --- | --- |
| 1 clean trees | `git status --porcelain` on `substrate-ui/` (outside `runs/packaged/` and `captures/`) and on `../substrate/src/` + `../substrate/pyproject.toml`. Both must be empty. |
| 2 tests | substrate-ui pytest under an empty `HOME`, generated envelope kinds current, ruff check and format, `tsc` + `eslint` + `vite build`, `test:unit`, `vm_smoke`. |
| 3 bundled runtime | Step 8 of "Build and install — no Apple". |
| 4 electron-builder | Signs (and notarizes with `--notarize`); records `SubstrateUICommit` and `SubstrateKernelCommit` in Info.plist. |
| 5 signature | `codesign --verify --deep --strict` on the built bundle. |
| 6 gates against the built bundle | `smoke:packaged`, `shakeout:packaged` (Axes A, B, C), the lifecycle gates, the transcript scroll gate, the background-tasks gate. Anything a gate writes to real-`HOME` paths fails the release. A second `codesign --verify` after. |
| 7 install (`--install`) | Quit the running app, move the old bundle to the Trash, copy this one in, verify its signature where it landed. |

### 6.1 Verification

The Verification checks of "Build and install — no Apple", plus: `codesign --verify --deep --strict /Applications/Substrate.app` returns clean. `xcrun stapler validate` on the `.dmg` passes. `spctl --assess --type execute --verbose=4 Substrate.app` reports `accepted, source=Notarized Developer ID`.

### 6.2 Rollback

Ship a new build with a higher `CFBundleVersion`. A notary ticket cannot be withdrawn in the general case.

---

## 7. Day-to-day development

- `npm run electron` compiles `electron/` into `dist-main/` and runs `SUBSTRATE_HOME=$HOME/.substrate-dev electron .`. The app names itself "Substrate Dev". The backend is `server.py`, started as `uv run python server.py --port 0` in `../substrate` (`electron/main.ts`, the source branch of the spawn before the `spawning server` log line).
- Window source: edit `web/reveal.html`, `web/reveal.ts`, `web/app/**/*.tsx` and `*.ts`, `web/vm/*.ts`, `web/reveal/transcript/*.tsx`. The gates run the built window in `web/dist/`, so `npm run build` comes before a gate.
- Backend source: edit `server.py`, `session_errors.py`, `demo_topologies.py`. Restart `npm run electron`.
- Kernel source: edit `../substrate/src/substrate/`. The editable install picks it up.

---

## 8. Tests only

- `npm run test:py` — pytest.
- `npm run test:unit` — vocabulary parity, then the client specs in `web/reveal/__tests__/` and `web/app/__tests__/`.
- `npx tsx harness/vm_smoke.ts` — controller against the harness's own server.
- `npm run gates:electron` — Axis C shakeout, then the lifecycle gates, then the rest of the chained Electron gates against source.
- `npm test` — `test:py`, `test:unit`, `vm_smoke`, `shakeout` (one run), `gates:electron`, in that order.
- `SHAKEOUT_APP=$APP ... run.ts` and `*_APP=$APP ... .ts` — individual gates against a built bundle at `$APP`.

---

## 9. Working with the Architect

- Each ask is written into the roadmap and `process/planning/OPEN-ITEMS-2026-10-10.md` before work on it starts (`WORKING_AGREEMENT.md` line 135).
- During live app testing: finish one item, report, stop.
- A narrow ask changes only what it names.
- Writing: plain register, every sentence a fact, active voice.
- Memory: `~/.claude/projects/-Users-peterlaffey-Documents-Claude-Projects-Agent-Orchestration/memory/`.

---

## 10. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `fetch-python-runtime.sh`: "source mode runs Python X.Y.Z; this script bundles 3.14.4" | `../substrate`'s `uv run python` is a different version | Align `uv.lock` and `.python-version` in `../substrate`, or bump `PY_TAG`/`PY_VER` in the script |
| `fetch-python-runtime.sh`: `VERIFICATION BUILD` | `../substrate/src/` or `pyproject.toml` is dirty | Commit the kernel, or accept the unsigned bundle marked not releasable |
| `pack:dev`: `build/icon.icns` not found | Icon not generated | `uv run python scripts/make_icon.py` |
| `packaged_app_smoke.ts`: "wrong team: expected TeamIdentifier=…" | Unsigned bundle | Pass `SMOKE_UNSIGNED=1` on the no-Apple path |
| `packaged_app_smoke.ts`: "stale build" | A source file is newer than the bundle | `npm run pack:dev` |
| `packaged_app_smoke.ts`: "driver <name> not in /api/models roster" | `SMOKE_DRIVER` names a driver not installed | Omit the env var, or pass `deterministic` |
| A gate: "port <n> already bound (pid <p>)" | Another process owns the shakeout port | Stop the pid the error names, if it is one this session started |
| `osascript ... Substrate quit`: "User canceled" | A modal is open in the running app | Dismiss it by hand; rerun step 17 |
| Window does not appear after `open` | Backend crashed at startup | Read `~/Library/Logs/Substrate/substrate.log` |
| `screencapture: could not create image from display` | The shell lacks Screen Recording permission | System Settings → Privacy & Security → Screen Recording → add the shell |
| `ruff format --check .` exits 1 | A Python file written out of format | `uv run --project ../substrate ruff format .` and commit; required for a release |

### 10.1 Known failures on the current tree (checked 2026-11-11, sprint 486)

- None.

---

## 11. Rollback across chapters

- Install (either build chapter): the Rollback steps of "Build and install — no Apple".
- Release: the Rollback note of "Build and release — with Apple".
- Python runtime bundle: `rm -rf build/python build/python-native dist-electron && npm run pack:dev` (which runs `pack:runtime`).
- Dev state: `rm -rf ~/.substrate-dev`.

---

## 12. Escalation

- A sprint cannot close on the three grounds in the section "Resolve-and-record" of `../sdd-kit-3/AGENTS.md` → ask the Architect in chat; keep working on independent work.
- A gate reports a defect the sprint card does not name → append a `surfaced` entry at the end of `BLACKBOARD.md` in the same turn, and say so in chat.
- A production incident on the installed app → read `~/Library/Logs/Substrate/substrate.log` first; `~/.substrate/sessions/<id>/record/events-*.jsonl` holds the per-session record.

---

## 13. Conventions

- The eight-word vocabulary binds the window's user-facing text (the section "Tone canon" of `WORKING_AGREEMENT.md`): Producer, Bus, View, Predicate, Trigger, Route, TerminationPolicy, Topology.
- `BLACKBOARD.md` and `KIT_DIARY.md` are append-only: new entries go at the end; nothing above is edited.
- Documents follow `WORKING_AGREEMENT.md `## Documents``: one folder per piece of work under `process/planning/`, listed in `process/planning/README.md`.
- No in-place edits to planning files, docs, specs, memory bodies, or this runbook. New round, new file.
- No `rm` or `rmdir` on committed artifacts.
- No `Co-Authored-By: Claude` trailer. No "Generated with Claude Code" footer.

---

## 14. References

- `scripts/release.sh`, `scripts/fetch-python-runtime.sh`, `electron-builder.config.js`, `package.json`, `electron/main.ts`, `WORKING_AGREEMENT.md`

---

## 15. Session startup

Copy-paste this at the start of a session on this repo.

```
Read the entire sdd-kit-3 first (section 1.1 has the file list and reading order). Then read, each in full unless a line says otherwise:

1.  README.md
2.  WORKING_AGREEMENT.md
3.  BLACKBOARD.md — the header; every decision entry (grep -nE '^- \*\*[0-9-]{10} (user|agent-resolved)\*\*' BLACKBOARD.md); then the end (tail -n 60 BLACKBOARD.md)
4.  KIT_DIARY.md — the end: tail -n 120 KIT_DIARY.md
5.  process/planning/README.md — the index of every piece of work
6.  Each folder the index marks open, every file in it (not its superseded/)
7.  process/planning/OPEN-ITEMS-2026-10-10.md
8.  process/BACKLOG.md
9.  process/methodology/2026-09-24-autonomous-build-topology.md
10. electron/main.ts, electron/menu.ts, electron/preload.ts, server.py
11. web/reveal.html, web/reveal.ts, web/app/, web/vm/, web/reveal/transcript/
12. harness/shakeout/, tests/
13. scripts/release.sh, scripts/fetch-python-runtime.sh, electron-builder.config.js, package.json
```
