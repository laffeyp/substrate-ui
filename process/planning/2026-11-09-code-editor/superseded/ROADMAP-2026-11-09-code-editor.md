# Roadmap — the code editor

*2026-11-09. The first project in the feature breakdown (`process/planning/2026-11-09-feature-breakdown/`). Source: `design/received/handoff 5/docs/DESIGN-SPEC -2026-11-04- r6.md` (sections 0, 4, 5 "Code", 5.0, 5.1, 8), `DESIGN-DECISIONS -through 2026-11-04-.md` (D51, D53, D63, D81, D82, D85, D86, D92, D93, D94), `EDITOR-INSPECTOR-PLAN-RATIONALE -2026-11-04-.md`, `process/planning/2026-11-04-editor-level/RESEARCH-2026-11-05-editor-view-r11.md`.*

---

## Why

The editor view is the first mode of the app beyond the terminal and the reveal. It opens a code file with a tree on the left, an inspector on the right, and the session's transcript below. The session edits files and the editor shows it happening; a person can also edit by hand. This is the cockpit loop from D91: prompt, watch the file change, prompt again.

This project builds the editor view infrastructure that every subsequent mode inherits: the three-column layout, the column configuration machinery (collapse, dock, swap, remembered widths), the inspector spine (ACTIVITY / HISTORY / INFO), quick open, workspace search, add-to-message chips, and the "editor follows the session" pattern. Documents, images, video, audio, design, and the plain shell each add their own mode sections and tools in their own projects later.

---

## What it delivers

When this project closes:

- ⌘⇧E opens the editor on the focused session's workspace. The same key or esc returns to the pane. The header chip reads "⌘⇧E pane". The View and Go menus list the key.
- The layout is three columns and a bottom panel: file explorer left, CodeMirror 6 editor centre, inspector right, transcript and input bar below.
- The left column has four tabs: files (the tree, with modified-file dots from the session's worktree diff), search (workspace find-and-replace with results by file), open (open files), activity (files the session has touched).
- The editor opens, edits, and saves files. Vim and nano bindings work. The status line reads mode, file, line:col, and a change summary vs main.
- The inspector shows: outline (current symbol highlighted), changes in this file (each hunk vs main, with its author — "by the session · turn 9 · seq 231 edit_file" or "by hand"), find and replace (⌘F plain, ⌥⌘F regex, match count, Aa, .*).
- The inspector's last three sections are the common spine: ACTIVITY (this file in the record, with ◂ to open the seq), HISTORY (every edit with its author and step-back via ⌘Z / ⌘⇧Z), INFO (path, size, modified, encoding, line endings). All sections collapse (▾/▸) and are drawn open by default.
- Quick open ⌘P: fuzzy file names, modified dots, recent files, ↵ opens.
- Workspace search ⌘⇧F: results by file with line previews; replace one or all.
- The editor follows the session: when the session calls edit_file, the file opens and the change shows as it is written. When the person is reading another file, the change is marked (a modified dot, an Activity line) and the view stays.
- ⌃⇧` swaps the inspector for the record's five lenses, 400px wide, and back.
- Each column folds to a labelled rail with ◂ and a vertical label. The terminal docks bottom (default) or right. Sides swap. Focus folds all columns but the prompt. Widths are remembered per session.
- Add to message from the editor: ⌥-click a file, a folder, or a line range and it becomes a chip in the input bar, removable, travelling with the next message.
- Every action a person can take by hand in the editor has a session tool behind it (read_file, edit_file, write_file, bash), or is labelled "by hand only" with the reason stated.

Each item closes when its tags fire in the packaged app's trace and a gate reads them.

---

## What is out of scope

- Other editor modes: documents, images, video, audio, design, and the plain shell. Each gets its own project.
- The input bar on surfaces (records, studio, assays). A separate item.
- Add-to-message from the transcript or from meta's stream. Separate items.
- A shared palette or theme module. After this project.
- Editor splitting (D49c: no splitting inside the editor view).
- Language servers, debuggers, source-control UI, extension marketplaces (D53).
- Flat and sandbox workspace support for the diff column. Every session workspace is a git repository (kernel K328), so the diff against main is always available. A future project may need to handle edge cases where main does not exist; the code editor does not.

---

## Preconditions

**The shell-to-react migration is closed.** G1 passed 2026-11-05 (sprint 345): 60 of 60 Electron gates, 139 unit tests, 257 Python tests, vm_smoke 12 of 12, pixels 20 of 28 equal to the pre-move baseline (the other 8 are logged fixes), packaged smoke passing. The window is a typed React app under `web/app/`; dc-runtime is retired to `_deprecated/dc-runtime/`; React 18.3.1 is bundled from node_modules; the page carries a Content-Security-Policy. Three interfaces shaped for the editor view: the input bar takes its pane as a prop (D90), each lens takes its width from its container (D81), the store's open-view field names the open view (D86). No preconditions block the code editor.

---

## What is already built

| What | Where | Sprint |
|---|---|---|
| The open-view field in the store | `web/app/state/` | 346 |
| The widget registry (keeps a CodeMirror editor alive across view switches) | `web/app/widgets.ts` | 347 |
| Workspace file API: list, read, write, watch | `server.py`, `web/vm/` | 348, 349, 387 |
| Hand edits on the record as `FileWritten` | kernel K340 | — |
| Attachments on `UserMessage` | kernel K344 | 388 |
| CodeMirror 6 core packages | `@codemirror/commands` 6.11.1, `@codemirror/state` 6.7.6, `@codemirror/view` 6.43.15 | — |

---

## Technical decisions

**CodeMirror 6 is the editor component.** Already a dependency (three packages in `package.json`). The widget registry (`web/app/widgets.ts`, sprint 347) was built specifically for it: CodeMirror keeps its document, undo history, and cursor in an `EditorView`; the widget registry preserves the `EditorView` across view switches so nothing is lost.

**Vim bindings via `@codemirror/vim`.** Not yet in `package.json`; added with the editor sprint. Nano bindings via a custom keymap extension (CodeMirror 6's keymap system makes this straightforward — nano's bindings are a small, fixed set: ⌃O save, ⌃X exit, ⌃K cut line, ⌃U paste, ⌃W search, ⌃G help).

**The inspector is React components reading the record.** The ACTIVITY section is a pure derivation over the session's envelopes: for each `ToolCall` whose arguments name a file path (`read_file`, `edit_file`, `write_file`), one row per turn and seq. HISTORY is the same derivation plus `FileWritten` events from hand edits. INFO reads the workspace file API. All three use the `useSyncExternalStore` pattern the shell-to-react migration established.

**Outline via CodeMirror's syntax tree.** CodeMirror 6 parses the open file into a Lezer syntax tree. The outline section walks the tree for function, class, and method nodes and highlights the one containing the cursor. No language server needed.

**The diff column reads the diff against main.** The design spec says "each hunk vs main" and the status line says "+2 −1 vs main." Every session workspace is a git repository (kernel K328); `/api/worktree_diff` returns the diff. The inspector's "changes in this file" section groups hunks by file and attributes each to its latest editor (session + seq, or "by hand").

---

## Order of work

Each step produces a working, testable increment. Steps are numbered for reference; sprint cards are written one at a time, each before its sprint runs. The research (round 11, section "The editor view, code mode") names nine sub-steps; the roadmap groups them into five phases by what each delivers to the person using the app.

**Phase 1 — The view shell.** ⌘⇧E opens the editor view. Three columns render (left, centre, right) with the transcript and input bar below. Each column collapses to a labelled rail. The terminal docks bottom or right. Sides swap. Widths are remembered. The centre is empty; the inspector shows the spine (ACTIVITY, HISTORY, INFO) reading the existing record. The left column shows the file tree tab over the workspace file API, with modified dots.

**Phase 2 — The editor.** CodeMirror 6 in the centre pane, using the widget registry. Open a file from the tree; edit; save through the workspace file API. Vim and nano bindings. The status line. The outline section in the inspector, reading CodeMirror's syntax tree.

**Phase 3 — Session integration.** The editor follows the session (D93): when `edit_file` fires, the file opens and the change shows as it is written; when the person is elsewhere, a dot and an Activity row mark the change. The changes-in-this-file section shows hunks vs main with author attribution. Tool parity check (D92): every hand action has a tool behind it or is labelled.

**Phase 4 — Search and navigation.** Quick open ⌘P. Workspace search and replace ⌘⇧F (the left column's search tab). Find and replace in the open file (⌘F, ⌥⌘F — the inspector's find section). The left column's open and activity tabs.

**Phase 5 — Add-to-message and the record column.** ⌥-click a file, folder, or line range to make a chip in the input bar. ⌃⇧` swaps the inspector for the record's five lenses at 400px. Final gate run on the packaged app.

---

## Risks

**CodeMirror's vim mode.** `@codemirror/vim` (not yet in `package.json`; added in phase 2) covers normal, insert, visual, and ex modes. Edge cases in macros, registers, and some ex commands are incomplete upstream. The design says "basic editing with vim/nano bindings" (D53), and the bar is "enough editor that nobody flees to VS Code mid-session." If a binding gap matters in practice, a custom keymap extension fills it — CodeMirror 6's keymap system handles this at the extension level.

**Language support packages.** CodeMirror 6 has three core packages installed (`@codemirror/commands`, `@codemirror/state`, `@codemirror/view`). The editor also needs `@codemirror/language` (syntax highlighting and the Lezer parser for the outline), `@codemirror/search` (find and replace), and one `@codemirror/lang-*` package per language for syntax highlighting. These are well-maintained, MIT-licensed, and the only question is which languages to ship from the start. The design names no specific set; a reasonable first batch is the languages the session's tools handle: Python, TypeScript/JavaScript, JSON, HTML, CSS, Markdown, shell.

---

## Next step

This roadmap is the first document in the D89 sequence. After it: REQUIREMENTS (the 12 items from the plan document, formalized as numbered, typed, traceable requirements), then BREAKDOWN (work items with files, requirements met, dependencies, and estimates), then sprint cards.
