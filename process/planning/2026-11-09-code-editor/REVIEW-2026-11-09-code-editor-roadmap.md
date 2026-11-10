# Review — the code editor roadmap

*2026-11-09. Reviews `ROADMAP-2026-11-09-code-editor.md` in this folder against its sources, the SDD kit and the code. "Line 78" means line 78 of the roadmap.*

*Design, read in full: `design/received/handoff 5/docs/DESIGN-SPEC -2026-11-04- r6.md`, `DESIGN-DECISIONS -through 2026-11-04-.md`, `EDITOR-INSPECTOR-PLAN-RATIONALE -2026-11-04-.md`, `MENU-BAR -2026-09-01-.md`. Sheet v11, as extracted text: frames 24a, 24b, 24h, 24j, 24k and the top of 24i. Frames 24c–24g draw the other modes and were not read.*

*Planning and method, read in full: `PLAN-2026-11-09-code-editor.md`, `FEATURE-BREAKDOWN-2026-11-09.md`, research r8 and r11 in `2026-11-04-editor-level/`, `WORKING_AGREEMENT.md`, the 2026-11-09 entries on `BLACKBOARD.md`, the kit's `AGENTS.md`, `grammar/BOOTSTRAP.md` and `templates/SPRINT_CARD.md`.*

*Code: substrate-ui at `9266de0`, kernel at `0301beca`, read at the lines cited. Measurements were taken on this machine on 2026-11-09.*

---

## Result

The roadmap should not go on to requirements. Twelve of the 36 findings below stop that step: 1–4, 10, 11, 15, 17, 19, 20, 27 and 28.

The largest is the diff. The design says "vs main". The roadmap says "vs the worktree base", limits the feature to session worktrees, and names an endpoint that returns something else. None of the 103 sessions on this machine has a worktree, and the app has no way to create one for a person's session, so the changes section, the status summary and the modified dots would draw nothing.

Two facts the roadmap builds on are false: the React migration closed on 2026-11-05, and the vim package it names does not exist. As designed, esc in vim insert mode during a turn would hard-interrupt the turn. The page's Content-Security-Policy blocks the `<style>` element CodeMirror writes. The ACTIVITY and HISTORY derivation misses every edit made by `claude`, `codex` and `cursor-agent`, the drivers of 36 of the 103 sessions. And the roadmap's next step leaves out the research document that r8 requires before any card.

These parts hold:

- The roadmap has the sections D89 asks of one: why, what, out of scope, order, risks.
- The design items the BLACKBOARD says the earlier plan left out are all present: outline, status line, the open and activity tabs, column settings, HISTORY's step back.
- The out-of-scope list agrees with D53 and with the spec's editor scope. Both quotations from D53 are exact.
- The file API returns what INFO needs: size, modified time, encoding, line endings (`server.py:1978`).
- `FileWritten` carries `old_text` and `new_text` (`substrate/topologies/session/__init__.py:241`).
- `InputBar` takes `paneId`, and `MetaView` takes each lens's width from its column, as line 51 says.

---

## The changes section and the diff

### 1. The roadmap overrides the design's diff base

Lines 22, 45, 78, 90 and 102 say the change summary and the hunks compare against "the worktree base". The design says "vs main" in the spec's Code mode ("each hunk vs main", "+2 −1 vs main") and draws it in frames 24a, 24b, 24i, 24j and 24k. The plan in this folder says "vs main" in items 4 and 5. The BLACKBOARD entry of 2026-11-09 lists the same kind of change, git HEAD "by practice", as "Design overridden".

Correction: "vs main", everywhere. Of the 19 workspaces on this machine that are in git, 13 have a `main` branch and all 13 have it checked out; 6 have neither `main` nor `master`. The requirement needs a rule for a repository with no `main`: its default branch, or for a repository the kernel made, its first commit. Compare from `git merge-base main HEAD` so that commits landing on `main` after the session began do not show as the session's changes. `git diff A...B` is defined that way in git's own documentation.

### 2. The feature is scoped to sessions that do not exist

Lines 45, 78 and 102 limit the changes section to "git workspaces (session worktrees)". The 103 session manifests on this machine are 101 `flat` and 2 `sandbox`. `~/.substrate/sessions/wt` is empty. `POST /api/session` reads no `branch` field and never passes one to `registry.create` (`server.py:3074`, `:3198`), and only `branch` makes a worktree (`session_registry.py:490`). U154 recorded this on 2026-10-12, and r11 repeats it: "no session gets a worktree today".

Delivered as written, the changes section is absent for every session a person opens, and so are the status line's summary and the modified dots on lines 21 and 27. The design test on line 9 and D91, "see the action take place in the UI", fails on the feature that most shows it.

Correction: the source covers every workspace in git, not only worktrees.

### 3. "Flat and sandbox workspaces have no base" is false for current sessions

Line 78 states it, and line 102 builds a risk on it. Since K315 (2026-10-13), `registry.create` calls `ensure_repository`, which makes any workspace outside a repository into one, with a first commit (`session_registry.py:489`, `workspace.py:69`). A sandbox is therefore a git repository too, unless git is not installed.

On this machine, every session created after K315 is in git. The 81 workspaces that are not in git all date from 2026-10-13 or earlier. The roadmap copies r11's open item without checking it, the failure the BLACKBOARD names "Errors copied forward".

Correction: the column is absent in two cases only, a workspace from before K315 and a machine with no git. Each shows its reason. The kernel's first commit is the base where the kernel made the repository.

### 4. `/api/worktree_diff` does not do what line 78 says

Line 78 says the endpoint "returns the diff against the session's branch base". `workspace.worktree_diff` runs `git diff` with a scratch index (`workspace.py:113–130`), which compares the working tree with the index. A commit made by the session empties it. There is no branch base in the call.

The server refuses any path outside `~/.substrate/sessions/wt` (`server.py:2419–2429`). The kernel function raises when the folder holds no `.git`, which is the case for a workspace that is a subfolder of a repository (2 of the 19 here). The endpoint also takes a path, not a session, and returns the whole diff, not one file's.

Correction: the roadmap names a new per-session read, held to the workspace through `_session_workspace_root` like the file API, with the base from finding 1. The scratch-index method for new files carries over.

### 5. Each hunk's author has no method

Line 78 says each hunk is attributed "to its latest editor". r11 gives one sentence: "the latest edit, session or view, whose new text covers it". The BLACKBOARD lists "changes vs main with each hunk's author" among the items no research covers.

The method fails in three cases the record will contain. A `bash` command such as `sed -i` changes a file and states no new text. An edit from outside the app, such as a person's own editor or `git checkout`, has no record entry at all. And a later edit may cover only part of a hunk. The design offers two authors, "by the session" and "by hand", and neither fits the outside edit.

Correction: the code editor's research defines the matching rule and the label for a hunk with no recorded author. D6's rule applies: nothing drawn may be invented.

---

## Departures from the design

### 6. Widths are remembered per mode, and restored with the collection

Line 29 says "per session". The spec's column configurations say "widths remembered per mode and restored with the collection"; the rationale and D82 say per mode. r11 gives the saving of widths, dock side and rails to the collection, which the feature breakdown makes project 9.

Correction: per mode. The roadmap states what persists before project 9 and where it is kept. A code-only project has one mode, so the key must already carry the mode for the next project to use.

### 7. ⌥⌘F is replace, not regex

Line 23 reads "⌘F plain, ⌥⌘F regex". The keyboard map reads "⌘F find · ⌥⌘F replace". Regex is the `.*` toggle in the FIND / REPLACE section (D85, frame 24a).

Correction: as the keyboard map.

### 8. Items the design has and the roadmap leaves out

- One key each for the left column, right column and bottom panel (spec, column configurations). The keyboard map and the sheet assign none, so the roadmap must assign them.
- The bottom panel collapses to a sill that keeps its input, and typing reopens the history (D49d, D51). Line 29 gives every column a rail.
- Drag and right-click › Add to message, the full path on hover, and ⌫ removing the last chip (D94, frame 24k). Line 30 has ⌥-click only.
- `grep` in the code view's tool parity list (spec's governing principle, D92). Line 31 has four of the five tools.
- `bash` paths in ACTIVITY (spec's common spine) and `grep` rows (frames 24a, 24j, 24k). Line 74 names three tools.
- The open-file tab row above the editor (frames 24a, 24b, 24j, 24k).
- The editor scrolling to the file being edited (spec, "opens and scrolls"; line 27 says opens).
- The outline's line number (spec's Code mode).
- INFO's "modified by" and "type" (D85, frame 24a). Modified-by comes from the record, so line 74's "INFO reads the workspace file API" is short one source.
- Workspace search's regex toggle and its keys, ⌘⇧↵ for replace all and ↵ for next (frame 24j).
- A way to choose vim or nano. The status line draws the current one as a chip, and D67 puts bindings in settings.

### 9. ⌘↵ "opens beside" contradicts "no splitting"

The spec's common spine and frame 24i give quick open "⌘↵ opens beside". The spec's views section gives the editor "no splitting in this view". The roadmap lists neither the key nor the conflict.

Line 43's citation for the rule is also wrong. D49(c) and the rationale apply no-splitting to the terminal in the editor view; the rule about the editor centre is the spec's sentence.

Correction: record the decision. "No splitting" is the later and broader sentence, so "open beside" opens a new tab and leaves the current one in view.

---

## False statements about the built app

The `user` entry of 2026-11-09 sets the rule: "a plan line that misdescribes the built app is an error in the plan."

### 10. The React migration is closed

Line 51 makes its close a precondition. Line 100 calls it "still open" and "actively sprinting". Sprint 345, the migration's G1, closed on 2026-11-05 with 60 of 60 gates on a fresh bundle. The BLACKBOARD's check of 2026-11-08 records 77 of 77 gates, `support.js` and `reveal_component.ts` in `_deprecated/dc-runtime/`, and no `@ts-nocheck`. Sprints 346–349 and 387–388 have already built on it. The `process/planning/README.md` row, "open: sprinting", is stale too, and is the likely origin.

Correction: delete the precondition and the risk. The real precondition is finding 27.

### 11. `@codemirror/vim` does not exist

Lines 72 and 104 name it. `npm view @codemirror/vim` returns E404. The package is `@replit/codemirror-vim`, 6.4.0, MIT, as r8 says. It takes `@codemirror/search` and `@codemirror/language` as peer dependencies, and its README requires `drawSelection` when `basicSetup` is not used. Line 104's account of which vim features are complete describes a package nobody has read, and carries no citation.

Correction: name the package, list its peers, and base the risk on its source.

### 12. Two locations in the already-built table are wrong

Line 59 puts the open-view field in `web/app/state/`. It is in `web/app/derive/open_view.ts`, held in App's state. Line 61 puts the file API in "`server.py`, `web/vm/`". No file under `web/` calls it; its callers are `tests/test_workspace_*` and one gate. The rows that remain are right: sprint numbers, FileWritten at K340, Attachment at K344, the three package versions.

### 13. The widget registry returns with no answer to the BLACKBOARD

Lines 60 and 70 present it as the foundation for keeping the editor alive. The first `user` entry of 2026-11-09 says it "is unused and its reason, dc-runtime's re-attach, is gone". The plan in this folder dropped it from its built list. `useWidget` has no caller outside `widgets.spec.ts`, which runs under jsdom.

The registry's own header gives a reason that outlasts dc-runtime: React unmounts the host when the view changes, and the history and cursor must survive. So the registry may be right, but the roadmap needs to say so against the entry that says otherwise, and it needs r8's "two designs" answer. Keyed per file, the registry holds one live `EditorView` per open file. CodeMirror's other route is one view and one saved `EditorState` per file, swapped with `setState`; the state holds the undo history when `historyField` is serialized or the object is kept.

Correction: choose between them in the research, and record the choice as an `agent-resolved` entry.

### 14. Attachments are listed as built, with their recorded fault left out

Line 63 lists K344 and sprint 388. The BLACKBOARD says "a folder carries no text and a file goes in whole up to 2 MiB, against the precedent D94 names (Claude Code's @-folder gives the listing; an @-file goes in within 25,000 tokens, never over 256 KB)". The code confirms both: `_resolve_attachments` records a folder with empty text and reads a file up to `WORKSPACE_READ_MAX`. Phase 5 builds chips on it.

Correction: the roadmap carries the fix as work in Phase 5, or states the decision to keep it with grounds.

---

## Mechanisms that fail as written

### 15. Esc has three owners

Line 19 says esc returns to the pane. Line 22 says vim bindings work, and in vim esc leaves insert mode. `keymap.ts:72–77` closes find, dialogs, cards and pages, and otherwise hard-interrupts a running turn. Under that rule, a person leaving insert mode while the session works would cancel the session's tool.

Correction: state the order. While CodeMirror has focus and vim is in insert or visual mode, esc belongs to vim. Then come find and quick open. Then the editor view closes to the pane, in the place `ctx.surface` holds today, so the interrupt branch is not reached from the editor. ⇧Esc keeps the soft interrupt, ahead of the view closing, and ⌃C in the input bar keeps the hard one. This comes from D73's rule that the close cascade runs before the interrupt tiers. The gate covers esc during a running turn.

### 16. The keys collide, and the menu line cannot be met as written

`keymap.ts:67` reads `ev.metaKey && key === "f"`, so ⌘⇧F opens the find bar today. `KeyContext` still has `surface` and `revealed` and no open view, so r11's rule, "the key handler passes keys to the open view first", is not built, although the view field it depended on is.

Line 19 says the View and Go menus list the key. `electron/menu.ts` has no Go menu. Its header sets "one owner per key" and explains that macOS Electron cannot show a key without registering it, which is why Meta, Assays and Settings carry none. MENU-BAR's rule 2 and D63 say the key shown in a menu is the canonical one. A key on the menu fires in every view, and r11 says each view binds its own keys while open.

Correction: a table of the keys the project adds (⌘⇧E, ⌘P, ⌘⇧F, ⌘F, ⌥⌘F, ⌘Z, ⌘⇧Z, ⌃⇧\`, and the column keys), each with its owner, menu or renderer, and what it does outside the editor. The Go menu is named as work.

### 17. The page's Content-Security-Policy blocks CodeMirror's styles

`web/reveal.html:13` sets `style-src 'self'`, with no `'unsafe-inline'` and no nonce. CodeMirror 6 writes its styles through `style-mod`, which in a document creates a `<style>` element and adds a nonce only when given one (`node_modules/style-mod/src/style-mod.js:94–101`). The browser refuses such an element under this policy, so CodeMirror's layout CSS would not apply in the packaged window. The only test of the registry runs under jsdom, which has no CSP. No roadmap line mentions this.

The two routes are `EditorView.cspNonce` with a nonce in the page's policy, or an editor mounted in a shadow root, where `style-mod` uses `adoptedStyleSheets`.

Correction: the research chooses one, and the first editor sprint's gate proves it on the packaged window with a screenshot.

### 18. The outline has no parser, and find has no package

Line 76 says CodeMirror "parses the open file into a Lezer syntax tree". It parses only with a language package. `package.json` has three CodeMirror packages. `node_modules` holds `@codemirror/language` and `@lezer/lr` as dependencies of those, and no `@codemirror/lang-*` grammar. Line 64 lists no language, and the roadmap names none. Each grammar names its nodes differently, so "function, class, and method nodes" is one mapping per language.

`@codemirror/search`, which r8 names for find in file, is also missing from lines 64 and 72, and vim needs it too.

Correction: list the languages and their packages. Each is a dependency decision (finding 30). State what the outline shows for a file with no grammar.

### 19. The ACTIVITY and HISTORY derivation misses harness drivers and `bash`

Line 74 derives both from "each `ToolCall` whose arguments name a file path". The drivers `claude`, `codex` and `cursor-agent` ran 36 of the 103 sessions here. Their own tools are recorded as `HarnessToolCall`, not `ToolCall` (`session/__init__.py:257`). Their arguments are the driver's own: Claude's are passed through as they arrive (`harness_streams.py:126–129`), and Codex's file edits arrive as `file_change` with a `changes` list and no `path` (`:166`). The BLACKBOARD names "edits made by harness drivers such as Claude Code" as uncovered by research. Line 90's follow behaviour has the same hole: "when `edit_file` fires" is false for those drivers.

Three more faults sit in the same paragraph:

- "HISTORY is the same derivation" would put `read_file` rows in a list the design calls "every edit".
- `bash` is left out, where r11 has a rule: list it only where the command names the path, and label it a text match.
- `FileWritten` has no name in `EnvelopeKind`. `gen_kinds.py` builds that list from the session topology's registered kinds, and `FileWritten` has no producer. The working agreement says "Never hand-copy a kernel name", so the generator must learn this kind first.

Correction: one table per driver of tool name, path argument and edit content, read from each parser and from recorded sessions. The gate runs on a harness driver as well as on a native model.

### 20. Hand edits and session edits are two event kinds, and the research requires one

r11's widened question 3 passes when "the view and the tool call one function and write one event kind". Line 74 reads `ToolCall` for the session and `FileWritten` for the person. The design's "one list of hands" (D54 generalised) wants one list, and K340 built a separate event.

Line 74 can stand only if the research replaces that pass rule with a stated one: one function that derives one HISTORY row from either event. As written, a document the roadmap calls its source fails its own test on the roadmap's central record.

Correction: settle it in the research question and record the decision.

### 21. ⌘Z has three candidates

Line 24 makes ⌘Z and ⌘⇧Z HISTORY's step-back, which r11 defines as writing the earlier text as a new edit. Line 70 keeps CodeMirror's own undo history in the `EditorView`. `{ role: "editMenu" }` (`menu.ts:95`) binds both keys to the native undo. Vim has `u`.

These differ in kind. CodeMirror's undo changes the buffer and writes nothing. HISTORY's step-back writes a file and a record entry. The roadmap also doesn't say whether a session's edit enters CodeMirror's history. The `addToHistory` annotation controls that, and if it does, ⌘Z undoes the session's work without a row.

Correction: one rule. Recommended: ⌘Z while the buffer has unsaved changes is CodeMirror's undo; once the buffer matches the file it steps HISTORY back. Session edits are dispatched with `addToHistory: false`. The gate covers a person's undo after a session edit.

### 22. Following the session has no technical decision, and unsaved work has no rule

Lines 27 and 90 say "the change shows as it is written", and the technical decisions never mention it. r11 has the mechanism: `edit_file` and `write_file` have no ToolProgress, so the editor marks the change at ToolCall and confirms at ToolResult. The ToolResult may report failure, so the view needs to withdraw the mark.

Nothing says what happens when the session edits a file the person has open with unsaved changes. The write API returns 409 on a stale `base_sha256` (`server.py:3693`), so the app refuses the save, and the person sees nothing unless the roadmap designs it. D93 says "the person's own focus wins", which settles the view and leaves open the content.

Correction: a technical decision covering mark, confirm, failure, and the unsaved conflict. A failure row and a planted fault go with each (finding 29).

### 23. Four states have no behaviour

- ⌘⇧E on a pane with no session. Line 19 opens "the focused session's workspace". Meta stays shut in that state today.
- A session that has ended. `append_event` raises `RecordNotAtRestError` and the write API returns 409, so saving fails.
- A run's view-only pane (`viewOnly`, U182).
- A file that is binary or over 2 MiB. The read returns `text: null`, and in `too_large` no encoding.

Correction: each gets a line in the roadmap, a tag and a failure row.

### 24. Quick open and workspace search have no data source

Quick open needs every file name in the workspace. `_workspace_list` reads one folder. The only full walk is the watch stream's snapshot, which sends a count and then changes, not names. Workspace search has no endpoint at all. r8's answer is "a backend `rg` call", but `rg` is neither called by `server.py` nor packaged by `electron-builder.config.js` or `fetch-python-runtime.sh`, and line 26 doesn't mention it.

r11's sentence, "Replace-all writes files, so it is an edit and goes on the record", is also dropped. Each file replaced would be one `FileWritten`, written through the 2 MiB path.

Correction: a technical decision for each. The session's own `grep` and `glob` tools are candidates, and D92's "one function" points at them.

### 25. The tool parity check is unspecified and comes too early

Line 90 runs the D92 check in Phase 3, before Phases 4 and 5 create search, replace and chips. A check run then can't cover them. r11's rule also requires each "by hand only" to name its kernel card or its reason. Line 31 gives the conclusion, not the table. Read from `tool_loop/tools.py:729–765`, the table is:

| Action by hand | Session tool | State |
|---|---|---|
| Open, read a file | `read_file` | has a tool |
| File tree | `list_dir` | has a tool |
| Quick open | `glob` | has a tool |
| Find in a file, workspace search | `grep` | has a tool |
| Edit, replace in a file | `edit_file` (with `replace_all`) | has a tool |
| Save a file | `write_file` | has a tool |
| Workspace replace all | `edit_file` per file, or `bash` | one call per file; the two rows must agree in HISTORY |
| HISTORY step back | `write_file` with the earlier text | the session needs that text; `inspect_record` is the path to it |
| Add to message | none | by hand only; the prompt is the person's |
| Columns, dock, swap, focus, widths, ⌃⇧\` | none | by hand only; window layout, no work on the record |
| Vim or nano bindings | none | by hand only; a setting |

Correction: the table goes in requirements with these reasons, and the check runs at the project's close and in each phase for what that phase adds.

### 26. The phases reorder r11, and line 84 says they group it

r11's order is: shell; tree and open tab; editor; spine; follow; changes; find, search and quick open; lenses; chips. Phase 1 puts the spine before the editor. With the centre empty no file is open, and ACTIVITY, HISTORY and INFO all describe "this file", so Phase 1 has nothing for them to show and no gate to prove them. Phase 4 moves the open tab away from the tree. r11's step 6 waits on the diff base, and the roadmap drops the wait.

Correction: the spine after the editor, as r11 has it, or a stated reason. Phase 1's modified dots wait for the source in finding 2.

---

## SDD discipline

### 27. The research that comes before any card is missing from the sequence

r8: "One research document per view … Sprint cards come only from a done document." It sets thirteen questions, and r11 adds two and widens two. The BLACKBOARD of 2026-11-09 records "The code editor's own research was never written" as a fault, and its last line names the work: state "that the code editor's research document comes before any card".

Line 110 goes from roadmap to requirements to breakdown to cards. The source line cites r11 and not r8, though r11 says r8's "terminal, libraries, record rules, thirteen questions and principles" stand and the BLACKBOARD records that r11 "is not complete alone". The three topics the BLACKBOARD says no research covers (hunk authors, the status line, harness drivers) appear nowhere as open work.

Correction: name the document, `RESEARCH-<date>-code-editor.md` per r8, in the sequence. Cite r8. For each of the twelve items, name the research that covers it or state that none does. Findings 1–5, 13, 17–24 are its first inputs.

### 28. No vocabulary work appears in the roadmap

Line 33 closes each item "when its tags fire", and no line says which tags, or that any must be added. v0.27 has five tags for the workspace file API (`FILES_LISTED`, `FILE_READ`, `FILE_WRITTEN`, `FILES_WATCH_OPENED`, `FILES_WATCH_CLOSED`) and `VIEW_CHANGED`. It has none for a file opened, a column folded, a follow or a mark, a hunk drawn, a chip added, search, quick open or a key refused.

Hard rule 2 and the card template require a typed proposal and a version bump before any card lists a tag. r8's question 11 requires one tag per record event the view shows. BOOTSTRAP step 9 pairs each behaviour tag with a view tag or a structural field, or records the gap. BOOTSTRAP step 3 and technique 10 give a view payload of `frame`, `visible`, `scene_id` and `layer` "or domain equivalents". The app has no `view` category and no stated equivalent for a DOM app. That has been open since r8.

Correction: the roadmap names the vocabulary as work before Phase 1. A session over this project's entities (open file, column, hunk, chip, search) ends in a version bump and a dual-contract table. The E1 rule in the existing file tags applies: no path or text in the trace.

### 29. The close condition is weaker than the working agreement

The plan says "failure rows included". Line 33 drops those words. The trace rule requires failure rows "under their named fixtures or planted faults", and both observation tracks: structural gates and read screenshots. The roadmap has no list of failures. These are known already: 409 on stale save, 409 on ended session, 503 on a busy record, a tool failing after the mark, a watch stream cut at the cap, a file over the cap, a CSP refusal.

Line 94's single "final gate run" also differs from technique 16, an integration sprint at the end of each wave, and from the rule that each sprint closes on the packaged trace.

Correction: restore the words, name the failures per phase, name both tracks, and end each phase with an integration sprint.

### 30. New dependencies have no record and no bridge mapping

Line 72 says vim is "added with the editor sprint". AGENTS.md requires an `agent-resolved` decision and an update to the working agreement's permitted list in the same turn. r8's question 8 requires each library's version, licence, built size and API from the installed source, written into the bridge mappings. The card template's `bridge` kind requires that mapping before authoring. The working agreement has no CodeMirror mapping. At least five packages are involved: the vim package, `@codemirror/search`, `@codemirror/language` as a direct dependency, and one or more grammars.

### 31. The document's standing

- Line 110 calls the roadmap "the first document in the D89 sequence", and the plan in this folder came first. Line 3 does not cite it, line 110 gives it no path, and neither document says which replaces the other. The working agreement requires a new round to name what it supersedes.
- D89 draws requirements "from the roadmap and a read of the existing system". Line 110 draws them from "the 12 items from the plan document".
- "What is already built" lists the built app. The `user` entry of 2026-11-09 says "A plan lists only work to be done".
- Line 11 sells the project as "infrastructure that every subsequent mode inherits". The same entry cut the earlier plan for groundwork ahead of later modes. Every item delivered is the code editor's own, so the sentence can go.
- The body cites D49c, D89, D90 and D91, and the source line does not. D1 and D2 (the UI owns no state), D54, D67 and D73 bear on it and are cited nowhere.
- No BLACKBOARD entry records this roadmap or the feature breakdown, and the last entry still names a new plan round as the next work.

---

## Code organization and scale

### 32. The roadmap names no homes, and r8's import check conflicts with its layout

Hard rule 7 and the registry's own line say "a new module gets its row before it lands". The roadmap names no module for the view, its store, the spine's derivations or the editor's key table. The registry already has places for them: `web/app/*.tsx`, `web/app/state/`, `web/app/derive/`, `web/app/keymap.ts`. `App.tsx` is 1,177 lines and holds keys, panes and views; the editor's state has to stay out of it.

r8's import check says "no view module imports from the transcript, the lenses or `PaneRegistry`", and its gate runs that check. The editor's bottom panel is the transcript, and its right column is the lenses. r8 itself says the editor reuses both.

Correction: the view takes them as children from the composing component, or the check is rewritten to say what it means. `Transcript` needs a third `view` value, and `useScrollAnchor` keys on it.

### 33. The watch stream costs more than the roadmap assumes

Modified dots and the follow marks read the watch stream, or the roadmap doesn't say what they read. `_workspace_snapshot` stats every file except `.git` every 0.5 s, up to 20,000 files (`server.py:2091–2092`). A plain `os.walk` and `lstat` of this repository, 19,361 files, took 81–203 ms, the low end warm. That is 16–40% of one thread per open watch on the same `ThreadingHTTPServer` that serves the session, before the path building the real function does. The kernel repository reaches the cap, so files past 20,000 change with no event. The walk includes `node_modules`, and the file tree and quick open have no ignore rule.

Correction: the research takes a position on `.gitignore`, on the cap, and on one watch per workspace. r8's `watchfiles` line and VS Code's own exclusions are the precedents already cited in this project.

### 34. Whole-file text travels on the record and into the window

`FileWritten` holds the file before and after. A save of a 2 MiB file is 4 MiB of event. The session stream attaches with `resolve_blobs=True` (`server.py:4177`) and sends each envelope to the window, which copies the whole array on each arrival (`session_controller.ts:1414`). Line 74's derivations then read that array, and the stream lens already holds it.

Nothing in the roadmap says whether HISTORY reads text on demand, how often the editor saves, or how a derivation avoids a full scan on each envelope.

Correction: HISTORY's rows come from paths and seqs, with text fetched for the row that is opened. The derivation is incremental by seq. The save policy is stated, as a save per keystroke would multiply the record.

### 35. The risks section lists the wrong risks

Of its three risks, the first is false (finding 10), the second is wrong on the facts (finding 3), and the third describes a package that does not exist (finding 11). The risks the code shows are findings 2, 15, 17, 19, 21, 22 and 33. None appears.

### 36. Terminology

"Worktree base" is not a git term and names nothing in the code. The term for what the design's comparison needs is merge base, and for the design's own words, "vs main". "The session's own branch" (line 45) describes a branch that exists only for build runs.

Line 9 calls meta "the reveal". The Architect named it meta on 2026-10-11, and r11 records that under "Names". Line 29 says "terminal" and line 20 says "transcript and input bar" for the same panel; the design's word is terminal, and r8 says the app's words replace it.

"Hunk", "rail", "inspector", "outline" and "quick open" are correct in their established uses or the design's own.

---

## Trace: every design item against the roadmap

| Design item | Source | Line | State | Finding |
|---|---|---|---|---|
| ⌘⇧E opens; same key or esc returns | D86, spec views | 19 | wrong for esc | 15 |
| Header chip "⌘⇧E pane" | D86, spec views | 19 | right | |
| View and Go menus list the key | D63, frame 24h | 19 | no mechanism | 16 |
| Three columns and bottom panel | spec views, D81 | 20 | right | |
| No splitting in the editor | spec views | 43 | right, wrong citation | 9 |
| Left tabs: files, search, open, activity | spec, D82 | 21 | right | |
| Modified dots | spec, D48 | 21 | no source | 2, 4 |
| Open-file tab row | frame 24a | — | missing | 8 |
| Open, edit, save | spec, D53 | 22 | right | |
| Vim and nano | D53, D49f | 22, 72 | wrong package | 11, 15 |
| Status line, "vs main" | spec Code | 22 | wrong base | 1 |
| Outline, current symbol, line number | spec Code | 23, 76 | no parser; number missing | 8, 18 |
| Changes in this file, vs main, author | spec Code, D81 | 23, 78 | wrong base, no method | 1–5 |
| Find and replace, ⌘F and ⌥⌘F, Aa, .* | spec spine, D85 | 23 | ⌥⌘F wrong | 7 |
| ACTIVITY, ◂ opens the seq | spec spine, D82 | 24, 74 | misses drivers and `bash` | 8, 19 |
| HISTORY, step back | spec spine, D85 | 24, 74 | ⌘Z unresolved | 19, 21 |
| INFO | spec spine, D85 | 24, 74 | two fields missing | 8 |
| Sections collapse, drawn open | D82, D85 | 24 | right | |
| Quick open: fuzzy, dots, recent, ↵ | spec spine, frame 24i | 25 | no source | 24 |
| Quick open ⌘↵ beside | spec spine, frame 24i | — | missing; conflict | 9 |
| Workspace search, replace one or all | spec left column, frame 24j | 26 | no source; record rule lost | 8, 24 |
| Editor follows the session; focus wins | spec, D93 | 27, 90 | no decision; misses drivers | 19, 22 |
| ⌃⇧\` swaps to the five lenses, 400px | spec views, D81 | 28 | right | |
| Each column folds to a labelled rail | D51, spec | 29 | right for side columns | 8 |
| Bottom panel to a sill, input stays | D49d, D51 | — | missing | 8 |
| One key each for three columns | spec configurations | — | missing | 8 |
| Terminal docks bottom or right | spec configurations | 29 | right | |
| Sides swap; focus | spec configurations | 29 | right | |
| Widths per mode, restored with the collection | spec, rationale, D82 | 29 | wrong | 6 |
| Chips: file, folder, line range | D94, frame 24k | 30 | ⌥-click only | 8, 14 |
| Chips: hover path, × and ⌫, recorded | D94 | 30 | "removable" only | 8 |
| Hand action has a tool, or is labelled | spec, D92 | 31, 90 | no table; too early | 25 |
| Prompt present in the view | D90 | 20 | right | |
| Scope: no debugger, source control, plugins | D53 | 44 | right | |

## Trace: the already-built table

| Row | Claim | State |
|---|---|---|
| Open-view field, 346 | in `web/app/state/` | built; it is in `web/app/derive/open_view.ts` |
| Widget registry, 347 | keeps CodeMirror alive | built; no caller; disputed on the BLACKBOARD (finding 13) |
| Workspace file API, 348, 349, 387 | `server.py`, `web/vm/` | built in `server.py`; no client in `web/` |
| `FileWritten`, K340 | hand edits on the record | right; no generated kind name (finding 19) |
| Attachments, K344, 388 | on `UserMessage` | right; folder and size fault recorded (finding 14) |
| CodeMirror core packages | three, with versions | right; not enough for lines 72 and 76 (findings 11, 18) |
