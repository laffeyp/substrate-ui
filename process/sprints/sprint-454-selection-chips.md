# Sprint 454 — ⌘⇧A adds the editor's selection to the message

```yaml
---
id: 454
status: closed
phase: code editor (roadmap r13), E10.3 part 2
pass_kind: functional
---
```

## scope

With the code focused, ⌘⇧A adds the selection as a chip (the Architect, 2026-11-10: a key under the left hand; `ADD-TO-MESSAGE-2026-11-10-r3.md`, selections):
- **Whole lines** make "cart.ts 85–89", or "cart.ts 85" for one line.
- **A range inside one line** makes "cart.ts 85:4–20".
- **A range across lines** makes "cart.ts 85:4–89:12".
- **No selection** adds the file, "cart.ts".

The chip carries its path, span and text: the buffer as shown, unsaved edits included (rule 9). The server takes the text since sprint 453, and the save before send writes the buffer before the model starts. The same range added twice is one chip. Removing a range chip records kind `range`.

Files:
- `web/app/keymap.ts` and its spec (the `add-selection` action, with the code focused);
- `web/app/App.tsx` (the context's `editorCode`, the action);
- `web/app/editor/Centre.tsx` (`addSelection`);
- `web/app/state/input_bar.ts` (the chip's `lines` kind, span and text; dedupe by span; `range` on removal);
- `web/vm/session_controller.ts` (the attachment's span and text);
- `web/app/editor/FileTree.tsx` (EDITOR_CHIP_ADDED.how);
- the vocabulary; gate `editor_selection_chips.ts` (new).

The hard rule 6 bypass is logged.

Found in the close and fixed in it: a removed line drawn above a changed line took the browser's own selection, so it showed as selected inside a selection of the lines around it. `Centre.tsx` now sets `user-select: none` on `.cm-removed`.

## context_files

- BLACKBOARD 2026-11-10: the user entry (left-hand key) and the agent-resolved entries (⌘⇧A; right-click in E10.4); round 3 rules 5 and 9 and the selections section; roadmap r13 E10.3; sprint 453's card.
- `keymap.ts`, `App.tsx` `onKey`, `Centre.tsx` `activeBuffer`, `input_bar.ts`, `FileTree.tsx` ⌥-click, D94, frame 24k.

## signal contract

Vocabulary v0.57, P-0.57-CHIP-HOW: EDITOR_CHIP_ADDED gains `how` (alt_click | key). KEY_ROUTED Meta+Shift+A → `add-selection`, target editor.

## artifact contract

- The keymap spec: ⌘⇧A with the code focused is `add-selection`, and outside the code it is nothing.
- Commands: unit specs 0; build 0; signals 0.

## observation contract

`editor_selection_chips` from source and on the bundle, deterministic driver, cart.ts of four lines:
1. Type into line 3 unsaved.
2. Select lines 2–3 and press ⌘⇧A: the chip "cart.ts 2–3".
3. Select line 1, columns 8–22, and press ⌘⇧A: the chip "cart.ts 1:8–22".
4. Clear the selection and press ⌘⇧A: the chip "cart.ts".
5. Press ⌘⇧A on lines 2–3 again: still three chips.
6. Send "look".

Expected:
- The record's UserMessage has three attachments: lines [2,3] with the typed text, lines [1,8,1,22] with "const total = 1", and the file.
- The disk holds the typed line before the message (the save before send).
- EDITOR_CHIP_ADDED: range key, range key, file key.
- KEY_ROUTED add-selection ×4.
- TRANSCRIPT_CHIPS_DRAWN chips 3, by_reference 0.
- A screenshot of the bar and the sent row.

## done criteria

The left hand adds what the eye has selected, and the model reads the text as selected.
