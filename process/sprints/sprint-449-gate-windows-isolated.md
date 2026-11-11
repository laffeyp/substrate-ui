# Sprint 449 — gate windows shut out the person's mouse and keys

```yaml
---
id: 449
status: closed
phase: the observation harness (all gates)
pass_kind: functional
---
```

## scope

The machine runs the gates while a person works on it, and the gate windows open on the central monitor (the Architect, 2026-11-10). The person's mouse and keys reach those windows. A buttonless mouse move during a drag ends the drag's capture (BLACKBOARD 2026-11-10, surfaced: reproduced 301 → 307 px). An Escape the gate never sent reached a gate window (2026-11-09, drift).

The fix:
- `launchArgs` (`harness/shakeout/lib/electron.ts`) sets `SUBSTRATE_GATE_ISOLATE=1` for every gate.
- With it set, Electron main gives each window two settings. `setFocusable(false)`: it never takes the keyboard from the app in front. `setIgnoreMouseEvents(true)`: the OS's mouse passes through to what is below.
- Playwright's mouse and keys are injected into the page and still arrive.
- APP_BOOTED gains `gate_isolated`, so a launch's trace says it ran isolated.
- Sprint 448's guards in `editor_resize` and `pane_grid` come out, since every gate now has the isolation.

Files: `electron/main.ts`, `harness/shakeout/lib/electron.ts`; the vocabulary files; the two gates' guards removed.

## context_files

- BLACKBOARD 2026-11-10: the `user` entry (active use), the surfaced entry (the mechanism); 2026-11-09 drift (the untraced Escape).
- `electron/main.ts` `createWindow`, APP_BOOTED; `harness/shakeout/lib/electron.ts` `launchArgs`.
- Electron's BrowserWindow docs: `setFocusable`, `setIgnoreMouseEvents`.
- ADDENDUMS C3 (DEBUG launch seams, kept out of shipped use).

## signal contract

Vocabulary v0.53, P-0.53-GATE-ISOLATED: APP_BOOTED gains `gate_isolated` (bool).

## artifact contract

- `main.ts` reads `SUBSTRATE_GATE_ISOLATE` in one place and applies both settings to every window.
- `launchArgs` sets the flag.
- `npm run build` 0; `npm run test:unit` 0.
- The editor gates and the pane gates from source and on the bundle 0; key-heavy gates among them: `editor_editing`, `editor_keys`, `escape_order`, `editor_view`.
- Each launch's APP_BOOTED reads `gate_isolated: true`.

## observation contract

`editor_resize` on the bundle runs a probe step: a buttonless `webContents.sendInputEvent` move during a drag.
- That event is injected inside Chromium, so isolation does not stop it, and the probe still loses the drag. It measures the mechanism, not the guard.
- The guard is shown by the full gate set passing with the windows unfocusable and mouse-transparent.
- Every APP_BOOTED in the gate traces reads `gate_isolated: true`.

## done criteria

A person working on the machine can no longer move or type into a gate's window.
