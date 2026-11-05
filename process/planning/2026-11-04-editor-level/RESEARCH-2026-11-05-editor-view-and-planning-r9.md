# New views in substrate-ui: the editor view and planning (round 9)

*2026-11-05, round 9. Rounds 1–8 are in this folder, unchanged. Round 8 researched sheet turns 16 and 17 of checkpoint 6. The design side has since sent checkpoint 7 (`design/received/handoff 5/`), and turns 24 and 25 replace 16 and 17 as the target (`BLACKBOARD.md`, `user` entry of 2026-11-05). Round 9 states what the new turns change in the views, in the build order, in the move off dc-runtime, and in the research each view finishes before its cards. What round 8 settled and turns 24–25 leave alone stands as round 8 wrote it: the terminal, the libraries, the record rules, the thirteen questions, the principles from* A Philosophy of Software Design.

*Design input: `design/received/handoff 5/README.md`; `docs/DESIGN-SPEC -2026-11-04- r6.md` (sections 0, 4, 5, 6.1, 8, 9); `docs/DESIGN-DECISIONS -through 2026-11-04-.md` (D81–D94); `docs/EDITOR-INSPECTOR-PLAN-RATIONALE -2026-11-04-.md`; `docs/PLANNING-TOOLS-FEATURE-ANALYSIS -2026-11-04- r2.md`; each read in full. Of sheet v11, the captions of turns 24 and 25 were read; the 2,432 lines of frame text under them were extracted and not read line by line.*

## What changed

| Round 8, from turns 16–17 | Turns 24–25 | What it changes |
|---|---|---|
| A code editor whose right panel is meta's lenses | The right column is an inspector for the open file's type; the record's lenses open in that column with ⌃⇧`, widened to 400px (D81) | The code editor gets an inspector, new work. The lenses must draw in a 400px column as well as in meta's right half. |
| Seven views, one per kind of file | One editor view with modes: code, documents, images, video, audio, design, and a plain shell tab (spec 5) | The media and design editors become modes of the editor view, opened from its file tree, each with its own inspector. Each still gets its own research, in the same order. |
| No common inspector | Every inspector ends in ACTIVITY, HISTORY and INFO; text modes add find and replace (D82, D85) | One spine module, built with the code editor and reused by every mode. |
| Left: a file tree | Left: tabs files · search · open · activity; quick open ⌘P; workspace search and replace ⌘⇧F (D82) | Four left tabs and quick open, not one tree. Replace-all writes files, so it is an edit and goes on the record. |
| Turn 17: contextual modes | Turn 25: planning, a surface on ⌘4 (D89) | A new surface beside records, studio and assays, with its own research. |
| The prompt in the code editor's bottom panel | The prompt in every view, surfaces included (D90) | Records, studio and assays draw over panes and meta today and hide the input bar (`reveal_component.ts:2265`). Each must show it. |
| Edits go on the record | The view moves as each tool runs: ToolCall, ToolProgress, ToolResult (D93); a view action with no tool behind it is a gap (D92) | Two new questions per view: how the view follows the session's tool calls, and which tool backs each action. |
| Comment pins in the design canvas | Any view adds a thing to the next message as a chip: a file, a line range, an image region, a time range, a card, a record event by seq (D94) | The attachment field on `UserMessage` (round 8, shared item 0(e)) serves every view, panes and meta included, and moves earlier. |
| AU plugin hosting left out | The audio inspector's effects chain lists plugins scanned on the machine, naming AUNBandEQ, AUDynamicsProcessor, AUPeakLimiter (spec 5) | Back in scope with the audio mode. Its research names the native host, since neither Electron nor the bundled Python can run an Audio Unit. |

**Names.** The handoff calls the record view "reveal" on ⌃`. The app's name for it is meta, on ⌘M (Architect, 2026-10-11 and 2026-11-04). The new keys stand as drawn: ⌘⇧E editor; ⌘1–⌘4 records · studio · assays · planning; ⌃⇧` the editor's right column; ⌘P quick open; ⌘⇧F workspace search; ⌘B build a card; ⌘⇧T plain shell tab. Each view binds its own keys while open, so the video mode's ⌘E export and the window's ⌘E (all tool output) do not meet.

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

## Planning (turn 25)

**What it is.** A surface on ⌘4 that shows a plan as six files, each drafted by the session from the one before and approved before the next: a roadmap, requirements, a breakdown with estimates, sprint cards, and a board over the cards' statuses (D89; the planning research, section 1). The board holds nothing of its own. Dragging a card writes its frontmatter. ⌘B asks the focused session to call `build(card_file=)`; the run opens in its own pane (U182); a card's status changes only when the Architect closes it.

**What exists.** `build(task, files?, read_first?, notes?, card?, card_file?)` (K332; `substrate/src/substrate/topologies/runs/build.py:118–128`) reads a card file inside the workspace and refuses one outside it. Run panes exist (U182). Cards here carry `id`, `status`, `phase`, `pass_kind` in their frontmatter (`process/sprints/`).

**What it lacks.**

- *Where plans live.* D89 puts a plan under `planning/<plan>/` as `ROADMAP.md`, `REQUIREMENTS.md`, `BREAKDOWN.md` and its cards. This repository keeps plans in `process/planning/<date>-<topic>/` as versioned rounds and cards in `process/sprints/`, one flat folder. The planning research decides whether the surface reads both layouts or the kit's layout changes.
- *Estimates, rank, epic, requirements met, assignee.* The kit's card template (`sdd-kit-3/templates/SPRINT_CARD.md`) has none of them. Adding them changes the kit, so it is recorded as a kit change, outside this repository.
- *Requirements and breakdown files.* No plan here has either; plans hold design, order of work and decisions.
- *The board's edits.* A drag writes a file, so it goes on the record through shared item 0(d).
- *Jira.* A site and a token are an account and a credential, a question only the Architect answers. The mirror is out of the first cut.

## Rules for every view, added

Round 8's rules stand: each view shows the record and the workspace and writes only to them; the record check and the import check; every edit goes on the record; one `view` tag per record event shown. Turns 24–25 add four.

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

Round 8's order stands with three changes. The add-to-message attachment moves into the shared work, since every view needs it. The inspector spine is built with the code editor. Planning is added after the document editor, which it uses for cards.

**Before any of it: the move off dc-runtime** (`process/planning/2026-11-04-shell-to-react/`). Each new view is a React component under `web/app/`, and none is added to `reveal_component.ts`. Turns 24–25 add two constraints to that move, and change neither its order nor its count of sprints:

- The input bar and transcript components take the pane they serve as a prop, so a view or a surface can mount them anywhere (D90).
- The lens components take their width from their container, so they draw in meta's right half and in the editor's 400px column (D81).

The store's open-view field takes the values pane, meta, editor and the four surfaces, so ⌘1–⌘4 and ⌘⇧E each set one value.

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

**1. The editor view, code mode.** Three columns and the bottom panel: left tabs files · search · open · activity; CodeMirror 6 with vim and nano bindings in the centre; the inspector right (outline, changes in this file, find and replace, then the spine); the transcript and input bar below; ⌃⇧` swaps the inspector for the lenses. Quick open ⌘P. Each column collapses to a labelled rail; the terminal docks bottom or right. In the order it is built:

1. The view shell: ⌘⇧E, View ▸ Editor, the columns and rails, the transcript and input bar below.
2. The file tree and the open tab, over 0(c), with change dots.
3. The editor: CodeMirror 6, vim and nano, save through 0(c) and 0(d).
4. The spine: ACTIVITY from ToolCall arguments, HISTORY from session edits and 0(d)'s events, INFO from 0(c).
5. Live follow (question 14): the session's `edit_file` opens the file and marks the change.
6. Changes in this file, once the base for flat and sandbox workspaces is chosen.
7. Find and replace in the file; the search tab; quick open.
8. ⌃⇧` and the lenses in the right column.
9. Chips from the editor: file, folder, line range (question 15).

**2. The collection.** As round 8: SQLite (D66), no save command (D68), sprint 044's empty-pane rule. It now also saves per-mode column widths, the dock side and collapsed rails (spec 5.1).

**3. Plain shell.** As round 8, opened as a tab beside the transcript with ⌘⇧T.

**4. Document mode.** As round 8, plus its inspector: outline, paragraph styles, selection formatting, document facts. The byte-diff test still decides between source-backed and tree-backed editing; paragraph styles applied in a source-backed editor write markdown markup, and the test covers each style.

**5. Planning.** Uses document mode for cards and roadmaps, 0(d) for board drags, and `build(card_file=)` for ⌘B. Its research starts with where plans live and the kit change for estimates.

**6–9.** Image mode, design mode, video mode, audio mode, in round 8's order, each with its inspector from spec 5 and questions 14 and 15. Audio's research includes Audio Unit hosting.

## Open

- Where plans live: the kit's `process/planning/` and `process/sprints/`, or D89's `planning/<plan>/`.
- The diff base for "changes in this file" in flat and sandbox workspaces.
- The Jira mirror needs a site and a token from the Architect; it waits for that.
- Edits made between turns stay off the record until 0(d) lands, as round 8 said.

## Sources

Local, beyond round 8's: `design/received/handoff 5/` (the files named at the top); `substrate/src/substrate/topologies/runs/build.py:118–128`; `substrate/src/substrate/topologies/tool_loop/tools.py:117–128`, `:342`, `:484`, `:729–738`; `substrate/process/BLACKBOARD.md:658` (K332); `web/reveal_component.ts:2238`, `:2265`; `web/reveal.html:417–422`; `BLACKBOARD.md` (2026-11-05 `user` entry; U154, U182).
