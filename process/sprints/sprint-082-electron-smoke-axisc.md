# Sprint 082 — Electron smoke harness (AXIS_C) + isolation + orphan watchdog

```yaml
---
id: 082
status: closed
opened_at: 2026-09-24
closed_at: 2026-09-24
closed_by: agent
commit: e2a0f23
phase: 9
pass_kind: implementation
closes_phase: 9
---
```

## scope

Third axis of the shakeout: three Electron flows under Playwright's `_electron.launch`, joined as AXIS_C. Two bugs surfaced during the sprint's own 5/5 run and were fixed in-sprint, not deferred.

## deliverables (from the commit)

- `harness/shakeout/electron_smoke.ts` — new. Launches `electron .` via `_electron.launch`, waits for the reveal shell's atom root, drives one deterministic turn through `window.__vm`, asserts `snapshot().parkReason` non-null, closes. Exports `launchArgs()` which `mkdtempSync`'s a userData dir under `os.tmpdir()`; every launch passes `--user-data-dir=<unique>` so Electron's `requestSingleInstanceLock` keys on distinct app identities and concurrent AXIS_C flows (or a dev-launched `npm run electron` running alongside) coexist without collision.
- `harness/shakeout/electron_menu.ts` — new. Fires `menu-new-session` and `menu-toggle-reveal` via `app.evaluate(Menu.getMenuItemById().click())`; asserts pane count grows and `state.revealed` flips. Reuses `launchArgs`.
- `harness/shakeout/electron_deeplink.ts` — new. Warm path emits `open-url` after the window is up; recorder installed via `window.native.onDeepLink` observes the URL. Cold path emits `open-url` pre-window; asserts main-side `flushing <N> buffered deep-link(s)` log line, verifying the buffered dispatch fires on `did-finish-load`. Reuses `launchArgs`.
- `harness/shakeout/run.ts` — three AXIS_C flows registered. `AXIS_ONLY` defaults to `"AB"` (unchanged); `"ABC"` runs Electron flows too. Passed `FlowContext.server` is unused; each flow spawns its own Electron+server pair on ephemeral ports.
- `package.json` — `"electron:smoke"` script wraps AXIS_C at 1 run for the sprint's own exit check.

## bugs surfaced and fixed in-sprint (not deferred)

- **`server.py` orphan.** When Playwright hard-terminates Electron via `_electron close()`, the SIGTERM never reaches `server.py` and the subprocess is orphaned (holds its port until `pkill`). A daemon thread polls `os.getppid()` every 1 s; when the ppid becomes 1 (re-parented to init) the watchdog fires the same `_sigterm_handler` graceful shutdown uses. Clean exit either way.
- **`web/reveal.ts` menu-command race.** The menu-command handler re-reaches component at dispatch time (`component ?? reachComponent()`) instead of relying on the boot-time `bind()`'s closure. Under fresh Chromium userData (`--user-data-dir=<tmp>`) dc-runtime's boot is slower and `bind()` can miss its 5 s deadline; the menu event then fired against a null component and no-op'd, blocking the Sprint 082 menu flow at 5/5. Late-reach makes the wire-up independent of `bind()`'s race.

## verified

AXIS_C at `SHAKEOUT_RUNS=5` returns 3 flows × 5 runs all green, 15 tags 5/5, zero blockers, zero dead, zero bugs, alongside or without a dev-launched Electron on the same box.

## exit gates (verified by the commit)

- typecheck ✓
- lint ✓
- 14/14 unit ✓
- `[vm-vocab-parity] OK — vocabulary 0.1 (30 tags: 30 live + 0 retired, locked=true); code emits 30 distinct live tag(s), all locked.`
- smoke:vm 11/11 ✓

## phase 9 close

The reveal shell now ships as a dev-runnable macOS `.app` via `npm run electron`: spawns `server.py` in a detached process group on an ephemeral port, loads the reveal shell into a Chromium window with `titleBarStyle: hiddenInset`, owns a native menu bar, registers `substrate://` as a deep-link handler, and has a three-flow smoke harness that runs alongside the shakeout as AXIS_C. Bundled Python, auto-update, Windows/Linux packaging, and multi-window are named as future epics in the plan.

Sprint 083 (top-bar polish under hiddenInset) is the follow-up polish landed 2026-09-24; it caught four issues the plan's §6 R5 named but Sprint 078's exit test did not encode.

## artifact

Commit `e2a0f23` (2026-09-24 18:26:53 -0700). Card is the retro-summary Peter asked for on 2026-09-25.
