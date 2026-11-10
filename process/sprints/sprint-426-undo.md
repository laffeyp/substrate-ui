# Sprint 426 — Edit ▸ Undo and Redo, routed by the window

```yaml
---
id: 426
status: closed
phase: code editor, the rest (roadmap r8), E4
pass_kind: functional
---
```

## scope

The Edit menu is built item by item in `electron/menu.ts` in place of the `editMenu` role: Undo ⌘Z and Redo ⇧⌘Z send `undo` and `redo` to the window; the rest is what the role built on macOS (read from the running app by `harness/shakeout/probes/edit_menu_probe.ts`: Cut, Copy, Paste, Paste and Match Style, Delete, Select All, Substitutions, Speech). The window routes them (BLACKBOARD 2026-11-09, the undo boundary): in the editor, the buffer's undo while it has unsaved changes and its redo while its redo stack has steps; with the buffer clean, nowhere yet (HISTORY's steps are E6's held-back part); outside the editor, the focused text box's own undo (`document.execCommand`). Vocabulary v0.35: UNDO_ROUTED (direction; to buffer | history | page | none).

Files: `electron/menu.ts`, `electron/preload.ts`, `web/reveal.ts`, `state/shell.ts`, `App.tsx`, `editor/Centre.tsx`, the vocabulary (0.35, rationale, proposals, regenerated); gate `harness/shakeout/editor_undo.ts`.

## context_files

- roadmap r8 key table (⌘Z, ⌘⇧Z); BLACKBOARD 2026-11-09 the undo boundary; `@codemirror/commands` (`undo`, `redo`, `undoDepth`, `redoDepth`); the editMenu role's items, read from the running app

## signal contract

Emits: UNDO_ROUTED; MENU_COMMAND_SENT undo and redo in main.

## artifact contract

- The files above exist; `npm run signals` 0 at v0.35 (130 live tags emitted); build 0.

## observation contract

`editor_undo.ts`, from source and on the bundle: Undo takes back the input bar's typing; under vim, `0ixy ` Escape, Undo, Redo, Undo, then Undo on the clean buffer; the file's sha-256 unchanged; UNDO_ROUTED undo→page, undo→buffer, redo→buffer, undo→buffer, undo→none; MENU_COMMAND_SENT 5.
