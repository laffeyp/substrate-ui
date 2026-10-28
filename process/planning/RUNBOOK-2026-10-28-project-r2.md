# RUNBOOK — Substrate (project)

*2026-10-28, round 2. Supersedes `RUNBOOK-2026-10-28-build-and-release.md`, which was the build chapter only. This file is the project runbook: the orientation a new engineer or agent reads first, then every operational procedure the project supports. Structure follows the common practice named in § 11 (header, orientation, inventory, prerequisites, triggers, procedure, verification, rollback, troubleshooting, escalation, references).*

| Field | Value |
|---|---|
| Owner | the Architect (Peter Laffey) |
| Last updated | 2026-10-28 |
| Last end-to-end executed | 2026-10-27, 21:16 — 21:24 (build + install chapter only; logs at `substrate-ui/runs/packaged/sprint-190-20261027-211649/`) |
| Scope | both `substrate/` and `substrate-ui/` |
| Not covered here | SDD methodology itself (see `sdd-kit-4/AGENTS.md`); product and tech specs (see `substrate/docs/specs/`); feature-level sprint cards (see each repo's `process/sprints/`). |

---

## 1. Orientation — what to read before you touch anything

A new engineer or a new session agent reads the files below, in this order, before writing or running anything. Reading means `Read` (or `cat`) of the whole file; a search excerpt does not count. The goal is to be able to answer the three questions at the end of this section without opening another file.

### 1.1 The methodology

- `sdd-kit-4/AGENTS.md` — the working agreement. Twelve hard rules, the resolve-and-record protocol, the dual contract (signal + artifact + observation), the Rubber Duck Pass.
- `sdd-kit-4/foundations/01-signal-driven-development.md` — the theory.
- `sdd-kit-4/foundations/02-sdd-practice.md` — the reference library and the practice.
- `sdd-kit-4/foundations/03-sdd-team-model.md` — the collapsed-three-roles topology.
- `sdd-kit-4/grammar/PRINCIPLES.md` — the eleven-layer grammar stack.
- `sdd-kit-4/grammar/BOOTSTRAP.md` — the Vocabulary Session procedure.
- `sdd-kit-4/TECHNIQUES.md` — the catalog of named practices.

### 1.2 The two repositories, side by side

The project runs out of two sibling checkouts.

- `substrate/` — the kernel. Python 3.12+ runtime, the bundled topologies, the session topology's vocabulary.
- `substrate-ui/` — the macOS app. Electron main, HTTP backend (`server.py`), the window (TypeScript built by Vite).

### 1.3 The project record, newest first

Read the newest round of each family. The project's rule is `no in-place edits`: new rounds land as new files, prior rounds stay on disk as the audit trail.

- `substrate/README.md` — what the kernel is in one page.
- `substrate-ui/README.md` — what the app is in one page.
- `substrate/CLAUDE.md` and `substrate-ui/CLAUDE.md` — the agent entry points. Each imports its kit.
- `substrate/process/BLACKBOARD.md` — the kernel's state. Read `## Surfaced for review` and the newest entries under `## Sprint tail` and `## Built`.
- `substrate-ui/BLACKBOARD.md` — the app's state. Same sections.
- `substrate/process/KIT_DIARY.md` and `substrate-ui/KIT_DIARY.md` — the kit-level findings.
- `substrate/process/WORKING_AGREEMENT.md` and `substrate-ui/WORKING_AGREEMENT.md` — per-project overrides: canonical home registry, build commands, tone canon, Apple identifiers.

### 1.4 The current roadmap, newest round of each family

- `substrate-ui/process/planning/ROADMAP-2026-10-11-before-distribution.md` — the release gate.
- `substrate-ui/process/planning/OPEN-ITEMS-2026-10-10.md` — every open item, with the 2026-10-14 and 2026-10-27 updates at the top.
- `substrate-ui/process/planning/ROADMAP-2026-10-13-language-in-the-app.md`, `ROADMAP-2026-10-12-slash-entry.md`, `ROADMAP-2026-10-10-model-picker-in-the-workspace-bar.md`, `ROADMAP-2026-10-08-lens-audit-remediation.md`, and the ledger beside the last one — each a running work line.
- `substrate-ui/process/planning/DESIGN-2026-10-13-language-in-the-app-r2.md` — the newest design round of the only active design family.
- `substrate-ui/process/methodology/2026-09-24-autonomous-build-topology.md` — the 27-line note that defines the autonomous build.

### 1.5 The code the project is built on

- `substrate/src/substrate/topologies/session/` — eighteen files, 5,290 lines; the session topology is the daily driver and the template every other topology is a copy of (per the autonomous-build note's point 10).
- `substrate-ui/server.py` — the HTTP backend. The `_build_session_topology_from_manifest` closure is where the UI builds a session topology from a stored manifest.
- `substrate-ui/electron/main.js` — what the installed app does at launch.
- `substrate-ui/web/reveal.html` and `substrate-ui/web/reveal.ts` — the window's layout and bootstrap.
- `substrate-ui/web/reveal_component.ts` — the dc-runtime-evaluated class body for the window.

### 1.6 The build system

- `substrate-ui/scripts/release.sh` — the seven numbered stages, in order.
- `substrate-ui/scripts/fetch-python-runtime.sh` — the bundled Python interpreter plus the kernel wheel.
- `substrate-ui/electron-builder.config.js` — the macOS packaging.
- `substrate-ui/package.json` — the shortcut names.

### 1.7 Three questions

Read the files in sections 1.1 — 1.6, then answer:

1. **What is a sprint, in this project?** A typed command message written to `substrate-ui/process/sprints/sprint-NNN-<slug>.md` (or the kernel's `substrate/process/sprints/`). Read `sdd-kit-4/templates/SPRINT_CARD.md` if the answer is not sharp.
2. **Where does an installed Substrate.app's state live?** `~/.substrate/sessions/`, `~/.substrate/runs/`, `~/.substrate/memory/`, `~/.substrate/skills/`, `~/Library/Logs/Substrate/substrate.log`. The dev run uses `~/.substrate-dev/` instead (set by `npm run electron`).
3. **What runs the installed app's backend?** `/Applications/Substrate.app/Contents/Resources/python/bin/python3 /Applications/Substrate.app/Contents/Resources/app.asar.unpacked/server.py --port 0`, spawned by `electron/main.js` with `PYTHONHOME` set to `Contents/Resources/python`. The electron main process polls the readback port and loads the window at `http://127.0.0.1:<port>/?atom-transcript=1&electron=1`.

If any one of those answers is not immediate, re-read the file that defines it before moving on.

---

## 2. Inventory

| Surface | Where |
|---|---|
| Kernel source | `substrate/src/substrate/` |
| Kernel tests | `substrate/tests/` |
| Kernel specs | `substrate/docs/specs/` (kernel, product, tech, design) |
| App Electron main | `substrate-ui/electron/main.js` |
| App backend | `substrate-ui/server.py` |
| App window source | `substrate-ui/web/` |
| App window built | `substrate-ui/web/dist/` |
| App tests (Python) | `substrate-ui/tests/` |
| App tests (client unit) | `substrate-ui/web/reveal/__tests__/*.spec.ts` |
| App gates (Playwright) | `substrate-ui/harness/shakeout/*.ts` |
| App bundle (unsigned, local) | `substrate-ui/dist-electron/mac-arm64/Substrate.app` |
| App bundle (installed) | `/Applications/Substrate.app` |
| Dev state | `~/.substrate-dev/` |
| Installed state | `~/.substrate/` |
| App logs | `~/Library/Logs/Substrate/substrate.log` |
| Release logs | `substrate-ui/runs/packaged/release-<stamp>-*.log` |

---

## 3. Prerequisites

- macOS on Apple silicon.
- `uv` on `PATH` (`brew install uv`).
- Node 20 or newer, `npm` on `PATH`.
- `substrate/` and `substrate-ui/` checked out as siblings.
- First run: `cd substrate-ui && npm install`.
- Release only: `APPLE_API_KEY`, `APPLE_API_KEY_ID`, `APPLE_API_ISSUER` (identifiers in `substrate-ui/WORKING_AGREEMENT.md` § External SDK bridge mappings; the private key stays at `~/.appstoreconnect/private_keys/AuthKey_<id>.p8`, `chmod 600`, never committed).

---

## 4. Triggers — pick the right chapter

| Trigger | Chapter |
|---|---|
| New agent or engineer, first day on the project | § 1 Orientation |
| "Does the current tree build and install?" | § 5 Build and install (no Apple) |
| "Ship a signed, notarized build" | § 6 Build and release (Apple) |
| "Try a change in the running app without packaging" | § 7 Day-to-day development |
| "Run only the automated checks" | § 8 Tests only |
| An installed Substrate crashed or hung | § 10 Troubleshooting |

---

## 5. Build and install — the no-Apple path

Nothing in this chapter contacts Apple. The bundle is unsigned.

### 5.1 Procedure

Run from `substrate-ui/`. Every command writes a per-command log at `runs/packaged/sprint-<id>-<stamp>/NN-<name>.log`.

| # | Command | Expected exit | Notes |
|---|---|---|---|
| 1 | `uv run --project ../substrate ruff check .` | 0 | Static lint on the UI tree. |
| 2 | `uv run --project ../substrate ruff format --check .` | 0 | Formatter check. Fails if any file is out of format. |
| 3 | `uv run --project ../substrate python scripts/gen_kinds.py --check` | 0 | Generated kernel-name files current. |
| 4 | `npm run build` | 0 | `tsc` on app and harness, `eslint web/`, `vite build` into `web/dist/`. |
| 5 | `npm run test:unit` | 0 | `check-vocabulary-parity.ts` first, then `node --test` on `web/reveal/__tests__/*.spec.ts`. |
| 6 | `npx tsx harness/vm_smoke.ts` | 0 | The controller against the harness's own isolated server. |
| 7 | `npm run test:py` | 0 | Pytest, under a `mktemp` `HOME`. |
| 8 | `npm run pack:runtime` | 0 | Downloads CPython 3.14.4, builds the kernel wheel from `../substrate` HEAD, installs locked deps. `build/python/KERNEL_SOURCE.releasable == true` on a clean kernel. |
| 9 | `npm run pack:dev` | 0 | electron-builder with `-c.mac.identity=null -c.mac.notarize=false`. Writes `dist-electron/mac-arm64/Substrate.app` and `Substrate-<v>-arm64.dmg`. The log prints `skipped macOS code signing  reason=identity explicitly is set to null`. |
| 10 | `SMOKE_UNSIGNED=1 SMOKE_DRIVER=deterministic SMOKE_APP=$APP npx tsx harness/shakeout/packaged_app_smoke.ts` | 0 | Real-keyboard turn on the deterministic driver, Structure populates. `$APP = $PWD/dist-electron/mac-arm64/Substrate.app`. |
| 11 | `SHAKEOUT_APP=$APP SHAKEOUT_AXIS=C SHAKEOUT_RUNS=1 npx tsx harness/shakeout/run.ts` | 0 | Three Electron flows against the packaged bundle. |
| 12 | `SHAKEOUT_APP=$APP SHAKEOUT_AXIS=A SHAKEOUT_RUNS=1 npx tsx harness/shakeout/run.ts` | 0 (see § 10 known failures) | Ten controller flows against the packaged bundle. |
| 13 | `LIFECYCLE_APP=$APP npx tsx harness/shakeout/lifecycle_gates.ts` | 0 | F5 deep link, F6 Dock activate, F7 bad `SUBSTRATE_HOME`, F8 backend killed. |
| 14 | `SCROLL_APP=$APP npx tsx harness/shakeout/transcript_follow.ts` | 0 | Scroll gate. |
| 15 | `TASKS_APP=$APP npx tsx harness/shakeout/tasks_gate.ts` | 0 | Background-tasks gate. |
| 16 | `SMOKE_APP=$APP npx tsx harness/shakeout/resume_ended_session.ts` | 0 | Resume-ended-session gate. |
| 17 | `osascript -e 'tell application "Substrate" to quit'` | 0 or non-zero | Both allowed. Then wait up to 60 s for the pid to go. |
| 18 | `mv /Applications/Substrate.app ~/.Trash/Substrate-<old-CFBundleVersion>-replaced-<stamp>.app` | 0 | Only if `/Applications/Substrate.app` existed. |
| 19 | `ditto dist-electron/mac-arm64/Substrate.app /Applications/Substrate.app` | 0 | Install. No `codesign --verify` — the bundle is unsigned. |
| 20 | `open /Applications/Substrate.app` | 0 | Launch. |

### 5.2 Verification

- `/Applications/Substrate.app/Contents/Info.plist`: `CFBundleVersion` equals the epoch seconds at build time, strictly greater than the trashed version. `SubstrateKernelCommit` equals `../substrate`'s HEAD. `SubstrateKernelVersion` equals the version in `substrate/pyproject.toml`.
- `pgrep -f "/Applications/Substrate.app/Contents/MacOS/Substrate"` prints the main pid.
- `pgrep -f "/Applications/Substrate.app/Contents/Resources/python/bin/python3"` prints the backend pid.
- `~/Library/Logs/Substrate/substrate.log` tail reads `app boot`, `spawning server`, `server bound port=<n>`, `server up on http://127.0.0.1:<n>`.
- A Substrate window is visible with `titleBarStyle: hiddenInset`.

### 5.3 Rollback

The trashed `.app` always survives one install.

```
osascript -e 'tell application "Substrate" to quit'
# wait for the pid to go, then:
mv /Applications/Substrate.app ~/.Trash/
mv ~/.Trash/Substrate-<prior-CFBundleVersion>-replaced-*.app /Applications/Substrate.app
open /Applications/Substrate.app
```

### 5.4 Last end-to-end run of this chapter

2026-10-27, 21:16 — 21:24 under sprint card `substrate-ui/process/sprints/sprint-190-build-release-runbook.md`. Logs: `substrate-ui/runs/packaged/sprint-190-20261027-211649/`. Steps 1 — 20 ran; two findings carried over:

- Step 2 (`ruff format --check .`) exit 1: nine files out of format. `ruff format .` clears it.
- Steps 6 and 12 (`vm_smoke` and shakeout Axis A `slash_router`): both report `/help` renders no listing. One real defect, severity high, caught by two independent probes.

---

## 6. Build and release — with Apple

One command: `scripts/release.sh --notarize --install`, from `substrate-ui/`. The script runs seven stages in order; any stage fails, nothing lands.

| Stage | What |
|---|---|
| 1 clean trees | `git status --porcelain` on `substrate-ui/` (outside `process/`, `runs/packaged/`, `captures/`) and on `substrate/src/`, `substrate/pyproject.toml`. Both must be empty. |
| 2 tests and web build | § 5 steps 1 — 7 (strictly: `ruff check`, `ruff format --check`, `gen_kinds.py --check`, `pytest`, `npm run build`, `npm run test:unit`, `vm_smoke.ts`). |
| 3 bundled runtime | § 5 step 8. A dirty kernel `src/` marks `VERIFICATION_BUILD` and `release.sh` refuses it. |
| 4 electron-builder | § 5 step 9 but with the Apple identity and `notarize: true`. The signed bundle is zipped, submitted to Apple's notary, the ticket is stapled, then the `.dmg` is built around the stapled `.app`. |
| 5 signature | `codesign --verify --deep --strict` on the built `.app`. `PlistBuddy` reads back `SubstrateUICommit` and `SubstrateKernelCommit`; both must equal the HEADs from stage 1. |
| 6 gates against the built bundle | § 5 steps 10 — 16, plus Axis B (real-model tool flows). Any gate that writes outside its temp `SUBSTRATE_HOME` fails the release. Second `codesign --verify` after. |
| 7 install | § 5 steps 17 — 20, plus `codesign --verify --deep --strict /Applications/Substrate.app` after `ditto`. |

### 6.1 Verification

Everything in § 5.2 plus `codesign --verify --deep --strict /Applications/Substrate.app` returns clean, `xcrun stapler validate` on the `.dmg` passes, and `spctl --assess --type execute --verbose=4 Substrate.app` reports `accepted, source=Notarized Developer ID`.

### 6.2 Rollback

The notary ticket cannot be rescinded in the general case. A new build with a higher `CFBundleVersion` supersedes it; Apple's notary accepts the next one.

---

## 7. Day-to-day development

The dev loop does not package.

- Backend: `cd substrate-ui && SUBSTRATE_HOME=$HOME/.substrate-dev electron .` (via `npm run electron`). The backend is `uv run python server.py --port 0` from `../substrate`. The window title reads "Substrate Dev".
- Window source: edit `web/reveal.html`, `web/reveal.ts`, `web/reveal_component.ts`, `web/vm/*.ts`, `web/reveal/transcript/*.tsx`. The dev shell reloads on save; the packaged shell does not.
- Backend source: edit `server.py` and its siblings (`session_errors.py`, `demo_topologies.py`). Restart `npm run electron`.
- Kernel source: edit `../substrate/src/substrate/`. `uv run` picks it up through the editable install.

The dev state at `~/.substrate-dev/` is independent of the installed app's `~/.substrate/`.

---

## 8. Tests only

- `npm run test:py` — pytest on the backend (257 passing today, 5 live-driver skips). About 2 min.
- `npm run test:unit` — vocabulary parity, then `node --test` on the client specs (62 today). About 1 s.
- `npx tsx harness/vm_smoke.ts` — the controller against the harness's own server. About 10 s.
- `npm run gates:electron` — the chained Playwright suite against source. 20 — 40 min.
- `npm test` — all of the above as one command.
- `SHAKEOUT_APP=$APP ... run.ts` and the `*_APP=$APP ... .ts` individual gates — against a built bundle at `$APP`.

---

## 9. Working with the architect (the human in the loop)

- Each ask is written into the current roadmap or `process/planning/OPEN-ITEMS-*.md` before work on it starts.
- When the architect is testing the installed app and calling out items, finish one, report, stop; do not roll into the next.
- A narrow ask changes only what it names.
- Writing is terse, every sentence a fact, active voice. No marketing register, no second-person address outside questions.
- Memory holds standing rules the project repeats on; honor them without being told. The entries sit at `~/.claude/projects/-Users-peterlaffey-Documents-Claude-Projects-Agent-Orchestration/memory/`.

---

## 10. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `fetch-python-runtime.sh`: "source mode runs Python X.Y.Z; this script bundles 3.14.4" | `../substrate`'s `uv run python` is a different version | Align `uv.lock` and `.python-version` in `../substrate`, or bump `PY_TAG`/`PY_VER` in the script |
| `fetch-python-runtime.sh`: `VERIFICATION BUILD` | `../substrate/src/` or `pyproject.toml` is dirty | Commit the kernel, or accept the unsigned bundle marked non-releasable |
| `pack:dev`: `build/icon.icns` not found | First run, icon not generated | `uv run python scripts/make_icon.py` |
| `packaged_app_smoke.ts`: "wrong team: expected TeamIdentifier=ZVL8XB9XGU" | Unsigned bundle | Pass `SMOKE_UNSIGNED=1` on the no-Apple path |
| `packaged_app_smoke.ts`: "stale build" | Bundle older than one of its inputs | `npm run pack:dev` |
| `packaged_app_smoke.ts`: "driver <name> not in /api/models roster" | `SMOKE_DRIVER` names a driver not installed | Omit the env var, or pass `deterministic` |
| A gate: "port already bound" | A squatter owns the shakeout port | Stop the squatter by pid the error names; the gates refuse a shared port by design |
| `osascript ... Substrate quit`: "User canceled" | A modal is open in the running app | Dismiss by hand; rerun step 17 |
| Window does not appear after `open` | Backend crashed at startup | Read `~/Library/Logs/Substrate/substrate.log` |
| `screencapture: could not create image from display` | Shell lacks Screen Recording permission | System Settings → Privacy & Security → Screen Recording → add the shell; or take the screenshot by hand |
| `/help` prints nothing in the window | Open defect; caught by `vm_smoke.ts` and `shakeout/slash_router.ts` | Owed a card; the installed app is still usable, no workaround at install time |
| `ruff format --check .` exits 1 | Nine files out of format on the current tree | `ruff format .` and commit; required for a release |

### 10.1 Known gates that exit non-zero on the current tree

- `vm_smoke.ts`: `/help` row missing.
- `shakeout Axis A → slash_router`: same `/help` defect, reported with severity high.
- `ruff format --check .`: nine files out of format.

A green release path requires each resolved first. The no-Apple install still produces a working app.

---

## 11. Rollback — summary across chapters

- Install (§ 5 or § 6): see § 5.3.
- Release: see § 6.2.
- Python runtime bundle: `rm -rf build/python build/python-native dist-electron && npm run pack:runtime && npm run pack:dev`.
- Dev state: `rm -rf ~/.substrate-dev` (destroys dev sessions and runs; installed state at `~/.substrate` is untouched).

---

## 12. Escalation

- A sprint cannot close on the three grounds in `sdd-kit-4/AGENTS.md § Resolve-and-record` → ask the architect in chat, keep working on independent work.
- A gate reports a defect the sprint card does not name → add it to `## Surfaced for review` in the right repo's BLACKBOARD, in the same turn, and say so in chat.
- A production incident on the installed app → read `~/Library/Logs/Substrate/substrate.log` first; `~/.substrate/sessions/<id>/record/events-*.jsonl` holds the per-session record.

---

## 13. Conventions

- The eight-word vocabulary binds the window's user-facing text (`substrate-ui/WORKING_AGREEMENT.md § Tone canon`): Producer, Bus, View, Predicate, Trigger, Route, TerminationPolicy, Topology. No anthropomorphism; no marketing reframes.
- No in-place edits to planning files, docs, specs, memory bodies, or this runbook. A new round lands as a new file; prior rounds stay on disk.
- The audit trail is the work. New thinking goes into new files; no `rm` or `rmdir` on committed artifacts.
- Git commits and PRs carry no `Co-Authored-By: Claude` trailer and no `Generated with Claude Code` footer. The automated tool is a tool, not an author.

---

## 14. References

- `substrate-ui/scripts/release.sh` — the seven stages.
- `substrate-ui/scripts/fetch-python-runtime.sh` — Python runtime + kernel wheel.
- `substrate-ui/electron-builder.config.js` — macOS packaging.
- `substrate-ui/package.json` — shortcut names.
- `substrate-ui/electron/main.js` — what the installed app does at launch.
- `substrate-ui/WORKING_AGREEMENT.md` — build commands, canonical home registry, Apple identifiers.
- `sdd-kit-4/AGENTS.md` — the working agreement.
- `substrate-ui/process/sprints/sprint-190-build-release-runbook.md` — the sprint that first executed § 5.
- `substrate-ui/runs/packaged/sprint-190-20261027-211649/` — the per-command logs for that first execution.
- `substrate-ui/process/planning/RUNBOOK-2026-10-28-build-and-release.md` — round 1 of this document (the build chapter alone).

### 14.1 External references on runbook form

The structure of this file is drawn from the common pattern across the sources below. None is an official SRE standard; they converge on header + triggers + prerequisites + procedure + verification + rollback + troubleshooting + escalation + references, which this file follows. The onboarding pattern (architecture overview, verified local setup, guided reading order, first tasks) is from the second set.

- [Runbook Example: A Best Practices Guide (Nobl9)](https://www.nobl9.com/it-incident-management/runbook-example)
- [Site Reliability Engineering Runbook Framework (Garnet Wiki)](https://www.thegarnetwiki.com/sre/runbook-framework/)
- [Runbook Templates — Complete Guide (adhdecode)](https://adhdecode.com/reliability-engineering/runbooks-and-playbooks/runbook-templates/)
- [How to Create Effective Runbooks (OneUptime)](https://oneuptime.com/blog/post/2026-02-02-effective-runbooks/view)
- [Runbook Maintenance Best Practices (Supportbench)](https://www.supportbench.com/how-to-maintain-runbooks-when-engineering-changes-processes/)
- [What Is a Runbook? History, Template, and Best Practices (Reliable Penguin)](https://blogs.reliablepenguin.com/2025/10/29/what-is-a-runbook-history-template-and-best-practices)
- [Comprehensive Tutorial on Runbooks in Site Reliability Engineering (SRE School)](https://sreschool.com/blog/comprehensive-tutorial-on-runbooks-in-site-reliability-engineering/)
- [Engineer Onboarding Checklist for Dev Teams (Pitch N Hire)](https://www.pitchnhire.com/checklists/engineer-onboarding-checklist)
- [How we onboard engineers at a devtools startup (Knock)](https://knock.app/blog/how-we-onboard-engineers-at-a-devtools-startup)
- [DevOps Team Onboarding Checklist (DevOpsil)](https://devopsil.com/articles/2026-03-29-devops-team-onboarding-checklist)
- [30-60-90 Day Playbook (Gigson)](https://www.gigson.co/blog/how-to-structure-a-remote-engineering-onboarding-the-30-60-90-day-playbook)

---

*A new round of this runbook lands as a new file beside it; it is not edited in place.*
