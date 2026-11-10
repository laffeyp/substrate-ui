# Sprint 419 — a file opens in the editor's centre

```yaml
---
id: 419
status: closed
phase: code editor, the rest (roadmap r8), E3
pass_kind: functional
---
```

## scope

A click on a file in the tree opens it as a tab (or shows its tab); the tab row draws the active tab on the ground with its accent top edge, × on hover, ⌘W closing the active tab without ending the session. `web/app/editor/Centre.tsx` (new) draws the file in CodeMirror 6 in a shadow root, with line numbers, syntax colours for the first languages, and the hunks of sprint 418 inline (added lines teal with +, removed lines red with −); binary and over-cap files say so. Read-only until saving (E4). Files: `editor/Centre.tsx`, `editor/FileTree.tsx`, `editor/EditorView.tsx`, `state/editor.ts`, `App.tsx`, `package.json` (seven grammar packages, exact versions). Gate `harness/shakeout/editor_centre.ts`.

## context_files

- frame 24a; spec r6 §5 "Code"; D49 (c), D53; roadmap r8 E3 and its key table; `node_modules/style-mod/src/style-mod.js` lines 94–101
