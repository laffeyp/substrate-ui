# New views in substrate-ui: the editor view (round 11)

*2026-11-05, round 11. Planning, sheet turn 25, is a project of its own (Architect, 2026-11-05), so round 11 drops it and covers turn 24, the editor view. Round 10 was round 9 with each key that contains a backtick (⌃ with backtick, ⌃⇧ with backtick) set as code, so the tables render; round 9 drew its first table as one run-on cell. Rounds 1–9 are in this folder, unchanged. Round 8 researched sheet turns 16 and 17 of checkpoint 6. The design side has since sent checkpoint 7 (`design/received/handoff 5/`), and turns 24 and 25 replace 16 and 17 as the target; turn 25 has since become its own project (`BLACKBOARD.md`, `user` entry of 2026-11-05). This document states what turn 24 changes in the views, in the build order, in the move off dc-runtime, and in the research each view finishes before its cards. What round 8 settled and turn 24 leaves alone stands as round 8 wrote it: the terminal, the libraries, the record rules, the thirteen questions, the principles from* A Philosophy of Software Design.

*Design input: `design/received/handoff 5/README.md`; `docs/DESIGN-SPEC -2026-11-04- r6.md` (sections 0, 4, 5, 8, 9); `docs/DESIGN-DECISIONS -through 2026-11-04-.md` (D81–D94); `docs/EDITOR-INSPECTOR-PLAN-RATIONALE -2026-11-04-.md`; each read in full. Of sheet v11, the caption of turn 24 was read; the frame text under it was extracted and not read line by line.*

## What changed

| Round 8, from turns 16–17 | Turn 24 | What it changes |
|---|---|---|
| A code editor whose right panel is meta's lenses, and nothing else | The right panel is more than meta. It is an inspector for the open file's type; the record's lenses open in that column with `` ⌃⇧` ``, widened to 400px (D81) | The code editor gets an inspector, new work. The lenses must draw in a 400px column as well as in meta's right half. |
| Seven views, one per kind of file | One editor view with modes: code, documents, images, video, audio, design, and a plain shell tab (spec 5) | The media and design editors become modes of the editor view, opened from its file tree, each with its own inspector. Each still gets its own research, in the same order. |
| No common inspector | Every inspector ends in ACTIVITY, HISTORY and INFO; text modes add find and replace (D82, D85) | One spine module, built with the code editor and reused by every mode. |
| Left: a file tree | Left: tabs files · search · open · activity; quick open ⌘P; workspace search and replace ⌘⇧F (D82) | Four left tabs and quick open, not one tree. Replace-all writes files, so it is an edit and goes on the record. |
| The prompt in the code editor's bottom panel | The prompt in every view, surfaces included (D90) | Records, studio and assays draw over panes and meta today and hide the input bar (`reveal_component.ts:2265`). Each must show it. |
| Edits go on the record | The view moves as each tool runs: ToolCall, ToolProgress, ToolResult (D93); a view action with no tool behind it is a gap (D92) | Two new questions per view: how the view follows the session's tool calls, and which tool backs each action. |
| Comment pins in the design canvas | Any view adds a thing to the next message as a chip: a file, a line range, an image region, a time range, a record event by seq (D94) | The attachment field on `UserMessage` (round 8, shared item 0(e)) serves every view, panes and meta included, and moves earlier. |
| AU plugin hosting left out | The audio inspector's effects chain lists plugins scanned on the machine, naming AUNBandEQ, AUDynamicsProcessor, AUPeakLimiter (spec 5) | Back in scope with the audio mode. Its research names the native host, since neither Electron nor the bundled Python can run an Audio Unit. |

**Names.** The handoff calls the record view "reveal" on `` ⌃` ``. The app's name for it is meta, on ⌘M (Architect, 2026-10-11 and 2026-11-04). The new keys stand as drawn: ⌘⇧E editor; ⌘1–⌘3 records · studio · assays (⌘4 belongs to planning); `` ⌃⇧` `` the editor's right column; ⌘P quick open; ⌘⇧F workspace search; ⌘⇧T plain shell tab. Each view binds its own keys while open, so the video mode's ⌘E export and the window's ⌘E (all tool output) do not meet.

## What the record already supplies

The inspector's spine reads the session's record. Most of what it shows is there today.

| Inspector part | Source | Today |
|---|---|---|
| ACTIVITY, session reads and writes | `ToolCall` rows for `read_file`, `edit_file`, `write_file`, each with a `path` argument (`tool_loop/tools.py:729–738`) | Present. A pure module over the envelopes the stream lens already holds lists, per path, each turn and seq. |
| ACTIVITY, `bash` | A `bash` call's argument is a command string; its files are not named apart from it | Listed only where the command contains the path as written, and labelled as a text match. |
| HISTORY, session edits | `edit_file` arguments carry the old and new text; `write_file` the whole file | Present. |
| HISTORY, edits made in the view | The edit event that round 8's kernel addition writes (shared item 0(d)) | Absent until 0(d). |
| HISTORY, step back | — | Stepping back writes the earlier text as a new edit. The record is append-only, so nothing is undone in it; the step itself is a history row with its author. |
| CHANGES IN THIS FILE, by hunk with author and seq | `/api/worktree_diff` for session worktrees only (`server.py:2009`); no session gets a worktree today (U154) | Absent for flat and sandbox workspaces. A hunk's author is the latest edit, session or view, whose new text covers it. The code editor's research settles the base a flat or sandbox workspace is diffed against. |
| Live follow | `ToolProgress` comes only from `bash` (`tools.py:117–128`, `:484`). `edit_file` and `write_file` state the change in the ToolCall's arguments. | The editor opens the file and marks the change at ToolCall and confirms it at ToolResult. A media mode redraws at a `bash` ToolResult. Nothing new is needed in the kernel. |
| INFO | The workspace file API (shared item 0(c)): size, modified, encoding, line endings; ffprobe for media | Absent until 0(c). |

## Rules for every view, added

Round 8's rules stand: each view shows the record and the workspace and writes only to them; the record check and the import check; every edit goes on the record; one `view` tag per record event shown. Turn 24 adds four.

- **The prompt is in every view** (D90). The input bar and the focused session's transcript, or the transcript's sill, appear in each view and each surface.
- **Each action has a tool** (D92). An action the session cannot take through a tool gets a kernel card for the tool, or is labelled as by hand only.
- **The view follows the tools** (D93). Each ToolCall, ToolProgress and ToolResult moves the view. When the person is reading something else, the change is marked where it happened, a dot or an Activity row, and the view stays put.
- **Anything can go to the next message** (D94). ⌥-click, drag or Add to message makes a chip naming the thing; it travels with the next `UserMessage` and lands in the record with it.

## The research questions, added

Round 8's thirteen questions stand. Two are added, and two are widened.

| # | Question | Answer form | Passes when |
|---|---|---|---|
| 1 (widened) | What does the view show, and what can it do? | Round 8's table, with one row per inspector section and per left tab | No row maps to neither a record event nor a workspace file |
| 3 (widened) | How does the session do the same job? | For each action, the session tool that does it, or "by hand only" with the reason | The view and the tool call one function and write one event kind; each "by hand only" names its kernel card or its reason |
| 14 | How does the view follow the session's tools? | For each tool the session uses on this view's files: which of ToolCall, ToolProgress and ToolResult moves the view, and what moves | A gate drives a session tool call and sees the view move; with the person reading another file, it sees the mark and no jump |
| 15 | What can be added to the message? | Each thing the view can hand to the prompt, its chip text, and the attachment it becomes | A gate adds each, sends, and finds the attachment in the record's `UserMessage` |

## Order of work

Round 8's order stands with two changes. The add-to-message attachment moves into the shared work, since every view needs it. The inspector spine is built with the code editor and reused by every mode.

**Before any of it: the move off dc-runtime** (`process/planning/2026-11-04-shell-to-react/`). Each new view is a React component under `web/app/`, and none is added to `reveal_component.ts`. Turn 24 adds two constraints to that move, and change neither its order nor its count of sprints:

- The input bar and transcript components take the pane they serve as a prop, so a view or a surface can mount them anywhere (D90).
- The lens components take their width from their container, so they draw in meta's right half and in the editor's 400px column (D81).

The store's open-view field takes the values pane, meta, editor and the surfaces, so each view's key sets one value.

**0. Shared work, done once.**

| Item | What | Where | Needs |
|---|---|---|---|
| 0(a) | One field for the open view, replacing `revealed` and `surface`; the key handler passes keys to the open view first | substrate-ui | the move's store |
| 0(b) | The widget registry; a test that a CodeMirror editor keeps its undo history and cursor through a re-attach | substrate-ui | the move's mount registry |
| 0(c) | The workspace file API: list, read, write, watch, each held to its workspace | substrate-ui `server.py` | — |
| 0(d) | One kernel call that appends an edit event to a session's record during a turn or between turns; the edit event kinds | substrate | — |
| 0(e) | Attachments on `UserMessage`, one shape for every view's chips (D94); images sent to the model | substrate | — |
| 0(f) | Two pane kinds, `SessionPane` and `ShellPane` | substrate-ui | — |
| 0(g) | The input bar in every surface (D90) | substrate-ui | the move's input bar component |
| 0(h) | Chips in the input bar; meta's stream rows and panes' transcript offer "add to message" first, since both exist today | substrate-ui | 0(e) |

**1. The editor view, code mode.** Three columns and the bottom panel: left tabs files · search · open · activity; CodeMirror 6 with vim and nano bindings in the centre; the inspector right (outline, changes in this file, find and replace, then the spine); the transcript and input bar below; `` ⌃⇧` `` swaps the inspector for the lenses. Quick open ⌘P. Each column collapses to a labelled rail; the terminal docks bottom or right. In the order it is built:

1. The view shell: ⌘⇧E, View ▸ Editor, the columns and rails, the transcript and input bar below.
2. The file tree and the open tab, over 0(c), with change dots.
3. The editor: CodeMirror 6, vim and nano, save through 0(c) and 0(d).
4. The spine: ACTIVITY from ToolCall arguments, HISTORY from session edits and 0(d)'s events, INFO from 0(c).
5. Live follow (question 14): the session's `edit_file` opens the file and marks the change.
6. Changes in this file, once the base for flat and sandbox workspaces is chosen.
7. Find and replace in the file; the search tab; quick open.
8. `` ⌃⇧` `` and the lenses in the right column.
9. Chips from the editor: file, folder, line range (question 15).

**2. The collection.** As round 8: SQLite (D66), no save command (D68), sprint 044's empty-pane rule. It now also saves per-mode column widths, the dock side and collapsed rails (spec 5.1).

**3. Plain shell.** As round 8, opened as a tab beside the transcript with ⌘⇧T.

**4. Document mode.** As round 8, plus its inspector: outline, paragraph styles, selection formatting, document facts. The byte-diff test still decides between source-backed and tree-backed editing; paragraph styles applied in a source-backed editor write markdown markup, and the test covers each style.

**5–8.** Image mode, design mode, video mode, audio mode, in round 8's order, each with its inspector from spec 5 and questions 14 and 15. Audio's research includes Audio Unit hosting.

## Open

- The diff base for "changes in this file" in flat and sandbox workspaces.
- Edits made between turns stay off the record until 0(d) lands, as round 8 said.

## Sources

Local, beyond round 8's: `design/received/handoff 5/` (the files named at the top); `substrate/src/substrate/topologies/tool_loop/tools.py:117–128`, `:342`, `:484`, `:729–738`; `web/reveal_component.ts:2238`, `:2265`; `web/reveal.html:417–422`; `BLACKBOARD.md` (2026-11-05 `user` entry; U154, U182).
