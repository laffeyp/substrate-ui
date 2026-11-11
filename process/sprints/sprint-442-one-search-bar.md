# Sprint 442 — the one search bar

```yaml
---
id: 442
status: closed
phase: code editor (roadmap r11), E8; SEARCH-BAR-2026-11-10
pass_kind: functional
---
```

## scope

The search bar as `process/planning/2026-11-09-code-editor/SEARCH-BAR-2026-11-10.md` describes it (the Architect's ruling of 2026-11-10: one search bar).

- **The bar finds names too.** The server's search matches the query, by the bar's one rule (Aa, ab, .\*), against every walked file's name and path and every folder's name and path, as well as the text inside files. Name matches come first, a match in the name above one only in the path, a shorter path above a longer one; at most 500. Binary files are matched by name; their contents are not searched (displaying binary files' text is E14, separate).
- **Results:** a names section (file and folder rows, the match lit) above the text section; one count line, `N names · M matches in K files`. A click or ↵ on a file name opens the file with the code focused; on a folder, the files tab opens the tree to it; on a line, the file opens at the line. ↓ ↑ step through every result. The search runs again when files change on disk (the watch stream).
- **Nothing removed** (the Architect, 2026-11-10: "I don't want you to undo anything. I want you to fix the search bar."). Quick open and the tree's find stay as built; the files tab's `⌘⇧F search workspace` text comes out, as the Architect asked.

Files: `server.py` (`_name_matches`); `editor/Search.tsx`, `derive/search.ts` and its spec, `editor/FileTree.tsx` (opens to a folder the bar chose), `editor/EditorView.tsx` (the files tab's text out), `state/editor.ts`; `tests/test_session_search_442.py`; `harness/shakeout/editor_search.ts`, `editor_left_tabs.ts`.

## signal contract

Vocabulary v0.48: FILES_SEARCHED gains `names`; EDITOR_SEARCH_QUERIED gains `name_count`.

## artifact contract

`tests/test_session_search_442.py` (names, folders, paths, extensions, a binary file's name, the one rule, the order, the unreadable count); `search.spec.ts`; unit specs; signals 0; build 0.

## observation contract

`harness/shakeout/editor_search.ts`, from source and on the bundle, on a repository the gate writes with a JPEG: typing a file's name lists it first and ↵ opens it with the code focused; `jpeg` lists the JPEG; a folder's name lists the folder and a click opens the tree to it; a path fragment lists the file; words list their lines; the text section and replace as before; the files tab shows no search text. All editor gates and `new_window` (the menu bar) from source and on the bundle.
