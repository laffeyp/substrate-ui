---
id: 210
status: closed
phase: shell-to-react A12
pass_kind: observation
---

# Sprint 210 — a gate for the menu's Settings… and Close Pane

## scope

No gate drives the menu's Settings… or Close Pane (plan round 5, "Tests already in place"), and ⌘W reaches Close Pane only through the menu (sprint 209's probe). `harness/shakeout/menu_commands.ts` clicks both items with `Menu.getMenuItemById(…).click()`, as `electron_menu.ts` does, against the app launched from source, and `gates:electron` runs it. Settings…: the settings dialog opens; Escape closes it. Close Pane: its accelerator is `CmdOrCtrl+W`; with two bound panes it ends the focused pane's session (`SESSION_END_REQUESTED`, `reason: user_close`, that session's id) and leaves one pane, whose session is not ended; with one pane left it does nothing.

## prerequisites

- 209 closed

## context_files

- `electron/menu.js:30–95`; `web/reveal.ts:255–276` (the renderer's menu commands)
- `web/reveal_component.ts:341–380` (`_closePane`)
- `harness/shakeout/electron_menu.ts` (clicking a menu item)
- `web/vm/signals/versions/current.json` (`SESSION_END_REQUESTED`)

## signal contract

### Emits

- `SESSION_END_REQUESTED` (`session_id`, `reason: user_close`) for the closed pane's session only. Read from `window.__vmSignals`.

## artifact contract

- Created: `harness/shakeout/menu_commands.ts`. Modified: `package.json` (`gates:electron`).
- `npx tsc -p harness` 0; `npx tsx harness/shakeout/menu_commands.ts` 0, its last line `menu_commands: ok — …`.

## observation contract

As in scope. A planted fault fails it: with `_closePane`'s one-pane guard removed, the gate fails at the last step.

## done criteria

The two menu commands with no gate, and ⌘W through its item, are gated on today's tree.

## result

Closed 2026-11-05. `harness/shakeout/menu_commands.ts` written; `gates:electron` runs it (50 scripts). `npx tsc -p harness` 0; the gate exit 0: "Settings… opens the dialog; Escape closes it; accelerator CmdOrCtrl+W; Close Pane ended s_9fe9… (user_close) and left pane 1 on s_74cb…; Close Pane on the last pane does nothing".

Two fixes to the gate while writing it: each turn is typed into its own pane's input bar (`[data-pane="<n>"] textarea[data-input-bar]`), since the first visible bar is pane 1's; and the "does nothing" step waits on a condition, not a fixed time: Settings… is clicked after Close Pane, and because menu commands reach the window in order over one IPC channel, its dialog opening shows the Close Pane before it was handled.

Planted fault (`_closePane`'s one-pane guard removed): exit 1, "Close Pane on the last pane: 1 panes, 1 end requests". Restored byte for byte and rebuilt.

## Rubber Duck pass

*Sequence.* `SESSION_END_REQUESTED` (session_id the second pane's, reason `user_close`) → the window asked to end the closed pane's session. No end request for the first pane's session, and none on the last-pane click.

*Observations.* None in the six categories. *Dispositions.* None needed.
