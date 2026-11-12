# The code editor's close (sprint 486, roadmap r20 E25)

*2026-11-11. The roadmap's last item: the full suites once; the runbook's build and install, steps 1 to 20; every editor frame beside the running app; and the editor's hand actions against the session's tools (D92), with where "by hand only" is drawn.*

## The hand actions and their session tools (D92)

D92: everything a view lets a person do by hand, the model must be able to do through a tool, and every tool call lands in the record; an action with no tool behind it is labelled "by hand only". The kernel's file tools read and write UTF-8 only (`../substrate/src/substrate/topologies/tool_loop/tools.py`: `_read_file` line 200, `_grep` 319, `_edit_file` 351 and 362, `_write_file` 369). Where the editor goes past that, `bash` is the tool, as D92 names it for images (`bash` with `magick`).

| Hand action in the editor | Session tool | On the record |
|---|---|---|
| Open a file: the tree, a tab, quick open, a search result | `read_file`; the tree's listing `list_dir` | FILE_READ (window trace); the session's ToolCall |
| Save: ⌘S, File ▸ Save, the save before a message is sent | `write_file` | FileWritten, by hand |
| Replace, replace all (FIND / REPLACE) | `edit_file` | FileWritten, by hand, at the save |
| Step back to an earlier text (HISTORY) | `write_file` | FileWritten, by hand |
| Search the workspace (the search tab) | `grep` | EDITOR_SEARCH_QUERIED; the session's ToolCall |
| Quick open (⌘P) | `glob` | EDITOR_QUICK_OPENED; the session's ToolCall |
| Type into a text file not in UTF-8 (Latin-1, UTF-16), saved in its encoding | `bash` (the file tools write UTF-8) | FileWritten, by hand |
| Type over a byte in hex, binary or octal, or edit a binary file's text form | `bash` | FileWritten, by hand |

What changes no file, so has no work for a tool to do: undo and redo in the buffer, find without replace, the selection's highlight, tabs, folding and docking the columns, the look, the code colours, the key binding. Adding to the message (chips by ⌥-click, ⌥A, right-click and drag) composes the person's own message; the prompt is the person's (D90), and no model tool writes it.

"By hand only" is drawn nowhere: every hand action that changes a file has a session tool behind it.

## The runbook, steps 1 to 20

Run 2026-11-11 22:03–22:16 (local), logs in `runs/packaged/sprint-486-20261111-220313/`. Bundle and install: CFBundleVersion 1794463909, unsigned (`skipped macOS code signing`).

| Step | Command | Result |
|---|---|---|
| 1 | `ruff check .` | 0, all checks passed |
| 2 | `ruff format --check .` | 0, 105 files formatted |
| 3 | `gen_kinds.py --check` | 0 |
| 4 | `npm run build` | 0 |
| 5 | `npm run test:unit` | 0, 231 specs |
| 6 | `vm_smoke` | 0, 12 of 12 steps |
| 7 | `npm run test:py` | 0, 423 passed, 5 live-driver skips |
| 8 | `npm run pack:runtime` | 0, no VERIFICATION_BUILD (the kernel tree is clean) |
| 9 | `npm run pack:dev` | 0 |
| 10 | `packaged_app_smoke` | 0 |
| 11 | shakeout, axis C | 0, 5 of 5 tags, no dead tags, no bugs |
| 12 | shakeout, axis A | 0, 29 of 29 tags, no bugs (the /help defect of 2026-10-27 no longer fails) |
| 13 | `lifecycle_gates` | 0, all passed |
| 14 | `transcript_follow` | 0, all passed |
| 15 | `tasks_gate` | 0, all passed |
| 16 | `resume_ended_session` | 0 |
| 17–20 | quit, the old bundle (1794461489) to the Trash, install, open | 0; `SubstrateKernelCommit` = the kernel's HEAD (0301bec), `SubstrateKernelVersion` 1.1.2 = pyproject; main and backend running; the log reads app boot, spawning server, server bound, server up |

## The editor's frames beside the running app

Frames rendered from `../design/received/handoff 5/sheets/Substrate Shell Directions v11.dc.html` into `runs/design/sheet-v11/`; the app drawn on the close's bundle by the gate that answers to each frame (`runs/packaged/sprint-<n>-20261112-0614*-packaged/`). Where a frame and a decision disagree, the decision governs (BLACKBOARD 2026-11-09).

| Frame | Gate and screenshot | Drawn as the frame | Differs by a ruling | Differs, not built |
|---|---|---|---|---|
| 24a, the editor | `editor_inspector` (kimi-k3:cloud), `sprint-422-…/editor.png` | tree with the changed dot; tabs; line numbers; the gutter's +, removed lines in red; status line with the count; OUTLINE with the current symbol and its line; CHANGES with three authors; FIND / REPLACE; ACTIVITY; HISTORY with ⌘Z steps back; INFO | added lines keep their syntax colours (2026-11-11); `vs head` (2026-11-11); `standard` keys by default, so no `-- NORMAL --` (2026-11-09); no search box atop the files tab (SEARCH-BAR-2026-11-10) | the inspector header's `⌃⇧\` record` chip; the top bar's short worktree chip and the model chip's ▾ (the app draws the full path); the footer's `clean · record … · N events` (E11, the surfaced question on "clean") |
| 24b, the record column | `editor_meta_pane`, `sprint-430-…/meta-pane-column.png` | the five lenses; rows with seq and kind; a row inspected inline with its payload | — | the header reads `META`, the frame `RECORD`; no `⌃⇧\` inspector` chip; at 400 px the lenses wrap to two lines, and `all · app` and `down · side` show, which the frame does not draw |
| 24h, the view keys | `editor_view` (structural: each key goes to its view and back) | the keys, as the gate drives them | — | planning (⌘4) is a later mode |
| 24i, quick open | `editor_quick_open`, `sprint-441-…/quick-open.png` | the box over the centre; ranked names with folders; the dot on the changed file; the key line; RECENT once files are opened | `⌘↵ open behind` (sprint 441), the frame `open beside` | — |
| 24j, search | `editor_search`, `sprint-435-…/search.png` | query and replace with their switches; the match count; results grouped by file with line numbers and the matches lit; the footer's keys | — | — |
| 24k, add to message | `editor_chips`, `sprint-443-…/chips.png` | chips in the input bar with their ×; the hint | the hint is the terminal header's tooltip (D40, sprint 458), not a drawn line | the gate's screenshot holds file and folder chips; the range chip (`cart.ts 85–89`) is gated by `editor_selection_chips` |
| 16c, focus | `editor_folds`, `sprint-415-…/fold-7.png` | the terminal folded to its sill: the input bar, `▴ history · ◐ parked` | — | the gate folds the left, right and bottom columns one at a time; the frame's all-folded state is not captured |
