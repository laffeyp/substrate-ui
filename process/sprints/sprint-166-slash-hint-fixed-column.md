# Sprint 166 — The slash hint sits in a fixed column and stays

```yaml
---
id: 166
status: closed
closed_at: 2026-10-12
phase: 1
pass_kind: functional
roadmap: process/planning/ROADMAP-2026-10-12-slash-entry.md
asked: 2026-10-12 (Architect: the hint "should always be in a standardized place. It shouldn't move while you type … far enough to the right that it won't be interrupted by typing in any option and it will never disappear")
context_files:
  - web/reveal_component.ts
  - web/partials/input-bar.html
---
```

## scope

U163 drew the hint right after the typed text, so it moved with every key, and dropped it at the space. After: the hint starts at one column for every command, the length of the longest command with its longest choice (`/guidance harness`, 17 characters) plus three, in `ch` of the bar's monospace font. It shows whenever the bar's text names one command: a unique prefix, or a full name or alias followed by a space and anything typed after it. It hides only when the typed text itself reaches the column (free-text arguments: `/name`, `/dellm`, `/model`).

## observation contract

`slash_inline_hint.ts`, rewritten: the hint's left edge is the same for "/g", "/guid", "/guidance ", "/guidance hig" and "/tone bl" (within 1px), lies right of the width of "/guidance harness", and reads the command's choices and description in each; "/l" shows none; "/name " followed by text past the column shows none.

## checks

Gate red, then green; `slash_menu`, `slash_choice_keys`, `slash_tab_complete`, `input_bar`; `tsc`, `tsc -p harness`.

## result

- **Built.** `_slashHint` names the command from a unique prefix or from a full name or alias before a space, and returns its text and a column computed from the catalog (longest name with its longest choice, plus three; 20ch today); the template places the hint at that column in `ch` behind the textarea. Text reaching the column hides it.
- **Gate** `slash_inline_hint.ts`, rewritten: red on U163's code (the hint started at 15.7px after "/g"), green after: the hint holds at 156.5px for "/g", "/guid", "/guidance ", "/guidance hig", "/tone bl", right of "/guidance harness" (133.1px); "/l" lists two and shows none; long `/name` text hides it. `slash_menu`, `slash_choice_keys`, `slash_tab_complete`, `input_bar` pass. Screenshot of "/guidance me": the hint holds its column, which lines up with the menu's description column.
