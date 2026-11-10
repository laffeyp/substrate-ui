# Sprint 437 — the tree's find by name

```yaml
---
id: 437
status: closed
phase: code editor (roadmap r10), E8; research RESEARCH-2026-11-10-editor-search-r2
pass_kind: functional
---
```

## scope

VS Code's Explorer find (`explorerViewer.ts` ExplorerFindProvider): ⌥⌘F with the tree focused opens a find by name above the rows; elsewhere in the editor ⌥⌘F stays replace in the file. The server finds the files (at most 512) and folders whose name matches over the whole workspace, from the search's walk, so ignored files are not found and folders never opened are reached; case ignored; fuzzy reads `abc` as `*a*b*c*`, continuous as `*abc*`. Filter (the default) shows only the matches and every folder above them; highlight keeps the tree, lights the matched letters and badges each collapsed folder with the matches below it. ↓ and ↑ step through the matches (highlight opens the folders on the way), ↵ opens a file or reveals a folder, Escape closes the find and the tree keeps what it opened. "no matches" and a cut list are said.

Files: `server.py` (`_workspace_find_names`, `_session_find_names`, the route); `editor/FileTree.tsx`; `derive/tree_find.ts`; `keymap.ts`, `App.tsx`, `state/editor.ts`.

## signal contract

Vocabulary v0.44: FILES_FOUND (server), EDITOR_TREE_FOUND (editor). v0.45 adds unreadable to FILES_FOUND and FILES_SEARCHED (sprint 438's card).

## artifact contract

`tests/test_tree_find_437.py` 5/5; `tree_find.spec.ts` 3/3; keymap spec; unit specs 204; signals 0; build 0.

## observation contract

`harness/shakeout/editor_tree_find.ts` on a plain folder with no git, from source and on the bundle: ⌥⌘F in the tree; the find box holds what was typed; filter to the match and its folders, src never opened, the ignored copy absent, the letters lit; highlight with src badged 2; ↓, ↓, ↵; fuzzy and continuous; Escape; the tags; no folder unreadable; the name in no trace.
