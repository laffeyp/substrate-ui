# Review — the code editor roadmap, round 2

*2026-11-09. Reviews `ROADMAP-2026-11-09-code-editor-r2.md` in this folder against `REVIEW-2026-11-09-code-editor-roadmap.md`, the sources that review read, the SDD kit and the code. That review stands; this one covers what round 2 changed. "Line 79" means line 79 of round 2. Code is substrate-ui at `9266de0` and the kernel at `0301beca`. Package facts are from `npm view` on 2026-11-09.*

---

## Result

Round 2 fixes most of round 1. The diff is "vs main", the vim package is real, the migration is closed, the research document comes first, and vocabulary work has a place. Six findings below, 1–6, should be corrected before the research document starts, because that document would inherit them.

Line 3 says round 2 "incorporates all 36 findings". The table at the end counts 21 carried and 15 carried in part. The same claim is on the BLACKBOARD and in `process/planning/README.md`.

Findings 2 and 6 correct advice in the first review. That review's esc rule throws a vim user out of the editor, and its fix for large history text saves nothing.

---

## Decisions that fail as written

### 1. Following the session still reads only native tools

Lines 25 and 93 say the file opens "when the session calls `edit_file`" and that the editor marks at ToolCall and confirms at ToolResult. Line 85 builds HISTORY from "`edit_file` or `write_file` arguments". Line 81 extends the derivation to `HarnessToolCall`, but these three lines keep the native names.

`claude`, `codex` and `cursor-agent` ran 36 of the 103 sessions here, and each uses its own tool names. `HarnessToolResult` is a separate kind from `ToolResult`. Codex's `file_change` "may arrive only as completed" (`harness_streams.py:173`), so for that driver no moment exists between mark and confirm.

Correction: lines 25, 85 and 93 name the driver table of line 81 as their source. The follow decision states what happens when call and result arrive together, and the gate runs follow on a harness driver.

### 2. Esc in vim normal mode must not leave the editor

Lines 91 and 106 take the first review's cascade: vim insert or visual, then find and quick open, then the view closes. Vim users press esc as a reflex to make sure they are in normal mode, often twice. Under this rule the second press leaves the editor. The first review's correction was wrong on this point.

Correction: with vim bound and CodeMirror focused, esc stays in vim in every mode, and ⌘⇧E leaves. Esc closes the view when focus is outside the editor or the bindings are nano. Frame 24a draws "esc or ⌘⇧E back to the pane" with vim in normal mode, so this departs from the design in that one state and needs an `agent-resolved` entry with its grounds.

### 3. The keyboard table does not settle who owns each key

The "Owner" column says `editor` for keys whose "Menu" column names View or Go. `electron/menu.ts:15–19` allows one owner per key and says macOS Electron cannot show a key without registering it. A key shown in the menu is therefore the menu's, in every view. Line 119 says each key "fires only while its owner's view is open", which the renderer's table cannot arrange for a menu accelerator. The table needs either a menu owner whose handler routes through `open_view`, or no key shown in the menu.

The table also has these faults:

- ⌘B toggles the left column on the View menu. The spec's keyboard map gives ⌘B to "build a card (plan)", and a menu accelerator is window-wide, so project 7 would collide with it.
- ⌘⇧E lists View only. Line 17 says View and Go.
- ⌘M, ⌘E, ⌘D, ⌘⇧D, ⌘3 and ⌘, are left out. `keymap.ts` handles all six today, and the table should say what each does while the editor is open.
- ⌘S appears on line 97 and not in the table, and `menu.ts` has no Save item.
- Line 97 gives nano's save as ⌃S. Line 73 gives it as ⌃O.
- `keymap.ts:67` still catches ⌘⇧F as find, and the table's row depends on changing it.
- ⌘F is find in file in every case, including with focus in the transcript below. Today ⌘F scopes to the focused area.

### 4. ⌘Z has a rule and ⌘⇧Z and `u` do not

Line 89 rules on ⌘Z only. Line 112 gives ⌘⇧Z "CodeMirror redo / HISTORY step-forward" with no test between them. A person who undoes back to the saved text has a clean buffer and a full redo stack. Applying ⌘Z's test, ⌘⇧Z then steps HISTORY forward and the redo stack cannot be reached.

Line 89 lists vim's `u` as a candidate and gives it no rule. HISTORY also has no defined "forward": the record is append-only and r11 defines a step as a new edit.

Correction: ⌘⇧Z is CodeMirror's redo while its redo stack is non-empty, and HISTORY's otherwise. `u` and ⌃R are CodeMirror's only. HISTORY's forward is defined as a new edit writing the later text.

### 5. Two of the eight grammars do not exist as named

Lines 77 and 192 require "one `@codemirror/lang-*` grammar per language" and count eight. `npm view` returns E404 for `@codemirror/lang-shell` and `@codemirror/lang-typescript`. TypeScript is an option of `@codemirror/lang-javascript`. Shell is available through `@codemirror/legacy-modes` 6.5.5 and `StreamLanguage`, which yields tokens and no tree of functions, so the shell outline is empty.

The batch is six `lang-*` packages and `legacy-modes`. The stated ground, "the languages the session's tools handle", has no source: the tools read and write any text.

Correction: name the packages. Take the ground from something measured, such as file extensions across the workspaces on this machine, or from the design's own examples. Line 21's "classes, functions, methods" also needs a statement for JSON, CSS and Markdown, which have none.

### 6. Fetching history text on demand saves nothing as designed

Line 87 states the cost, then says "the old and new text are fetched only when the row is opened". The same paragraph says the stream sends every envelope. `_session_events` resolves blobs before sending (`server.py:4177`) and the controller keeps each envelope in `rawEnvelopes` (`session_controller.ts:1414`). The text is already in the window when the row is drawn. No endpoint returns one event's text by seq. The first review's correction had this flaw.

Correction: choose one and take it to the research. Either the session stream sends a `FileWritten` without its text and a new endpoint serves it by seq, or the window keeps the text and the roadmap states the cost. The first needs care: `session_events` serves the stream lens and the i/o lens as well.

### 7. The diff decision has four holes

- Line 79 calls `worktree_diff` "not the right function" and drops its one useful part. Plain `git diff` omits files never added, so a file the session created would have no hunks and no dot. The scratch-index method (`workspace.py:122–129`) has to carry over, as the first review said.
- Line 79 says "every session workspace is a git repository since K315" and line 65 records 81 workspaces without git. The first review's correction listed the two cases where the column is absent, a workspace from before K315 and a machine with no git. Neither is in the edge-state table.
- The rules for "no `main`" and "a repository the kernel made" overlap. A kernel-made repository may have a `main`, and the order of the two rules is not given.
- 13 of the 19 git workspaces here have `main` checked out. There, `merge-base main HEAD` is HEAD, and a commit by the session empties the column. That is what "vs main" gives, and the roadmap should say so.

Nothing says what refreshes the dots and the summary: a watch event, a ToolResult or a poll. Each refresh runs git.

---

## First-review corrections carried in part

### 8. Widths: what persists is not stated

Line 27 has "per mode". The first review's correction also required a statement of what persists before project 9, the collection, and where it is kept. Round 2 has neither, and line 176 builds the feature in Phase 1.

### 9. The failures are not named

Line 32 restores "failure rows included", but the first review asked for the failures per phase and gave the list: 409 on a stale save, 409 on an ended session, 503 on a busy record, a tool failing after the mark, a watch stream cut at the cap, a file over the cap, a CSP refusal. Round 2 lists none of them under any phase. To these, round 2 adds a refused key and a hunk with no author.

### 10. No bridge mappings

r8's question 8 and the card template's `bridge` kind require CodeMirror's API written into the working agreement's bridge mappings before authoring. `WORKING_AGREEMENT.md` has CodeMirror only in its dependency list, and round 2's lines 77 and 168 name only the permitted list. Question 8's size and licence answers go to the research, which line 164 covers by the fifteen questions; the mapping is named nowhere.

### 11. Work that no phase owns

These appear in the deliverables or decisions and in no phase:

- the per-session diff read, which Phase 1's dots need
- teaching `gen_kinds.py` the `FileWritten` kind (only a note in the built table, line 62)
- the attachment size and folder fix (line 63 says Phase 5; line 184 does not list it)
- focus, the three column keys, and the View menu entries
- the vim or nano setting
- the four edge states
- `keymap.ts`'s view-aware dispatch

The first review's finding 16 asked for the Go menu to be named as work. Line 184 builds it in Phase 5, and line 107 needs it for ⌘P in Phase 4.

### 12. Phase order

Line 174 says the phases follow r11, and quotes "tree and open tab" as one step. Line 182 still builds the open tab in Phase 4. Line 139 runs the parity check in each phase, and line 182 runs one check for phases 1–4. Line 176's open-file tab row has nothing to show until Phase 2.

### 13. A conflict is shown and cannot be acted on

Lines 25 and 93 say the conflict "is shown". Neither says what the person can then do: reload, keep theirs and overwrite, or compare. The save returns 409 until something changes `base_sha256`. Line 93 doesn't say when a clean open buffer takes the session's text, whether at ToolResult or at the watch event.

Replace all (line 24) has no rule for a file open with unsaved changes or one over the 2 MiB cap. Each is a failure row.

### 14. ⌘↵ now equals ↵

Line 23 has "↵ opens, ⌘↵ opens in a new tab". With a tab row, a file opened by ↵ also has to land somewhere. The design's two keys differ. Round 2 needs to say ↵ replaces the current tab or that it opens a tab and ⌘↵ does something else.

---

## Facts and standing

### 15. Citations

- Line 63 cites `server.py:3198` for attachments. That line is `registry.create`. `_resolve_attachments` is at `server.py:2033` and `Attachment` at `session/vocabulary.py:181`.
- Line 61 cites `server.py:1978–2092` for the file API. `_workspace_list` is at `:1938` and the handlers at `:3606`, `:3656` and `:3690`.
- Line 49 says "the store's `open_view` field". Line 59 says it is held in `App` state, which is right. The type is `OpenView` and the field is `vs.view`.
- Line 158 says `Transcript`'s values are `pane` and `meta`. They are `terminal` and `reveal` (`Transcript.tsx:21`).
- Line 158 names `web/app/editor/`. Line 156 lists `web/app/*.tsx` as the home for view components. The folder needs its registry row.
- Line 166 cites D89, and the source line does not.
- Line 51 says only the research precedes the build. Line 165 puts vocabulary there too.

### 16. The built app is still listed

The `user` entry of 2026-11-09 says "A plan lists only work to be done". The first review's finding 31 named this. Round 2 keeps "What is already built", adds a row, and adds a section on the closed migration (lines 47–65). The notes in that table hold real work and real constraints.

Correction: move the constraints to the technical decisions and the work to the phases, and remove both sections.

### 17. The record says more than the document does

Line 3, the `built` entry on the BLACKBOARD and the planning index all say every finding is addressed. The kit reserves `built` for sprint closes. The working agreement moves a superseded round to the folder's `superseded/`; round 1 is still beside round 2 and the folder does not exist.

### 18. Decisions without records

Round 2 settles at least these on no recorded ground: the esc order, the ⌘Z rule, the save policy, the three column keys, "unattributed" as a third author, ⌘↵ against no splitting, the first batch of languages, and the replacement of research question 3's pass rule. A roadmap cannot amend a research document's pass rule by saying so. The kit's rule is one `agent-resolved` entry each, with its grounds. The BLACKBOARD has none dated 2026-11-09.

---

## The 36 findings of the first review

| # | Subject | Round 2 | Where, or this review's finding |
|---|---|---|---|
| 1 | "vs main" | carried | line 79 |
| 2 | Not only worktrees | carried | line 79 |
| 3 | "No base" false | in part | 7 |
| 4 | Endpoint | in part | 7 |
| 5 | Hunk author | carried | line 95 |
| 6 | Widths | in part | 8 |
| 7 | ⌥⌘F | carried | lines 21, 110 |
| 8 | Omissions | carried | lines 17–28 |
| 9 | ⌘↵ and no splitting | carried | lines 23, 42; see 14 |
| 10 | Migration closed | carried | line 47 |
| 11 | Vim package | carried | line 73 |
| 12 | Locations | carried | lines 59, 61 |
| 13 | Widget registry | carried | lines 60, 71 |
| 14 | Attachments | in part | 11 |
| 15 | Esc | carried | line 91; rule corrected in 2 |
| 16 | Keys and menus | in part | 3, 11 |
| 17 | CSP | carried | line 75 |
| 18 | Parser and search | in part | 5 |
| 19 | Harness drivers, `bash` | in part | 1, 11 |
| 20 | Two event kinds | carried | line 85; see 18 |
| 21 | ⌘Z | in part | 4 |
| 22 | Follow, unsaved work | in part | 13 |
| 23 | Four states | carried | line 145 |
| 24 | Search and quick open | carried | lines 24, 164 |
| 25 | Tool parity | carried | line 125 |
| 26 | Phase order | in part | 12 |
| 27 | Research first | carried | line 164 |
| 28 | Vocabulary | carried | line 165 |
| 29 | Close condition | in part | 9 |
| 30 | Dependencies, bridge | in part | 10 |
| 31 | Standing | in part | 16, 17 |
| 32 | Homes, import check | in part | 15 |
| 33 | Watch cost | carried | lines 164, 194 |
| 34 | Whole-file text | in part | 6 |
| 35 | Risks | carried | line 188 |
| 36 | Terminology | carried | line 9 |
