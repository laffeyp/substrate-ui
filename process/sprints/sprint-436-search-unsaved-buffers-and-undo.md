# Sprint 436 — unsaved buffers in the search, and one undo for a replace

```yaml
---
id: 436
status: closed
phase: code editor (roadmap r10), E8; research RESEARCH-2026-11-10-editor-search-r2
pass_kind: functional
---
```

## scope

As VS Code does (`searchService.ts` getOpenEditorResults; `replaceService.ts`; `bulkTextEdits.ts`): the editor's unsaved buffers go with each search and replace, and the server reads a buffer's text in place of the file on disk, dropping the disk's matches for it. A replace changes such a buffer and saves it from there, with the hash the buffer read. An edit to the shown buffer runs the search again once typing pauses. The last replace can be undone in one step: "undo" writes each file back to its text before the replace, and puts a buffer back unsaved.

Files: `server.py` (`buffers` on `_workspace_search` and `_workspace_replace`; POST …/search; `before` and `buffer` on each replaced file); `editor/Centre.tsx` (`unsavedBuffers`, `putBuffer`, `writeBuffer`, `onBufferEdit`); `editor/Search.tsx`.

## signal contract

Vocabulary v0.43: FILES_SEARCHED.buffers, EDITOR_SEARCH_REPLACED.buffers, EDITOR_SEARCH_REPLACE_UNDONE.

## artifact contract

`tests/test_session_search_436.py` 4/4; the 434 and 435 search tests; unit specs 199; signals 0; build 0.

## observation contract

`editor_search.ts` from source and on the bundle: an unsaved edit searched while the disk is unchanged; the one-match replace works from the buffer and saves it; undo returns the disk and the shown buffer to their text before the last replace; the record's four FileWritten. `editor_history`, `editor_editing`, `editor_save`, `editor_status`, `editor_meta_pane` from source; `editor_history` on the bundle.
