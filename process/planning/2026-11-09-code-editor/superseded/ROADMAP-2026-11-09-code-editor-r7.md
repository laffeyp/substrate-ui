# Roadmap — the code editor, the rest of it (round 7)

*2026-11-09. Supersedes `ROADMAP-2026-11-09-code-editor-r6.md`, whose Phase 1 items are built (sprints 403–416). This round plans the work left in the code editor, each item traced to the design. The editor is done when the running app matches the editor's design with real data, confirmed by the signals from every process, the pixel anchor and the screenshots. The stages below are an order of work, not points of completion. After the editor is done and confirmed, the other editor modes wait for the design team's Claude Design SDD Process (BLACKBOARD `user` entry, 2026-11-09).*

---

## The design this plan answers to

- Spec: `../design/received/handoff 5/docs/DESIGN-SPEC -2026-11-04- r6.md` §0 (the cockpit, tool parity, tools drive the UI), §4 (views), §5 "Code", §5.0 (the common spine), §5.1 (the left column), §8 (keyboard map).
- Decisions: D6, D7, D49 (c), D53, D54, D63, D81, D82, D85, D86, D90, D91, D92, D93, D94.
- Rationale: `EDITOR-INSPECTOR-PLAN-RATIONALE -2026-11-04-.md` §2–§4.
- Frames, rendered by `npx tsx harness/design/render_frames.ts <id>` into `runs/design/sheet-v11/`: **24a** (code: the inspector), **24b** (the record revealed into the right column), **24i** (quick open), **24j** (the search view), **24k** (add to the message), **24h** (the views), **16c** (rails and the sill).

## How each item is verified

As in Phase 1, every item:
1. **Real data.** Real folders and files. For the session's own edits, real tool calls on the record, from a local Ollama model or a driver that runs the kernel's own tools.
2. **Close tests per change.** The specs that import the changed code and the gate for the changed behaviour, run from source and on the packaged bundle (trace rule). The full suites run once at the end.
3. **The pixel anchor.** It grows a field for each area the item draws (a vocabulary proposal each time). The gate decodes it from screenshots and checks it against the `EDITOR_DRAWN` record it names and against the truth: the disk, `git`, or the kernel record.
4. **Screenshots** at 1512 and 504 points, read beside the frame the item answers to.
5. **The adversarial question** in each card, tested.
6. **The Rubber Duck Pass**, narrated from the packaged trace.

## The work, in order

Each item names its sources. Items later in the list read what earlier ones draw: the inspector describes the open file, so a file must open first.

| # | Item | Sources |
|---|---|---|
| E1 | ⌘D and ⌘⇧D do nothing in the editor; the key is written as KEY_ROUTED with action none. ⌘M, ⌘3, ⌘, and ⌘F keep their meaning (tested). Corrects roadmap r6's R11, which listed ⌘D among the keys that keep their meaning. | D49 (c); spec §4 ("no splitting in this view"); D86 |
| E2 | **A file opens in the centre.** A click on a file in the tree opens it as a tab, or shows its tab if open. The tab row above the centre shows the open files: the active tab on the ground with a 2 px accent top edge, a dot on a file changed against main. CodeMirror 6 draws it with line numbers and syntax colours for the first languages (Python, TypeScript/JavaScript, JSON, HTML, CSS, Markdown, shell). Lines changed against main are drawn inline: a removed line with `−` in red, an added one with `+` in teal, as 24a draws them. A binary file or one over the read cap says so in place of the text. | 24a; spec §5 "Code"; D53; BLACKBOARD 2026-11-09 decisions (the CSP nonce route; first grammars; one `EditorView` per file in `web/app/widgets.ts`) |
| E3 | **Editing and saving.** Vim and nano bindings, chosen in settings. The status line: `-- NORMAL -- · file · line:col · +N −M vs main`, with the binding at its right. Save on command: `:w`, ⌃O, ⌘S (File ▸ Save). Each save goes through the file API (`PUT /api/session/<id>/file`) and lands on the record as FileWritten. A stale save is refused (409) and says so. An ended session and a view-only pane open read-only. | 24a status line; spec §5 "Code"; BLACKBOARD 2026-11-09 decisions (save on command; Esc stays in vim; ⌘Z then HISTORY) |
| E4 | **The inspector's sections**, drawn open and each folding (▾/▸), under the header `INSPECTOR <file>` with its `⌃⇧\` record` chip and ▸: OUTLINE (from the syntax tree; the current symbol lit, with its line); CHANGES IN THIS FILE (each hunk vs main with its author: `by the session · turn N · seq N <tool>`, `by hand`, or `unattributed`); FIND / REPLACE (⌘F, ⌥⌘F; Aa, .*; `1 of N`; ↵ all); ACTIVITY (this file in the record: turn, seq, tool and its gist; ◂ opens the seq); HISTORY (every edit with its author, the current one lit; ⌘Z steps back, ⌘⇧Z forward); INFO (path, size and lines, modified and by whom, encoding, line ends, type). | 24a right column; spec §5.0; D54, D81, D82, D85 |
| E5 | **The editor follows the session.** When a file-editing tool call lands, the file opens and scrolls to the change as it is written. When the person is reading another file, the change is marked (a dot, an ACTIVITY line) and the view stays. The mark comes at the call, is confirmed at the result, and is withdrawn on failure. A file with unsaved changes offers: reload, keep and overwrite, or compare. | D93; spec §0 ("tools drive the UI state"); vocabulary EDITOR_FOLLOW_* and rule S10 |
| E6 | **The left column's tabs**: `files · search · open · activity`, with `⌘⇧F search workspace` above the tree. Search (24j): find and replace fields with Aa and .*, `N matches in M files`, results grouped by file (name, dim path, count) with line numbers and previews, the match lit, and `⌘F · ↵ next · ⌘⇧↵ replace all` at the foot. Each replacement goes through the file API as a FileWritten. Open: the open files with their dots. Activity: every file the session touched, newest first. | 24a, 24j; spec §5.1; D53 |
| E7 | **Quick open ⌘P** (24i): a box at the top of the centre (`› query`, `⌘P`); fuzzy file names with the matched letters lit, dots, dim paths; a RECENT section; `↑↓ choose · ↵ open · ⌘↵ open beside · esc`. ↵ replaces the tab, ⌘↵ opens a new one, since the editor does not split. The file list comes from `git ls-files --cached --others --exclude-standard`. The Go menu lists ⌘P. | 24i; spec §5.0; D63; BLACKBOARD 2026-11-09 decisions (⌘↵; the file list) |
| E8 | **⌃⇧\` swaps the inspector for the record** (24b): `RECORD <id> · N events`, the `⌃⇧\` inspector` chip, the five lenses (stream+graph · i/o · structure · language · scene), rows inspected inline; 400 px wide. The footer adds `seq N selected`. | 24b; spec §4; D81 |
| E9 | **Add to the message** (24k): ⌥-click, drag, or right-click › Add to message on a file, folder or line range makes a chip in the input bar (`cart.ts`, `tests/`, `cart.ts 85–89`), with the full path on hover, × to remove and ⌫ for the last. The terminal's header reads `⌥-click or drag to add · right-click › Add to message · ⌫ removes the last chip`. Chips travel with the next message (kernel K344, sprint 388). | 24k; D94 |
| E10 | **The footer and the header as 24a draws them.** Each field (`live · clean`, `record <id> · N events`, the worktree chip) traced to its source before it is drawn (D6). | 24a footer and header; D6, D40 |
| E11 | **Tool parity**: every action the editor lets a person take by hand has a session tool behind it, or is marked by hand only with its reason. | D92; spec §0 table |
| E12 | **Text in narrow areas**: a rule for lines with no break points (paths, the bar line) in narrow columns. | BLACKBOARD 2026-11-09 deferred entry |
| E13 | **Close**: the full suites once; the runbook's build and install; every editor frame beside the running app, with the Architect's confirmation. | runbook; D91 |

## Facts the items rest on, checked 2026-11-09

- CodeMirror in `package.json`: `@codemirror/state` 6.7.6, `@codemirror/view` 6.43.15, `@codemirror/commands` 6.11.1. Installed alongside them: `@codemirror/language`, `@codemirror/streamparser`. Not installed: `@codemirror/search`, the `lang-*` grammars, `@codemirror/legacy-modes`, `@replit/codemirror-vim`. Each is a dependency decision in its card, with its version read from the registry.
- The kernel's hand-edit record is `FileWritten` (`../substrate/src/substrate/topologies/session/__init__.py`, line 241: path, old_text, new_text, view). The window's generated kinds (`web/vm/envelope_kinds.gen.ts`) do not name it yet; `scripts/gen_kinds.py` must, before HISTORY can read hand edits.
- The session's file tools in the kernel: `read_file`, `edit_file`, `write_file` (`../substrate/src/substrate/topologies/tool_loop/tools.py`, lines 55–61). The harness drivers' tool names and argument shapes (claude, codex, cursor-agent) are read from `../substrate/src/substrate/adapters/harness_streams.py` in E4's card. They were not re-read for this round.
- No `rg` binary is on the app's PATH on this machine; `git` is (`/usr/bin/git`). Every workspace is a git repository (the kernel's `ensure_repository`). So workspace search (E6) runs `git grep`, not `rg`.

## Vocabulary

v0.29 already holds tags for most of this work: EDITOR_FILE_OPENED, _SAVED, _CLOSED; EDITOR_FOLLOW_MARKED, _CONFIRMED, _WITHDRAWN (rule S10); EDITOR_HUNK_DRAWN; EDITOR_CHIP_ADDED; EDITOR_SEARCH_QUERIED; EDITOR_QUICK_OPENED; EDITOR_INSPECTOR_SWAPPED; EDITOR_KEY_REFUSED. Each item's card reads those tags against its frame first and proposes what the frame needs: the inspector sections' drawn rows, the anchor's new fields, and E3's binding becoming required again.
