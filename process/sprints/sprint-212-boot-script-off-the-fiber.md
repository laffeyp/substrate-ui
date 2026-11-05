---
id: 212
status: closed
phase: shell-to-react A7b
pass_kind: functional
---

# Sprint 212 — the boot script stops reaching the component's fiber

## scope

`reveal.ts` writes each pane controller's snapshot with `mirrorSnapshot` and sends the menu's `toggle-meta`, `settings` and `close-pane` with `sendCommand` (`web/app/state/shell.ts`, sprint 211). `DCLogicHandle`, `ReactFiberNode`, `ReactContainerRoot`, `findComponent`, `reachComponent`, `computeStatePatch`, the `bind()` retry and the snapshot handler leave `reveal.ts`; `open-record` keeps calling the controller. Finding F334 closes. The transcript's mount code (`:192–240`) stays until the transcript moves to the mount registry.

## prerequisites

- 211 closed

## context_files

- `web/reveal.ts` (whole file)
- `web/app/state/shell.ts`; `web/reveal_component.ts` (`componentDidMount`'s shell subscriber)
- Lens finding F334 (`process/planning/2026-10-08-lens-audit/ROADMAP-2026-10-08-lens-audit-remediation-LEDGER.md:341`)

## signal contract

None changed.

## artifact contract

- Modified: `web/reveal.ts`; `web/app/state/shell.ts` (one instance per window, found below).
- `web/reveal.ts` contains no `__reactContainer`, `stateNode`, `findComponent`, `reachComponent` or `setState`.
- `npm run build` 0, run alone; `npm run test:unit` 0; `npm run signals` 0.

## observation contract

Every snapshot the window draws now arrives through the store, so every gate exercises it. This sprint closes group A: every script in `gates:electron` runs alone and exits 0; the pixel captures compare equal to `baseline-2026-11-04`; `electron_menu` (meta from the menu), `menu_commands`, `language_lens_views` (`/language` opens meta), and a check that the URL's `session` follows the focused pane after a turn.

## done criteria

No code in the window reaches React's private fields; group A's gates pass.

## result

Closed 2026-11-05. `reveal.ts` hands each snapshot to `mirrorSnapshot` and sends `toggle-meta`, `settings` and `close-pane` with `sendCommand`; `open-record` still calls the controller. `DCLogicHandle`, `ReactFiberNode`, `ReactContainerRoot`, `findComponent`, `reachComponent`, `computeStatePatch`, the `bind()` retry and the `GraphMode` and `Snapshot` imports are gone; the file contains no `__reactContainer`, `stateNode` or `setState`. F334 fixed.

The first full gate run failed 28 of 50 (`menu_commands`: the settings dialog never opened; `naming_sessions`: the bar read `pane-1` before the session opened; `length_tone_rows`, `run_panes` and others: snapshot fields missing). Cause: the window held two copies of `web/app/state/shell.ts`. Vite bundles one into `reveal-*.js` with the boot script; esbuild bundles another into the page with `reveal_component.ts` (`vite.config.ts`, `inlineDcScript`, `bundle: true`). The built page had the store's code 9 times and the boot bundle once, so the boot script wrote to one store and the component read the other. `shell.ts` now keeps its store and channel on the window (`globalThis.__substrateShell`), made by whichever copy loads first. Sprint 211's gates passed because nothing wrote the store then.

With the fix: `npm run build` 0, run alone; `npm run test:unit` 0; `npm run signals` 0. Every script in `gates:electron` run alone: 50 of 50 exit 0, 152 s, each log ending on its own ok line (Axis C: "tags 5/5: 5 … bugs: 0"). URL probe (scratch script) exit 0: no `session` before the turn, the session's id after it, and a reload reopens that session. Pixel capture `sprint-212-check`: 28 of 28, 0 pixels. Group A is done.

## Rubber Duck pass

No signals change. Observations: timing surprise, a store that worked in one bundle and was empty in the other. Disposition: resolved-here (one instance per window); the settings store, read today only by the component, gets the same fix in sprint 213 before any React reader reaches it.
