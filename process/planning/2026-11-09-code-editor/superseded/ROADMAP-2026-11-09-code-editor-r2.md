# Roadmap — the code editor (round 2)

*2026-11-09. Supersedes `ROADMAP-2026-11-09-code-editor.md`. Incorporates all 36 findings from `REVIEW-2026-11-09-code-editor-roadmap.md`. Source: `design/received/handoff 5/docs/DESIGN-SPEC -2026-11-04- r6.md` (sections 0, 4, 5 "Code", 5.0, 5.1, 8), `DESIGN-DECISIONS -through 2026-11-04-.md` (D1, D2, D6, D49, D51, D53, D54, D63, D67, D73, D81, D82, D85, D86, D90, D91, D92, D93, D94), `EDITOR-INSPECTOR-PLAN-RATIONALE -2026-11-04-.md`, `MENU-BAR -2026-09-01-.md`, `PLAN-2026-11-09-code-editor.md`, research r8 and r11 in `2026-11-04-editor-level/`, `WORKING_AGREEMENT.md`.*

---

## Why

The editor view is the first mode of the app beyond the terminal and meta. ⌘⇧E opens a code file with a tree on the left, an inspector on the right, and the session's transcript below. The session edits files and the editor shows it happening; a person can also edit by hand. This is the cockpit loop from D91: prompt, watch the file change, prompt again.

---

## What it delivers

When this project closes:

- ⌘⇧E opens the editor on the focused session's workspace. ⌘⇧E or esc returns to the pane. The header chip reads "⌘⇧E pane". The View and Go menus list the key (D63, D86).
- The layout is three columns and a bottom panel: file explorer left, editor centre with an open-file tab row, inspector right, transcript and input bar below (D90).
- The left column has four tabs: files (the tree, with modified dots from the diff vs main), search (workspace find-and-replace, results by file with line previews, regex toggle, ⌘⇧↵ replace all, ↵ next), open (open files), activity (files the session has touched, including `bash` commands that name the path).
- The editor opens, edits, and saves files. Vim bindings via `@replit/codemirror-vim` 6.4.0 and nano bindings via a custom keymap. A setting chooses between them (D67). The status line reads `-- NORMAL -- · file · line:col · +2 −1 vs main`.
- The inspector shows: outline (classes, functions, methods from the Lezer syntax tree, current symbol highlighted, with line number), changes in this file (each hunk vs main, with its author — "by the session · turn 9 · seq 231 edit_file" or "by hand"), find (⌘F) and replace (⌥⌘F), plain or regex (Aa, .*).
- The inspector's last three sections are the common spine: ACTIVITY (this file in the record, including harness drivers and `bash` text matches, with ◂ to open the seq), HISTORY (every edit with its author and step-back via ⌘Z / ⌘⇧Z), INFO (path, size, modified, modified-by from the record, encoding, line endings, type). All sections collapse (▾/▸) and are drawn open by default (D85).
- Quick open ⌘P: fuzzy file names, modified dots, recent files, ↵ opens, ⌘↵ opens in a new tab.
- Workspace search ⌘⇧F: results by file with line previews; replace one, ⌘⇧↵ replace all. Each replacement is a `FileWritten` on the record.
- The editor follows the session: when the session calls `edit_file`, the file opens and scrolls to the change as it is written. When the person is reading another file, the change is marked (a modified dot, an Activity line) and the view stays (D93). The mark is withdrawn on `ToolResult` failure. A file with unsaved changes shows the conflict.
- ⌃⇧` swaps the inspector for the record's five lenses, 400px wide, and back (D81).
- Each side column folds to a labelled rail with ◂ and a vertical label (D51). The bottom panel collapses to a sill that keeps its input; typing reopens the history (D49d). One key each for left, right, and bottom (assigned in the keyboard table below). The terminal docks bottom (default) or right. Sides swap. Focus folds all columns but the prompt. Widths are remembered per mode (D82).
- Add to message from the editor: ⌥-click, drag, or right-click › Add to message on a file, a folder, or a line range; it becomes a chip in the input bar showing the name (full path on hover), removable with × or ⌫, travelling with the next message (D94).
- Every action a person takes by hand has a session tool behind it, or is labelled "by hand only" with its reason (D92). The table is below.
- A pane with no session, an ended session, a view-only pane, and a binary or over-cap file each state their condition.

Each item closes when its tags fire in the packaged app's trace, failure rows included under their named fixtures or planted faults, and both observation tracks (structural gates and read screenshots) hold. Each phase ends with an integration sprint on the packaged app.

---

## What is out of scope

- Other editor modes: documents, images, video, audio, design, and the plain shell. Each gets its own project.
- The input bar on surfaces (records, studio, assays). A separate item.
- Add-to-message from the transcript or from meta's stream. Separate items.
- A shared palette or theme module. After this project.
- Editor splitting (the spec says "no splitting in this view" in the editor's own section).
- Language servers, debuggers, source-control UI, extension marketplaces (D53).

---

## The shell-to-react migration is closed

Sprint 345 (G1) closed 2026-11-05: 60 of 60 Electron gates on a fresh bundle, 139 unit tests, 257 Python tests, vm_smoke 12 of 12, pixels 20 of 28 equal to the pre-move baseline (the other 8 are logged fixes), packaged smoke passing. The window is a typed React app under `web/app/`; dc-runtime is retired; React 18.3.1 is bundled from `node_modules`; the page carries a Content-Security-Policy. Three interfaces shaped for the editor view: `InputBar` takes `paneId` as a prop (D90), each lens takes its width from its container (D81), the store's `open_view` field names the open view (D86). `open_view` is in `web/app/derive/open_view.ts`.

No preconditions block the code editor except the research document (below).

---

## What is already built

| What | Where | Sprint | Note |
|---|---|---|---|
| `open_view` field | `web/app/derive/open_view.ts`, held in `App` state | 346 | |
| Widget registry | `web/app/widgets.ts` | 347 | No caller outside its spec. The BLACKBOARD of 2026-11-09 says "unused and its reason, dc-runtime's re-attach, is gone." The registry's own reason (CodeMirror's `EditorView` must survive a view switch) still holds. The research chooses between the registry and per-file `EditorState` swap; the decision is recorded on the BLACKBOARD. |
| Workspace file API: list, read, write, watch | `server.py:1978–2092` | 348, 349, 387 | No client under `web/` calls it yet. The editor is the first client. |
| `FileWritten` on the record | kernel K340 (`session/__init__.py:241`) | — | No generated kind name in `EnvelopeKind`. `gen_kinds.py` builds from the session topology's registered kinds; `FileWritten` has no producer. The generator must learn this kind before HISTORY can filter by it. |
| Attachments on `UserMessage` | kernel K344 (`server.py:3198`) | 388 | A folder carries empty text; a file goes whole up to 2 MiB. D94 names a precedent (Claude Code: @-folder gives the listing; @-file within 25,000 tokens, never over 256 KB). Phase 5's work corrects the size or records the decision to keep it. |
| CodeMirror 6 core | `@codemirror/commands` 6.11.1, `@codemirror/state` 6.7.6, `@codemirror/view` 6.43.15 in `package.json`; `@codemirror/language` installed as a transitive dep | — | |
| `ensure_repository` | `workspace.py:69` | K315 | Every workspace created after K315 (2026-10-13) is a git repository. The 81 workspaces on this machine without git all predate K315. |

---

## Technical decisions

**CodeMirror 6 is the editor component.** Already a dependency. The research chooses between two persistence routes: the widget registry (one live `EditorView` per open file, preserved across view switches) or one `EditorView` with saved `EditorState` per file, swapped with `setState` (the state holds undo history when `historyField` is serialized or the object is kept). The choice is recorded on the BLACKBOARD as an `agent-resolved` entry.

**Vim bindings via `@replit/codemirror-vim` 6.4.0** (MIT). Requires `@codemirror/search` and `@codemirror/language` as peer dependencies, and `drawSelection` when `basicSetup` is not used. Nano bindings via a custom keymap extension (nano's bindings are a small, fixed set: ⌃O save, ⌃X exit, ⌃K cut line, ⌃U paste, ⌃W search, ⌃G help).

**The CSP must accommodate CodeMirror's styles.** The page sets `style-src 'self'` with no nonce (`reveal.html:13`). CodeMirror's `style-mod` creates a `<style>` element (`node_modules/style-mod/src/style-mod.js:100`), which the browser refuses under this policy. Two routes: `EditorView.cspNonce` with a nonce in the page's policy, or mounting in a shadow root where `style-mod` uses `adoptedStyleSheets`. The research chooses one; the first editor sprint's gate proves it on the packaged window with a screenshot.

**Language packages.** The editor needs `@codemirror/language` as a direct dependency, `@codemirror/search` for find/replace and as a peer of the vim package, and one `@codemirror/lang-*` grammar per language for syntax highlighting and the outline. Each grammar names its tree nodes differently, so the outline's symbol-walker carries a mapping per language. Languages for the first batch: Python, TypeScript, JavaScript, JSON, HTML, CSS, Markdown, shell — the languages the session's tools handle. A file with no grammar gets highlighting off and an empty outline. Each package is a dependency decision recorded in the working agreement's permitted list.

**The diff is vs main.** The design spec says "each hunk vs main" and the status line says "+2 −1 vs main." Every session workspace is a git repository since K315. The base is `git merge-base main HEAD`, so commits landing on main after the session began do not show as the session's changes. For a repository with no `main` branch (6 of 19 on this machine): the default branch. For a repository the kernel made: its first commit. The per-session diff reads through `_session_workspace_root` like the file API; the existing `worktree_diff` (which runs `git diff` against a scratch index, not a branch) is not the right function.

**The inspector reads `ToolCall` and `HarnessToolCall`.** The ACTIVITY and HISTORY derivations cover both. Harness drivers (claude, codex, cursor-agent) ran 36 of 103 sessions on this machine; their tool calls are recorded as `HarnessToolCall` (`session/__init__.py:260`), not `ToolCall`. Claude's arguments pass through as they arrive; Codex's file edits arrive as `file_change`. The derivation needs a table per driver of tool name, path argument, and edit content. The gate runs on a harness driver as well as on a native model.

**ACTIVITY lists `bash` by text match.** A `bash` call's argument is a command string. ACTIVITY lists it only where the command contains the file's path, and labels the row as a text match (r11's rule). `grep` rows are the same.

**HISTORY comes from two event kinds.** Session edits are `ToolCall`/`HarnessToolCall` with `edit_file` or `write_file` arguments. Hand edits are `FileWritten` events (K340). The design's "one list of hands" (D54 generalised) requires one list. One function derives one HISTORY row from either event, attributed to its author. Research question 3's pass rule ("the view and the tool call one function and write one event kind") is replaced by: the derivation produces one unified list from both kinds.

**HISTORY rows are paths and seqs; text is fetched on demand.** `FileWritten` holds the file before and after (up to 2 MiB each side). A save of a large file is 4 MiB of event. The stream to the window sends every envelope. HISTORY lists each edit as a row with path, author, and seq; the old and new text are fetched only when the row is opened. The derivation is incremental by seq, not a full scan on each envelope.

**⌘Z resolves between three candidates.** CodeMirror has its own undo stack. HISTORY has step-back (which writes the earlier text as a new edit). The native edit menu binds ⌘Z. Vim has `u`. Rule: ⌘Z while the buffer has unsaved changes is CodeMirror's undo. Once the buffer matches the saved file, ⌘Z steps HISTORY back. Session edits are dispatched with `addToHistory: false` so they do not enter CodeMirror's undo stack. The gate covers ⌘Z after a session edit.

**Esc resolves in cascade order.** D73 says the close cascade runs before the interrupt tiers. While CodeMirror has focus and vim is in insert or visual mode, esc belongs to vim. Then find and quick open close. Then the editor view closes to the pane (in the place `ctx.surface` holds today), so the interrupt branch is not reached from the editor. ⇧Esc keeps the soft interrupt ahead of the view closing; ⌃C in the input bar keeps the hard interrupt. The gate covers esc during a running turn with vim in insert mode.

**Following the session: mark at ToolCall, confirm at ToolResult.** `edit_file` and `write_file` have no ToolProgress, so the editor marks the change at ToolCall and confirms at ToolResult. On failure, the mark is withdrawn. When the person has the file open with unsaved changes, the conflict is shown (the file's content diverged) — the person's focus wins (D93), and the content conflict is presented as a state, not resolved silently.

**Hunk attribution.** Each hunk in the changes section is attributed to the latest edit whose new text covers it. The matching rule: walk the unified HISTORY list in reverse; the first entry whose written range overlaps the hunk is the author. Three cases the record will contain where this fails: a `bash` command (e.g. `sed -i`) that changes the file with no new-text argument, an edit from outside the app (the person's own editor, `git checkout`) with no record entry, and a later edit that covers only part of a hunk. A hunk with no recorded author is labelled "unattributed" — D6's rule: nothing drawn may be invented. The research defines the matching rule's edge cases and the label's appearance.

**The save policy.** The editor saves on explicit save (⌃S in nano, `:w` in vim, ⌘S from the menu). Each save is one `FileWritten` on the record. No save per keystroke.

---

## Keyboard table

| Key | Owner | In the editor | Outside the editor | Menu |
|---|---|---|---|---|
| ⌘⇧E | window | opens the editor; if already in the editor, returns to pane | opens the editor | View |
| Esc | cascade | vim insert/visual → find/quick-open → editor closes to pane | close cascade → interrupt (D73) | — |
| ⌘P | editor | quick open | — | Go (new) |
| ⌘⇧F | editor | workspace search (left column's search tab) | — | — |
| ⌘F | editor | find in file (inspector) | find in transcript (today) | — |
| ⌥⌘F | editor | replace in file (inspector) | — | — |
| ⌘Z | editor | CodeMirror undo / HISTORY step-back | native undo | Edit (native) |
| ⌘⇧Z | editor | CodeMirror redo / HISTORY step-forward | native redo | Edit (native) |
| ⌃⇧` | editor | swaps inspector ↔ record lenses | — | View |
| ⌘⇧T | — | — | — | reserved for plain shell (separate project) |
| ⌘B | editor | toggle left column | — | View |
| ⌥⌘B | editor | toggle right column | — | View |
| ⌘J | editor | toggle bottom panel | — | View |

The Go menu is new work (D63, MENU-BAR). Each key fires only while its owner's view is open; `keymap.ts` gains a view-aware dispatch using `open_view`.

---

## Tool parity (D92)

| Action by hand | Session tool | State |
|---|---|---|
| Open, read a file | `read_file` | has a tool |
| File tree | `list_dir` | has a tool |
| Quick open | `glob` | has a tool |
| Find in a file, workspace search | `grep` | has a tool |
| Edit, replace in a file | `edit_file` (with `replace_all`) | has a tool |
| Save a file | `write_file` | has a tool |
| Workspace replace all | `edit_file` per file, or `bash` | one call per file; HISTORY rows must agree |
| HISTORY step back | `write_file` with the earlier text | the session needs that text via `inspect_record` |
| Add to message | — | by hand only; the prompt is the person's |
| Columns, dock, swap, focus, widths, ⌃⇧` | — | by hand only; window layout, not work on the record |
| Vim or nano bindings | — | by hand only; a setting |

The check runs at the project's close and in each phase for what that phase adds.

---

## Edge states

| State | Behaviour |
|---|---|
| Pane with no session | ⌘⇧E does nothing; the pane stays at its picker |
| Ended session | The editor opens read-only; saves are refused (the record is not at rest); the state is shown |
| View-only pane (U182) | The editor opens read-only |
| Binary or over-cap file | The editor shows the file name and type in INFO; the centre says the file cannot be opened, with its size |

---

## Code organization

**Canonical homes (hard rule 7).** Each new module gets its row in `WORKING_AGREEMENT.md`'s canonical-home registry before it lands. The breakdown assigns homes; the registry already has places: `web/app/*.tsx` for view components, `web/app/derive/` for derivations, `web/app/keymap.ts` for key dispatch. `App.tsx` is 1,177 lines and holds keys, panes, and views; the editor's state stays out of it.

**The import check.** r8 says "no view module imports from the transcript, the lenses, or `PaneRegistry`", and its gate runs that check. The editor's bottom panel IS the transcript, and the right column can swap to the lenses (⌃⇧`). The editor view takes the transcript and the lenses as children from the composing component (`App.tsx` or its successor), not as imports. The gate checks that `web/app/editor/` imports neither `Transcript` nor any lens module directly. `Transcript` needs a third `view` value (alongside `pane` and `meta`), and `useScrollAnchor` keys on it.

---

## Document sequence

1. **RESEARCH** — `RESEARCH-<date>-code-editor.md`, required before any sprint card (r8's rule). Answers the fifteen questions from r8 and r11 for the code editor. For each of the twelve plan items, names the research that already covers it or provides the answer. Three topics the BLACKBOARD says no research covers: hunk authors vs main, the status line, and harness drivers. Also settles: the widget registry vs EditorState swap, the CSP route, quick open's data source (the session's `glob` tool or a recursive walk), workspace search's data source (the session's `grep` or `rg`), the watch stream's cost and `.gitignore` rule, and the import check from r8 (the editor takes the transcript and lenses as children).
2. **VOCABULARY** — a session over this project's entities (open file, column, hunk, chip, search) ends in a version bump. Tags for: file opened, column folded, follow mark, hunk drawn, chip added, search, quick open, key refused. The E1 rule applies: no path or text in the trace. View-category tags and their pairing (BOOTSTRAP step 9) are included.
3. **REQUIREMENTS** — numbered items traced to design spec sections and decisions. Drawn from this roadmap and a read of the existing system (D89). Each names its type (functional, non-functional, constraint), its source, and what the code does today.
4. **BREAKDOWN** — work items grouped by area, each naming its files, the requirements it meets, and what it depends on. Estimates in story points. The canonical-home registry gains rows for each new module before it lands (hard rule 7).
5. **Sprint cards** — one per work item, ≤2 files, one concept, with scope, context files, and its contracts (signal, artifact, observation). Written one at a time, each before its sprint runs. Each new dependency is an `agent-resolved` entry with its row added to the working agreement's permitted list (hard rule, AGENTS.md).

---

## Order of work

Each phase produces a working, testable increment and ends with an integration sprint on the packaged app. The phases follow r11's build order for the code editor (shell; tree and open tab; editor; spine; follow; changes; find, search and quick open; lenses; chips):

**Phase 1 — The view shell and the tree.** ⌘⇧E opens the editor view. Three columns render (left, centre, right) with the transcript and input bar below. The left column shows the file tree tab over the workspace file API, with the open-file tab row above the centre, and modified dots from the diff vs main. Each side column folds to a labelled rail; the bottom panel collapses to a sill that keeps its input. The terminal docks bottom or right. Sides swap. Widths are remembered per mode.

**Phase 2 — The editor.** CodeMirror 6 in the centre, using whichever persistence route the research chose. Open a file from the tree; edit; save. The CSP route is proven by a screenshot on the packaged window. Vim and nano bindings. The status line: mode, file, line:col, +N −M vs main. The outline section in the inspector, reading CodeMirror's syntax tree with per-language node mapping.

**Phase 3 — The spine and session integration.** The inspector's spine: ACTIVITY (from `ToolCall` and `HarnessToolCall` arguments, `bash` text matches, ◂ to open the seq), HISTORY (from both event kinds, unified list, step-back), INFO (path, size, modified, modified-by, encoding, line endings, type). The editor follows the session (D93): mark at ToolCall, confirm at ToolResult, withdraw on failure, show conflict on unsaved changes. Changes in this file: hunks vs main, each attributed.

**Phase 4 — Search and navigation.** Quick open ⌘P. Workspace search and replace ⌘⇧F (the left column's search tab; each replacement is a `FileWritten`). Find and replace in the open file (⌘F, ⌥⌘F — the inspector's find section). The left column's open and activity tabs. Tool parity check for what phases 1–4 add.

**Phase 5 — Add-to-message, the record column, and close.** ⌥-click, drag, or right-click a file, folder, or line range to make a chip. ⌃⇧` swaps the inspector for the record's five lenses at 400px. The Go menu. Tool parity check for phase 5. Final integration sprint: every gate on a fresh bundle, both observation tracks, every failure row under its fixture.

---

## Risks

**The CSP and CodeMirror's style injection.** `style-src 'self'` blocks the `<style>` element `style-mod` creates. If neither the nonce route nor the shadow-root route works cleanly with the existing page and Electron's security model, the policy must change — which is a security decision. The research resolves this before any code.

**Language package count.** Eight `@codemirror/lang-*` grammars in the first batch. Each adds to the bundle. The research measures the combined size and decides whether lazy loading is needed.

**Quick open and workspace search data sources.** Neither has an endpoint that returns what it needs. Quick open needs every file name; workspace search needs full-text search. The watch stream's snapshot stats every file every 0.5 s up to 20,000 files (`server.py:2091`), and a walk of this repository (19,361 files) takes 81–203 ms per run. The research chooses the source and addresses `.gitignore` filtering.

**Harness driver argument shapes.** Each driver has its own tool names and argument structure. Claude's pass through; Codex's `file_change` carries a `changes` list with no `path` field. The derivation must handle each shape, and the set of drivers may grow.
