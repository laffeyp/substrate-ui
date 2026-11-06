---
id: 328
status: closed
phase: shell-to-react E4.1
pass_kind: functional
---

# Sprint 328 — `App`: the shell as a typed React component (F327, F344)

## scope

Plan row E4. `web/app/App.tsx` is DCLogic (web/reveal_component.ts) as a React class component, type-checked against the controllers' own types (`PaneRegistry`, `SessionController`, `Snapshot`), with `AppState` and `AppPane` declared. Every method's logic is carried over; its `render` draws the window from the template's layout with the areas as children (top bar, panes view, the meta view's transcript column and `MetaView`, the records and assay pages, footer, dialogs, first run). Not carried over: values the class computed for template slots nothing read (per-pane dots, sent lines, the legacy start lines, `driverOpen`, `toggleDriverMenu`, `allSessions`) and four markdown wrappers nothing called. `web/app/window.css` holds the page rules from the template's helmet. `web/app/derive/stream.ts`'s `RawEnvelope` takes the wire's `producer: null`.

Fixed in the port: "choose folder…" in the pane picker called `this._pickFolder`, which commit 4fcc3bf removed while leaving the call, so the row threw a TypeError; App's `pickFolder` opens Electron's folder dialog, records the folder and arms it. The top-bar actions' unsubscribe is held once, not pushed per render.

## artifact contract

- Created: `web/app/App.tsx` (no `@ts-nocheck`), `web/app/window.css`. Modified: `web/app/derive/stream.ts`. `npx tsc --noEmit` 0.

## result

Closed 2026-11-05. The first draft, the old file with the pragma removed, had 360 errors (184 undeclared fields, 136 untyped parameters); the port typechecks with none.

## Rubber Duck pass

No signals.
