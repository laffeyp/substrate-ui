---
id: 329
status: closed
phase: shell-to-react E4.2
pass_kind: functional
---

# Sprint 329 — `reveal.html` loads one module; dc-runtime moves out (F343, F346, F321)

## scope

`web/reveal.html` is a head with one module script and a body with `#root`; `web/reveal.ts` boots the registry and renders `App`, with no mount registry and no transcript observer. `vite.config.ts` loses `inlineDcScript`, `includePartials` and the React alias, so the bundle imports React from `node_modules`. Moved to `_deprecated/dc-runtime/`: the old `reveal.html`, `reveal_component.ts`, `support.js` (F343: generated from a dc-runtime source in neither repo; F346: it fetched the page a second time on each load to parse the template), `web/shims/` (F321), `web/partials/`, `web/app/mount.ts` and its spec, and the two plugins (`vite-plugins.ts`). The vendored UMD React files are still emitted; E5 removes them. `web/app/PanesView.tsx` and `App.tsx` carry the template's `data-view` and `data-pane-id` hooks on their area wrappers.

## artifact contract

- Modified: `web/reveal.html` (no `support.js`, no `x-dc`), `web/reveal.ts`, `vite.config.ts` (no `alias`, no `inlineDcScript`), `web/app/PanesView.tsx`, `web/app/App.tsx`. Moved: the eight paths above. `npm run build` 0.

## observation contract

Every `gates:electron` script run alone exits 0; Axis C bugs 0; pixels equal `baseline-2026-11-05-d2`.

## result

Closed 2026-11-05. Run: 57 of 58 exit 0, Axis C bugs 0, pixels 28/28. `activity_clock` exit 1, `after a turn the line reads {"text":"","pulse":false}`: it finds the bar line under `[data-view="panes"]`, a hook the template's mount div carried and the React wrapper did not. With the hooks on the wrappers it exits 0. Over the two-file rule (drift entry): the page, its boot and its build change together or nothing draws.

## Rubber Duck pass

No signals of its own; the capture's first-run reload shows SESSION_ATTACH_STARTED, SESSIONS_LOADED, DRIVER_ROSTER_LOADED, WORKSPACES_LOADED, STREAM_ATTACHED, TOPOLOGY_LOADED, STREAM_ENVELOPE_APPENDED, TURN_PARKED, BUNDLE_ROSTER_LOADED, as before.
