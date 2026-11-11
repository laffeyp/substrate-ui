# Sprint 443 — chips in the message

```yaml
---
id: 443
status: closed
phase: code editor (roadmap r11), E10 (a), and the first source of (b)
pass_kind: functional
---
```

## scope

D94 (frame 24k): things added to the message become chips in the input bar, named by the file or folder name, the full path on hover, removable with × or ⌫, and they travel with the next message as its attachments.

- **The chips.** Each pane's input keeps its chips beside its draft. A chip shows its label (a file's name; a folder's name with `/`), the workspace path as its tooltip, and × on hover; ⌫ with the caret at the start of an empty draft removes the last chip. The same thing added twice is one chip.
- **The message.** ↵ sends the draft with the chips as the turn body's `attachments` (`{kind, label, ref}`, which the server has resolved since sprint 388: a file's text read now, a folder recorded by name), then clears them. A slash command does not take the chips.
- **The first source.** ⌥-click on a file or folder in the editor's tree adds it as a chip to the pane's input (24k's terminal header hint, "⌥-click or drag to add", is part (b)'s with the other sources).

Parts (b)'s drag and right-click and line ranges, (c) and (d) follow in later sprints.

Files: `state/input_bar.ts` (chips), `InputBar.tsx` (drawn), `vm/session_controller.ts` (the body's attachments), `editor/FileTree.tsx` (⌥-click).

## context_files

Roadmap r11 E10; D94 and D40 (`design/received/handoff 5/docs/DESIGN-DECISIONS -through 2026-11-04-.md`); frame `runs/design/sheet-v11/24k.png`; `server.py` `_resolve_attachments` (sprint 388).

## signal contract

Vocabulary v0.49: EDITOR_CHIP_ADDED (declared, unemitted) emitted with kind file or folder; new INPUT_CHIP_REMOVED {kind, how: x | backspace}; TURN_SUBMITTED gains `attachments` (the chips sent). The server's TURN_ACCEPTED already counts them.

## artifact contract

The input bar's chip spec (add, the same twice, remove by index, ⌫ on an empty draft, the chips taken by a send); unit specs; signals 0; build 0.

## observation contract

`harness/shakeout/editor_chips.ts`, from source and on the bundle: ⌥-click a file and a folder in the tree; two chips with their labels and paths on hover; ⌥-click the file again, still two; ⌫ in the empty draft removes the folder chip, × the file chip; add the file again and send a message: the record's UserMessage carries the attachment with the file's text, TURN_ACCEPTED counts 1, TURN_SUBMITTED counts 1, the chips are gone from the bar.
