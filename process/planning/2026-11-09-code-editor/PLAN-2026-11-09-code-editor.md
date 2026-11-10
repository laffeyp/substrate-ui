# Plan — the code editor

*2026-11-09. Replaces `2026-11-05-editor-shared-work/PLAN-2026-11-08-editor-shared-work-r2.md`, which mixed the code editor with groundwork for other modes and other pages. This plan covers the code editor only. Source: `design/received/handoff 5/docs/DESIGN-SPEC -2026-11-04- r6.md` (sections 0, 4, 5 "Code", 5.0, 5.1, 8) and design decisions D51, D53, D63, D81, D82, D85, D86, D92, D93, D94.*

## What it is

⌘⇧E opens the editor on the focused session's workspace. Files on the left, the open file in the centre, the inspector on the right, the session's transcript and input bar below. The session edits files and the editor shows it happening; a person can also edit by hand.

## Already built, used as it is

- The open-view field (sprint 346).
- The workspace file API: list, read, write, watch (sprints 348, 349, 387).
- Hand edits recorded on the session's record as `FileWritten` (kernel K340).
- Attachments on the user message (kernel K344, sprint 388).

## The work

| # | What | Source |
|---|---|---|
| 1 | ⌘⇧E opens the editor; ⌘⇧E or esc returns to the pane; the header chip reads "⌘⇧E pane"; View and Go menus list the key | spec 4, 8; D86, D63 |
| 2 | The layout: left column, centre editor (no splitting), inspector right, transcript and input bar below | spec 4 |
| 3 | Left column tabs: files (the tree, with modified dots), search, open, activity | spec 5.1; D82 |
| 4 | The editor: open, edit, save; vim and nano bindings; status line `-- NORMAL -- · file · line:col · +2 −1 vs main` | spec 5 "Code"; D53 |
| 5 | Inspector for code: outline (current symbol highlighted); changes in this file, each hunk vs main with its author ("by the session · turn 9 · seq 231 edit_file" or "by hand"); find and replace (⌘F, ⌥⌘F, plain or regex) | spec 5 "Code"; D81, D85 |
| 6 | The inspector's last three sections: ACTIVITY (this file in the record; ◂ opens the seq), HISTORY (every edit with its author; step back ⌘Z, ⌘⇧Z), INFO (path, size, modified, encoding, line endings) | spec 5.0; D82, D85 |
| 7 | Quick open ⌘P (fuzzy file names, modified dots, recent files; ↵ opens); workspace search ⌘⇧F (results by file with line previews; replace one or all) | spec 5.0, 5.1 |
| 8 | The editor follows the session: when it edits a file, the file opens and the change shows as it is written; when the person is reading another file, the change is marked (a dot, an Activity line) and the view stays | spec 0; D93 |
| 9 | ⌃⇧` swaps the inspector for the record's lenses, 400px wide, and back | spec 4; D81 |
| 10 | Columns: each folds to a labelled rail; the terminal docks bottom or right; sides swap; focus folds all but the prompt; widths remembered | spec 5.1; D51 |
| 11 | Add to message from the editor: a file, a folder, a line range, as chips in the input bar | spec 0; D94 |
| 12 | Every action a person takes by hand in the editor has a session tool behind it, or is labelled "by hand only" | spec 0; D92 |

Each item closes when its tags fire in the packaged app's trace, failure rows included, and a gate reads them (`WORKING_AGREEMENT.md`, the trace rule).

## Other plans

The image, video, audio, design and document modes, the plain shell, the input bar on other pages, and add-to-message from meta and the transcript each get their own plan.
