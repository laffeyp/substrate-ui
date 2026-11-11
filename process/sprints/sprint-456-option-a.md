# Sprint 456 — the selection's key is ⌥A

```yaml
---
id: 456
status: closed
phase: code editor (roadmap r13), E10.3 amended
pass_kind: functional
---
```

## scope

The Architect, 2026-11-10: ⌥ adds things to the message (⌥-click in the tree), and ⌘⇧ is kept for switching views. ⌘⇧A, from sprint 454, becomes ⌥A, with the code focused:
- The keystroke is cancelled, so ⌥A adds the chip and types nothing into the code. Outside the code, ⌥A still types "å".
- KEY_ROUTED names an ⌥ chord that acts by its physical letter ("Alt+A"), since macOS gives `key` the composed character.
- ⌘⇧A does nothing.

Files: `web/app/keymap.ts` and its spec, `web/app/App.tsx` (cancel, name, log), `web/app/editor/Centre.tsx` (the refusal's key name); the vocabulary (notes); gate `editor_selection_chips.ts`.

## context_files

- BLACKBOARD 2026-11-10: the user entry (⌥, not ⌘⇧) and the agent-resolved entry (⌥A).
- Sprint 454's card; `keymap.ts`; `App.tsx` `onKey` (KEY_ROUTED); vocabulary 0.57 (EDITOR_CHIP_ADDED, KEY_ROUTED).

## signal contract

Vocabulary v0.58, notes only (P-0.58-OPTION-A):
- EDITOR_CHIP_ADDED.how `key` is ⌥A.
- KEY_ROUTED names an acting ⌥ chord by its physical letter.

## artifact contract

- The keymap spec: ⌥A with the code focused is `add-selection`; ⌘⇧A is nothing; ⌥A outside the code is nothing.
- Unit specs 0; build 0; signals 0.

## observation contract

`editor_selection_chips` from source and on the bundle, now with ⌥A:
- The same three chips as before, and the same record.
- KEY_ROUTED Alt+A → add-selection ×4.
- The buffer is unchanged by the four ⌥A presses: no character typed.
- ⌘⇧A in the code adds no chip.

One ⌥A comes as macOS sends it: a single key-down whose key and text are "å", sent through the DevTools Protocol's `Input.dispatchKeyEvent`. Playwright's ⌥A types nothing either way, and a mutant that acts without cancelling fails the gate by typing "å". The cancel is `onKey`'s general `preventDefault` for every action. Found in the close and fixed: the comment above that line still described sprint 407's Escape, which sprint 447 removed.

## done criteria

⌥ adds to the message everywhere it can, and ⌘⇧ is left for views.
