# Roadmap — the code editor, the rest of it (round 15)

*2026-11-11. Supersedes `superseded/ROADMAP-2026-11-09-code-editor-r14.md`. Round 15 changes E21 only. The text in VS Code, Ghostty and Substrate's editor, measured from each app's own pixels, sits 71–74 L* above its ground; Substrate's terminal reply sits 63–65 L* above it (`RESEARCH-2026-11-11-text-contrast.md`). So the reply takes #d7dade (a 73.2 gap), not #e2e5e9 (77.1, above every app measured), and the person's message steps down to #cbcfd4 (69.3). Round 14's header follows unchanged.*

*2026-11-11. Supersedes `superseded/ROADMAP-2026-11-09-code-editor-r13.md`. Round 14 adds the Architect's detour of 2026-11-11 (BLACKBOARD `user`): how the code should look to a person, researched in `RESEARCH-2026-11-11-colour-spacing-wrap.md` and, for colour, `RESEARCH-2026-11-11-colour-spacing-wrap-r2.md`. E16, the palette's notes tuned within its key; E17, the ghost scheme, the key without hue; E20, a red-green colour-blind scheme as an option; E21, the pane's reply brightest (`RESEARCH-2026-11-11-pane-text-emphasis.md`); E22, code in replies in the editor's palette, and E23, a reading measure for the reply's prose (`RESEARCH-2026-11-11-pane-legibility.md`). These eight are one group, how text looks to a person, in the pane and the editor alike, done in this order: E18, E21 and E23 (the pane's spacing, brightness and measure, then the code's spacing), E16, E22, E17, E20, E19; E18, line spacing at 1.54 in the pane and the code; E19, wrapping as a setting. E15 gains its second item, C's outline (found in sprint 475's screenshot). Round 13's header follows unchanged.*

*2026-11-10. Supersedes `superseded/ROADMAP-2026-11-09-code-editor-r12.md`. Round 13 adds E10.0, the Architect's ruling of 2026-11-10: what is on screen is what the model sees; every unsaved buffer is saved when a message is sent, before the model starts (`SAVE-BEFORE-SEND-2026-11-10.md`). It goes first among the E10 items. Round 12's header follows unchanged.*

*2026-11-10. Supersedes `superseded/ROADMAP-2026-11-09-code-editor-r11.md`. Round 12 applies the Architect's ruling of 2026-11-10 on E10: sprint 443's chips were a prototype; add to the message restarts from `ADD-TO-MESSAGE-2026-11-10-r3.md`, in five items E10.1–E10.5. Round 11's header follows unchanged.*

*2026-11-10. Supersedes `superseded/ROADMAP-2026-11-09-code-editor-r10.md`. Round 11 applies the Architect's rulings of 2026-11-10 (BLACKBOARD `user` entries): one search bar, described in `SEARCH-BAR-2026-11-10.md`, which replaces E8's search (quick open and the tree's find stay: nothing is undone); and E14, the editor displays every file's text, binary files included. Round 10's header follows unchanged.*

*2026-11-09. Supersedes `superseded/ROADMAP-2026-11-09-code-editor-r9.md`. Round 10 applies the Architect's last ruling of 2026-11-09 (BLACKBOARD `user` entry): the editor is just an editor, whether the session is on or off, and restarting sessions is not the editor's job. Round 9's E14 (the session restarts) is removed and its kernel work undone. E4: no file is read-only; a save into a session that is off writes the file off the record; a normal editor by default, with vim and nano as options (sprint 427). Built through sprint 426: E1–E4, and E6's sections that need no saving or record column. The editor is done when the running app matches the editor's design with real data, as the signals from every process, the pixel anchor and the screenshots show; the stages are an order of work, not points of completion. After the editor is done, the other editor modes wait for the design team's Claude Design SDD Process (BLACKBOARD `user` entry, 2026-11-09).*

---

## Why

substrate is a cockpit for directing a model: prompt → response → see the action take place in the UI → prompt again (D90, D91). In the code editor the person watches the session's edits land in the file, sees who made each change and when, and can take over by hand (D93, D54). The editor exists so that a person can see, after a prompt, what changed and how, without asking.

## Scope

- **In:** the code mode of the editor view as spec r6 §4, §5 "Code", §5.0, §5.1 and §8 and frames 24a, 24b, 24h, 24i, 24j, 24k and 16c draw it, for every session the app can open: workspaces in git and the 81 of this machine's 103 present session workspaces that are not (measured 2026-11-09 over `~/.substrate/sessions/*/manifest.json`).
- **Later projects:** the other modes (documents, images, video, audio, design, plain shell; frames 24c–24g); the spec's "Not drawn yet" list (compare in every mode, code breadcrumbs, folding, references by name); restoring widths with the collection (spec §5.1 (5); the collection is its own project, and the editor keeps widths in `localStorage` until then).
- **Kept out by D53:** debuggers, source-control UI, containers, language servers, extensions.

## The design this plan answers to

- Spec: `../design/received/handoff 5/docs/DESIGN-SPEC -2026-11-04- r6.md` §0, §4, §5 "Code", §5.0, §5.1, §8.
- Decisions: D6, D7, D40, D49 (c), D53, D54, D63, D81, D82, D85, D86, D90, D91, D92, D93, D94.
- Rationale: `EDITOR-INSPECTOR-PLAN-RATIONALE -2026-11-04-.md` §2–§4.
- Frames, rendered by `npx tsx harness/design/render_frames.ts <id>` into `runs/design/sheet-v11/`: 24a, 24b, 24h, 24i, 24j, 24k, 16c. Where a frame and a decision's text disagree, the decision's text governs (as for the rails' labels, BLACKBOARD 2026-11-09).

## How each item is verified

1. **Real data.** Real folders and files, in git and outside it. For the session's edits, real tool calls on the record: a local Ollama model or a driver running the kernel's tools; for the harness drivers, records copied from this machine's real Claude, Codex and Cursor sessions as fixtures (E5).
2. **Close tests per change**: the specs that import the changed code and the gate for the changed behaviour, from source and on the packaged bundle. The full suites run once, at E13.
3. **The pixel anchor**, grown by rows (the rule below), decoded from screenshots and checked against the record it names and the truth (the disk, `git`, the kernel record).
4. **Screenshots** at 1512 and 504 points beside the frame each item answers to.
5. **The adversarial question** in each card, tested.
6. **Tool parity** (D92) in each card's contract: each hand action the card adds names its session tool, or is marked by hand only with its reason.
7. **The Rubber Duck Pass** from the packaged trace.

**The anchor's room.** Each new set of fields is a further row of 72 cells (216 px) stacked above the last at the view's bottom-left, with its own magic byte and the proc_seq of the EDITOR_DRAWN it paints. At the 504 px window minimum a row fits; six rows are 18 px tall. The decoder reads every row and checks each against its record.

## Keys

| Key | Owner | In the editor | Outside it | In the menus |
|---|---|---|---|---|
| ⌘⇧E | renderer | back to the pane | the editor | View ▸ Editor, no key shown (below) |
| ⌘D, ⌘⇧D | renderer | refused: EDITOR_KEY_REFUSED reason `no_split` (D49 (c)) | split | — |
| ⌘F | renderer | find in the open file (the inspector's FIND / REPLACE) when the focus is in the centre or the inspector; the transcript's find when it is in the terminal | the transcript's find | — |
| ⌥⌘F | renderer | replace in the open file | — | — |
| ⌘⇧F | renderer | the left column's search tab | the transcript's find (today) | — |
| ⌘P | renderer | quick open | — | Go ▸ Quick Open, no key shown |
| ↵ / ⌘↵ in quick open | renderer | open as a tree click does / open with the focus kept on the current tab | — | — |
| ⌘⇧↵ in search | renderer | replace all | — | — |
| ⌃⇧` | renderer | the right column: inspector ⇄ record | — | View ▸ Inspector or Record, no key shown |
| ⌘S | menu (File ▸ Save, new) | save the open file | refused, written | File ▸ Save ⌘S |
| ⌘W | menu (File ▸ Close Pane) | closes the active tab; with no tab open, refused and written | ends the pane's session and closes the pane | File ▸ Close Pane ⌘W; the window routes it |
| ⌘Z, ⌘⇧Z | menu (Edit ▸ Undo, Redo, replaced) | in the buffer: the buffer's undo while it has unsaved changes, then HISTORY's step back; ⌘⇧Z the reverse | the page's undo and redo | Edit ▸ Undo ⌘Z, Redo ⇧⌘Z; the window routes them |
| ⌃O, ⌃K, ⌃U, ⌃W, ⌃X, ⌃G | renderer, nano binding | save, cut line, paste, search, leave the editor, help, at a higher precedence than CodeMirror's macOS keymap (which gives ⌃O to `splitLine` and ⌃K to `deleteToLineEnd`) | — | — |
| `:w`, `u`, ⌃R | vim binding | save; the buffer's undo and redo only | — | — |
| Esc | renderer | with vim and the centre focused: stays in vim; otherwise the close cascade, then back to the pane | the close cascade, then interrupt | — |
| ⌥⌘L, ⌥⌘R, ⌘J, ⌘M, ⌘3, ⌘, | as built | as built | as built | — |

A renderer-owned key is listed in its menu without its key, as Meta and Assays are today: on macOS Electron cannot show a key it does not register, and a registered key competes with the renderer (`electron/menu.ts` lines 15–19; Electron 44 `registerAccelerator` is Linux and Windows only). This departs from D63's "every key is listed in the View and Go menus" for those keys, and is recorded.

## The work, in order

| # | Item | Sources |
|---|---|---|
| E1 | ⌘D and ⌘⇧D are refused in the editor: EDITOR_KEY_REFUSED with a new reason `no_split` (vocabulary proposal). ⌘M, ⌘3 and ⌘, keep their meaning (tested). | D49 (c); spec §4; D86 |
| E2 | **Hunks on the server.** A per-file read of the changes against the base `_workspace_diff` picks: `git diff -U0 <base> -- <path>` with the same scratch index, so a new file reads all-added; each hunk's old and new ranges and its lines. Outside git, base `none` and no hunks. A tag or a DIFF_READ field reports the hunk count (vocabulary proposal). | spec §5 "Code" (`+2 −1 vs main`; each hunk vs main); 24a; review finding 2 |
| E3 | **A file opens in the centre.** A click in the tree opens a file as a tab, or shows its tab. The tab row: the active tab on the ground with its 2 px accent top edge; a dot on a tab with unsaved changes; ⌘W or a × shown on hover closes a tab. No split glyph. CodeMirror 6: line numbers, syntax colours for Python, TypeScript/JavaScript, JSON, HTML, CSS, Markdown and shell, the hunks of E2 drawn inline (`−` red, `+` teal). Outside git, no inline hunks. A binary file or one over the read cap says so in place of the text. | 24a; spec §5; D49 (c), D53; decisions of 2026-11-09 |
| E4 | **Editing and saving.** A normal editor by default: CodeMirror's standard keys, click and type. vim or nano chosen in settings (the Architect, 2026-11-09: "optional"; 24a's `-- NORMAL --` is the vim option drawn). The status line: under vim, the mode (`-- NORMAL --`, `-- INSERT --`, `-- VISUAL --`), then `file · line:col · +N −M vs main`; under nano, no mode field; the binding's name at the right. Saves through `PUT /api/session/<id>/file` as FileWritten; a stale save (409) offers to reload the file or overwrite it. No file is read-only. A save goes on the session's record when the session can take it, and writes the file off the record when the session is off (ended, or no record yet; FILE_WRITTEN `off_record`). File ▸ Save and Edit ▸ Undo and Redo as the key table says. | 24a; spec §5 "Code"; D53; decisions of 2026-11-09 |
| E5 | **The record in the right column**, ⌃⇧` (24b): `RECORD <id> · N events`, the `⌃⇧\` inspector` chip, the five lenses, rows inspected inline, 400 px; the footer adds `seq N selected`. Built before the inspector, whose ◂ opens a seq here. | 24b; spec §4, §5.0; D81 |
| E6 | **The inspector's sections**, drawn open and folding (▾/▸), under `INSPECTOR <file>` with its chip and ▸. OUTLINE (the syntax tree; the current symbol lit, with its line). CHANGES IN THIS FILE (E2's hunks, each with its author: the latest edit whose written range covers it, `by the session · turn N · seq N <tool>`, `by hand`, or `unattributed`; outside git the section says there is no base). FIND / REPLACE (⌘F, ⌥⌘F; Aa, .*; `1 of N`; ↵ all). ACTIVITY (this file in the record: turn, seq, tool and gist; ◂ opens the seq in E5's column). HISTORY (every edit with its author, the current one lit; step back and forward, from the earlier texts below). INFO (path, size and lines, modified and by whom, encoding, line ends, type). `scripts/gen_kinds.py` learns FileWritten first. | 24a; spec §5.0; D54, D81, D82, D85 |
| E7 | **Following the session.** See the follow rules below. Vocabulary: the three follow tags carry the call's seq (and the result's where there is one), and rule S10 gets its checker with planted breaks, as sprint 408 did for S11. | D93; spec §0; review findings 5, 10, 12 |
| E8 | **The left column's tabs**: `files · search · open · activity`. Search is the one search bar of `SEARCH-BAR-2026-11-10.md`: file names, folder names, paths and the text inside files, in one box. The files tab carries no search text. | SEARCH-BAR-2026-11-10; 24j; spec §5.1 |
| E9 | **Quick open ⌘P**: built in sprint 441 (24i); the list is the search's own walk. It stays beside the search bar (the Architect, 2026-11-10: nothing undone). | 24i; sprint 441 |
| E10 | **Add to the message** (`ADD-TO-MESSAGE-2026-11-10-r3.md`; D94, 24k). Sprint 443 built the prototype: chips in the input bar, ⌥-click on the tree, the message's attachments. | ADD-TO-MESSAGE r3; D94 |
| E10.0 | **Save before send**: every unsaved buffer of the session saved when a message is sent, before the turn is posted; FileWritten with view `send`; a stale file refused, offered and warned of while the message goes; EDITOR_SAVED_FOR_SEND, TURN_SUBMITTED.saved. | SAVE-BEFORE-SEND-2026-11-10; the Architect 2026-11-10 |
| E10.1 | **Never refuse**: the reference always goes; any text is text; 64 KB inline a file, 256 KB a message; large, binary, image and missing files by reference with one line saying why; folders as listings. | ADD-TO-MESSAGE r3 |
| E10.2 | **The sent message shows its chips, in order**: the transcript draws attachments with a by-reference mark; the echo matched by identity; a refused message keeps its warning and its chips. | ADD-TO-MESSAGE r3 |
| E10.3 | **Selections**: ⌥A (the left hand alone, ⌥ as for ⌥-click; the Architect, 2026-11-10); lines and in-line ranges; the buffer's text; no selection adds the file. Right-click › Add to message in the code comes with E10.4's right-click menu (the app has none yet). | D94; the Architect 2026-11-10 |
| E10.4 | **Drag and right-click in the editor**: the tree, tabs, search results and the code's selection (one right-click menu for all); the terminal header's hint tooltip (D40). | D94, D40; 24k |
| E10.5 | **Images to the receivers that see them**: an image goes as an image, by its path, and Claude Code's Read opens it (sprint 460). Codex's `-i` and Ollama's images are kernel work and a vocabulary change; set aside by the Architect on 2026-11-11 (the models open the path themselves; BLACKBOARD `deferred` of that date holds what was found). | ADD-TO-MESSAGE r3 |
| E11 | **The footer and the header as 24a draws them**, each field traced to its source first (`live · clean`, `record <id> · N events`, the worktree chip). | 24a; D6, D40 |
| E12 | **Text in narrow areas**: a rule for lines with no break points (paths, the bar line) in narrow columns. | BLACKBOARD 2026-11-09 deferred entry |
| E14 | **Every file opens and shows what it is, at any size** (`RESEARCH-2026-11-11-binary-files-and-highlighting.md`). A text file in any encoding opens as text, by the server's decoding rule, read-only when it is not UTF-8, its encoding named (sprint 462). Every file that is not text, a JPEG, a WAV, a PDF, anything with a NUL byte, opens as its bytes in a form chosen in the status line: hex (the default: offset, sixteen bytes, the text column), binary (each byte's eight 0s and 1s), octal, or text (the bytes as Latin-1). Every file is editable by hand, by default (the Architect, 2026-11-11): the text form edits like any text, every byte one character (Latin-1), saved byte for byte; hex, binary and octal edit by typing over a digit; a text file in another encoding saves in its own encoding. No file is too big to open: the server sends a file in pieces and the editor loads them as the person scrolls, text or bytes. Missed on 2026-11-11: sprint 462 was taken as E14's whole first half, the Architect opened JPEGs and WAVs and saw `binary file` and `over the read limit` still, and the 2 MB limit had been left in place ("you just open a file … they could just scroll down and see the whole file"). Sprint 463 shows every file that is not text as its bytes at any size, read-only at first; sprint 465 makes every file editable as text; sprint 466 compares a file not in UTF-8 with its base in its own encoding (found closing 465: git calls such a file binary, or its diff fails to decode, so it showed no changes); sprint 467 keeps the server's own write files out of the tree, the watch and the search (found closing 466: the tree drew `.substrate-write-…` between a write's record entry and its rename); sprint 468 edits hex, binary and octal by typing over a digit (a file up to the read limit); sprint 469 sends a large text file's lines by range from the server; sprint 470 shows them in the editor, a line past 64 KB opened whole in a line reader that wraps it and reads on as it scrolls. The Architect's answer of 2026-11-11 ("File size limits shouldn't change anything at all"): sprint 471 removes the 2 MB limit, so every file opens in the code editor and saves as a small one does; sprint 472 makes the search's regular expressions safe on long lines; the large-file views of 463, 469 and 470 are retired after it. | BLACKBOARD 2026-11-10 user; the Architect 2026-11-11 |
| E15 | **Syntax highlighting for every common language and format**: the language picked by `LanguageDescription.matchFilename` over `@codemirror/language-data`'s 143 descriptions (Rust, Go, C, C++, Java, YAML, TOML, SQL, Kotlin, Swift, Ruby, Dockerfile among them), loaded on first use, named in the status line and INFO; the editor's own colours. | the Architect 2026-11-11; RESEARCH-2026-11-11-binary-files-and-highlighting |
| E16 | **The palette's notes tuned within its key** (`RESEARCH-2026-11-11-colour-spacing-wrap-r2.md`), built for regular vision. One core design (the Architect, 2026-11-11: "we still design to one core idea"): the key is written once as the relations between the notes (which classes neighbour, each step in hue and in lightness), and every scheme is that design solved for one way of seeing; E16 solves it for regular vision. The coloured classes stay in sprint 475's 260°–340° hue arc at chroma at most 35, the greys tinted to it; the pairs that share a note (keyword/type, string/meta) are moved apart within the arc or by a clear lightness step; keyword, string and number get small lightness steps; no colour moves more than 10 ΔE2000. Checked on decoded pixels: every pair of coloured classes at least 8 ΔE2000 apart, every hue in the arc. | the Architect 2026-11-11 |
| E17 | **The ghost scheme**: the one design solved with lightness alone, its steps in the tinted greys; a setting picks the scheme. | the Architect 2026-11-11 |
| E20 | **A red-green colour-blind scheme, as an option**: the one design solved for protan and deutan perception (Machado 2009 simulation): the colours shifted against that perception curve, mostly along the blue–orange axis those readers keep, so the steps they see match the steps regular vision sees in E16, every coloured pair at least 10 ΔE2000 apart when simulated. Not the default. | the Architect 2026-11-11 |
| E18 | **Line spacing**: the pane's transcript text from 2.0 to 1.54 (20 px on 13 px) and the code's from 1.77 to 1.54, as the print evidence and WCAG's 1.5 for prose suggest; box-drawing rows still touch. | the Architect 2026-11-11 |
| E19 | **Wrapping long lines, as a setting**: off for code, on for Markdown and plain text; ⌥Z switches it for the file shown; a wrapped line takes its first line's indentation. | the Architect 2026-11-11 |
| E21 | **The pane's reply brightest** (`RESEARCH-2026-11-11-pane-text-emphasis.md`, `RESEARCH-2026-11-11-text-contrast.md`): the model's reply takes #d7dade, the editor's text, 73.2 L* above the pane's ground as VS Code's and Ghostty's text sits 71–74 above theirs; the person's message steps down to #cbcfd4, one note in the same key; graded on decoded pixels, the reply's text 70–76 L* above its ground and the message's below the reply's. | the Architect 2026-11-11 |
| E22 | **Code in replies in the editor's palette** (`RESEARCH-2026-11-11-pane-legibility.md`): a fenced block with a language highlighted by the editor's parsers and palette (`@lezer/highlight` `highlightCode`), the palette in one shared home both draw from; the pane keeps wrapping code. After E16. | the Architect 2026-11-11 |
| E23 | **A reading measure for the reply's prose**: paragraphs and lists at most 72 characters (`72ch`); code blocks, tables and tool cards keep the row's width. A proportional font for the pane's prose is not taken: about 5% faster, and monospace is Substrate's look. | the Architect 2026-11-11 |
| E13 | **Close**: the full suites once; the runbook's build and install; every editor frame beside the running app; the closing table of the editor's hand actions against their session tools (save → `write_file`; replace and replace all → `edit_file`; step back → `write_file`; search → `grep`; quick open → `glob`), with where "by hand only" is drawn; the evidence reported in chat. | runbook; D91, D92 |

## Following the session (E7)

| The editor view | A file-editing call lands on a file | What is drawn and written |
|---|---|---|
| open, on that file | the view scrolls to the change; the mark is confirmed at the result and withdrawn on failure | EDITOR_FOLLOW_MARKED → CONFIRMED or WITHDRAWN |
| open, on another file | the view stays; the file is marked (its dot; an ACTIVITY line) | the same tags |
| closed (the pane, meta or a page) | nothing opens: the person's focus wins; the tree's dot comes from the watch stream when the editor opens next | no editor tag (S11: no editor record outside a run); the ToolCall on the record is the trace |

With unsaved changes in the buffer, the buffer is kept and the session's change is marked (EDITOR_FOLLOW_CONFIRMED `conflict` true); the next save is refused as stale and offers reload or overwrite (E4). No compare view: side by side would split the editor (D49 (c)).

The calls the follow reads, to be confirmed against `../substrate/src/substrate/adapters/harness_streams.py` and a real record of each driver at E7's card:

| Driver | Call | Path | Text at the call | At the result |
|---|---|---|---|---|
| kernel | `edit_file` | `path` | `search`, `replace` | the file re-read |
| kernel | `write_file` | `path` | the whole text | the file re-read |
| Claude | its edit and write tools, passed through | the tool's path argument | as the tool carries it | the file re-read |
| Codex | `file_change` | `changes[].path` | none; may arrive only completed (`harness_streams.py` line 173), so mark and confirm come together | the file re-read |
| Cursor | its edit and write calls | the call's path | a `diffString` at completion | the file re-read |

## HISTORY's earlier texts (E6)

| Edit on the record | The earlier text | Step back |
|---|---|---|
| By hand: FileWritten (kernel `session/__init__.py` line 241) | its `old_text` | yes |
| Kernel `edit_file` (`tools.py` line 342) | the result with `replace` swapped back to `search`, when `replace` occurs once and `replace_all` is not set | then yes |
| Kernel `write_file` (`tools.py` line 366), Codex `file_change` | the last whole-file text earlier on the record (a full `read_file` result or an earlier full write), else none | only with an earlier text |
| `opened · start of session` | the file at the session's first whole-file read on the record; else, for a tracked file unchanged since the base, the base commit's text; else none | only with that text |

A row without an earlier text is drawn without step back and says why, in its tooltip (D40). A step back writes the earlier text through the file API as a new FileWritten, by hand.

## Breakdown

Cards, in order. Each is ≤2 product files where it can be; a card that cannot be logs why (hard rule 10). "After" names what must be built first.

| Item | Cards | Files touched | After |
|---|---|---|---|
| E1 | 1: the refusal + its vocabulary proposal | `keymap.ts` + spec; vocabulary | — |
| E2 | 1: the hunk read and its tag | `server.py`; `tests/test_session_hunks_*.py` | — |
| E3 | 4: dependencies and the CSP nonce; the centre with one file; the tab row and ⌘W; the inline hunks | `package.json`, `electron/main.ts`, `electron/preload.ts`, `web/reveal.html`; `editor/Centre.tsx` (new), `widgets.ts`; `editor/Tabs.tsx` (new), `App.tsx`; `editor/hunks.ts` (new) | E2 |
| E4 | 5: vim and nano with the setting; a standard binding as the default (round 9); the status line; save, File ▸ Save, the 409; Edit ▸ Undo and Redo routed | `editor/bindings.ts` (new), `state/settings.ts`; `editor/StatusLine.tsx` (new); `electron/menu.ts`, `App.tsx`; `electron/menu.ts`, `editor/Centre.tsx` | E3 |
| E5 | 1: the record column | `editor/EditorView.tsx`, `MetaView.tsx` | E3 |
| E6 | 7: FileWritten in the generated kinds; OUTLINE; CHANGES; FIND / REPLACE; ACTIVITY; HISTORY; INFO and the section frame | `scripts/gen_kinds.py`; `editor/inspector/*.tsx` (new, one per section); `derive/history.ts` (new) | E2, E3, E5 |
| E7 | 3: the vocabulary proposal and S10's checker; following native and harness calls; the driver fixtures and their gate | vocabulary, `electron/invariants.ts`; `editor/follow.ts` (new); gate | E6 |
| E8 | 4: the tab row; search (server endpoint, then the tab); open and activity | `editor/LeftTabs.tsx` (new); `server.py`; `editor/Search.tsx` (new); `editor/LeftTabs.tsx` | E3 |
| E9 | built in sprint 441 | `editor/QuickOpen.tsx`; `server.py` | E3 |
| E10 | the prototype: built in sprint 443 | `state/input_bar.ts`, `InputBar.tsx`, `session_controller.ts`, `editor/FileTree.tsx` | E3, E8 |
| E10.0 | 1: save before send | `state/input_bar.ts`, `App.tsx`; gate `editor_save_on_send.ts` | E4, E10 |
| E10.1 | 1: never refuse | `server.py`; `tests/` | E10 |
| E10.2 | 1: chips on the sent message, in order | `session_controller.ts`, the transcript row | E10.1 |
| E10.3 | 1: selections | `editor/Centre.tsx`, `state/input_bar.ts` | E10.0, E10.2 |
| E10.4 | 1: drag and right-click in the editor | `editor/*`; the terminal header | E10.2 |
| E10.5 | 1: images to the receivers that see them | `server.py`; gate `image_chip_claude.ts` (sprint 460); the kernel part set aside | E10.1 |
| E11 | 1 | `TopBar.tsx`, `Footer.tsx` | E5 |
| E12 | 1 | the areas it names | — |
| E14 | 1: text in any encoding (sprint 462); 2: every file that is not text as its bytes in four forms, at any size (sprint 463); 3: every file editable by hand, saved byte for byte or in its own encoding (sprint 465); 4: a file not in UTF-8 compared with its base in its own encoding (sprint 466); 5: the server's own write files kept out of the workspace's listings (sprint 467); 6: hex, binary and octal edited by typing over a digit (sprint 468); 7: a text file's lines by range from the server (sprint 469); 8: a text file over 2 MB shown in pieces by line, a long line read whole in a line reader (sprint 470) | `server.py` (the file API); `editor/Centre.tsx`, `editor/StatusLine.tsx` | E3 |
| E15 | 1: every language by its file name (sprint 472), its colours seen (sprint 475); 2: the outline for languages that name a function through its declarator (C, C++) | `editor/Centre.tsx`; `package.json` | E3 |
| E16 | 1: the notes tuned within the key, and the pixel checks | `editor/Centre.tsx` | E15 |
| E17 | 1: the ghost scheme and its setting | `editor/Centre.tsx`; `state/settings.ts` | E16 |
| E18 | 1: the pane's and the code's line height | `editor/Centre.tsx`; the transcript rows | — |
| E19 | 1: wrapping, its key and its default per kind of file | `editor/Centre.tsx`; `keymap.ts`; `state/settings.ts` | — |
| E20 | 1: the red-green scheme and its simulation check | `editor/Centre.tsx` | E17 |
| E21 | 1: the reply and message colours, with E18's pane spacing | `web/reveal/transcript/Row.tsx` | — |
| E22 | 1: code in replies highlighted; the palette's shared home | `web/reveal/transcript/ModelReply.tsx`; `editor/Centre.tsx` | E16 |
| E23 | 1: the prose measure, with E18 and E21 | `web/reveal/transcript/ModelReply.tsx` | — |
| E13 | 1: the close | — | all |

About 35 cards.

## Risks

- **Hunks and HISTORY on old sessions.** 81 of 103 present workspaces are outside git: no base, no hunks, no CHANGES. HISTORY still works from the record there; the editor must say plainly where a base is missing.
- **The harness drivers.** Codex gives no text and may give no start; Cursor's text comes as a diff. The follow and HISTORY rely on re-reading the file; a file changed again before the re-read is drawn as it is then.
- **The vim package and the CSP.** `@replit/codemirror-vim` is not installed; its version and peer dependencies are read at E3's card. The CSP change to a nonce is a security change to the page's policy; it is proven by a screenshot on the packaged window (`style-src 'self' 'nonce-…'`).
- **Edit ▸ Undo and Redo.** Replacing Electron's `editMenu` role's items moves undo for every text box in the window; the routed items must keep the page's own undo outside the editor.
- **The anchor's rows.** Each row is one more thing to decode; a row that does not decode fails its gate.

## Facts the items rest on, checked 2026-11-09

- CodeMirror in `package.json`: `@codemirror/state` 6.7.6, `@codemirror/view` 6.43.15, `@codemirror/commands` 6.11.1. Installed alongside them: `@codemirror/language`, `@codemirror/streamparser`. Not installed: `@codemirror/search`, the `lang-*` grammars, `@codemirror/legacy-modes`, `@replit/codemirror-vim`.
- The kernel's hand-edit record is FileWritten (`../substrate/src/substrate/topologies/session/__init__.py` line 241: path, old_text, new_text, view). `web/vm/envelope_kinds.gen.ts` does not name it yet.
- The kernel's file tools: `read_file`, `edit_file`, `write_file` (`tools.py` lines 55–61).
- No `rg` binary on the app's PATH here; `/usr/bin/git` is. 22 of the 103 present session workspaces are inside a git work tree, 81 are not; the newest outside git was created 2026-10-13. The kernel makes a workspace a repository only when it creates a session (`session_registry.py` line 489).
- The diff endpoint (`GET /api/session/<id>/diff`, sprint 412) returns files and statuses only, no hunks.
