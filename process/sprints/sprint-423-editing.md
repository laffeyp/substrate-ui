# Sprint 423 — editing under vim or nano

```yaml
---
id: 423
status: closed
phase: code editor, the rest (roadmap r8), E4
pass_kind: functional
---
```

## scope

The centre's buffer edits under the binding chosen in settings (⌘, ▸ editor keys: vim, the default as 24a draws, or nano). `web/app/editor/bindings.ts` (new): vim through `@replit/codemirror-vim` 6.4.0 (`u`, ⌃R the buffer's undo only); nano's ⌃K (consecutive cuts join one buffer), ⌃U and ⌃X at the highest precedence over CodeMirror's macOS keymap; under both, the buffer's history and the standard keys. Read-only for an ended session or a view-only pane. A buffer with unsaved changes is kept: through a write landing on the record (the file's facts and hunks are read again for the inspector, the buffer stays), a trip to another tab, and leaving the editor (buffers are kept for the window by session and path). The change marks move with edits; the outline follows the buffer. With vim bound and the code focused, Escape is vim's; nano's ⌃X returns to the pane. vim's block cursor takes the UI accent. Held back: saving (⌃O, `:w`, ⌘S) to sprint 425, nano's ⌃G to the status line (424), ⌃W to FIND.

Files: `editor/bindings.ts`, `editor/Centre.tsx`, `editor/EditorView.tsx`, `state/settings.ts`, `Dialogs.tsx`, `state/editor.ts`, `state/shell.ts`, `keymap.ts` and its spec, `App.tsx`, `package.json`; gate `harness/shakeout/editor_editing.ts`.

## context_files

- frame 24a; spec r6 §5 "Code"; D7, D53; roadmap r8 E4 and its key table; BLACKBOARD 2026-11-09 (esc stays in vim; the undo boundary; the save policy); `node_modules/@replit/codemirror-vim/README.md`, `dist/index.d.ts`; `node_modules/@codemirror/commands/dist/index.js` (emacsStyleKeymap)

## signal contract

Emits: EDITOR_OPENED with `binding`; EDITOR_DRAWN with `binding`; KEY_ROUTED target `editor` for keys typed in the code; VIEW_CHANGED editor→panes cause `key` from ⌃X.

## artifact contract

- The files above exist; `keymap.spec.ts` 7/7 (Escape with `vimCode` returns null; a find still closes first); `npx tsc --noEmit` 0; eslint 0; `npm run build` 0.

## observation contract

`editor_editing.ts`, from source and on the bundle, on a real repository: vim's Escape stays; `0i` text Escape inserts; `dd` then `u`; the buffer unsaved, kept through a hand save to app.py landing on the record and a trip to app.py's tab; nano chosen in settings: typing, ⌃K ⌃K, ⌃U, ⌃X to the pane; after the session ends the editor reopens on the unsaved buffer and takes no typing; the file's sha-256 on disk unchanged throughout; EDITOR_OPENED vim then nano; the anchor names an EDITOR_DRAWN with binding vim.
