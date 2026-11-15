# Sprint 504 — Splitting the editor

```yaml
---
id: 504
status: done
phase: editor features (roadmap 2026-11-14 r4, E6)
pass_kind: functional
---
```

## scope

The Architect, 2026-11-14, supersedes D49 (c) and code-editor roadmap E1's refusal: ⌘D splits the editor right, ⌘⇧D down, and the tab menu does the same; a new group opens empty; a tab dragged across a boundary moves to that group; a group's last tab closed removes the group. Each group has its own tabs and shown file (sprint 499's state, one level down). The grid allows any layout up to 3 groups across and 3 down; a split past that is refused. One verifiable property: ⌘D then ⌘⇧D gives three groups, each showing its own file.

## signal contract

Vocabulary proposal: `EDITOR_KEY_REFUSED` reason `no_split` retired for ⌘D/⌘⇧D (TAG_DEPRECATION or payload change), a tag for a group opened or closed with its count, and the refusal past 3 × 3.

## observation contract

Gate on the bundle: the keys, the menu, a drag across, the limit; screenshots read. Mutants: the old refusal back; no limit.

## close

**Built.**
- `web/app/derive/editor_groups.ts`: the group layout is the pane grid's own (`splitPane`, `closePane`), refused when a line across or down would cross more than 3 groups; 4 unit specs, 3 × 3 = 9 among them.
- `web/app/state/editor.ts`: groups per pane. The focused group's fields (tabs, active file, caret, hunks, outline, mode and the rest of `GROUP_FIELDS`) live in the pane's store; the others keep theirs in their own store, and focusing a group swaps them. Unsaved buffers, folds, find and follow stay the pane's.
- `web/app/editor/Centre.tsx`: one centre per group; each mounted buffer is registered, so save-for-send and the unsaved list read every group, not only the focused one. `splitGroup`, `closeFocusedGroup`, `moveTab`; "split right" and "split down" in the tab menu; opening a file another group holds focuses that group.
- `web/app/editor/EditorView.tsx`: the group grid; a group takes the focus on pointerdown, before any click inside it, and takes a dropped tab. One status line, for the focused group.
- Keys: ⌘D splits right and ⌘⇧D down in the editor; ⌘W on an empty group closes it.
- Vocabulary 0.73: `EDITOR_GROUP_OPENED {groups, dir, how}`, `EDITOR_GROUP_CLOSED {groups, how last_tab|key|moved}`, `EDITOR_TAB_MOVED {groups}`, `EDITOR_DRAWN.groups`, `EDITOR_KEY_REFUSED.reason` `split_limit`; `no_split` no longer written.

**Decided on the grounds.** A file is open in one group at a time; opening it again focuses its group. A new group opens empty, with "open a file from the tree, or drag a tab here". The accent bar marks the focused group's active tab; the others' active tabs get a grey bar, as VS Code dims an inactive group's.

**Found and fixed.**
- **A tab drag could not drop.** The tab's drag allowed only "copy" while a group asked for "move", so Chromium would never deliver the drop. The drag now allows both.
- **A tab dropped on the code.** CodeMirror would have pasted the tab's path into the file. The code host now takes a tab drop itself and moves the tab to its group.
- **A hex view in an unfocused group** would have written its caret into the focused group's state; it now writes through its own group's store.
- **No mark of the focused group.** All three groups' active tabs drew the same accent bar (screenshot `three-groups`); see the decision above.

**Gate `editor_groups`** (new; in `gates:electron`), on the multipane workspace. From source and on bundle 1794714455:
- ⌘D then ⌘⇧D: three groups, each showing only its own file's code (models.py, memchr.rs, strings.go);
- the accent bar on the focused group's tab alone, read from the pixels;
- out of the editor and back: the same groups, tabs, focus and code;
- reopening models.py from group 3 focuses group 1 and adds no tab;
- the tab menu's split right makes a fourth group;
- strings.go dragged onto group 1's code moves there with its typing and unsaved dot, and models.py's text is unchanged; long_one.txt dragged out of group 3 closes it;
- ⌘D and ⌘⇧D pressed until refused: 3 across and 3 down at the limit, `split_limit` twice;
- ⌘W closes an empty group, and closes a group's last tab together with the group;
- trace: 10 grouping records in step order, each with the DOM's group count; the anchor names an `EDITOR_DRAWN` with groups 3; no INVARIANT_BROKEN.

Screenshots read: three groups; the limit; the drag; the empty groups after ⌘D and ⌘⇧D.

**Mutants**, each failing the gate; every build exit was checked:
- ⌘D not splitting;
- the limits at 99 (4 to 11 groups across);
- `moveTab` doing nothing;
- the accent bar on every group;
- the reopen not focusing the holding group.

**Other gates.**
- `editor_keys` now expects the splits (`right:key:2`, `down:key:3`, three groups, no refusal).
- The tab-menu pins in `editor_context_menu` (`tab:4`) and `editor_markdown_links` gain the two split items.
- 13 editor gates pass on the bundle, `editor_drag_chips` among them.
- 241 unit specs pass.

**Rubber Duck Pass.** One gap: no gate had left the editor with groups open. That step was added and passes.
