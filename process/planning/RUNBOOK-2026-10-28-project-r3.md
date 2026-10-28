# RUNBOOK — substrate-ui

*2026-10-28, round 3. Supersedes rounds 1 and 2. Scope: `substrate-ui/`. The kernel is in the sibling repo `substrate/` and has its own runbook.*

| Owner | the Architect (Peter Laffey) |
| --- | --- |
| Last updated | 2026-10-28 |
| Last run end to end | 2026-10-27, 21:16 — 21:24, no-Apple build + install; logs at `runs/packaged/sprint-190-20261027-211649/` |
| Scope | `substrate-ui/` only |
| Depends on | `../substrate/` (its runbook lives in that repo) |

---

## 1. Orientation

Read every file below in order before writing or running anything. "Read" means `Read` of the whole file. BLACKBOARD and KIT_DIARY: tail only.

### 1.1 The methodology

Read `../sdd-kit-4/` in full. Every file.

### 1.2 The record for this repo

- `README.md`
- `CLAUDE.md`
- `WORKING_AGREEMENT.md`
- `BLACKBOARD.md` — tail the last 10 blocks under `## Surfaced for review`, the last 10 under `## Sprint tail`, the last 10 under `## Built`.
- `KIT_DIARY.md` — tail the last 10 entries.

### 1.3 The current direction

Open roadmaps only.

- `process/planning/open/ROADMAP-2026-10-11-before-distribution.md`
- `process/planning/open/ROADMAP-2026-10-10-model-picker-in-the-workspace-bar.md`
- `process/planning/open/ROADMAP-2026-10-08-lens-audit-remediation.md` and its ledger beside it.
- `process/planning/OPEN-ITEMS-2026-10-10.md`
- `process/BACKLOG.md`
- `process/planning/DESIGN-2026-10-13-language-in-the-app-r2.md`
- `process/methodology/2026-09-24-autonomous-build-topology.md`

Completed roadmaps sit in `process/planning/completed/`; superseded in `process/planning/superseded/`. Read them only when a current item points back.

### 1.4 The code

- `electron/main.js`
- `server.py`
- `web/reveal.html`, `web/reveal.ts`, `web/reveal_component.ts`
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

Its runbook is `../substrate/process/planning/RUNBOOK-*.md` (newest round).

---

## 2. Inventory

| Surface | Path |
| --- | --- |
| Electron main | `electron/main.js` |
| Backend | `server.py` |
| Window source | `web/` |
| Window built | `web/dist/` |
| Backend tests | `tests/` |
| Client specs | `web/reveal/__tests__/*.spec.ts` |
| Gates | `harness/shakeout/*.ts` |
| Local bundle (unsigned) | `dist-electron/mac-arm64/Substrate.app` |
| Installed bundle | `/Applications/Substrate.app` |
| Dev state | `~/.substrate-dev/` |
| Installed state | `~/.substrate/` |
| App logs | `~/Library/Logs/Substrate/substrate.log` |
| Release logs | `runs/packaged/release-<stamp>-*.log` |

---

## 3. Prerequisites

- macOS, Apple silicon.
- `uv` on `PATH`.
- Node 20 or newer, `npm` on `PATH`.
- `../substrate/` checked out beside this repo.
- First run of this repo: `npm install`.
- Release only: `APPLE_API_KEY`, `APPLE_API_KEY_ID`, `APPLE_API_ISSUER` in the environment. The three non-secret identifiers sit in `WORKING_AGREEMENT.md § External SDK bridge mappings`; the private key lives at `~/.appstoreconnect/private_keys/AuthKey_<id>.p8`, `chmod 600`, uncommitted.

---

## 4. Pick a chapter

| Trigger | Chapter |
| --- | --- |
| First day on this repo | § 1 |
| "Does the current tree build and install?" | § 5 |
| "Ship a signed, notarized build" | § 6 |
| "Edit source and try it in a running app" | § 7 |
| "Run only the automated checks" | § 8 |
| An installed Substrate crashed or hung | § 10 |

---

## 5. Build and install — no Apple

Run from this repo's root. Every command writes a per-command log to `runs/packaged/<sprint-id>-<stamp>/NN-<name>.log`. The bundle is unsigned. No step contacts Apple.

| # | Command | Exit | Notes |
| --- | --- | --- | --- |
| 1 | `uv run --project ../substrate ruff check .` | 0 | Lint. |
| 2 | `uv run --project ../substrate ruff format --check .` | 0 | Formatter. Fails if any file is out of format. |
| 3 | `uv run --project ../substrate python scripts/gen_kinds.py --check` | 0 | Generated kernel-name files are current. |
| 4 | `npm run build` | 0 | `tsc` on app and harness, `eslint web/`, `vite build` into `web/dist/`. |
| 5 | `npm run test:unit` | 0 | Signal-vocabulary parity first, then `node --test`. |
| 6 | `npx tsx harness/vm_smoke.ts` | 0 | Controller against the harness's own server. |
| 7 | `npm run test:py` | 0 | Pytest, under a `mktemp HOME`. |
| 8 | `npm run pack:runtime` | 0 | CPython 3.14.4, kernel wheel built from `../substrate` HEAD, locked deps. `build/python/KERNEL_SOURCE.releasable == true` on a clean kernel `src/`. |
| 9 | `npm run pack:dev` | 0 | electron-builder with `-c.mac.identity=null -c.mac.notarize=false`. The log prints `skipped macOS code signing  reason=identity explicitly is set to null`. Writes `dist-electron/mac-arm64/Substrate.app` and `Substrate-<v>-arm64.dmg`. |
| 10 | `SMOKE_UNSIGNED=1 SMOKE_DRIVER=deterministic SMOKE_APP=$APP npx tsx harness/shakeout/packaged_app_smoke.ts` | 0 | `$APP = $PWD/dist-electron/mac-arm64/Substrate.app`. |
| 11 | `SHAKEOUT_APP=$APP SHAKEOUT_AXIS=C SHAKEOUT_RUNS=1 npx tsx harness/shakeout/run.ts` | 0 | Three Electron flows against the bundle. |
| 12 | `SHAKEOUT_APP=$APP SHAKEOUT_AXIS=A SHAKEOUT_RUNS=1 npx tsx harness/shakeout/run.ts` | 0 (see § 10) | Ten controller flows against the bundle. |
| 13 | `LIFECYCLE_APP=$APP npx tsx harness/shakeout/lifecycle_gates.ts` | 0 | F5 deep link, F6 Dock activate, F7 bad `SUBSTRATE_HOME`, F8 backend killed. |
| 14 | `SCROLL_APP=$APP npx tsx harness/shakeout/transcript_follow.ts` | 0 | |
| 15 | `TASKS_APP=$APP npx tsx harness/shakeout/tasks_gate.ts` | 0 | |
| 16 | `SMOKE_APP=$APP npx tsx harness/shakeout/resume_ended_session.ts` | 0 | |
| 17 | `osascript -e 'tell application "Substrate" to quit'` | 0 or non-zero | Both allowed. Wait up to 60 s for the pid to go. |
| 18 | `mv /Applications/Substrate.app ~/.Trash/Substrate-<old-CFBundleVersion>-replaced-<stamp>.app` | 0 | Only when `/Applications/Substrate.app` existed. |
| 19 | `ditto dist-electron/mac-arm64/Substrate.app /Applications/Substrate.app` | 0 | Install. The bundle is unsigned, so there is no `codesign --verify` after. |
| 20 | `open /Applications/Substrate.app` | 0 | Launch. |

### 5.1 Verification

- `/Applications/Substrate.app/Contents/Info.plist`: `CFBundleVersion` equals the epoch seconds at build time and is strictly greater than the trashed version. `SubstrateKernelCommit` equals `../substrate`'s HEAD. `SubstrateKernelVersion` equals the version in `../substrate/pyproject.toml`.
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

The last-trashed `.app` sits in `~/.Trash/` under its old `CFBundleVersion`.

### 5.3 Last end-to-end run

2026-10-27, 21:16 — 21:24 under `process/sprints/sprint-190-build-release-runbook.md`. Logs: `runs/packaged/sprint-190-20261027-211649/`. Steps 1 — 20 ran. Open findings on this tree:

- Step 2 (`ruff format --check .`) exit 1: nine files out of format.
- Steps 6 and 12 (`vm_smoke` and shakeout Axis A `slash_router`): `/help` renders no listing in the window; severity high.

---

## 6. Build and release — with Apple

`scripts/release.sh --notarize --install`, from this repo. Any stage fails, nothing lands.

| Stage | What |
| --- | --- |
| 1 clean trees | `git status --porcelain` on `substrate-ui/` (outside `process/`, `runs/packaged/`, `captures/`) and on `../substrate/src/` + `../substrate/pyproject.toml`. Both must be empty. |
| 2 tests and web build | § 5 steps 1 — 7. |
| 3 bundled runtime | § 5 step 8. A dirty kernel `src/` writes `VERIFICATION_BUILD` and the release refuses it. |
| 4 electron-builder | § 5 step 9 with the Apple identity and `notarize: true`. The signed bundle is zipped, submitted to Apple's notary, the ticket is stapled, the `.dmg` is built around the stapled `.app`. |
| 5 signature | `codesign --verify --deep --strict` on the built `.app`. `PlistBuddy` reads back `SubstrateUICommit` and `SubstrateKernelCommit`; both must equal the HEADs from stage 1. |
| 6 gates against the built bundle | § 5 steps 10 — 16, plus Axis B (real-model tool flows). A gate that writes outside its temp `SUBSTRATE_HOME` fails the release. Second `codesign --verify` after. |
| 7 install | § 5 steps 17 — 20, plus `codesign --verify --deep --strict /Applications/Substrate.app` after `ditto`. |

### 6.1 Verification

§ 5.1 plus: `codesign --verify --deep --strict /Applications/Substrate.app` returns clean. `xcrun stapler validate` on the `.dmg` passes. `spctl --assess --type execute --verbose=4 Substrate.app` reports `accepted, source=Notarized Developer ID`.

### 6.2 Rollback

Ship a new build with a higher `CFBundleVersion`. The notary ticket cannot be rescinded in the general case.

---

## 7. Day-to-day development

- `npm run electron` runs `SUBSTRATE_HOME=$HOME/.substrate-dev electron .`. Window title: "Substrate Dev". Backend: `uv run python server.py --port 0` from `../substrate`.
- Window source: edit `web/reveal.html`, `web/reveal.ts`, `web/reveal_component.ts`, `web/vm/*.ts`, `web/reveal/transcript/*.tsx`. The dev shell reloads on save.
- Backend source: edit `server.py`, `session_errors.py`, `demo_topologies.py`. Restart `npm run electron`.
- Kernel source: edit `../substrate/src/substrate/`. The editable install picks it up.

Dev state: `~/.substrate-dev/`. Installed state: `~/.substrate/`.

---

## 8. Tests only

- `npm run test:py` — pytest. ~2 min.
- `npm run test:unit` — vocabulary parity, then `node --test`. ~1 s.
- `npx tsx harness/vm_smoke.ts` — controller against the harness's own server. ~10 s.
- `npm run gates:electron` — chained Playwright suite against source. 20 — 40 min.
- `npm test` — chains all of the above.
- `SHAKEOUT_APP=$APP ... run.ts` and `*_APP=$APP ... .ts` — individual gates against a built bundle at `$APP`.

---

## 9. Working with the architect

- Each ask is written into a roadmap or `process/planning/OPEN-ITEMS-*.md` before work starts.
- During live app testing: finish one item, report, stop. Do not roll into the next.
- A narrow ask changes only what it names.
- Writing: plain register, every sentence a fact, active voice.
- Memory: `~/.claude/projects/-Users-peterlaffey-Documents-Claude-Projects-Agent-Orchestration/memory/`.

---

## 10. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `fetch-python-runtime.sh`: "source mode runs Python X.Y.Z; this script bundles 3.14.4" | `../substrate`'s `uv run python` is a different version | Align `uv.lock` and `.python-version` in `../substrate`, or bump `PY_TAG`/`PY_VER` in the script |
| `fetch-python-runtime.sh`: `VERIFICATION BUILD` | `../substrate/src/` or `pyproject.toml` is dirty | Commit the kernel, or accept the unsigned bundle marked non-releasable |
| `pack:dev`: `build/icon.icns` not found | First run, icon not generated | `uv run python scripts/make_icon.py` |
| `packaged_app_smoke.ts`: "wrong team: expected TeamIdentifier=ZVL8XB9XGU" | Unsigned bundle | Pass `SMOKE_UNSIGNED=1` on the no-Apple path |
| `packaged_app_smoke.ts`: "stale build" | Bundle older than one of its inputs | `npm run pack:dev` |
| `packaged_app_smoke.ts`: "driver <name> not in /api/models roster" | `SMOKE_DRIVER` names a driver not installed | Omit the env var, or pass `deterministic` |
| A gate: "port already bound" | A squatter owns the shakeout port | Stop the squatter by the pid the error names |
| `osascript ... Substrate quit`: "User canceled" | A modal is open in the running app | Dismiss by hand; rerun step 17 |
| Window does not appear after `open` | Backend crashed at startup | Read `~/Library/Logs/Substrate/substrate.log` |
| `screencapture: could not create image from display` | The shell lacks Screen Recording permission | System Settings → Privacy & Security → Screen Recording → add the shell; or take the screenshot by hand |
| `/help` prints nothing in the window | Open defect; two gates report it | A card is owed; the installed app is still usable |
| `ruff format --check .` exits 1 | Nine files out of format on the current tree | `ruff format .` and commit; required for a release |

### 10.1 Known failures on the current tree

- `vm_smoke.ts`: `/help` row missing.
- `shakeout Axis A → slash_router`: same `/help` defect, severity high.
- `ruff format --check .`: nine files out of format.

---

## 11. Rollback across chapters

- Install (§ 5 or § 6): § 5.2.
- Release: § 6.2.
- Python runtime bundle: `rm -rf build/python build/python-native dist-electron && npm run pack:runtime && npm run pack:dev`.
- Dev state: `rm -rf ~/.substrate-dev`.

---

## 12. Escalation

- A sprint cannot close on the three grounds in `../sdd-kit-4/AGENTS.md § Resolve-and-record` → ask the architect in chat, keep working on independent work.
- A gate reports a defect the sprint card does not name → add it to `BLACKBOARD.md ## Surfaced for review`, in the same turn, and say so in chat.
- A production incident on the installed app → read `~/Library/Logs/Substrate/substrate.log` first; `~/.substrate/sessions/<id>/record/events-*.jsonl` holds the per-session record.

---

## 13. Conventions

- Eight-word vocabulary binds the window's user-facing text (`WORKING_AGREEMENT.md § Tone canon`): Producer, Bus, View, Predicate, Trigger, Route, TerminationPolicy, Topology.
- No in-place edits to planning files, docs, specs, memory bodies, or this runbook. New round, new file.
- No `rm` or `rmdir` on committed artifacts.
- No `Co-Authored-By: Claude` trailer. No "Generated with Claude Code" footer.

---

## 14. References

### 14.1 Inside this repo

- `scripts/release.sh`
- `scripts/fetch-python-runtime.sh`
- `electron-builder.config.js`
- `package.json`
- `electron/main.js`
- `WORKING_AGREEMENT.md`
- `process/sprints/sprint-190-build-release-runbook.md` — the sprint that first ran § 5 end to end
- `runs/packaged/sprint-190-20261027-211649/` — the per-command logs for that run
- `process/planning/RUNBOOK-2026-10-28-build-and-release.md` and `RUNBOOK-2026-10-28-project-r2.md` — earlier rounds; on disk as audit trail

### 14.2 Prior art for runbook form

- [Runbook Example (Nobl9)](https://www.nobl9.com/it-incident-management/runbook-example)
- [SRE Runbook Framework (Garnet Wiki)](https://www.thegarnetwiki.com/sre/runbook-framework/)
- [Runbook Templates (adhdecode)](https://adhdecode.com/reliability-engineering/runbooks-and-playbooks/runbook-templates/)
- [Effective Runbooks (OneUptime)](https://oneuptime.com/blog/post/2026-02-02-effective-runbooks/view)
- [Engineer Onboarding Checklist (Pitch N Hire)](https://www.pitchnhire.com/checklists/engineer-onboarding-checklist)
- [Engineer onboarding at a devtools startup (Knock)](https://knock.app/blog/how-we-onboard-engineers-at-a-devtools-startup)

---

## 15. Session startup

Copy-paste this at the start of a session on this repo.

```
Read every file below in order. "Read" means Read of the whole file. BLACKBOARD and KIT_DIARY: tail only.

1.  ../sdd-kit-4/ — in full. Every file.
2.  README.md
3.  CLAUDE.md
4.  WORKING_AGREEMENT.md
5.  BLACKBOARD.md — tail the last 10 blocks under ## Surfaced for review, the last 10 under ## Sprint tail, the last 10 under ## Built.
6.  KIT_DIARY.md — tail the last 10 entries.
7.  process/planning/open/ROADMAP-2026-10-11-before-distribution.md
8.  process/planning/open/ROADMAP-2026-10-10-model-picker-in-the-workspace-bar.md
9.  process/planning/open/ROADMAP-2026-10-08-lens-audit-remediation.md and its ledger beside it.
10. process/planning/OPEN-ITEMS-2026-10-10.md
11. process/BACKLOG.md
12. process/planning/DESIGN-2026-10-13-language-in-the-app-r2.md
13. process/methodology/2026-09-24-autonomous-build-topology.md
14. electron/main.js
15. server.py
16. web/reveal.html, web/reveal.ts, web/reveal_component.ts
17. web/vm/
18. web/reveal/transcript/
19. harness/shakeout/
20. tests/
21. scripts/release.sh
22. scripts/fetch-python-runtime.sh
23. electron-builder.config.js
24. package.json

The kernel's runbook is ../substrate/process/planning/RUNBOOK-*.md (newest round).
```
