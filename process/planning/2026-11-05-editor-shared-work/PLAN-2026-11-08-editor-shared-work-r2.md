# Plan — the editor view's shared work, then its code mode (round 2)

*2026-11-08. Supersedes `superseded/PLAN-2026-11-05-editor-shared-work.md`. Round 1 was written before the SDD signals plan (`2026-11-05-sdd-signals/`, closed 2026-11-08). That plan added the trace, vocabulary v0.7 to v0.25, the runtime checker, and the trace rule in `WORKING_AGREEMENT.md`: no behaviour sprint closes until its tags fire in the packaged app's trace, its failure rows under fixtures. Round 2 applies that rule to every item, gives each item a done condition, and settles round 11's one open point by practice. The source stays `2026-11-04-editor-level/RESEARCH-2026-11-05-editor-view-r11.md`, "Order of work".*

## Rules

- A refactor changes nothing a user sees or does. It passes the gates and the pixel captures with no difference.
- New items add only what the design asks (`design/received/handoff 5/`, D81–D94). A detail the design leaves open is settled by best practice, with its source named.
- Each behaviour item proposes its tags (a vocabulary version, with proposals) before its code. It closes when the tags fire in the packaged app's trace, failure rows included, and a gate reads them.
- Kernel items are made in `substrate`.

## Shared work

| # | What | State | Closes when |
|---|---|---|---|
| 0(a) | One field for the open view | Done, sprint 346 | — |
| 0(b) | The widget registry (CodeMirror keeps its history through a remount) | Done, sprint 347; nothing uses it yet | — |
| 0(c) | The workspace file API | List, read and watch done (348, 349), with no tags; write next | The write saves a file and records `FileWritten` through `SessionRegistry.append_event` (K340), refusing paths outside the workspace. The server's file events have tags: a file listed, read, written and refused, and a watch opened and closed. Each fires in the packaged trace under a gate. |
| 0(d) | Kernel: an edit event on the record during or between turns | Done, K340 (`FileWritten`, kernel vocabulary 0.4) | — |
| 0(e) | Kernel: attachments on `UserMessage`, one shape for every view's chips (D94); images sent to the model | Not started | A `UserMessage` with an attachment reaches the record and the model; kernel tests; the session vocabulary records the field. |
| 0(f) | Two pane kinds, `SessionPane` and `ShellPane` | Not started | The split is a refactor with no pixel difference; the shell pane's tags fire under a gate. |
| 0(g) | The input bar in every view (D90) | Not started; `InputBar` already takes its pane | The bar shows and sends from each page; its tags carry the view; gate. |
| 0(h) | Chips in the input bar; "add to message" from meta's stream rows and the transcript | Not started; needs 0(e) | A chip added in each place reaches the record's `UserMessage`; tags and gate. |

## Code mode (round 11, section 1)

In order, each a sprint or a short chain, each under the rules above:

1. The view: ⌘⇧E and View ▸ Editor, its columns and rails, the transcript and input bar below; `editor` as a value of the open view.
2. The file tree and the open tab, over 0(c), with change dots from the watch.
3. The editor: CodeMirror 6 through the widget registry, vim and nano bindings, saving through 0(c)'s write.
4. The inspector spine: ACTIVITY from ToolCall arguments, HISTORY from session edits and `FileWritten`, INFO from 0(c).
5. Live follow: a session's `edit_file` opens the file and marks the change (question 14).
6. Changes in this file. The diff base is the workspace's git HEAD. Every session workspace is a git repository (kernel K328; sprint 349 found `.git` in each), and a working tree against HEAD is how editors with git support show changes (VS Code's source control view).
7. Find and replace in the file; the search tab; quick open ⌘P.
8. `` ⌃⇧` `` and the lenses in the right column (each lens already takes its width from its container).
9. Chips from the editor: file, folder, line range (question 15).

## Done

The shared work closes when 0(c) to 0(h) close. Code mode closes when its nine steps close.
