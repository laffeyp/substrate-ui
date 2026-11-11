# Sprint 457 — right-click › Add to message

```yaml
---
id: 457
status: closed
phase: code editor (roadmap r13), E10.4 (1 of 2)
pass_kind: functional
---
```

## scope

D94: "⌥-click or drag a thing into the prompt (or right-click › Add to message)". The app has no right-click menu. This sprint draws one, in the page, for the whole window (BLACKBOARD 2026-11-11, how the menu is drawn), and gives it one item, "Add to message", with the chip's label beside it:

- a tree row: its file or folder, as ⌥-click;
- a tab: its file;
- a search result: a name row its file or folder, a file row its file, a match row its line ("cart.ts 85", no text; the server reads the line);
- the code: what ⌥A adds, the selection or, with nothing selected, the file.

The menu opens at the pointer, inside the window. It takes the focus and gives it back when it closes. ↑ ↓ move, ↵ picks, a click picks. Escape, a press outside it, or the window losing focus closes it. Escape goes through the key map's close cascade, first, so Escape on an open menu never interrupts a turn.

Files: `web/app/state/context_menu.ts` (new: the store, open, close, pick, keys) and `web/app/ContextMenu.tsx` (new: the drawn menu), mounted in `App.tsx`; `keymap.ts` and its spec (`menuOpen`: Escape `close-menu`, ↑ ↓ ↵ `menu`); the sources' `onContextMenu` in `editor/FileTree.tsx`, `editor/Centre.tsx` (tabs and code; `selectionChip`, `addSelection(paneId, how)`), `editor/Search.tsx`; the vocabulary.

## context_files

- D94, D40 and D66 (h) (`design/received/handoff 5/docs/DESIGN-DECISIONS -through 2026-11-04-.md`); design spec r6 "Add to the message"; sheet v11 frame 24k.
- `ADD-TO-MESSAGE-2026-11-10-r3.md`; roadmap r13 E10.4.
- BLACKBOARD 2026-11-11: the three agent-resolved entries (the menu, what each source adds, the split).
- `keymap.ts` (the close cascade, sprint 447); `App.tsx` `onKey`; `state/input_bar.ts` `addChip`; `editor/Centre.tsx` `addSelection`, `Tab`; `editor/FileTree.tsx` (⌥-click); `editor/Search.tsx`; `server.py` `_attachment_text`.
- Vocabulary 0.58: EDITOR_CHIP_ADDED, KEY_ROUTED.

## signal contract

Vocabulary v0.59 (P-0.59-CONTEXT-MENU):
- CONTEXT_MENU_OPENED {source: tree | tab | search | code, items}: the menu drawn.
- CONTEXT_MENU_CLOSED {outcome: picked | escape | outside | blur}.
- EDITOR_CHIP_ADDED.how gains `menu`.

Emits: CONTEXT_MENU_OPENED, CONTEXT_MENU_CLOSED, EDITOR_CHIP_ADDED (how menu), KEY_ROUTED (Escape close-menu; ArrowDown and Enter menu).

## artifact contract

- `web/app/state/context_menu.ts` and `web/app/ContextMenu.tsx` exist; `[data-context-menu]` and `[data-context-item]` are drawn.
- The keymap spec: with `menuOpen`, Escape is `close-menu` even while a turn runs; ↑ ↓ ↵ are `menu`.
- Unit specs 0; build 0; signals 0 (`gen_signals.py --check`, `npm run signals`).

## observation contract

Gate `editor_context_menu.ts` (new), from source and on the bundle. A repository holds `src/cart.ts` (six lines) and `src/lib/menu.ts`; the deterministic driver. After one message ("hello") so a turn has run, in the editor:

1. Right-click `src/cart.ts` in the tree: the menu reads "Add to message" beside "cart.ts"; a screenshot; click it. Chip `src/cart.ts`.
2. Right-click the folder `src/lib`: ↓ then ↵ picks it. Chip `src/lib` (folder).
3. Open cart.ts; right-click its tab; Escape closes the menu (CONTEXT_MENU_CLOSED escape, KEY_ROUTED Escape close-menu) and adds no chip.
4. Select lines 2–3 in the code by keys; right-click inside the selection: the item reads "cart.ts 2–3"; click it. Chip span [2, 3] with the buffer's text.
5. Search "const c": right-click the match row: the item reads "cart.ts 3"; click. Chip span [3, 3], no text.
6. Right-click a tree row, then press in the code: the menu closes (outside), no chip.
7. Send "look": TURN_ACCEPTED attachments 4; the model's turn sees `(src/cart.ts, lines 3)` and the line's text (the deterministic driver's echo of its prompt, or the record's UserMessage attachments).

Gate `editor_context_menu_escape.ts` (new), from source and on the bundle, with the live roster's model (the deterministic driver answers at once, so no turn of it is running when a key is pressed): the model is asked to run `sleep 30` in bash; once the call is on the record, right-click in the code and press Escape: the menu closes (escape), the turn goes on (no TURN_INTERRUPTED, no Returned); a second Escape interrupts it (KEY_ROUTED Escape interrupt, TURN_INTERRUPTED hard, Returned interrupted).

Record of `editor_context_menu` (window-1.jsonl): CONTEXT_MENU_OPENED tree, tree, tab, code, search, tree; CONTEXT_MENU_CLOSED picked, picked, escape, picked, picked, outside; EDITOR_CHIP_ADDED file menu, folder menu, range menu, range menu; KEY_ROUTED Escape close-menu. Screenshots: the tree's menu, the code's menu over the selection, the search's menu.

## done criteria

Right-click › Add to message works on every editor source D94 and the roadmap name, and Escape on a menu closes the menu only.

## close

Found and fixed in the sprint: the server's path line for one whole line read "lines 3–3" beside a chip reading "cart.ts 3"; `_span_note` now writes "line 3", and `tests/test_turn_attachments_453.py` expects it.

Mutant: App passing `menuOpen: false` to the key map fails `editor_context_menu_escape` ("the menu closed: \"code\""): the first Escape goes to the interrupt and the menu stays open.
