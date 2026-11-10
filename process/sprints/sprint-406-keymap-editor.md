# Sprint 406 — ⌘⇧E and Escape in the key map

```yaml
---
id: 406
status: closed
phase: code editor, phase 1 (round 6), R1
pass_kind: architecture
---
```

## scope

`web/app/keymap.ts`: `KeyContext` gains `editor` (the editor is the base view and no page is open). ⌘⇧E (⌘ and ⇧, no ⌥, no ⌃, key `e` either case) is `{ kind: "toggle-editor" }` from anywhere the ⌘ keys work. Escape in the editor, once find, a dialog, the top bar's cards and any page are closed, is `{ kind: "close-editor" }`, ahead of the interrupt (BLACKBOARD 2026-11-09 agent-resolved, "Esc in the editor view"). ⌘E (no ⇧) stays `toggle-tools`. The spec `web/app/__tests__/keymap.spec.ts` adds `editor: false` to its context and one test for the new keys; the four existing tests pass unchanged.

## prerequisites

- 405

## context_files

- `web/app/keymap.ts`, `web/app/__tests__/keymap.spec.ts`
- `electron/menu.ts` lines 15–19 (the renderer owns view keys)
- Design: spec r6 §4, §8 (⌘⇧E editor; esc pane); D73 (c) (close cascade before interrupt); frame `runs/design/sheet-v11/24a.png` footer ("esc or ⌘⇧E back to the pane")

## signal contract

### Emits

- none here. App writes KEY_ROUTED for the action this map returns (card 407).

### Invariants

- Every action the existing tests name is returned unchanged.

## artifact contract

### Files modified

- `web/app/keymap.ts`, `web/app/__tests__/keymap.spec.ts`

### Content assertions

- `keymap.ts` contains `kind: "toggle-editor"` and `kind: "close-editor"`.

### Command exit codes

- `npx tsx --test web/app/__tests__/keymap.spec.ts` returns 0.
- `npx tsc --noEmit` returns 0 after card 407 passes the new context field (this card leaves App's call missing `editor`, so `tsc` is run at 407's close).

## observation contract

None here: card 407's gate presses ⌘⇧E and Escape in the running app.

## done criteria

The key map returns the editor's two actions in the cases the design names, and nothing else changes.

## self-review checklist

- [x] One verifiable property.
- [x] Design inputs listed.
- [x] Emits: none.
- [x] Gradable.
- [x] Behaviour covered by 407.
- [x] Two files, one concept.
