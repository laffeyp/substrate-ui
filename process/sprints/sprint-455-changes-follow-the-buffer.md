# Sprint 455 — the inspector's changes follow the buffer

```yaml
---
id: 455
status: closed
phase: code editor (roadmap r13), the inspector (E6)
pass_kind: functional
---
```

## scope

Sprint 454's screenshot showed the inspector's CHANGES IN THIS FILE reading "no changes against the base" while the status line read "+1 −1 vs main" for an unsaved edit. The inspector lists the saved file's hunks from the server; the centre's marks and the status line count the buffer.

The change (BLACKBOARD 2026-11-10, agent-resolved, CHANGES with unsaved edits):
- **Storing the buffer's hunks.** The centre keeps the buffer's hunks against the base in the editor store (`bufferHunks`) whenever the shown file has unsaved edits, and clears them when it has none.
- **The list.** The inspector lists them while they exist.
- **Authors.** A hunk equal line for line to a saved hunk takes that hunk's author; any other reads "by hand · unsaved".
- **No unsaved edits.** Nothing changes from today.

Files: `web/app/editor/Centre.tsx`, `web/app/editor/Inspector.tsx`, `web/app/state/editor.ts` (the field); gate `editor_changes_unsaved.ts` (new).

## context_files

- BLACKBOARD 2026-11-10: agent-resolved (CHANGES with unsaved edits); sprint 454's built entry.
- `Inspector.tsx` (CHANGES, `hunkAuthor`, EDITOR_HUNK_DRAWN); `Centre.tsx` (the recount microtask, the placing, `BASES`); `derive/inspector.ts` `lineHunks`.
- Design spec r6 §5.1; D54; frame 24a.

## signal contract

No new tag. EDITOR_HUNK_DRAWN author `hand` for an unsaved hunk; EDITOR_DRAWN's `hunks` (the inspector's count) follows the list.

## artifact contract

- Unit specs 0; build 0; signals 0.
- The gates `editor_changes_unsaved`, `editor_inspector`, `editor_status`, `editor_centre` and `editor_history` 0.

## observation contract

`editor_changes_unsaved` from source and on the bundle. A committed file has one line changed on disk.
1. Open the file: CHANGES shows that one hunk.
2. Type a new line, unsaved: CHANGES shows two hunks, the new one "by hand · unsaved", and the counts agree with the status line.
3. ⌘S: CHANGES shows the saved hunks with no "unsaved" label.

Expected:
- EDITOR_HUNK_DRAWN author hand for the unsaved hunk.
- Screenshots of the three states.

## done criteria

The inspector and the status line describe the same text, the one on screen.
