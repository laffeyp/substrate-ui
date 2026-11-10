# Sprint 440 — the left column's open and activity tabs

```yaml
---
id: 440
status: closed
phase: code editor (roadmap r10), E8 part 2
pass_kind: functional
---
```

## scope

The left column's tab row gains `open` and `activity` (design spec r6 §5.1; roadmap r10 E8), after `files` and `search`.

- **open** — the files open in the editor, in tab order, the shown one lit, each with an accent dot while its buffer has unsaved changes (24j's dot); a click shows that tab (EDITOR_FILE_OPENED is not written: the tab is already open).
- **activity** — every workspace file the session's calls touched (the kernel's ToolCall and the harness drivers' HarnessToolCall, read or write, as the inspector's ACTIVITY reads them for one file, `derive/inspector.ts`), and each FileWritten by hand, newest first, one row per file with its last call's turn, seq and gist; a click opens the file (EDITOR_FILE_OPENED how=activity).
- The files tab gets 24a's and 24j's `⌘⇧F search workspace` box above the tree (roadmap r10 E8, not built in sprint 434); a click opens the search tab. The tab row takes 24j's spacing (no gap between tabs; ◂ padded on the left only), so the four tabs and ◂ fit 210 px.
- EDITOR_FILE_OPENED.how gains `open_tab` (reserved for an open from the open tab when its file is not open, which cannot happen today) and `activity`; EDITOR_DRAWN.left_tab already names `open` and `activity`, and the anchor's third row carries them.

## context_files

`process/planning/2026-11-09-code-editor/ROADMAP-2026-11-09-code-editor-r10.md` (E8); `design/received/handoff 5/docs/DESIGN-SPEC -2026-11-04- r6.md` §5.1; frame 24j (the tab row); `web/app/editor/EditorView.tsx`, `editor/Centre.tsx` (tabs, unsaved), `derive/inspector.ts` (ACTIVITY), `derive/follow.ts` (the drivers' call shapes).

## signal contract

Vocabulary v0.46: EDITOR_FILE_OPENED.how gains `open_tab` and `activity`. Emits EDITOR_DRAWN.left_tab open and activity; EDITOR_FILE_OPENED how=activity.

## artifact contract

`derive/activity_files.ts` and its spec (hand-written record examples: kernel and harness calls, a hand write, a file outside the workspace, newest first); `EditorView.tsx` (the tabs); unit specs; signals 0; build 0.

## observation contract

`harness/shakeout/editor_left_tabs.ts`, from source and on the bundle, with the live roster's model making edit and read calls on a repository the gate writes: open lists the open tabs with the unsaved dot after typing; a click shows a tab; activity lists the files the turns touched, newest first, equal to the record's calls read by the gate; a click opens one (how=activity); left_tab open and activity in EDITOR_DRAWN and the anchor's third row; every field inside the column.
