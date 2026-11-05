---
id: 216
status: closed
phase: shell-to-react B1.3b
pass_kind: functional
---

# Sprint 216 — the dialogs swap in

## scope

Plan round 5, row B1, swap step. `reveal.html`'s dialog block (settings, export, end-session; four `sc-if`s) becomes `<div data-app-mount="dialogs"></div>`. `reveal_component.ts` drops `showSettings`, `showExport`, `showEndConfirm` and the dialog fields of `renderVals`; ⌘,, the menu's Settings… and `/exit` call `openSettings()` and `openEndSession(title)`, where the title is the pane header's (`_paneTitle`); the Escape order and the two key guards read `dialogOpen()`. F351 closes: no export dialog, and the confirm names the session.

## context_files

`web/reveal.html`, `web/reveal_component.ts`, `web/app/state/dialogs.ts`, `web/app/Dialogs.tsx`; design: `design/received/handoff 5/docs/DESIGN-SPEC -2026-11-04- r6.md`.

## artifact contract

- Modified: `web/reveal.html` (no `showSettings`, `showExport`, `showEndConfirm`; contains `data-app-mount="dialogs"`), `web/reveal_component.ts` (no `showSettings`, `showExport`, `showEndConfirm`, `doEndSession`).
- `npm run build` 0, run alone; `npm run test:unit` 0; `npm run signals` 0.

## signal contract

Emits, through the controller, unchanged: `SESSION_END_REQUESTED` then `SESSION_ENDED_LOCAL` on confirm.

## observation contract

- `harness/shakeout/dialogs.ts`, `escape_order.ts`, `menu_commands.ts` exit 0.
- Pixel captures equal to the baseline except `end-dialog@*`, where only the session name differs.

## result

Closed 2026-11-05. Build 0, unit 72/72, signals 0 (36 of 36). `dialogs.ts` 0 ("end confirm: SESSION_END_REQUESTED, SESSION_ENDED_LOCAL; settings 13px → 14px, Escape closes; after reload 14px"); `escape_order.ts` 0; `menu_commands.ts` 0. Pixels against `baseline-2026-11-04`: 26 of 28 at 0; `end-dialog@1440x900` and `@900x380` differ by 1190 pixels each, all in the title, which reads "End session pane-1?" where it read "End session fix-race-in-metering?". `captures/pixel/baseline-2026-11-05/` is the 2026-11-04 baseline with those two files replaced; the run matches it 28 of 28.

One change in behaviour, small: Escape on the settings dialog now clears the theme note as a click on the backdrop or "close esc" did; before, the note survived an Escape and showed again on reopening.

## Rubber Duck pass

Signals: `SESSION_END_REQUESTED` (reason `user_end`) — the end of the session was requested; `SESSION_ENDED_LOCAL` — the controller recorded it ended. Order as the vocabulary states. Observations: none outside the two recorded above. Disposition: recorded (new baseline; Escape clears the note).
