# Sprint 447 — Escape in the editor interrupts the model

```yaml
---
id: 447
status: closed
phase: code editor (roadmap r13), the editor's keys (E1)
pass_kind: functional
---
```

## scope

In the editor view, Escape does what it does in the pane:
- It interrupts the focused pane's running turn, hard, or soft with ⇧.
- With no turn running, it does nothing.
- It no longer leaves the editor. ⌘⇧E alone returns to the pane.

Two things are unchanged:
- The close cascade comes first, as in the pane: the find bar, a dialog, the top bar's cards, a page over the editor (D73 (c)).
- With vim bound and the code focused, Escape is vim's own key.

The footer's hint reads "⌘⇧E back to the pane · ⌘M meta". The Architect's ruling of 2026-11-10 supersedes the decision of 2026-11-09 and frame 24a's "esc or ⌘⇧E back to the pane".

Files: `web/app/keymap.ts` and its spec, `web/app/derive/footer.ts` and its spec, `web/app/App.tsx` (the `close-editor` action gone); gates `editor_view.ts` and `editor_resize.ts` (they left the editor with Escape), `editor_escape_interrupt.ts` (new).

## context_files

- BLACKBOARD: the `user` entry of 2026-11-10 (Escape interrupts); the agent-resolved entries of 2026-11-09 (Esc in the editor view; esc stays in vim).
- `web/app/keymap.ts`; `App.tsx` `close-editor` and `interrupt`; `derive/footer.ts`; frame 24a; D73 (c); gate `escape_order.ts`.

## signal contract

No new tag:
- KEY_ROUTED records Escape → `interrupt` from the editor.
- TURN_INTERRUPTED records the interrupt.
- No VIEW_CHANGED for Escape in the editor.

## artifact contract

- The keymap spec: Escape in the editor gives `interrupt` (hard; ⇧ soft) while a turn runs, and null when none runs; the cascade first; null with vim in the code.
- The footer spec: the new hint.
- Commands: `npm run test:unit` 0; `npm run build` 0.
- Gates from source and on the bundle: `editor_escape_interrupt`, `editor_view`, `editor_resize`, `escape_order`, `editor_editing`, `editor_keys` 0.

## observation contract

`editor_escape_interrupt`, with the live roster's model:
1. Open the editor.
2. From its terminal, send a turn that runs `sleep 30` in bash.
3. Once the bash call is on the record, press Escape with the focus in the editor's input bar.

Expected:
- The editor stays open.
- KEY_ROUTED reads Escape → interrupt, and TURN_INTERRUPTED is hard.
- The record's turn ends interrupted within 10 s.
- No VIEW_CHANGED is written.

`editor_view`: Escape with no turn running leaves the editor open, and ⌘⇧E returns to the pane.

## done criteria

Esc in the editor stops the model, as in the pane, and the person stays in the editor.
