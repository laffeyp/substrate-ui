# ROADMAP: entering a slash command

*2026-10-12. From the Architect's description of how typing a slash command should behave, confirmed the same day. Builds on U162 (one slash-command table, `slashCatalog()`).*

## The behaviour

**Typing the command name** (no space yet). While several commands match (`/`, `/l`), the menu above lists them, as now. Once one command matches (`/guid`), the menu closes and a grey hint follows the typed text in the input row: the command's choices or arguments and its description. The name is never completed for the user.

**After the full name and a space.** The menu above lists the command's choices with their notes, the current one marked; typing filters them. ↑ from the input moves into the menu at the row nearest the input; ↑ and ↓ move; ↓ from the bottom row returns to the input; ↵ picks the lit choice; esc returns to the input. While this menu is open, ↑ does not recall history.

**Tab.** Tab completes a command name: a single match becomes `/<name> ` (its choices then open); several matches complete to their longest common prefix.

## Order

| Card | What | Gate |
|---|---|---|
| U163 | The grey hint in the input row once one command matches; the menu closes | `slash_inline_hint.ts` |
| U164 | Arrow keys in the choice menu; ↑ leaves history alone while it is open | `slash_choice_keys.ts` |
| U165 | Tab completes command names | `slash_tab_complete.ts` |

Each card: its gate red on the old code and green after; `slash_menu` and `input_bar` still pass.
