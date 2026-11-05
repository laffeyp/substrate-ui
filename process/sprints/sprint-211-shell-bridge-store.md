---
id: 211
status: closed
phase: shell-to-react A7a
pass_kind: functional
---

# Sprint 211 — the store the boot script will write in place of the component's state

## scope

`reveal.ts` reaches the dc-runtime component through React's private fiber fields (`reachComponent`, `findComponent`, `reveal.ts:34–57`) to do two things: mirror every pane controller's snapshot into `component.setState` (`:131–165`, with the focused pane's fields, `/language` opening meta, and the URL's `session`), and run three menu commands on it (`:255–276`: toggle meta, settings, close pane). Plan row A7 replaces both with store actions that `DCLogic` subscribes to. That takes three files, so A7 runs as two sprints: this one (A7a) adds the store and the subscriber; A7b points `reveal.ts` at the store and removes the fiber code.

`web/app/state/shell.ts`: a store made with `createStore` holding each pane's latest snapshot and the pane that changed last (`mirrorSnapshot(paneId, snap)`); and an ordered command channel (`sendCommand`, `onCommand`) for `toggle-meta`, `settings`, `close-pane`, which holds commands sent before any listener and hands them to the first. `DCLogic.componentDidMount` subscribes to both. Its snapshot handler does what `reveal.ts`'s does today, moved unchanged: `controllerSnapshots` for every pane; for the focused pane the ten fields of `computeStatePatch`, `/language`'s open tick (meta opens on the language lens at the latest shift), and the `session` URL parameter. Its command handler calls `_toggleMeta`, opens the settings dialog, or `_closePane(state.focused)`. Unsubscribed at unmount. Nothing writes the store in this sprint, so the window behaves as before.

## prerequisites

- 210 closed (the menu and dialog gates check this move)

## context_files

- `web/reveal.ts:19–72`, `:126–175`, `:246–280`
- `web/reveal_component.ts:888–895` (`componentDidMount`), `:1063` (`componentWillUnmount`), `:1074` (`_toggleMeta`), `:341` (`_closePane`)
- `web/app/store.ts`, `web/app/state/settings.ts`
- `process/planning/2026-11-04-shell-to-react/PLAN-2026-11-04-shell-to-react-r5.md` (A7; the store paragraph)

## signal contract

None changed.

## artifact contract

- Created: `web/app/state/shell.ts`. Modified: `web/reveal_component.ts`.
- `npm run build` 0, run alone; `npm run test:unit` 0; `npm run signals` 0.

## observation contract

No caller writes the store yet. Gates `menu_commands`, `dialogs`, `transcript_follow`, `language_lens_views` exit 0; the pixel captures compare equal to `baseline-2026-11-04`.

## done criteria

`DCLogic` can be driven entirely through the store and the channel, ready for `reveal.ts` to stop touching its fiber.

## result

Closed 2026-11-05. `web/app/state/shell.ts` holds the `shell` store (`snapshots`, `changedPane`, `mirrorSnapshot`) and the command channel (`sendCommand`, `onCommand`, holding commands sent before a listener). `DCLogic.componentDidMount` subscribes to both and unsubscribes at unmount; its snapshot handler is `reveal.ts`'s, moved unchanged (the ten focused fields, the language open tick, the URL's `session`); its command handler calls `_toggleMeta`, opens settings, or `_closePane(state.focused)`. `npm run build` 0, run alone; `npm run test:unit` 0; `npm run signals` 0. Gates `menu_commands`, `dialogs`, `transcript_follow`, `language_lens_views` exit 0. Pixel capture `sprint-211-check`: 28 of 28, 0 pixels. Nothing writes the store yet; A7b points `reveal.ts` at it.

## Rubber Duck pass

No signals change. Observations: none. Disposition: none needed.
