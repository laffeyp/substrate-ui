# Sprint 435 — the workspace search without git

```yaml
---
id: 435
status: closed
phase: code editor (roadmap r10), E8; research RESEARCH-2026-11-10-editor-search-r2
pass_kind: functional
---
```

## scope

The left column's search becomes the standard workspace search the research describes. The server walks the workspace itself. It skips VS Code's `files.exclude` names and its `node_modules` and `bower_components` folders, applies each folder's `.gitignore` and `.ignore` whether or not the folder is a git repository, searches hidden files, follows no symlink, and skips files over the read cap, binary files and files that are not UTF-8. It matches with Python's `re`, so `\d`, `\b`, `\s` and lookaround work, and sends each match's range in UTF-16 units; the page lights those ranges and matches nothing itself. Added: whole word (ab), include and exclude globs behind `…` (read as `.gitignore` patterns), one row per match, and replace of one match (a row's ↵), one file (a file's ↵) or every match (⌘⇧↵, all). The server works a replace out line by line (`^` and `$` per line; `$1`, `$<name>`, `$&` in a regex replacement) and writes nothing; the page writes each file through PUT …/file with the hash it was read at. No git runs in the search.

Files: `server.py` (the walk, the gitignore matcher, `_workspace_search`, `_workspace_replace`, `_session_search_replace`); `editor/Search.tsx`, `derive/search.ts`, `state/editor.ts`, `hover.css`.

## signal contract

Vocabulary v0.42: FILES_SEARCHED gains word and matches; EDITOR_SEARCH_QUERIED gains word; new FILES_REPLACE_PREPARED (server) and EDITOR_SEARCH_REPLACED (editor). FILE_WRITTEN per written file. No query, replacement, glob or path in the trace (E1).

## artifact contract

`tests/test_session_search_435.py` 10/10 (git never run; ignore files and skips; the regex editors write; whole word and ranges; UTF-16; globs; replace writes nothing; `^` per line; one file and one match; a fixed replacement as written; the gitignore globs); `test_session_search_434.py` 9/9; unit specs 200; signals 0; build 0.

## observation contract

`harness/shakeout/editor_search.ts` from source and on the bundle, expected rows written by hand: folded, Aa, ab, `\s\d`, exclude; ↵, a click; replace one, file, all against the disk and the record; whole-word misses untouched; the fields inside the column; left_tab; the anchor's third row; the four search tags; no query in any trace.
