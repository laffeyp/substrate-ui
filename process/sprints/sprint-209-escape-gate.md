---
id: 209
status: closed
phase: shell-to-react A11
pass_kind: observation
---

# Sprint 209 — a gate for Escape's order

## scope

No gate drives Escape (plan round 5, "Tests already in place"). `harness/shakeout/escape_order.ts` drives it against the app launched from source after one deterministic turn, and `gates:electron` runs it. Escape closes, in this order (`reveal_component.ts:976–998`): find; then a dialog; then a menu; then a surface; with none open, it interrupts the focused pane's running turn, `hard`, or `soft` with Shift. Checked: find open over the settings dialog closes first and the dialog stays; the settings dialog over the records page closes first and the page stays; then the page closes. For the interrupt branch the deterministic driver gives no running turn (it answers at once), so the gate sets the focused controller's snapshot to running and records the calls `window.__vm.interruptTurn` receives: Escape gives `hard`, ⇧Escape gives `soft`, and Escape with find open gives none. The controller's interrupt itself does not move in this plan and is not gated here.

⌘W, the plan row's second half, is a menu accelerator (`electron/menu.js:84`). A synthetic ⌘W, from Playwright or `webContents.sendInputEvent`, does not reach it (probe on 2026-11-05: two panes stay two), because macOS maps the key to the menu item. It is gated through that item, with its accelerator checked, in A12.

## prerequisites

- 208 closed

## context_files

- `web/reveal_component.ts:974–998` (⌘F, ⌘, and Escape), `:341–350` (`_closePane`)
- `web/reveal.ts:144` (the snapshot mirror the key handler reads), `:255–276` (menu commands)
- `electron/menu.js:80–90`
- `harness/shakeout/dialogs.ts`

## signal contract

None asserted: the gate records `interruptTurn`'s calls in the page; no controller tag fires, since the recorder stands in for the controller's method.

## artifact contract

- Created: `harness/shakeout/escape_order.ts`. Modified: `package.json` (`gates:electron`).
- `npx tsc -p harness` 0; `npx tsx harness/shakeout/escape_order.ts` 0, its last line `escape_order: ok — …`.

## observation contract

As in scope. A planted fault fails it: with the find and dialog branches swapped in the handler, the gate fails at the first step.

## done criteria

Escape's order and its interrupt branch are gated on today's tree.

## result

Closed 2026-11-05. `harness/shakeout/escape_order.ts` written; `gates:electron` runs it (49 scripts). `npx tsc -p harness` 0; the gate exit 0 on its first run: "find, then the dialog; the dialog, then the records page; running turn: Escape hard, ⇧Escape soft, Escape with find open closes find only; calls ["hard","soft"]". The recorded calls show the running state took: without it the handler calls nothing.

Planted fault (the find and dialog branches swapped): exit 1, "the first Escape should close find and leave the settings dialog". Restored byte for byte and rebuilt.

## Rubber Duck pass

No signals asserted: the recorder stands in for the controller. Observations: none in the six categories; the ⌘W probe is in scope above. Disposition: none needed.
