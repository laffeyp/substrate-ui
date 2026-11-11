# Sprint 458 — drag into the message, and the hint

```yaml
---
id: 458
status: closed
phase: code editor (roadmap r13), E10.4 (2 of 2)
pass_kind: functional
---
```

## scope

D94: "⌥-click or drag a thing into the prompt". 24k's terminal header reads "⌥-click or drag to add · right-click › Add to message · ⌫ removes the last chip"; D40 puts behaviour hints in tooltips. Two parts:

- **Drag** (BLACKBOARD 2026-11-11, what a drag carries). A tree row, a tab, a search result's name, file or match row is draggable. Its drag carries the same chip right-click adds, as JSON under `application/x-substrate-chip`, and the path as `text/plain` last. The input bar takes the drop as a chip and is outlined in the accent while a chip is over it; the path's text never goes into the draft. The code refuses a chip's drop.
- **The hint.** The terminal header's "SUBSTRATE TERMINAL" carries the tooltip "⌥-click or drag to add · right-click › Add to message · ⌥A adds the selection · ⌫ removes the last chip".

Files: `editor/chips.ts` (the drag's data: `dragChip`, `droppedChip`), `InputBar.tsx` (the drop and its outline); the sources' `draggable` and `onDragStart` in `editor/FileTree.tsx`, `editor/Centre.tsx` (tabs; the code's refusal), `editor/Search.tsx`; `editor/EditorView.tsx` (the tooltip) and `derive/control_notes.ts` (its words); the vocabulary.

## context_files

- D94, D40 (`design/received/handoff 5/docs/DESIGN-DECISIONS -through 2026-11-04-.md`); sheet v11 frame 24k (the terminal header's line).
- `ADD-TO-MESSAGE-2026-11-10-r3.md`; roadmap r13 E10.4.
- BLACKBOARD 2026-11-11: what a drag carries; sprint 457's close.
- `editor/chips.ts`, `InputBar.tsx`, `editor/FileTree.tsx`, `editor/Centre.tsx` (`Tab`, the code host), `editor/Search.tsx`, `editor/EditorView.tsx` (the terminal); `derive/control_notes.ts`.
- MDN, "Recommended drag types".

## signal contract

Vocabulary v0.60 (P-0.60-CHIP-DRAG): EDITOR_CHIP_ADDED.how gains `drag`.

Emits: EDITOR_CHIP_ADDED (how drag).

## artifact contract

- `[data-drop-over="1"]` on the bar while a chip drag is over it.
- The header's `title` is the hint, and the words are one constant in `derive/control_notes.ts`.
- Unit specs 0; build 0; signals 0.

## observation contract

Gate `editor_drag_chips.ts` (new), from source and on the bundle. A repository holds `src/cart.ts` (six lines), `src/tax.ts` and `src/lib/menu.ts`; the deterministic driver; after "hello", in the editor:

1. Drag `src/cart.ts` from the tree onto the terminal's input bar: chip "cart.ts". Midway, a screenshot with the bar outlined (`data-drop-over`).
2. Drag the folder `src/lib`: chip "lib/".
3. Open `src/lib/menu.ts`; drag its tab onto the bar: chip "menu.ts".
4. Search "const c"; drag the match row: chip "cart.ts 3".
5. Drag `src/tax.ts` from the tree onto the code: no chip, and the code's text is unchanged.
6. The draft stays empty through all of it: no path typed into the bar.
7. The header's tooltip reads the hint.
8. Send "look": the record's UserMessage holds cart.ts, the listing, menu.ts and line 3.

Record (window-1.jsonl): EDITOR_CHIP_ADDED file drag, folder drag, file drag, range drag; nothing for the code's drop.

## done criteria

Drag and right-click add to the message from every editor source D94 and the roadmap name, and the terminal header says how.

## close

Mutant: the code's refusal turned off fails `editor_drag_chips` ("the drop changed the code: [\"export const items = [];src/tax.ts\", \"\"]"): without it, CodeMirror's own drop writes the dragged path into the file.

Found in the gate and fixed there: its read of the code's lines ran before the first file made the code's shadow root, and threw.
