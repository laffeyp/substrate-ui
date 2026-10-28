---
id: 190
status: pending
phase: 10
pass_kind: observation
---

# Sprint 190 — the build and release runbook, every step run

## scope

Run every step `scripts/release.sh` defines, without the Apple notary and without the Apple signing identity. Install the resulting bundle at `/Applications/Substrate.app` and open it so a window is on the screen. Write one runbook that names, for every step, the command, its expected exit, where its output lands, and what fails the step; close the runbook with the one run of each step this card produced.

## prerequisites

- none

## context_files

- `../sdd-kit-4/AGENTS.md`
- `BLACKBOARD.md`
- `WORKING_AGREEMENT.md`
- `process/planning/ROADMAP-2026-10-11-before-distribution.md`
- `scripts/release.sh`
- `scripts/fetch-python-runtime.sh`
- `electron-builder.config.js`
- `package.json`
- `electron/main.js`
- `vite.config.ts`
- `harness/shakeout/run.ts`
- `harness/shakeout/packaged_app_smoke.ts`
- `harness/shakeout/lifecycle_gates.ts`
- `harness/shakeout/transcript_follow.ts`
- `harness/shakeout/tasks_gate.ts`
- `harness/shakeout/resume_ended_session.ts`
- `harness/vm_smoke.ts`
- `tests/` (every file this card runs under pytest)

## signal contract

### Emits

- none (the card runs existing tooling; it emits no new signals)

### Consumes

- the files under `context_files`

### Invariants

- no file in `web/vm/signals/versions/current.json` moves
- no file under `build/`, `dist-electron/`, `runs/packaged/` outside this run's logs lands in git
- `electron-builder` runs with `-c.mac.identity=null -c.mac.notarize=false`; nothing is sent to Apple
- `/Applications/Substrate.app` is replaced only once, at the end, with the unsigned bundle built in this run; `codesign --verify` is skipped on it and the runbook says so
- nothing is left running that this card did not start; the installed app is the only process that stays on past the close

## artifact contract

### Files created

- `process/planning/RUNBOOK-2026-10-28-build-and-release.md`
- `runs/packaged/sprint-190-<stamp>/*.log` (one log per command)

### Files modified

- none in-place; `BLACKBOARD.md ## Built` gets its close paragraph in the next sprint-close pass, not here

### Content assertions

- `RUNBOOK-2026-10-28-build-and-release.md` names every command this card runs, in the order it ran them, with its expected exit code, its working directory, its output location, and its failure cases
- `RUNBOOK-2026-10-28-build-and-release.md` carries one "verified on 2026-10-28" section whose rows match the per-command log files on disk
- the runbook does not claim an Apple signing step, a notary step, or a `codesign --verify` on the installed bundle
- every command in the runbook that is skipped on the no-Apple path is marked skipped and names why

### Command exit codes

- `npm run build` returns 0
- `uv run --project ../substrate python scripts/gen_kinds.py --check` returns 0
- `npm run test:unit` returns 0
- `uv run --project ../substrate ruff check .` returns 0
- `uv run --project ../substrate ruff format --check .` returns 0
- `npm run test:py` returns 0 (`5 skipped` on live-driver tests is allowed, the rest pass)
- `npx tsx harness/vm_smoke.ts` returns 0
- `npm run pack:runtime` returns 0; `build/python/KERNEL_SOURCE.releasable == true`
- `npm run pack:dev` returns 0; `dist-electron/mac-arm64/Substrate.app` exists; the log prints `skipped macOS code signing  reason=identity explicitly is set to null`
- `SMOKE_UNSIGNED=1 SMOKE_DRIVER=deterministic npx tsx harness/shakeout/packaged_app_smoke.ts` returns 0
- `SHAKEOUT_APP=$PWD/dist-electron/mac-arm64/Substrate.app SHAKEOUT_AXIS=C SHAKEOUT_RUNS=1 npx tsx harness/shakeout/run.ts` returns 0
- `SHAKEOUT_APP=$PWD/dist-electron/mac-arm64/Substrate.app SHAKEOUT_AXIS=A SHAKEOUT_RUNS=1 npx tsx harness/shakeout/run.ts` returns 0
- `LIFECYCLE_APP=$PWD/dist-electron/mac-arm64/Substrate.app npx tsx harness/shakeout/lifecycle_gates.ts` returns 0
- `SCROLL_APP=$PWD/dist-electron/mac-arm64/Substrate.app npx tsx harness/shakeout/transcript_follow.ts` returns 0
- `TASKS_APP=$PWD/dist-electron/mac-arm64/Substrate.app npx tsx harness/shakeout/tasks_gate.ts` returns 0
- `SMOKE_APP=$PWD/dist-electron/mac-arm64/Substrate.app npx tsx harness/shakeout/resume_ended_session.ts` returns 0
- `osascript -e 'tell application "Substrate" to quit'` returns 0 (or returns non-zero because no copy was running — both are allowed)
- `ditto dist-electron/mac-arm64/Substrate.app /Applications/Substrate.app` returns 0
- `open /Applications/Substrate.app` returns 0

Any one of these failing is a Rubber Duck observation; the card does not close until the step passes or the runbook names the failure in its own section with the cause.

## observation contract

### UI driving steps

- after `open /Applications/Substrate.app`: a `Substrate` process shows under `ps -axo pid=,command= | grep /Applications/Substrate.app` and a `BrowserWindow` is visible on screen
- the Dock shows a `Substrate` icon
- the window loads `http://127.0.0.1:<port>/` (confirmed by `curl http://127.0.0.1:<port>/` returning 200; the port is read from `~/Library/Logs/Substrate/substrate.log`)

### Expected log substrings

- `~/Library/Logs/Substrate/substrate.log` holds `app boot` and `server up on http://127.0.0.1:<port>` after launch

### Expected runtime signals

- none produced by this card itself

### Expected screenshot / visual state

- a screenshot of the running `/Applications/Substrate.app` window exists at `runs/packaged/sprint-190-<stamp>/installed-app.png`

## done criteria

Every command above has run against the current tree, every log is on disk, the unsigned bundle sits in `/Applications/Substrate.app`, the window is on the screen, and the runbook at `process/planning/RUNBOOK-2026-10-28-build-and-release.md` reads the way a release engineer at another company would read a runbook: purpose, prerequisites, inputs, numbered procedure with one command per step, verification, troubleshooting, rollback, references.

## notes

- The `--notarize` and signing step from `scripts/release.sh` stage 5 is out of scope and must be marked skipped in the runbook.
- `scripts/release.sh --install` quits a running `/Applications/Substrate.app` first; this card does the same (`osascript`), moves the old bundle to the Trash with its `CFBundleVersion` in the name, and `ditto`s the new one in.
- `release.sh`'s clean-tree gate (stage 1) will refuse on this box right now; the card runs the component commands directly, not `release.sh`, and the runbook says so.
- The Playwright gates are long: Axis A ×1 is ~5–15 min, each `*_APP=` gate 1–5 min; budget 30–60 min for the whole stage.

## self-review checklist

- [x] Scope names one verifiable property: every command runs, bundle is on disk, the app is on screen, runbook is at the named path.
- [x] `context_files` covers every script and harness the card runs.
- [ ] Signal contract's `Emits` list is empty by design (the card runs existing tooling only).
- [x] Artifact contract is gradable: every command has an expected exit, every output lands at a named path.
- [x] Observation contract names the installed app running and a screenshot of it.
- [ ] Rule 6 — ≤2 files, one concept. The card writes one runbook (one file) and uses one scratch log directory; it reads many files but writes two surfaces. Honored.
- [x] Every part the card names (`release.sh` stages, each gate's env var, each `scripts/*` file, each `harness/*` file) is defined in a file under `context_files`.
