# Sprint 434 — the left column's search

```yaml
---
id: 434
status: closed
phase: code editor, the rest (roadmap r10), E8 part 1
pass_kind: functional
---
```

## scope

The left column gets its tab row, `files · search` (frame 24j); open and activity follow in sprint 435, and only what works is drawn (D6). ⌘⇧F in the editor shows the search tab, unfolding the column, with the query focused. The query, with Aa and .*, searches the session's workspace once typing pauses: `GET /api/session/<id>/search`, git grep on the server, `--untracked` in a work tree (ignored files left out) and `--no-index` outside one, binary files skipped. The results are grouped by file (`▾ name dir count`), each line with its number and every match lit; a click opens the file at the line, and ↵ goes to the next result. ⌘⇧↵ or "all" replaces every match: each file read and written through the file API with the hash it was read at (one FileWritten each), then the search runs again. The column's foot reads the search keys while the search is shown. EDITOR_DRAWN.left_tab follows the tab.

Files: `server.py` (`_workspace_search`, `_session_search`, the route and its area); `editor/Search.tsx`, `derive/search.ts` (matching, counting, replacing); `editor/EditorView.tsx` (the tab row); `editor/Centre.tsx` (`openFile` takes how and a line); `state/editor.ts`, `derive/anchor.ts`, `keymap.ts`, `App.tsx`.

## context_files

Roadmap `process/planning/2026-11-09-code-editor/ROADMAP-2026-11-09-code-editor-r10.md` (E8); frame `runs/design/sheet-v11/24j.png` and its sheet markup; `server.py` `_session_diff`, `_git_out`; `editor/Inspector.tsx` FIND / REPLACE.

## signal contract

Emits: FILES_SEARCHED (new, server); EDITOR_SEARCH_QUERIED (declared since v0.28, now emitted); EDITOR_FILE_OPENED how=search; FILE_WRITTEN per replaced file; EDITOR_DRAWN.left_tab. Vocabulary v0.41: P-0.41-FILES-SEARCHED, P-0.41-LEFT-TAB-ANCHOR (the anchor's third row gains left_tab). The query and the paths stay out of the trace (E1).

## artifact contract

- The files above exist; `tests/test_session_search_434.py` 9/9 (tracked and untracked match, ignored and binary do not; case; fixed string vs pattern; a subfolder workspace; a plain folder with --no-index; no match; a refused pattern; the line cap; a query that looks like an option); `search.spec.ts` 4/4; keymap and anchor specs; unit specs 201; signals 0; build 0.

## observation contract

`harness/shakeout/editor_search.ts`, from source and on the bundle: a repository the gate writes itself; ⌘⇧F; the results equal git grep run by the gate, with every match lit; the fields and counts inside the column; Aa, .*, ↵, a click, ⌘⇧↵ against the disk and the record; left_tab files→search→files; the anchor's third row reads search; EDITOR_SEARCH_QUERIED and FILES_SEARCHED agree; no query in any trace. `editor_status`, `editor_save`, `editor_meta_pane` and `editor_follow` again from source (the anchor's third row and the centre's load changed).
