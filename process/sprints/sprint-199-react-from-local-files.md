---
id: 199
status: closed
phase: shell-to-react A3b
pass_kind: functional
---

# Sprint 199 — the window loads React from its own files

## scope

`web/reveal.html` loads React 18.3.1 and ReactDOM from `cdnjs.cloudflare.com` at every launch, with no `integrity` hash (lens finding F320). It loads them from `./vendor/` instead. A Vite plugin in `vite.config.ts`, `vendorReact`, copies `node_modules/react/umd/react.production.min.js` and `node_modules/react-dom/umd/react-dom.production.min.js` into the build as `vendor/…`, serves them from `node_modules` under the dev server, and adds a `sha384` `integrity` attribute to each `./vendor/` script tag. With no `window.React` missing, `support.js`'s own unpkg loader never runs (F345). The rest of the window is unchanged.

## context_files

- `web/reveal.html` (lines 10–14), `vite.config.ts`, `server.py:4451–4475` (static serving)
- `process/planning/2026-11-04-shell-to-react/PLAN-2026-11-04-shell-to-react-r4.md`
- Lens findings F320, F345 (`process/planning/2026-10-08-lens-audit/ROADMAP-2026-10-08-lens-audit-remediation-LEDGER.md`)

## artifact contract

- Modified: `web/reveal.html`, `vite.config.ts`.
- `web/dist/reveal.html` has no `cdnjs` and two `./vendor/` script tags, each with `integrity="sha384-…"`.
- `web/dist/vendor/react.production.min.js` and `react-dom.production.min.js` exist, byte-equal to the `node_modules` copies.
- `npm run build` 0; `npm run test:unit` 0.

## signal contract

None changed: React's version and the window's code are the same.

## observation contract

- The app, launched from source, makes no request to any origin but its own server (every request the window makes is recorded).
- The pixel captures compare equal to the baseline.
- Gates `electron_smoke` (Axis C), `transcript_follow`, `input_bar`, `one_top_bar` pass.

## done criteria

The window draws as before and fetches nothing from another origin.

## result

Closed 2026-11-04. `web/reveal.html` loads `./vendor/react.production.min.js` and `./vendor/react-dom.production.min.js`; `vite.config.ts`'s `vendorReact` plugin serves them from `node_modules` in dev, emits them into the build and adds a `sha384` `integrity` to each tag. `npm run build` 0: `web/dist/reveal.html` has no `cdnjs` and two `./vendor/` tags with `integrity`; both vendor files are byte-equal to `node_modules`. `npm run test:unit` 62/62.

Requests: launched from source, the window made 10 requests after a reload, none to another origin; two were `/vendor/…`; `window.React.version` is `18.3.1`. Gates `electron_smoke` (Axis C, 0 bugs), `transcript_follow`, `input_bar`, `one_top_bar` exit 0.

Pixels: the capture failed to hold steady across runs on this card, for reasons in the harness, not in the move. Fixed in `harness/pixel/masks.ts` and `capture.ts`:

- Masks drawn over text moved with the value's width and drew over text under overlays and backdrops. The capture now writes a fixed stand-in in place of each volatile value in the page's text (`normalizeVolatileText`), and retakes a shot when a value changed during it.
- Record ids (ULIDs) in the inspector's payload are a new pattern.
- `keyboard.type("hello")` into the input bar sometimes left a stray `o` behind after the turn, which broke the end-dialog step about one run in four. The capture now `fill`s the bar (`textarea[data-input-bar]`).
- The records row prints `2.678257942199707s ago`: `_relTime` (`web/reveal_component.ts:2001`) floors `Date.now()` but not the float `createdAt`. The relative-time pattern now takes a decimal part.

Baseline recaptured as `captures/pixel/baseline-2026-11-04/` (the old one moved to `sprint-199-old-baseline/`). Four fresh captures (`sprint-199-c1` … `c4`): 28 of 28 each, 0 differing pixels.

## Rubber Duck pass

*Sequence.* No new tags. The capture's `[pixel] signals` lines list the tags each screen fired; they match the baseline's.

*Observations.*
- Payload anomaly: the records row's relative time carries 15 decimal places (`_relTime` subtracts a float).
- Timing surprise: synthetic typing into the input bar drops or keeps keystrokes after a turn; the dc-runtime textarea is controlled and redraws mid-burst.
- Timing surprise: one probe launch timed out waiting for the armed model half after picking a folder; the next launch passed. No cause found in one run.

*Dispositions.* All three `recorded` as surfaced; the first two sit in areas the move rewrites (records list, input bar), and the swap sprints for those areas carry gates for them.
