# Sprint 438 — the open file's find: whole word, in selection, preserve case

```yaml
---
id: 438
status: closed
phase: code editor (roadmap r10), E6 follow-up; research RESEARCH-2026-11-10-editor-search-r2
pass_kind: functional
---
```

## scope

The inspector's FIND / REPLACE gains VS Code's Match Whole Word (ab), Find in Selection (sel) and Preserve Case (AB). Whole word is CodeMirror's `wholeWord`. In selection takes the selection as a range (the caret's line when nothing is selected), moves it with each edit, draws it faintly, and holds the count, the steps and the replaces to it through the query's `test`. Preserve case writes each replacement in its match's case by VS Code's rule (`src/vs/base/common/search.ts`, buildReplaceStringWithCasePreserved), written here in `derive/preserve_case.ts`. ⌥⌘L, VS Code's key for in selection, is the editor's fold-the-files key (sprint 415), so sel is by click.

Also in this card: the walk counts the folders it cannot read (FILES_FOUND and FILES_SEARCHED `unreadable`) in place of skipping them in silence; `editor_view`'s expectations brought to the current footer (sprint 430) and the current EDITOR_DRAWN (sprint 422 on), which it had failed since.

Files: `editor/Centre.tsx`, `editor/Inspector.tsx`, `derive/preserve_case.ts`, `state/editor.ts`; `server.py` (unreadable); `harness/shakeout/editor_find.ts`, `editor_view.ts`.

## signal contract

Vocabulary v0.45: EDITOR_FIND_QUERIED whole_word and in_selection; EDITOR_REPLACED preserve_case; FILES_FOUND and FILES_SEARCHED unreadable.

## artifact contract

`preserve_case.spec.ts` 2/2; `test_tree_find_437.py` (an unreadable folder counted); full Python suite 359 passed, 5 skipped before the unreadable change, then the search and find tests 29; unit specs 204; signals 0; build 0.

## observation contract

`editor_find.ts` from source and on the bundle: ab counts whole words only; sel holds the count and a replace to lines 4–5, the scope drawn; AB writes cost→amount and Cost→Amount; each against JavaScript over the buffer's own text; the signals' new fields. Every editor gate from source; search, tree find, find, history and view on the bundle.
