# Roadmap — the code editor (round 4)

*2026-11-09. Supersedes `ROADMAP-2026-11-09-code-editor-r3.md` (left on disk). Corrects the document sequence: rounds 1–3 inherited a fifteen-question research framework from `2026-11-04-editor-level/`, written before the design spec existed. The design spec (98 decisions, sections 0/4/5/5.0/5.1/8) answers those questions. A research document re-answering them was written and deleted the same day. This round drops the research and requirements steps, commits to the implementation choices rounds 1–3 deferred, and keeps the vocabulary session and sprint cards. Source: `DESIGN-SPEC -2026-11-04- r6.md`, `DESIGN-DECISIONS -through 2026-11-04-.md`, `WORKING_AGREEMENT.md`, the code at substrate-ui `9266de0` and kernel `0301beca`.*

---

## Why

The editor view is the first mode beyond the terminal and meta. ⌘⇧E opens a code file with a tree on the left, an inspector on the right, and the session's transcript below. The session edits files and the editor shows it happening; a person can also edit by hand. D91's cockpit loop: prompt, watch the file change, prompt again.

---

## What it delivers

When this project closes:

- ⌘⇧E opens the editor on the focused session's workspace. ⌘⇧E returns to the pane. The header chip reads "⌘⇧E pane". The View and Go menus list the key (D63, D86).
- The layout is three columns and a bottom panel: file explorer left, editor centre with an open-file tab row, inspector right, transcript and input bar below (D90).
- The left column has four tabs: files (the tree, with modified dots from the diff vs main), search (workspace find-and-replace, results by file with line previews, regex toggle, ⌘⇧↵ replace all, ↵ next), open (open files), activity (files the session has touched, including `bash` commands that name the path).
- The editor opens, edits, and saves files. Vim bindings via `@replit/codemirror-vim` 6.4.0 and nano bindings via a custom keymap. A setting chooses between them (D67). The status line reads `-- NORMAL -- · file · line:col · +2 −1 vs main`.
- The inspector shows: outline (classes, functions, methods from the Lezer syntax tree, current symbol highlighted, with line number — JSON shows top-level keys, CSS shows selectors, Markdown shows headings), changes in this file (each hunk vs main, with its author — "by the session · turn 9 · seq 231 edit_file", "by hand", or "unattributed"), find (⌘F) and replace (⌥⌘F), plain or regex (Aa, .*).
- The inspector's last three sections are the common spine: ACTIVITY (this file in the record, including harness drivers' tool calls and `bash` text matches, with ◂ to open the seq), HISTORY (every edit with its author and step-back via ⌘Z / ⌘⇧Z), INFO (path, size, modified, modified-by from the record, encoding, line endings, type). All sections collapse (▾/▸) and are drawn open by default (D85).
- Quick open ⌘P: fuzzy file names, modified dots, recent files, ↵ replaces the current tab, ⌘↵ opens a new tab.
- Workspace search ⌘⇧F: results by file with line previews; replace one, ⌘⇧↵ replace all. Each replacement is a `FileWritten` on the record. A file open with unsaved changes or over the 2 MiB cap is a failure row.
- The editor follows the session: when a file-editing tool call arrives (native `edit_file`/`write_file` or the harness driver's equivalent per the driver table), the file opens and scrolls to the change as it is written. When the person is reading another file, the change is marked (a modified dot, an Activity line) and the view stays (D93). The mark is withdrawn on `ToolResult` or `HarnessToolResult` failure. When a Codex `file_change` arrives as completed with no prior started event, the mark and confirm happen together. A file with unsaved changes shows the conflict: the person can reload the session's version, keep theirs and overwrite on next save, or compare side by side. A clean open buffer takes the session's text at the result event.
- ⌃⇧` swaps the inspector for the record's five lenses, 400px wide, and back (D81).
- Each side column folds to a labelled rail with ◂ and a vertical label (D51). The bottom panel collapses to a sill that keeps its input; typing reopens the history (D49d). One key each for left, right, and bottom (assigned in the keyboard table). The terminal docks bottom (default) or right. Sides swap. Focus folds all columns but the prompt. Widths are remembered per mode (D82); before project 9 (collection and state restore), they persist in `localStorage` keyed by mode, and the code editor carries the mode key so the next project inherits it.
- Add to message from the editor: ⌥-click, drag, or right-click › Add to message on a file, a folder, or a line range; it becomes a chip in the input bar showing the name (full path on hover), removable with × or ⌫, travelling with the next message (D94).
- Every action a person takes by hand has a session tool behind it, or is labelled "by hand only" with its reason (D92). The table is below.
- A pane with no session, an ended session, a view-only pane, a workspace from before K315 with no git, and a binary or over-cap file each state their condition.

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

## Technical decisions

**CodeMirror 6 is the editor component.** Three packages in `package.json` (`@codemirror/commands` 6.11.1, `@codemirror/state` 6.7.6, `@codemirror/view` 6.43.15); `@codemirror/language` installed as a transitive dependency.

**The widget registry is the persistence mechanism.** The widget registry (`web/app/widgets.ts`, sprint 347) keeps one live `EditorView` per open file, preserved across view switches by `useWidget`. Cursor, scroll, undo history, decorations, and the Lezer parse tree survive every switch without serialization. The alternative — one `EditorView` with `setState` per file switch — rebuilds the DOM each time, with a visible flash on large files and a 15–40 ms Lezer reparse. The BLACKBOARD's earlier "unused and its reason is gone" entry is corrected: the registry's purpose is the code editor. Recorded as `agent-resolved` on 2026-11-09.

**The CSP route is the nonce.** The CSP at `reveal.html:13` sets `style-src 'self'`. CodeMirror's `style-mod` creates `<style>` elements the browser refuses. `EditorView.cspNonce` (defined at `@codemirror/view/dist/index.js:9044`, read at `:8382`) passes a nonce to `StyleModule.mount`, which sets `nonce="<value>"` on the tag. The CSP changes to `style-src 'self' 'nonce-<value>'`. The main process generates a random nonce per page load; the preload makes it available to the renderer. The shadow-root alternative (`style-mod:94` uses `adoptedStyleSheets` when the root is a `ShadowRoot`) adds event, focus, and style isolation with no other consumer in the app. Recorded as `agent-resolved` on 2026-11-09.

**Quick open's file list comes from `git ls-files`.** `git ls-files --others --cached` lists tracked and untracked-but-not-ignored files, respects `.gitignore`, and runs under 50 ms on 19,361 files. For workspaces without git (81 pre-K315 workspaces), the watch stream's `_workspace_snapshot` (`server.py:2095`) is the fallback. The watch stream itself watches the full tree for change detection, including gitignored files — that is its correct job. Recorded as `agent-resolved` on 2026-11-09.

**Workspace search runs through a new endpoint.** `GET /api/session/<id>/search?q=<pattern>&regex=<bool>` runs `rg --json` in the workspace root, capped result count, `.gitignore` respected by default. `rg` 14.1.1 is installed. Replace writes each file through the existing PUT `/api/session/<id>/file` endpoint, each producing a `FileWritten`. Falls back to `grep -rn` if `rg` is absent. Recorded as `agent-resolved` on 2026-11-09.

**HISTORY text stays in the window.** The session stream sends every `FileWritten` with resolved blobs (`server.py:4177`, `resolve_blobs=True`). The controller keeps each envelope in `rawEnvelopes` (`session_controller.ts:1414`). Cost: 4 MiB per 2 MiB file edited. The alternative — send `FileWritten` without text and add an endpoint to serve blobs by seq — changes the shared stream that the stream lens and I/O lens also read. Recorded as `agent-resolved` on 2026-11-09.

**Vim bindings via `@replit/codemirror-vim` 6.4.0** (MIT). Requires `@codemirror/search` and `@codemirror/language` as peer dependencies, and `drawSelection` when `basicSetup` is not used. Nano bindings via a custom keymap extension (nano's bindings are a small, fixed set: ⌃O save, ⌃X exit, ⌃K cut line, ⌃U paste, ⌃W search, ⌃G help).

**Language packages.** The editor needs `@codemirror/language` as a direct dependency, `@codemirror/search` for find/replace and as a peer of the vim package, and one grammar package per language for syntax highlighting and the outline. Each grammar names its tree nodes differently, so the outline's symbol-walker carries a mapping per language. The first batch is six `@codemirror/lang-*` packages and `@codemirror/legacy-modes` 6.5.5, grounded by measured file extension counts across the project tree (JS 5,939; TS 2,842; MD 2,210; JSON 826; Python 491; HTML 51; shell 18; CSS 15):

| Language | Package | Outline nodes |
|---|---|---|
| Python | `@codemirror/lang-python` | FunctionDefinition, ClassDefinition |
| TypeScript, JavaScript | `@codemirror/lang-javascript` (TypeScript is an option) | FunctionDeclaration, ClassDeclaration, MethodDefinition |
| JSON | `@codemirror/lang-json` | top-level keys (Property nodes) |
| HTML | `@codemirror/lang-html` | — (no outline) |
| CSS | `@codemirror/lang-css` | RuleSet selectors |
| Markdown | `@codemirror/lang-markdown` | ATXHeading, SetextHeading |
| Shell | `@codemirror/legacy-modes` with `StreamLanguage` | — (tokens only, no Lezer tree; empty outline) |

A file with no grammar gets highlighting off and an empty outline. Each package is a dependency decision recorded in the working agreement's permitted list.

**The diff is vs main.** The design spec says "each hunk vs main" and the status line says "+2 −1 vs main." Every workspace created after K315 is a git repository (`ensure_repository` at `workspace.py:69`). The base is `git merge-base main HEAD`. For a repository with no `main` branch (6 of 19 on this machine): the default branch. For a repository the kernel made: its first commit (the kernel-made rule applies only when no named branch exists). When `main` is checked out (13 of 19), `merge-base main HEAD` is HEAD, and a commit by the session empties the column — correct, because the session's commits are on `main`.

The diff uses the scratch-index method from `worktree_diff` (`workspace.py:122–130`) so that files never added to git still appear. The per-session diff read goes through `_session_workspace_root` like the file API; a new function takes the merge-base as its argument and the scratch-index for untracked files.

Modified dots and the status summary refresh on `ToolResult`/`HarnessToolResult` and on watch events. Each refresh runs git.

**The inspector reads `ToolCall` and `HarnessToolCall`.** The ACTIVITY and HISTORY derivations cover both. The derivation needs a table per driver:

| Driver | File-edit tool | Path argument | Edit content | Result kind |
|---|---|---|---|---|
| native | `edit_file`, `write_file` | `path` | `new_str` / full text | `ToolResult` |
| claude | `edit_file`, `write_file` (passed through, `harness_streams.py:126`) | `path` | `new_str` / full text | `HarnessToolResult` |
| codex | `file_change` (`:166`) | no `path` field; `changes` list | content in `changes` | `HarnessToolResult`; may arrive only as completed (`:173`) |
| cursor-agent | varies | varies | varies | `HarnessToolResult` |

**ACTIVITY lists `bash` by text match.** A `bash` call's argument is a command string. ACTIVITY lists it only where the command contains the file's path, and labels the row as a text match.

**HISTORY comes from two event kinds.** Session edits are `ToolCall`/`HarnessToolCall` with `edit_file`, `write_file`, or the harness driver's equivalent. Hand edits are `FileWritten` events (K340). One function derives one HISTORY row from either event, attributed to its author.

`FileWritten` has no generated kind name in `EnvelopeKind`. `gen_kinds.py` must learn this kind before HISTORY can filter by it. Phase 3 work.

**⌘Z resolves between three candidates.** CodeMirror has its own undo stack. HISTORY has step-back (which writes the earlier text as a new edit). Rule: ⌘Z while the buffer has unsaved changes is CodeMirror's undo. Once the buffer matches the saved file, ⌘Z steps HISTORY back. ⌘⇧Z while CodeMirror's redo stack is non-empty is CodeMirror's redo; otherwise it steps HISTORY forward (a new edit writing the later text). Vim's `u` and ⌃R are CodeMirror only. Session edits dispatched with `addToHistory: false`.

**Esc resolves by focus and binding.** With vim bound and CodeMirror focused, esc stays in vim in every mode. ⌘⇧E leaves. With nano bound and CodeMirror focused, esc closes the editor view. With focus outside the editor, esc follows the existing close cascade (D73): find and quick-open close first, then the editor view closes to the pane. ⇧Esc keeps the soft interrupt ahead of the view closing; ⌃C in the input bar keeps the hard interrupt.

**Following the session: mark at call, confirm at result.** The editor marks the change at the call event and confirms at the result event. On failure, the mark is withdrawn. When Codex's `file_change` arrives as completed with no prior started event, the mark and confirm happen together. Unsaved changes show the conflict: reload the session's version, keep theirs and overwrite on next save, or compare side by side. A clean open buffer takes the session's text at the result event.

**Hunk attribution.** Each hunk is attributed to the latest edit whose new text covers it. Walk the unified HISTORY list in reverse; the first entry whose written range overlaps the hunk is the author. A hunk with no recorded author is labelled "unattributed" (D6).

**The save policy.** Save on explicit command (⌃O in nano, `:w` in vim, ⌘S from the menu). Each save is one `FileWritten`. Phase 2 adds File › Save to `menu.ts` with ⌘S as its accelerator.

**Attachments.** K344 (sprint 388) built attachments on `UserMessage` (`_resolve_attachments` at `server.py:2033`). A folder carries empty text; a file goes whole up to 2 MiB (`WORKSPACE_READ_MAX`). Phase 5 corrects the size or records the decision to keep it.

---

## Keyboard table

| Key | Owner | In the editor | Outside the editor | Menu |
|---|---|---|---|---|
| ⌘⇧E | menu | opens the editor; if already in the editor, returns to pane | opens the editor | View, Go |
| Esc | cascade | vim bound + CM focused: stays in vim (all modes). Nano bound + CM focused: closes editor to pane. Focus elsewhere: find/quick-open close, then editor closes to pane | close cascade → interrupt (D73) | — |
| ⌘P | menu | quick open (routed to editor when open) | — | Go (new) |
| ⌘⇧F | menu | workspace search (routed to editor's left column search tab) | — (today `keymap.ts:67` catches it as find; changed to route through `open_view`) | — |
| ⌘F | renderer | find in file (inspector) when CM focused; find in transcript when transcript focused | find in transcript (today) | — |
| ⌥⌘F | renderer | replace in file (inspector) | — | — |
| ⌘S | menu | save the open file | — (no-op; no Save item in `menu.ts` today, added in Phase 2) | File (new item) |
| ⌘Z | menu | CodeMirror undo / HISTORY step-back (per the rule above) | native undo | Edit (native) |
| ⌘⇧Z | menu | CodeMirror redo / HISTORY step-forward (per the rule above) | native redo | Edit (native) |
| ⌃⇧` | renderer | swaps inspector ↔ record lenses | — | — |
| ⌘⇧T | — | — | — | reserved for plain shell (separate project) |
| ⌥⌘L | renderer | toggle left column | — | — |
| ⌥⌘R | renderer | toggle right column | — | — |
| ⌘J | renderer | toggle bottom panel | — | — |
| ⌘M | keymap | toggle meta | toggle meta | — |
| ⌘E | keymap | toggle tools | toggle tools | — |
| ⌘D / ⌘⇧D | keymap | split right / split down | split right / split down | — |
| ⌘3 | keymap | toggle assays | toggle assays | — |
| ⌘, | keymap | settings | settings | — |

Keys owned by `menu` are registered as Electron accelerators and fire window-wide; the menu handler routes through `open_view` to dispatch them to the editor when open. Keys owned by `renderer` fire only in the web content via `keymap.ts`; they have no menu accelerator. Keys owned by `keymap` are the existing bindings in `keymap.ts` and keep their current behaviour; what each does while the editor is open is stated.

The Go menu is new work (D63, MENU-BAR). `keymap.ts` gains a view-aware dispatch using `open_view`; the current `⌘⇧F → toggle-find` binding (`:67`) is replaced by a route that opens workspace search when the editor is open.

⌘B is not used for the left column. The spec's keyboard map gives ⌘B to "build a card (plan)" in project 7, and a menu accelerator is window-wide. The column toggles use ⌥⌘L (left), ⌥⌘R (right), and ⌘J (bottom).

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
| Ended session | The editor opens read-only; saves are refused (`RecordNotAtRestError`, the write API returns 409); the state is shown |
| View-only pane (U182) | The editor opens read-only |
| Binary or over-cap file | The editor shows the file name and type in INFO; the centre says the file cannot be opened, with its size |
| Workspace from before K315 with no git | The editor opens; the tree shows files; the diff column, modified dots, and status summary are absent; INFO states "no git repository" |
| Machine with no git | Same as above |

---

## Code organization

**Canonical homes (hard rule 7).** Each new module gets its row in `WORKING_AGREEMENT.md`'s canonical-home registry before it lands. `web/app/*.tsx` holds view components, `web/app/derive/` holds derivations, `web/app/keymap.ts` holds key dispatch. `App.tsx` is 1,177 lines and holds keys, panes, and views; the editor's state stays out of it. The editor view lives in `web/app/editor/`, which gets its registry row in the breakdown.

**The import check.** The editor view takes the transcript and the lenses as children from the composing component (`App.tsx`), not as imports. The gate checks that `web/app/editor/` imports neither `Transcript` nor any lens module directly. `Transcript` needs a third `view` value (alongside `terminal` and `reveal`), and `useScrollAnchor` keys on it.

**CodeMirror API reference.** Written into `WORKING_AGREEMENT.md`'s bridge mappings before the first sprint card that calls each function. The API surface: `EditorView` (constructor, state, dispatch, dom, destroy, focus, cspNonce, theme, editable, updateListener, lineWrapping), `EditorState` (create, doc, selection, update, facet, field, toJSON, fromJSON), `StateField.define`, `StateEffect.define`, `Compartment`, `keymap` facet, `search`/`searchKeymap`/`highlightSelectionMatches`, `vim()`/`Vim.defineEx`, `syntaxTree`/`LanguageSupport`/`StreamLanguage`/`foldGutter`/`bracketMatching`/`syntaxHighlighting`. Each entry names the package, the function, and what the editor uses it for.

---

## Before sprint cards

Two steps, then cards.

1. **VOCABULARY** — a session over this project's entities (open file, column, hunk, chip, search) ends in a version bump. Tags for: file opened, column folded, follow mark, hunk drawn, chip added, search, quick open, key refused. The E1 rule applies: no path or text in the trace. View-category tags and their pairing (BOOTSTRAP step 9) are included.
2. **Sprint cards** — one per work item, ≤2 files, one concept, with scope, context files, and its contracts (signal, artifact, observation). Written one at a time, each before its sprint runs. Each new dependency is an `agent-resolved` entry with its row added to the working agreement's permitted list (hard rule, AGENTS.md).

The design spec is the requirements. The phases below are the breakdown. A separate requirements or breakdown document would restate what is already here and in the design spec.

---

## Order of work

Each phase produces a working, testable increment and ends with an integration sprint on the packaged app.

**Phase 1 — The view shell, the tree, and the diff.** ⌘⇧E opens the editor view. Three columns render (left, centre, right) with the transcript and input bar below. The left column shows the file tree tab over the workspace file API. Each side column folds to a labelled rail; the bottom panel collapses to a sill that keeps its input. The terminal docks bottom or right. Sides swap. Focus folds all columns but the prompt. Widths are remembered per mode in `localStorage`. The column keys (⌥⌘L, ⌥⌘R, ⌘J) and the View menu entries for them. `keymap.ts` gains view-aware dispatch using `open_view`. The per-session diff read (through `_session_workspace_root`, merge-base vs main, scratch-index for untracked files). Modified dots on the tree from the diff. The four edge states (no session, ended, view-only, no git). Existing keys (⌘M, ⌘E, ⌘D, ⌘⇧D, ⌘3, ⌘,) keep their behaviour while the editor is open.

Failures: 409 on ended session, no git repository, a watch stream cut at the 20,000-file cap.

**Phase 2 — The editor and the open-file tab row.** CodeMirror 6 in the centre, using the widget registry. The open-file tab row above the centre. Open a file from the tree (↵ replaces the current tab, ⌘↵ opens a new tab); edit; save. The CSP nonce is proven by a screenshot on the packaged window. Vim and nano bindings; the setting that chooses between them (D67). ⌘S added to `menu.ts` as a File › Save item. The status line: mode, file, line:col, +N −M vs main. The outline section in the inspector, reading CodeMirror's syntax tree with per-language node mapping. The esc rule (vim keeps esc; nano and non-editor focus follow the cascade).

Failures: a file over 2 MiB, a binary file, a CSP refusal with CodeMirror mounted, a stale save (409).

**Phase 3 — The spine and session integration.** The inspector's spine: ACTIVITY (from `ToolCall` and `HarnessToolCall` per the driver table, `bash` text matches, ◂ to open the seq), HISTORY (from both event kinds, unified list, step-back and step-forward), INFO (path, size, modified, modified-by, encoding, line endings, type). Teaching `gen_kinds.py` the `FileWritten` kind. The ⌘Z / ⌘⇧Z / `u` / ⌃R rules. The editor follows the session (D93): mark at call, confirm at result, withdraw on failure, Codex's arrived-as-completed case, show conflict on unsaved changes (reload, keep, or compare). Changes in this file: hunks vs main, each attributed. The hunk-with-no-author label.

Failures: a tool failing after the mark, 503 on a busy record, a `file_change` with no path field, a hunk with no recorded author.

**Phase 4 — Search, navigation, and the Go menu.** The Go menu (D63, MENU-BAR; needed for ⌘P's menu entry). Quick open ⌘P (file list from `git ls-files`, fallback to the watch snapshot). Workspace search and replace ⌘⇧F (the left column's search tab; each replacement is a `FileWritten`; `keymap.ts`'s ⌘⇧F route changed; the new `/api/session/<id>/search` endpoint running `rg`). Find and replace in the open file (⌘F scoped to focused area, ⌥⌘F — the inspector's find section). The left column's open and activity tabs. Tool parity check for what phases 1–4 add.

Failures: workspace search on a file with unsaved changes, workspace search on a file over 2 MiB.

**Phase 5 — Add-to-message, the record column, and close.** ⌥-click, drag, or right-click a file, folder, or line range to make a chip. ⌃⇧` swaps the inspector for the record's five lenses at 400px. The attachment size correction (or the decision to keep it). Tool parity check for phase 5. Final integration sprint: every gate on a fresh bundle, both observation tracks, every failure row under its fixture.

Failures: a folder attachment with no text, a file attachment over the cap, a key refused while the editor is open.

---

## Risks

**The CSP nonce and Electron's security model.** The nonce must be random per page load. Electron's main process generates it and the preload makes it available. If Electron's content security policy enforcement differs from the browser's (e.g., if `webContents` rejects the nonce attribute on `<style>` elements), the policy itself must change — a security decision.

**Language package count.** Seven grammar packages in the first batch. Each adds to the bundle. The installed sizes total roughly 250–350 KB minified, 80–120 KB gzipped. Lazy loading (each grammar loaded when a file of that type opens) is worth considering but not blocking at this bundle size.

**Workspace search endpoint.** The new `/api/session/<id>/search` endpoint runs `rg` in the workspace. `rg` is installed on this machine but is not a declared dependency of the kernel or the app. If absent on another machine, the fallback is `grep -rn` (slower, no `.gitignore` filtering).

**Harness driver argument shapes.** Each driver has its own tool names and argument structure. The set may grow. The derivation handles each shape through the driver table; a new driver needs a new row.

**HISTORY text cost.** A 2 MiB file edited once is 4 MiB held in `rawEnvelopes`. Ten distinct 2 MiB files: 40 MiB. Acceptable for a desktop Electron app. A session editing many large files could push this higher; the stream-splitting alternative is deferred.
