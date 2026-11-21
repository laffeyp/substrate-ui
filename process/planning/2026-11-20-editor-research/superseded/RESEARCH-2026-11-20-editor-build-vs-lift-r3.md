# Research — the editor, feature by feature: what to install, borrow, steal, or build (round 3)

*2026-11-20. Supersedes round 2 (in `superseded/`), which ruled on the capabilities the editor already has and found little to change. This round adds the capabilities the editor does NOT yet have — where there is far more to take — and corrects the earlier scope mistake: round 2 looked only at built features, so it mostly returned "keep." For every capability: install a package, borrow/lift code, or build a slice. All CodeMirror and VS Code sources are MIT; the shipped Microsoft VS Code binary is proprietary, so lifts are from the repositories. Written during the 2026-11-18 freeze: findings, not a build order. Package versions and the two installed language servers were read from the registry and this machine on 2026-11-20.*

---

## The headline: language intelligence is in scope and mostly already paid for

The editor has no autocomplete, no go-to-definition, no find-references, no rename, no hover, no inline errors. This was never ruled out. The design bars one thing — reaching out to a third-party or external server — and a language server running locally on the machine, over stdio, never contacts anyone. So local language intelligence sits inside the design; it simply has not been built. The cost of building it is far lower than it looks.

The editor UI for all of it is three small MIT packages built on the CodeMirror core already running:

- **`@codemirror/autocomplete`** (6.20.4) — the completion popup, snippets, and auto-close brackets.
- **`@codemirror/lint`** (6.9.8) — the inline error underlines, the gutter marks, the diagnostics panel.
- **`@codemirror/lsp-client`** (6.3.1) — speaks the Language Server Protocol: it wires a server's completion, hover, go-to-definition, find-references, rename, and diagnostics into the editor. It depends on the two packages above plus `vscode-languageserver-protocol`.

The intelligence those packages display does not come from them — it comes from a **language server**, a separate process. Here is the fact that collapses the cost: **pyright 1.1.414 (Python) and typescript-language-server 6.1.0 (TypeScript/JavaScript) are already installed on this machine.** The brain for the two main languages is already here. The backend already spawns processes (the kernel, the PTY). The work is to spawn the server, pipe its stdio to `@codemirror/lsp-client` over the channel the editor's file API already uses, and turn on the three packages.

The app's strict Content-Security-Policy (`script-src 'self'`, no worker `blob:`) does not block this path — it would only block the alternative of compiling a language service into an in-browser worker. Spawning a real server over the existing channel sidesteps it.

So language intelligence is not "free" in effort — running a server per language is real operational work: lifecycle, crashes, one server per language, one per session workspace. But the pieces are unusually close to hand: the client is a package, the servers for Python and TS/JS are already installed, the transport is a bridge over a channel that exists. **VERDICT: install the three packages; run pyright and typescript-language-server through `@codemirror/lsp-client`. This is the single largest capability the editor is leaving on the table, and it fits the design as drawn: the server runs locally with no network egress, and the thing the design bars is contacting a third-party server, which a local server never does.** Semantic completion, diagnostics, and navigation all follow from the same wiring; local keyword completion is available from the grammar packages even without a server.

## Free, already installed, simply not switched on

These ship in packages the editor already carries (or one small add) and are not wired today. Confirmed off in our source (`web/app`, `web/reveal`).

- **Code folding** — `foldGutter`, `codeFolding`, and language-driven fold ranges are in `@codemirror/language`, which is installed. Collapsing a function or block is wiring, not a new dependency. VERDICT: **turn it on.**
- **Line wrapping** — `EditorView.lineWrapping` in `@codemirror/view` (installed) is a one-line extension; the roadmap lists wrapping as "later." VERDICT: **turn it on** (as the setting the design wants).
- **Bracket matching** — `bracketMatching()` in `@codemirror/language` (installed), one line. VERDICT: **turn it on.**
- **Auto-close brackets** — `closeBrackets()` lives in `@codemirror/autocomplete`; it arrives with the language-intelligence packages above, or alone if those wait. VERDICT: **turn it on** (free once autocomplete is in).

## Install a package — new, but genuine drop-ins

- **A compare / merge view** — `@codemirror/merge` (6.12.3, MIT, official). It gives the side-by-side `MergeView` and the unified view, computes its own diff, and shows accept/revert controls. The roadmap lists "compare" as not-drawn-yet; this is a real install-and-mount, built on the same core, using `style-mod` the way our editor already does (so the same shadow-root/CSP handling applies). VERDICT: **install `@codemirror/merge`** for the compare view; feed it two texts.
- **Indentation guides** — `@replit/codemirror-indentation-markers` (6.5.3, MIT). Not a core package; Replit-maintained, so it carries third-party maintenance risk. VERDICT: **install if wanted, flag as third-party.**
- **Minimap** — `@replit/codemirror-minimap` (0.5.2, MIT). Third-party, pre-1.0, more maintenance risk than the indentation markers. VERDICT: **install only if the minimap is actually wanted; it is the weakest-supported of these.**
- **Sticky scroll** (the enclosing function header pinned at the top as you scroll its body) — no standard CodeMirror package; VS Code's is a Monaco subsystem, not liftable. VERDICT: **build from the outline we already compute, or skip; do not reach for VS Code.**

## Build from what we already have

- **Breadcrumbs** (the `file › Class › method` trail at the top) — the editor already computes the outline from the Lezer tree, and the inspector already maps the caret line to its enclosing symbol. Breadcrumbs are a second view of data we already hold: cursor position → enclosing outline nodes. VERDICT: **build-our-own, trivially**, reading VS Code only for the dropdown interaction.
- **Markdown live preview** (rendered and source in sync, Obsidian-style, past the current render/source toggle) — a decoration technique on `@codemirror/lang-markdown` (installed): hide syntax away from the cursor, render inline, keep the Markdown string as the file. The model-backed WYSIWYG libraries (ProseMirror, Milkdown, Tiptap) serialize lossily, which for a tool that writes files to the record puts edits on disk the person never made. VERDICT: **build-our-own on decorations; do not adopt a WYSIWYG library.**
- **Outline, widened** — recurse into functions for arbitrary nesting and add TypeScript `interface`/`enum`/`type`/top-level `const`; the Lezer node names already exist. VERDICT: **widen the walk** (from round 2).
- **Quick-open fuzzy match** — port VS Code's `fuzzyScorer` weight table into the renderer; drop the Python round-trip. VERDICT: **build in the renderer** (from round 2).

## Build or own in the backend

- **Workspace text search** — the Python `re` walk re-implementing `.gitignore` is the real weakness; it loses on speed and fidelity on any large workspace. Swap to a bundled `ripgrep` (`@vscode/ripgrep`, MIT), which is what VS Code itself does — its TypeScript is glue around `rg`. VERDICT: **swap to bundled `ripgrep`** (from round 2).
- **Diff as you type** — the product choice from round 2: VS Code's inline diff re-diffs git's copy against the live buffer in a worker every 200 ms; ours re-reads on save. If live hunks are wanted, lift VS Code's self-contained `diff.ts` rather than run `git diff` per keystroke.

## The settled keeps (round 2, unchanged)

- **Install and keep, owning would be foolish:** the text-editing engine (`@codemirror/state` + `@codemirror/view`) and the language grammars (`@codemirror/language`, `language-data`, the `lang-*` packages, `@lezer/highlight`).
- **Keep the package:** the in-file find match engine (`@codemirror/search` — ~400 lines of Unicode/multiline edge-handling, already decoupled from the panel); undo/redo and the default keymap (`@codemirror/commands` — the hard part rides on `@codemirror/state`, the editing commands on `@codemirror/language`, both kept anyway); vim (`@replit/codemirror-vim` — never rewrite a modal editor).
- **Keep as ours:** the diff-vs-main rendering (CodeMirror decorations — the same model VS Code uses); the large-file pager (neither engine streams from disk; ours is the only one that avoids holding a giant file in RAM — name its handoff threshold, aligned to VS Code's 20 MB / 300K lines); the file tree and tabs (both VS Code subsystems are welded to its service layer; the only liftable widget drags the whole non-React `vs/base` engine); nano bindings, the agent-following, save and the stale-write guard, encodings, the selection-to-message chip, the status line, the inspector.
- **Build if wanted, exists nowhere to lift:** case-preserving replace (absent in both CodeMirror and our find).

## Everything to take, ordered by payoff over cost

1. **Language intelligence.** The biggest capability, mostly paid for: three MIT packages plus two servers already on this machine. In scope — the servers run locally, over stdio, never contacting a third party, which is the only thing the design bars.
2. **The free switches.** Folding, line wrapping, bracket matching, auto-close brackets — already installed, unwired, near-zero cost.
3. **Workspace search → bundled `ripgrep`.** The current `re` walk is the real weakness.
4. **Compare view → `@codemirror/merge`.** A genuine install-and-mount for a feature the roadmap wants.
5. **Breadcrumbs.** A second view of the outline we already compute — nearly free, ours.
6. **Quick-open fuzzy match in the renderer; outline widened.** Small, from round 2.
7. **Optional, product-gated:** live-as-you-type diff (lift `diff.ts`); Markdown live preview (build on decorations); indentation guides / minimap (third-party installs); case-preserving replace (build).

## The rule

Install the two hard, generic things (engine, grammars) and the small well-made packages that do a bounded job on top of them (autocomplete, lint, lsp-client, merge, search). Switch on what we already carry before writing anything. Build what touches a file, a pane, or the agent, reading VS Code's and CodeMirror's source so we never solve it cold. Lift actual code only when a piece is self-contained and not worth re-deriving — `diff.ts` for live diff, the `fuzzyScorer` weight table for quick-open. The one capability the editor was most wrong to leave off — an editor that understands the code — is a package install plus a server already sitting on the machine.

## The error pattern, hunted across the rest of the project

The CodeMirror finding exposes an error pattern: a capability-rich dependency imported for one narrow job, its fuller capability never learned, so features it already offers get hand-rolled or skipped. The question is where else it occurs.

The pattern can only occur where a rich library was adopted. This project deliberately runs on almost nothing: `server.py` (333 KB) imports the Python standard library — `http.server.BaseHTTPRequestHandler` for the HTTP server, not a framework — plus one package, `msgspec`, and the local `substrate` kernel. The whole renderer's runtime dependencies are CodeMirror and React. When almost nothing rich is imported, under-using an import is not possible; the code hand-builds instead, which is a deliberate minimal-dependency trade, not this error. So the pattern concentrates at the few capability-rich dependencies, and there are only a handful.

- **CodeMirror — the strong instance.** Documented above: folding, wrapping, bracket matching, auto-close, autocomplete, lint, lsp-client, merge — all available on packages already installed or one small add, mostly unused.
- **`msgspec` — a plausible, weaker instance.** Used 16 of 24 times as `msgspec.json.decode`/`encode`, a fast JSON codec, with only two typed `Struct` schemas in the whole file. Its defining capability is typed, validated decoding into schema types; here request bodies are mostly decoded untyped. Partly justified — `server.py` is a thin HTTP layer over the kernel, which owns the typed vocabulary — so this is worth a look, not a clear miss.
- **Native find — looks like the pattern, is not.** The renderer hand-writes find (`web/app/FindBar.tsx`, `web/app/state/find.ts`) instead of Electron's built-in `webContents.findInPage`. But the transcript is windowed (`Transcript.tsx`): off-screen rows are not in the DOM, so native find would miss matches. The hand-roll is forced by the virtualization, not by missing Electron's API. Not every hand-roll is this error; some are made necessary by other choices.

The shape: the error is real but not pervasive, because the project rarely reaches for a rich library. It bit hardest at the one big library it did adopt, CodeMirror. The discipline that follows is narrow and checkable — for each capability-rich dependency actually imported (CodeMirror, Electron, `msgspec`), audit what it offers against what was hand-rolled or skipped, as done here for CodeMirror. The backend's stdlib hand-rolls (gitignore matching, SSE, file watching) are the other question — whether to have imported something richer — and the record shows those were deliberate choices (BLACKBOARD 2026-11-10: the editor stays off the kernel, no `pathspec`), not missed capability.

---

## Sources

- Registry (read 2026-11-20): `@codemirror/autocomplete` 6.20.4, `@codemirror/lint` 6.9.8, `@codemirror/lsp-client` 6.3.1 (deps include `vscode-languageserver-protocol`), `@codemirror/merge` 6.12.3, `@codemirror/language` 6.13.1, `@codemirror/view` 6.43.15, `@codemirror/commands` 6.11.1 — all MIT; `@replit/codemirror-indentation-markers` 6.5.3, `@replit/codemirror-minimap` 0.5.2 — MIT, third-party.
- This machine (read 2026-11-20): `pyright` 1.1.414 and `typescript-language-server` 6.1.0 present on PATH; `pylsp` absent.
- CodeMirror reference: codemirror.net/docs/ref/ (autocomplete, lint, lsp-client, merge, language fold/bracket APIs, `EditorView.lineWrapping`).
- VS Code (`microsoft/vscode`, read in round 2): the diff, search, outline, explorer, tabs, and undo sources, for contrast and for the two liftable files (`src/vs/base/common/diff/diff.ts`, `src/vs/base/common/fuzzyScorer.ts`).
- In-repo: `web/app/editor/*` (confirmed none of folding, wrapping, bracket matching, close brackets, autocomplete, indentation markers, minimap wired); `process/planning/2026-11-09-code-editor/ROADMAP-2026-11-09-code-editor-r20.md` (capability enumeration, the "later / not drawn yet" list). On D53: the roadmap renders it as "language servers" out of scope, but the design intent bars reaching third-party/external servers, not local language intelligence — a local server over stdio never contacts a third party and is in scope.
