# Sprint 416 — View ▸ Editor, Dock Terminal Right, Swap Sides, Focus

```yaml
---
id: 416
status: closed
phase: code editor, phase 1 (round 6), R1 (the menu item), R7, R8, R9
pass_kind: functional
---
```

## scope

Four View items with no accelerator (`electron/menu.ts`'s rule): Editor (opens and closes the editor; VIEW_CHANGED cause menu), Dock Terminal Right (the terminal becomes a full-height column between the centre and the end column, its width kept as `side` in the sizes; EDITOR_DOCK_SET), Swap Sides (the files column and the inspector change sides, with their rails, fold marks and drag directions; EDITOR_SIDES_SWAPPED), Focus (folds every column, cause focus; again, it undoes only the folds it made; a person's own fold or unfold during focus ends it; EDITOR_FOCUS_SET). EDITOR_DRAWN and the pixel anchor carry dock, swap and focus. Files (logged, hard rule 10): `electron/menu.ts`, `electron/preload.ts`, `web/app/state/shell.ts`, `web/reveal.ts`, `web/app/App.tsx`, `web/app/state/editor.ts`, `web/app/editor/EditorView.tsx`, `web/app/editor/sizes.ts` and its spec. Gate `harness/shakeout/editor_layout.ts`.

## context_files

- Design: spec r6 §4, §5.1 (2)–(4); D63; frames `runs/design/sheet-v11/16c.png`, `24a.png`, `24h.png`
- `web/vm/signals/versions/0.29.json` (EDITOR_DOCK_SET, EDITOR_SIDES_SWAPPED, EDITOR_FOCUS_SET, EDITOR_COLUMN_FOLDED cause focus)

## observation contract

Twelve steps through the real menu (clicked in the main process) and one key and one click; at each the DOM, the anchor's flags and the vertical divider lines in the screenshot agree; after close, 24 layout records in order and the EDITOR_DRAWN each anchor names. From source and on the bundle. Close tests also run: `editor_sizes.spec.ts`, `editor_resize.ts`, `editor_folds.ts` (the drag and fold code changed).
