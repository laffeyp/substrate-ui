---
id: 203
status: closed
phase: shell-to-react A8 (fix found by the gate)
pass_kind: functional
---

# Sprint 203 — a click inside a dialog no longer closes it

## scope

Each dialog's panel binds `onClick="{{ swallow }}"` (`web/reveal.html:497, 517, 530`) so a click inside it stops before the backdrop's close handler. Commit `5a4d97a` (2026-10-14, U186) removed `swallow: (ev) => ev.stopPropagation()` from `renderVals()` and left the bindings, so `swallow` is undefined and every click in a dialog closes it: in settings, `+`, `−` and a theme pick each apply and close the dialog. Found by sprint 202's gate. `renderVals()` returns `swallow` again, beside the dialogs' values. Nothing else changes.

## prerequisites

- 202's gate written (it is the check)

## context_files

- `web/reveal.html:492–534`, `web/reveal_component.ts:2507`
- `git show 5a4d97a -- web/reveal_component.ts` (the removal)

## signal contract

None changed.

## artifact contract

- Modified: `web/reveal_component.ts` (one value).
- `npm run build` 0; `npm run test:unit` 0.

## observation contract

- `npx tsx harness/shakeout/dialogs.ts` exits 0 (it fails on today's tree at the size read after `+`).
- The pixel captures compare equal to the baseline: no screen the capture draws has a click inside a dialog.

## done criteria

Clicking a control in the settings dialog applies it and leaves the dialog open.

## result

Closed 2026-11-04. `renderVals()` returns `swallow: (ev) => ev.stopPropagation()` beside `closeSettings`. `npm run build` 0; `npm run test:unit` 67/67. `dialogs.ts` exit 0 (it failed before the fix). Pixel capture `sprint-203-check` against `baseline-2026-11-04`: 28 of 28, 0 pixels. Gates `transcript_follow`, `input_bar`, `slash_menu` exit 0.

## Rubber Duck pass

No signals change. Observations: none beyond the defect fixed. Disposition: none needed.
