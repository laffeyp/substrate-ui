# Review — code editor roadmap, round 7

*2026-11-09. Reviews `ROADMAP-2026-11-09-code-editor-r7.md` against its sources: design spec r6, the design decisions through 2026-11-04, the editor and inspector rationale, sheet v11 frames 24a, 24b, 24h, 24i, 24j, 24k and 16c (rendered in `runs/design/sheet-v11/`, with the sheet's own markup for tooltips), `PLAN-2026-11-09-code-editor.md`, the BLACKBOARD decision entries of 2026-11-09, vocabulary v0.29, sdd-kit-3, and the code in `substrate-ui` and `../substrate`. The scope it is held to is the BLACKBOARD `user` entry of 2026-11-09: the hard stop comes after the whole code editor, inspector included.*

---

## Result

Round 7 has the scope right. It plans everything in the code editor that Phase 1 (sprints 403–416) did not build, and nothing outside it. Each of the plan's twelve items is either built or has an E-item. Every code-mode frame is cited: 24a, 24b, 24h, 24i, 24j, 24k and 16c. 24c to 24g are the other modes, which wait for the design team. The round also follows the documents rule this time: round 6 is in `superseded/`, and BLACKBOARD names round 7.

As a full roadmap it falls short in three ways. First, it has none of the sections D89 and the rationale's planning sequence give a roadmap (why, out of scope, risks), and it gives no size, though E4 alone covers six inspector sections. Second, it rests on four facts the code contradicts:

- every workspace is a git repository;
- the diff endpoint gives the hunks;
- ⌘F keeps its meaning in the editor;
- the record holds the text HISTORY needs to step back.

Third, it leaves out four things the design or the app forces: closing a tab while ⌘W ends the session, the frame's "split the editor" glyph, follow-the-session while the editor view is closed, and the window side of attachments.

Seventeen findings follow. Findings 2–6 block E2–E5 and should be settled in the roadmap before E2's card is written. E1 (⌘D does nothing in the editor) depends on none of them.

The second review's six blocking findings stand as follows. Esc in vim (2), redo and vim `u` (4), the grammar batch (5) and the HISTORY text route (6) are closed by `agent-resolved` entries of 2026-11-09. Key ownership (3) is closed for the column keys only; finding 4 below covers the keys still open. Follow on the harness drivers (1) is still open: r7 says the drivers "were not re-read for this round".

---

## Findings

### 1. The roadmap has no why, no out-of-scope, no risks and no size

**Evidence.** D89 and the rationale's planning sequence define a roadmap as "a prose document: why, what will be done, what is out of scope, order and risks". Round 6 had a "Why" section; round 7 dropped it. Round 7 has no out-of-scope section; the other modes are named only in its header line. Round 4 dropped the requirements and breakdown steps with a `surfaced` entry ("the design spec is both"), not an `agent-resolved` one. The same day's `user`-reported problem list names "No requirements, no breakdown" as one cause of the first failure. Phase 1's eleven R-items took fourteen cards (403–416). E4 lists six sections, each with its own data source, and E6 lists three tabs. Neither the reader nor the next card knows how many cards remain or which items share files.

**Correction.** Add the missing sections:

- **Why**: D90, D91 and D93, the cockpit loop the editor exists for.
- **Out of scope**, as positive statements:
  - the other modes, waiting on the Claude Design SDD Process;
  - the spec's "Not drawn yet" list (compare in every mode; code breadcrumbs, folding, references);
  - D53's exclusions;
  - a statement whether "widths … restored with the collection" (spec, column configurations, item 5) is in or out, since Phase 1 keeps widths in `localStorage`.
- **Risks**: findings 2, 3, 5 and 6, the vim package and the CSP change.
- **Breakdown**: per E-item, the cards it splits into, the files each touches and what each comes after.

### 2. No item reads the hunks that E2, E3 and E4 draw

**Evidence.**

- `GET /api/session/<id>/diff` (`server.py`, `_workspace_diff`, sprint 412) returns `{base, files: [{path, status}]}`, built from `git diff --name-status`. It carries no hunks, no line numbers and no base text.
- E2 draws removed and added lines inline ("a removed line with `−` in red, an added one with `+` in teal").
- E3's status line needs `+N −M vs main`.
- E4's CHANGES IN THIS FILE needs each hunk's range and counts (`@@ 86–88 … +2 −1` in 24a).

All three need either the file's text at the base commit or `git diff -U0 <base> -- <path>` per file. No item and no endpoint names that read, and DIFF_READ counts files only.

**Correction.** Add a server item ahead of E2: one per-file read of the hunks against the same base `_workspace_diff` picks (main's merge-base, the default branch, the first commit, or none). The read uses the same scratch index, so a new file reads as all-added. It should have its own tag or a DIFF_READ field for the hunk count.

### 3. "Every workspace is a git repository" is false for most sessions on this machine

**Evidence.**

- r7's facts section says so, citing `ensure_repository`. The `agent-resolved` entry choosing `git grep` (2026-11-09) rests on the same ground.
- `ensure_repository` runs only when a session is created through `session_registry.py` line 489, so sessions created before it are not covered.
- Measured today over `~/.substrate/sessions/*/manifest.json`: 106 manifests, 6 workspaces gone. Of the 100 present, 22 are inside a git work tree and 78 are not. The newest non-git workspace was created 2026-10-13.
- In a folder outside git, `git grep` and `git ls-files` exit 128 ("not a git repository"), while `git grep --no-index` finds the match (git 2.50.1, run here).
- E3 itself opens ended sessions read-only, so old sessions are in scope.
- The 2026-11-09 quick-open decision had a fallback for non-git workspaces (`_workspace_snapshot`); r7 drops it without an entry.
- `_workspace_diff` already returns base `none`, and EDITOR_KEY_REFUSED already has the reason `no_git`.

**Correction.** Replace the fact in r7 with the measured count, and give E6 and E7 their non-git paths:

- E6: `git grep --no-index` outside a work tree.
- E7: the watch stream's file list outside a work tree.
- E2–E4: name what the editor draws when the base is `none` (no dots, no hunks, an empty CHANGES section) and the tag that reports it.

Correct the `git grep` entry's ground with a new `agent-resolved` entry.

### 4. Key ownership: ⌘F, ⌘W, ⌘Z and the menus

**Evidence.**

- **⌘F.** E1 says "⌘M, ⌘3, ⌘, and ⌘F keep their meaning (tested)". E4 gives ⌘F to the inspector's FIND / REPLACE, which is what 24a draws (`priceCents 1 of 4`), and the spec's keyboard map reads "⌘F find". Today `windowKey` (`web/app/keymap.ts` line 83) sends ⌘F to `toggle-find` in every view, and the editor view mounts the transcript's `FindBar`. E1 and E4 cannot both hold.
- **⌘W.** `electron/menu.ts` gives ⌘W to File ▸ Close Pane, which "ends the pane's session (like /exit) then removes the pane". No item says how a tab closes. EDITOR_FILE_CLOSED exists, and 24a draws no × on tabs. A person who presses ⌘W to close a file tab, as in every other editor, ends the session.
- **⌘Z / ⌘⇧Z.** The Edit menu is Electron's `editMenu` role, which registers ⌘Z and ⇧⌘Z. Its undo reaches CodeMirror as a `beforeinput` of type `historyUndo` (`@codemirror/commands`, `dist/index.js` line 268) and stops there. The 2026-11-09 decision (⌘Z is buffer undo while the buffer has unsaved changes, then HISTORY step-back) therefore needs the role's Undo and Redo replaced by items the window routes. No item owns that change.
- **The menus.** E7 says "The Go menu lists ⌘P". `menu.ts` has no Go menu: its menus are File, Edit, View, Window and Help. The spec's views section and D63 say every key is listed in the View and Go menus, and the plan's item 1 repeats it. The rule at `menu.ts` lines 15–19 says a renderer-owned key carries no accelerator, so the menu cannot show it. No entry records that departure, for ⌘⇧E or for ⌘P, ⌘⇧F, ⌃⇧`, ⌘F and ⌥⌘F.
- **nano.** CodeMirror's default macOS keymap binds Ctrl-o to `splitLine` and Ctrl-k to `deleteToLineEnd` (`dist/index.js` lines 1704–1706). E3's ⌃O save and nano's ⌃K cut must take precedence over them.

**Correction.** Add a key table to r7. For each key the editor uses (⌘F, ⌥⌘F, ⌘⇧F, ⌘P, ⌘↵, ⌘⇧↵, ⌃⇧`, ⌘S, ⌘W, ⌘Z, ⌘⇧Z, ⌃O, ⌃K, ⌃U, ⌃W, Esc), it should give:

- the owner (menu or renderer);
- what the key does in the editor and outside it;
- how the menus show it.

Correct E1's list to leave out ⌘F. Record the ⌘W rule and the menu departure as decisions.

### 5. Following the session: the editor view closed, and the harness drivers

**Evidence.**

- **The closed view.** E5 covers a person reading another file. It does not say what happens when the editor view is closed (the pane, meta or a page is showing). The spec's governing principle says "the editor opens and scrolls to the file being edited", and "The person's own focus wins". S11 makes any editor tag outside an editor run a rule break: `electron/invariants.ts` breaks on "another editor tag outside a run". So EDITOR_FOLLOW_MARKED cannot be written while the view is closed.
- **The drivers.** `adapters/harness_streams.py` shows three different shapes:
  - Claude passes `tool_use` names and inputs through.
  - Codex's `file_change` carries only `changes: [{path, kind}]`, with no text, and "may arrive only as completed, so a completion with no start writes its call first" (line 173). Its mark and its confirmation arrive together, and the window has nothing to draw "as it is written".
  - Cursor's completion carries a `diffString`.
- The second review measured 36 of 103 sessions on these drivers.
- r7's verification step 1 names an Ollama model or a driver running the kernel's own tools, so no gate covers these drivers.

**Correction.** Give E5 a rule for each of three cases: editor view open on that file, open on another file, closed. Pick between opening the view and marking only, and name the tag that marks a change while the view is closed. Give E5 a table of the file-editing calls it reads: kernel `edit_file`, `write_file`; Claude's edit and write tools; Codex `file_change`; Cursor's edit and write calls. For each, list the path argument, whether text is present at the call, and the action at the result (re-read from disk where no text is present). Name a gate with real driver records.

### 6. HISTORY's step-back has no earlier text for session writes

**Evidence.** E4 says "⌘Z steps back, ⌘⇧Z forward" across every edit with its author. The record holds different amounts of text for each kind of edit:

| Edit | What the record holds | Can it be stepped back? |
|---|---|---|
| Hand edit, `FileWritten` (kernel `session/__init__.py` line 241) | `old_text` and `new_text` | Yes |
| Kernel `write_file` (`tools.py` line 366) | the path and the new text only | No: the earlier text is not on the record |
| Kernel `edit_file` (`tools.py` line 342) | `search` and `replace` | Only when `replace` occurs once in the result; `replace_all` breaks that |
| Codex `file_change` | no text | No |

24a draws HISTORY's last row as `opened · start of session`. That baseline is the file's text when the session began, which is on the record only if the session read the whole file before its first edit.

**Correction.** Name the source of each earlier text in E4, case by case. The options are the `old_text` of `FileWritten`, the reverse of a unique `edit_file`, a whole-file `read_file` result earlier in the record, the base commit, or none. Where there is none, HISTORY draws the row without step-back and says why. Name what `opened · start of session` restores.

### 7. The tab row: the split glyph, the tab dot, closing a tab

**Evidence.**

- 24a, 24b, 24i, 24j, 24k and 16c draw `◫` at the right end of the tab row. The sheet's markup gives it `title="split the editor"`.
- The spec's views section says "no splitting in this view", and D49 (c) says the same.
- r7 does not mention the glyph, so the frame-beside-screenshot check in step 4 of its verification will either flag it on every card or pass over it.
- E2 says the tab carries "a dot on a file changed against main". In 24a, `cart.test.ts` has the tree's dot (titled "modified in this worktree") but its tab has none, and the tab dot has no title in the markup. The frame does not support r7's meaning.
- Closing a tab is finding 4.

**Correction.** Record decisions for each: leave out `◫`, since the spec's text governs the drawing (the same ground as the rails' labels on 2026-11-09); state the tab dot's meaning, either unsaved changes or changed against main; and state how a tab closes.

### 8. Order: E4's ◂ needs E8; tool parity comes last

**Evidence.** E4's ACTIVITY has "◂ opens the seq". The spec's inspector spine says ◂ "opens that seq in the record", which in this view is E8's record column (24b, footer `seq 240 selected`), and E8 comes after E4. E11, tool parity, is a check on what each item adds: the spec's rule is "a view action with no tool behind it is a gap". As the eleventh item it runs after every hand action has been built.

**Correction.** Move E8 ahead of E4, or move ◂ out of E4 into E8. Make tool parity a line in every card's contract, and keep E11 as the closing table of the editor's hand actions against their tools (save → `write_file`, replace all → `edit_file`, step-back → `write_file`, search → `grep`). The table also says where "by hand only" is drawn.

### 9. E9 is larger than r7 says

**Evidence.**

- E9 says "Chips travel with the next message (kernel K344, sprint 388)". Sprint 388 built the kernel and server half. No window source sends `attachments`: outside tests and generated files, no file under `web/` or `electron/` names them. The input bar has no chips today.
- `_resolve_attachments` (`server.py`) reads each chip's text from disk when the message is sent. A `lines` chip taken from a buffer with unsaved changes therefore sends the saved lines, not the ones the person selected.
- A `folder` chip carries no text.
- A `file` chip goes in whole up to 2 MiB. The BLACKBOARD problem list of 2026-11-09 names this against D94's precedent: Claude Code's @-folder gives the listing; an @-file goes in within 25,000 tokens, never over 256 KB.

**Correction.** Split E9 into:

- the input bar's chips and the turn body;
- the editor's ⌥-click, drag and right-click sources;
- a decision on unsaved buffers: save first, send the buffer's text, or refuse with a reason;
- a decision on the folder listing and the file size limit against D94's precedent.

### 10. E5's conflict actions are not in the design

**Evidence.** E5 offers, for a file with unsaved changes, "reload, keep and overwrite, or compare". The design has no conflict prompt. The spec's "Not drawn yet" list holds "Compare in every mode — code side-by-side for a hunk", and side-by-side would split the editor, against D49 (c). D6 says nothing is drawn that the design and source do not hold. No entry records these actions.

**Correction.** Decide the conflict rule with an `agent-resolved` entry and drop "compare". EDITOR_FOLLOW_CONFIRMED's `conflict` field already records the case. "Keep and overwrite" needs stating: keep the buffer, and write it over the session's change on the next save.

### 11. Quick open's ↵ discards the current tab

**Evidence.** E7, following the 2026-11-09 entry: "↵ replaces the tab, ⌘↵ opens a new one". E2: a click in the tree opens a new tab or shows the existing one. One file reached two ways behaves two ways, and r7 does not say what ↵ does to a current tab with unsaved changes. The entry's ground was that "open beside" cannot split. That rules out a split, not opening in a tab as the tree does.

**Correction.** Make ↵ in quick open behave as a tree click (open in a new tab, or show its tab), and let ⌘↵ keep the current tab focused, or state the unsaved-buffer rule. Supersede the entry either way.

### 12. Rule S10 cannot be checked as written, and has no checker

**Evidence.** S10: "EDITOR_FOLLOW_MARKED precedes exactly one EDITOR_FOLLOW_CONFIRMED or EDITOR_FOLLOW_WITHDRAWN for the same pane and seq." The tags' notes say otherwise:

- MARKED's `seq` is "the call's sequence number";
- WITHDRAWN's `seq` is "the result's sequence number";
- CONFIRMED's `seq` is not defined.

A withdrawn follow therefore never matches its mark. `electron/invariants.ts` has code for S11 only (lines 22, 233–239). The sprint 404 entry put S10's checker "in Phase 3", and r7 gives it to no item. Separately, EDITOR_FILE_OPENED's `how` enum (`tree | quick_open | follow | search | deep_link`) has no value for the left column's open and activity tabs, which E6 adds.

**Correction.** Add to E5 a vocabulary proposal that makes all three tags carry the call's seq (or adds `call_seq`), and add the S10 checker with planted breaks, as sprint 408 did for S11. Add the missing `how` values in E6's proposal.

### 13. The pixel anchor has no room rule

**Evidence.** `web/app/derive/anchor.ts` paints 72 cells at 3 px, a strip 216 px wide at the view's bottom-left. The files column is 210 px (`EDITOR_SIZES.left`). With the files folded to a 26 px rail or the sides swapped, the strip lies across the terminal. r7 adds "a field for each area the item draws": tab count, cursor line and column, hunks, outline rows, ACTIVITY and HISTORY rows, the inspector's swap and more. At 16 bits for each count field the strip passes the 504 px window minimum.

**Correction.** State the anchor's layout rule in r7 before E2 adds its first field: more rows of cells, or one strip per area, each naming its own record.

### 14. The status line under nano, and the default binding

**Evidence.** E3 fixes the status line as `-- NORMAL -- · file · line:col · +N −M vs main`. `-- NORMAL --` is a vim mode. E3 says bindings are "chosen in settings", but does not say whether there is a third choice with neither binding, or which binding a new install starts on. The spec's code mode and D53 name vim and nano only. D67's settings frame 19c lists "bindings".

**Correction.** State the status line's first field for each binding, and the default binding, in E3.

### 15. E13 adds a confirmation step the kit does not have

**Evidence.** E13 closes "with the Architect's confirmation". r7's own header defines done as "the running app matches the editor's design with real data, confirmed by the signals from every process, the pixel anchor and the screenshots". The `user` entry of 2026-11-09 says: "only when it looks like the design can you declare it done … according to the signals in all the systems … and also the screenshots". sdd-kit-3 says the Architect "is not a gate: no step in this kit waits for an Architect 'go'".

**Correction.** End E13 with the evidence the header names, reported in chat. The Architect can overrule at any time without a step written into the plan.

### 16. 24k's hint line against D40

**Evidence.** E9 copies 24k's terminal header text: `⌥-click or drag to add · right-click › Add to message · ⌫ removes the last chip`. D40 says "The UI never explains itself in body copy … Behavior hints live in tooltips". Sprint 403 already held a sheet caption off the screen on D40's ground. The footer's `esc or ⌘⇧E back to the pane`, built in sprint 409, is the one hint of this kind on screen.

**Correction.** Decide whether the header hint is drawn or goes into a tooltip, and record the decision. The frame and D40 disagree, and nothing on record settles it.

### 17. Decisions in r7 without entries, and the Phase 1 wording left on the BLACKBOARD

**Evidence.** r7 makes these choices with no `agent-resolved` entry:

- E1 writes KEY_ROUTED with action `none`, where the vocabulary has EDITOR_KEY_REFUSED for "a key binding refused in context", whose `reason` enum has no value for a split;
- E2's tab-dot meaning;
- E5's conflict actions;
- E7 drops the non-git fallback and adds `--exclude-standard` to the quick-open decision's command, which without it would list ignored files;
- E9's drag source.

The ⌘D correction is a `surfaced` entry. The COMPREHENSION_AFFIRMATION at BLACKBOARD line 1641 still reads "the work is the code editor view …, Phase 1 only". That is the misreading the `user` entry at line 1624 corrects, and a session that reads the affirmation inherits it.

**Correction.** Write the entries. Correct line 1641's "Phase 1 only" in place to the whole code editor, as the 2026-11-09 rule on wrong text requires.
