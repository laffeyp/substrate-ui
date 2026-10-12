# Sprint 164 — Arrow keys in the choice menu

```yaml
---
id: 164
status: closed
closed_at: 2026-10-12
phase: 1
pass_kind: functional
roadmap: process/planning/ROADMAP-2026-10-12-slash-entry.md
asked: 2026-10-12 (Architect: "the up arrow shouldn't be taking me back … to the previous prompt … Now, the up arrow should be taking me up into that options bar … the same rules as we use basically throughout this entire app … except this has no nesting")
context_files:
  - web/reveal_component.ts
---
```

## scope

With a command's choices open (`/tone `), ↑ in the bar recalls history. After: ↑ moves into the menu at the bottom row (nearest the input) and lights it as the picker lights a row (`#2e3138`); ↑ and ↓ move; ↓ from the bottom row returns to the input; ↵ picks the lit choice; esc returns to the input; typing returns to the input and filters. History recall is unchanged whenever no choice menu is open.

## observation contract

Electron gate `slash_choice_keys.ts`: send a message (so history holds one); "/tone ": ↑ lights `/tone dry` (bottom) and the bar still reads "/tone "; ↑ lights formal; ↓, ↓ returns to the input with nothing lit; ↑, ↑, ↵ sets the tone to formal. With the bar empty, ↑ recalls the sent message.

## checks

Gate red, then green; `slash_menu`, `input_bar` (history recall); `tsc`, `tsc -p harness`.

## result

- **Built.** Choice rows carry `choice`, `lit` and `bg`; render keeps each pane's rows (`this._slashRows`) for `_barKey`, which, with choices open, takes ↑ ↓ ↵ esc before history: ↑ enters at the bottom row, ↓ off the bottom returns, ↵ picks, esc returns. Typing clears the selection (`slashSel`).
- **Gate** `slash_choice_keys.ts`: red on the old code (↑ recalled "hello"), green after: ↑ lit /tone dry, ↑ lit formal, ↓ ↓ returned to the bar with nothing lit, ↑ ↑ ↵ set the tone to formal; ↑ on an empty bar recalled "hello".
