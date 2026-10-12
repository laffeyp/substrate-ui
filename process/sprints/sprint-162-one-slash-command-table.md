# Sprint 162 — One slash-command table: the menu, its choices and /help read it

```yaml
---
id: 162
status: closed
closed_at: 2026-10-12
phase: 1
pass_kind: functional
asked: 2026-10-12 (Architect: "I'm only seeing exit, model, name, list, interrupt, fold, unfold, clear, and help"; "/help … not very formatted"; choices should appear "as … grayed out text, like we do it everywhere else"; then a pass for the same class of error)
context_files:
  - web/vm/session_controller.ts
  - web/reveal_component.ts
  - web/partials/input-bar.html
---
```

## scope

Two lists of the slash commands: the menu's `CMDS` (`reveal_component.ts`, 9 rows) and the controller's `slashCommands()` (`session_controller.ts`, 13 commands, the one that runs them). U161 added `/guidance`, `/length`, `/tone` to the second only; `/dellm` was never in the first. `/help` prints the second as one line of usages joined by dots. Typing `/tone ` offers no positions.

After:

1. **One table.** Each entry in `slashCommands()` carries its names, usage, a one-line description and, where it takes one of a fixed set, its choices and current value. `slashCatalog()` exposes it. `CMDS` goes; the menu reads the focused pane's controller. One UI-side override stays, by name: `/exit` from the menu opens the end confirmation, as now.
2. **Choices.** Typing a command with choices and a space lists its choices in the menu, filtered by what follows, each with its note in grey; the current value is marked. A pick sends the full command.
3. **`/help`.** One row per command: usage, then description.

## signal contract

No controller tag changes.

## observation contract

Electron gate `slash_menu.ts`: bind pane 1; `/` lists every command `slashCatalog()` names (13), in its order; `/to` lists `/tone` alone; `/tone ` lists blunt, neutral, formal, dry with neutral marked current; picking `formal` sets the manifest's tone; `/help` writes one row per command naming `/guidance`, `/length`, `/tone` and `/dellm` with their descriptions.

## checks

- The gate red, then green; unit specs; `tsc`; `input_bar`, `controls_mid_session`, `tool_output_toggle`.

## result

- **Built.** `slashCommands()` entries carry `about`, and for a fixed set `choices` and `current`; `slashCatalog()` exposes them. `CMDS` is gone: the menu (`_slashMenu`) reads the pane's controller; `/exit` from the menu still asks first. `/tone ` (a command with choices and a space) lists the choices with the picker's own notes and the current value marked. `/help` writes `helpRows`, drawn by `Row.tsx` as usage then description. The table's order puts the session controls after `/model` and `/name`.
- **Gate** `slash_menu.ts` (in `gates:electron`): red on the old code (no catalog), green after: "/" lists the 13 commands in the table's order; "/to" lists /tone; "/tone " lists four with neutral current; picking formal sets the tone; /help writes 13 described rows. Screenshots of "/" and "/guidance " read.
- **The same class, swept.** Two more hand-kept pairs: the session status label and dot, kept twice (workspace picker rows, records page), now one `web/reveal/session_status.ts`; and the session `PATCH` allow-list beside its handlers (U161's `guidance` was handled and not allowed), now held equal by `tests/test_session_patch_fields_parity_162.py`, which fails with `guidance` taken out. Slash names mentioned in the UI's text all exist in the table.
- **An error in the gates.** `left_folds_workspace` failed once in a run of the affected gates and passed three reruns. Cause: its `press` read the state after a fixed 120 ms; under load the read came before the draw (it showed the folder still lit after ↓). Fifteen fixed sleeps before reads, in eleven gates, now wait for a condition or `settled()` (`lib/electron.ts`, two animation frames); `input_bar`'s composition check counts the `TURN_SUBMITTED` signal instead of waiting. One bounded poll (`new_window`) stays.
- **Checks.** Full `gates:electron`, 34 commands, exit 0 (shakeout 3 flows, 0 bugs); UI Python 250 passed; unit specs 37/37; `tsc` and `tsc -p harness` clean. The first full run failed to build: a duplicate `const` in `input_bar.ts` that `tsc --noEmit -p .` does not see, since `harness/` has its own tsconfig.
- **Rubber Duck Pass.** No controller tag moved; `SLASH_ROUTED` still marks each routed command.
