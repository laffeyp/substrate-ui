# Sprint 441 — quick open

```yaml
---
id: 441
status: closed
phase: code editor (roadmap r10), E9
pass_kind: functional
---
```

## scope

Quick open as frame 24i draws it: ⌘P in the editor, and Go ▸ Quick Open (a new Go menu; the item shows no key, as the roadmap's key table says), open a box at the top of the centre: `› query` with `⌘P` at its right; the workspace's files matched by name, fuzzy, the matched letters lit, the tree's dot on a file changed against main, the folder dim after the name; a RECENT section of the files opened in the editor, newest first, the shown one left out; a key line. ↑↓ choose, ↵ opens as a tree click does (the code takes the focus), ⌘↵ opens the file's tab and keeps the current tab shown (the editor does not split, D49 (c), so 24i's "open beside" is drawn as "open behind"), Escape closes the box and leaves the editor open.

The list is the server's own walk, the one the search and the tree's find use (sprint 435; research r2: no git, ignore files applied in or out of a repository): `GET /api/session/<id>/files/list`. The roadmap's `git ls-files` is replaced on those grounds.

Matching, in the page: every letter of the query in order, case ignored. A match in the file's name ranks above one that needs the folders; within each, a run of the query's letters together ranks above letters apart, an earlier start above a later one, and a shorter path above a longer one. At most 50 matches are drawn.

Files: `server.py` (`_session_files_list`, the route); `derive/quick_open.ts` and its spec; `editor/QuickOpen.tsx`; `editor/Centre.tsx` (`openFile` can keep the shown tab; the recent list); `state/editor.ts`; `keymap.ts`, `App.tsx`; `electron/menu.ts`, `electron/preload.ts`.

## context_files

Roadmap r10 E9 and its key table rows (⌘P, ↵ / ⌘↵); frame `runs/design/sheet-v11/24i.png`; `RESEARCH-2026-11-10-editor-search-r2.md` (the list without git); `editor/FileTree.tsx` (the dot from `/diff`); `editor/Search.tsx` (field styles).

## signal contract

Vocabulary v0.47: FILES_LISTED_ALL (server: the walk's file count, truncated, unreadable; no path, E1). EDITOR_QUICK_OPENED (declared since v0.28, unemitted) is emitted when the box opens. EDITOR_FILE_OPENED how=quick_open for a file opened from it.

## artifact contract

`tests/test_files_list_441.py`; `quick_open.spec.ts`; keymap spec (⌘P in the editor); unit specs; signals 0 (EDITOR_QUICK_OPENED off unemitted.json); build 0.

## observation contract

`harness/shakeout/editor_quick_open.ts`, from source and on the bundle, on a repository the gate writes (an ignored copy, a file changed against main): ⌘P opens the box focused (EDITOR_QUICK_OPENED); `cart` lists the expected files in the expected order, the letters lit, the ignored copy absent, the dot on the changed file; ↓ ↵ opens the second (how=quick_open) with the code focused; ⌘P again shows RECENT; ⌘↵ adds a tab and keeps the shown one; Escape closes the box and the editor stays; Go ▸ Quick Open opens it; the box inside the centre.
