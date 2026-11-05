---
id: 204
status: closed
phase: shell-to-react A5b
pass_kind: functional
---

# Sprint 204 — the settings fields leave the component

## scope

`reveal_component.ts` keeps the settings in `this.state` (`theme`, `fontOverride`, `settingsNote`, line 122), loads and saves `localStorage['substrate-ui.settings']` in `componentDidMount` (`:888–908`), and changes them in `renderVals()` (`:2507–2513`, `:2281`). They move into `web/app/state/settings.ts`: a store made with `createStore` (sprint 201), the load with its checks (theme one of dark, light, system; size a number from 9 to 19), the save, and the three changes the dialog makes (pick a theme, step the size, clear the note). `DCLogic` reads the store's snapshot in `renderVals()`, calls its actions, loads it at mount, and redraws on each change through `subscribe`, unsubscribing at unmount. The note's text and every value the dialog shows stay as they are.

## prerequisites

- 201 closed (the store); 202 closed (the dialogs gate, which checks this move)

## context_files

- `web/reveal_component.ts:118–124`, `:888–908`, `:1063`, `:2281`, `:2505–2514`
- `web/app/store.ts`
- `harness/shakeout/dialogs.ts`
- `process/planning/2026-11-04-shell-to-react/PLAN-2026-11-04-shell-to-react-r5.md` (A5b; the design's store paragraph)

## signal contract

None changed. The settings emit no tags.

## artifact contract

- Created: `web/app/state/settings.ts`. Modified: `web/reveal_component.ts`.
- `reveal_component.ts` no longer contains `fontOverride: null`, `settingsNote: ''` in its initial state, `_persistSettings`, or `substrate-ui.settings`.
- `npm run build` 0; `npm run test:unit` 0; `npm run signals` 0; `npx tsc --noEmit -p .` 0.

## observation contract

- `npx tsx harness/shakeout/dialogs.ts` exits 0: the size steps 13 → 14px, Escape closes, a reload keeps 14px.
- The pixel captures compare equal to `baseline-2026-11-04`, 28 of 28.
- A probe picks `light` in the settings dialog: the note "noted — the light theme ships with the build; the prototype renders dark" shows and the dialog stays open; `close esc` clears it; after a reload `localStorage['substrate-ui.settings']` holds `"theme":"light"`.

## done criteria

The settings live in their own store file and the dialog behaves as before.

## result

Closed 2026-11-05. `web/app/state/settings.ts` holds the settings store (`createStore`), `readSaved` with the load's checks, `loadSettings`, the save, and the dialog's changes `pickTheme`, `stepFont`, `fontSize`, `clearNote`. `reveal_component.ts` imports them: its initial state drops `theme`, `fontOverride`, `settingsNote`; `componentDidMount` calls `loadSettings()` and subscribes `forceUpdate`; `componentWillUnmount` unsubscribes; `renderVals()` reads the store's snapshot. No `_persistSettings`, `fontOverride: null` or `substrate-ui.settings` remains in the component; the key appears once in `web/dist/reveal.html`.

The first build failed on lint (`id-length`: a one-letter name in `settings.ts:35`), and the dialogs gate in that run tested the old bundle, since the failed build left `web/dist` as it was. Renamed; `npm run build` 0, run on its own so its exit code is the build's, not a pipe's. Then: `npm run test:unit` 67/67; `npx tsc --noEmit -p .` 0; `npm run signals` 0. `dialogs.ts` exit 0 on the new bundle ("settings 13px → 14px, Escape closes; after reload 14px"). Theme probe (scratch script) exit 0: picking `light` shows the note and leaves the dialog open; `close esc` closes it and clears the note; after a reload `localStorage` holds `{"theme":"light","fontOverride":null}` and the `light` chip is drawn selected. Pixel capture `sprint-204-check` against `baseline-2026-11-04`: 28 of 28, 0 pixels.

## Rubber Duck pass

No signals: the settings emit none. Observations: one timing surprise, a gate run against a stale bundle after a failed build; resolved here by reading the build's own exit code before any gate. Disposition: resolved-here.
