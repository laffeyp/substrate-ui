# The editor level and its modes: what the shell has, how other tools do it, and how each mode gets researched (round 2)

*2026-11-04, round 2. Round 1 is `RESEARCH-2026-11-04-editor-level-and-modes.md` in this folder and stays as written. Round 2 adds: what `design/received/handoff_latest/docs/RESEARCH-2026-11-04-editor-and-media-views.md` contributes that round 1 lacked (the plain-shell pane against `PaneRegistry`, the code-boundary rule, the video cut-list shape and preview strategies, the audio filters, a name for the three-stop level); the collection; the keys across levels, modes and surfaces; and the tools and model capabilities the session lacks for the media and design modes. It corrects one round-1 statement: `web/reveal/transcript/ansi.ts` is a small terminal grid, not only a colourer (the plain-shell section).*

*Design input: sheet turns 16 and 17 in `design/received/handoff_latest/sheets/Substrate Shell Directions v3.dc.html`; decisions D48–D59, D66, D68 and D71 in `DESIGN-DECISIONS -through 2026-09-01-.md`; `MENU-BAR -2026-09-01-.md`. Prototype v7 carries none of turns 16–17.*

## What is being built

Turn 16 adds a third level. Today the shell has two, terminal and reveal. Turn 16 makes the toggle a cycle, terminal → reveal → full → terminal, on one ⌃` button whose label names the next stop (16b). The full level (16a) puts four regions around the focused session: an explorer rooted at that session's workspace, with modified-file dots from the worktree diff; a central editor with vim and nano bindings; the substrate terminal as a bottom panel; and the machinery pane on the right with the reveal's lens chips. Each region collapses: explorer and machinery to labelled rails, the terminal to a sill that keeps its input (16c, D51). There are no splits inside the full level (D49c).

Turn 17 lists what the editor's centre shows. These are modes, not levels (D49):

| Frame | Mode | Decision |
|---|---|---|
| 17a | Documents in write mode: rendered and editable, markdown underneath, `source` one toggle away | D52 |
| 17b·0 | The user's own shell as a tab beside the substrate terminal, ⌘⇧T, rooted at the workspace | D49b |
| 17b·1 | A plain-shell pane at the tiled level: no session, no record | D59 |
| 17c·0, 17c·1 | Image mode: crop, resize, annotate, convert, analyze, "ask the session"; tools as overlays with a docked action bar | D50, D59 |
| 17d·0, 17d·1 | Video: one timeline edited by the session or by hand; one cut list naming each cut's author | D50, D54 |
| 17e·0 | Audio, one file: split, trim, fade, gain, normalize, denoise, effects from scanned plugins | D58 |
| 17f | Real-time translation as `translate_in` / `translate_out` producers | D65 |
| 17g | Design mode: chat left, a pannable canvas of live HTML/CSS sheets right, comments pinned to elements | D71 |

The collection (D57, amended by D68) is not in turns 16–17, but every mode adds state it has to restore, so it joins this round.

**Scope of "most of 17", still an assumption.** Covered: 17a, 17b·0, 17b·1, 17c, 17d, 17g, and 17e without plugin hosting. Left out: 17f, a topology whose frame shows only the existing transcript and structure lens; and 17e's AU/VST hosting, which needs a native audio host that neither Electron nor the bundled Python provides.

**A word on "view".** The tone canon in `WORKING_AGREEMENT.md` reserves View for the kernel primitive. This document uses the design's words for screens: level, mode, lens, surface.

## How the frames read under the kit

Foundation 04 (`sdd-kit-3/foundations/04-sdd-claude-design.md`) says every visual state is the visible form of a domain event. Turns 16 and 17 say so in their captions: "this file's provenance — the open image came from seq 251" (17c·0); "the timeline's cut list and the record agree by construction" (17d·0); "hand edits stage on the timeline; export runs ffmpeg and the write lands on the record" (17d·1); converted files "land on the record" (D50); comments "travel as UserMessage context" (D71).

Each mode is therefore a projection of two sources the shell already treats as truth, the session record and the workspace on disk, plus ways to write to them. D1 and D2 say the UI owns no state. Two tests keep a mode inside the product:

- **The record test.** List every piece of state the mode shows and every action it offers, and name the record event or workspace file each maps to. A row that maps to neither is UI-owned state, and the design changes before the build.
- **The code-boundary test** (from the media-views doc). No mode module imports from the transcript, the lenses, or `PaneRegistry`. Modes couple to the rest of the shell only through the file system, the session's tool calls, and the dc component's level and mode state. Each mode's gate checks its imports.

The record test finds one gap shared by every editing mode. A session edit reaches the record as a `ToolCall` / `ToolResult` pair. A hand edit does not reach the record at all, yet 17d·1's cut list reads "2 · trim demo pt 1 −0:02.4 · by hand, just now" and 17e·0's edit list reads "1 · gain +2.5 dB · whole file · by hand". Three candidates: a new kernel event kind (a vocabulary change through `grammar/PRINCIPLES.md`, in the kernel repo); a `UserMessage` carrying the edit; an edit-list file in the workspace the session reads like any file. `UserMessage` today has four fields, `text`, `turn_index`, `assembled_prompt`, `slash_source` (`substrate/src/substrate/topologies/session/__init__.py:146`), so the second candidate also needs a payload change. The media-views doc treats the cut list as a data shape; it is a kernel question first.

Under the dual-contract audit (`grammar/BOOTSTRAP.md`, step 9), each record event a mode projects pairs with a view-category tag in the UI vocabulary. `web/vm/signals/versions/current.json` (v0.3) has 36 tags in 11 categories and no `view` category. Each mode's research produces its share of the v0.4 bump.

## What the current shell has and lacks

Facts from the code on 2026-11-04.

**Levels.** Component state holds `revealed: false` (`web/reveal_component.ts:98`). `renderVals` derives `showTerminal` and `showRevealed` from it (`:2265`). The button reads `panes` / `meta` (`:2279`); ⌘M toggles it (`:986`). The design and the product spec say ⌃`. Turn 16 needs a three-valued level. `RevealLevel` in `web/vm/kinds.ts` already names the all/app toggle; the media-views doc proposes `ViewLevel { Terminal, Reveal, Editor }` beside it. "View" in that name collides with the tone canon's View, so the name is settled as a vocabulary decision, with `Level` the plain candidate.

**Layout.** `web/reveal.html` (563 lines) holds every screen as an `<sc-if>` block. The full level becomes another block. The reveal's right pane is inline in the revealed block (lines 160–342) and moves into a partial before 16a can reuse it; `includePartials` in `vite.config.ts` already inlines two partials.

**Stateful widgets.** dc-runtime (`web/public/support.js`) clears a mount div's children on every commit. `web/reveal.ts:192–240` re-attaches the transcript's React root through a `MutationObserver`, keyed by `view:paneId`, where `view` is only `terminal` or `reveal`. Every mode in turn 17 is a stateful widget (an editor's undo history, a terminal's scrollback, a `<video>` playhead, a canvas). The island code needs to become a registry of widget kinds, and whether a re-attach keeps a widget's internal state is untested. The media-views doc's statement that `Transcript.tsx` "does not care where in the DOM it sits" is wrong for this reason; a bottom-panel transcript needs a third `view` value.

**Organization.** `reveal_component.ts` is 2,576 lines, one `@ts-nocheck` class. Each mode is its own typed module mounted as an island; the dc component keeps the level, the active mode, and region sizes.

**React.** `reveal.html:11–12` loads React 18.3.1 from cdnjs. Mode libraries are bundled by Vite.

**Workspace files.** No endpoint lists, reads or writes workspace files. `/api/worktree_diff` (`server.py:4352`, body at `:2009`) serves session worktrees only and refuses other paths (lens audit F301). Flat and blank workspaces get no modified-file dots. `watchfiles` 1.2.0 imports in the kernel environment but `../substrate/pyproject.toml` does not declare it.

**PTY.** `_cli_pty_start` (`server.py:1437`) runs a login command from `KNOWN_CLI_ADAPTERS` in a pseudo-terminal, buffers 512 KB, streams over SSE, takes input by POST, and never sets the window size. `web/reveal/transcript/ansi.ts` is a CSI grid written for login screens: SGR colour, cursor moves and absolute positioning, erase in line and display. Its header lists what it leaves out: alternate screen buffer, scroll regions, mouse tracking, character sets. vim, `less` and `htop` need the first two, so the plain shell needs a full emulator. Product spec round 15 lists "Not a real PTY" as deferred; 17b ends that deferral.

**Panes.** `PaneRegistry.spawn` (`web/vm/pane_registry.ts:39`) creates a `SessionController` for every pane id, so every pane today is a session pane, bound or unbound. 17b·1's plain-shell pane is the first pane with no session. The media-views doc names the consequence: a pane type of `SessionPane | ShellPane`, touching the pane loop in `reveal.html`, the top bar, focus, and the level cycle, since a shell pane has no record to reveal.

**Electron.** The window runs with `contextIsolation`, `sandbox`, no `nodeIntegration` (`electron/main.js:342–345`). Native modules such as node-pty and `child_process` calls run in Electron main or the Python backend, never the window. The media-views doc's `child_process.spawn` for ffmpeg and `sharp` / `jimp` for images assume a Node backend; the backend is Python.

**Media binaries.** Electron's bundled ffmpeg includes H.264 by default, so `.mp4` plays in `<video>` (Electron's `build/args/release.gn` and its proprietary-codecs test page, via mirrors; to confirm on Electron 44). ffmpeg 8 is on this machine only as `/opt/homebrew/bin/ffmpeg`; the app bundle has none. ImageMagick is absent, though 17c's example tool call runs `magick`. `sips` is at `/usr/bin/sips`; Pillow 12.3.0 imports in the kernel environment, undeclared.

**Gates.** `npm run gates:electron` chains 45 gate scripts in `harness/shakeout/`. Each mode adds at least one, under Addendum A1's three lenses; Addendum A2's pixel decode fits the crop result and the waveform envelope.

## The collection

**What the design says.** D57: the collection is the whole UI configuration (windows, pane grids, pane-to-session bindings, each pane's level, lens choices, collapsed states, focus), restored exactly on relaunch. D68 (2026-09-03) supersedes D57's save-and-browse surface: a collection is what is open, membership is automatic, there is no save verb and no browse place, and persistence across quit is the app's own whole-state restore. D66(a) ratifies SQLite as the app-state store. `MENU-BAR -2026-09-01-.md` rule 3 repeats D68 and bans the word "arrangement".

**Prior work, all unbuilt.** The collection was designed and carded, never implemented.

- `process/sprints_v0.1/sprint-043-collection-persist.md` and `sprint-044-collection-restore.md`, status `pending`, target the September prototype-port tree (`bridge/main.py`, `src/render/CollectionSaveDialog.tsx`, `src/reducer/ShellReducer.ts`). That tree now sits at `../substrate-ui-old-versions/substrate-shell-abandoned-2026-09-08/` with six sprint cards and no collection code. Both cards keep a save verb ("Menu Collection ▸ Save", ⌘⇧S, files at `~/.substrate/collections/<name>.sqlite`), which D68 retired. Sprint 044's restore rule still holds: a session gone between save and restore comes back as an unbound pane with a hint row.
- The abandoned tree's vocabulary rationale (`signals/0.1-rationale.md`) names `COLLECTION_OPENED` and `COLLECTION_CLOSED` with `thing_kind` in `session / record / assay / studio / shell`, and scopes the SQLite writes as "shell app-store internals, not events". That scoping is the useful part: the collection is persistence of UI layout, and it does not belong on any session record.

**What the shipped app does today.** On launch, `electron/main.js:379` loads `/?atom-transcript=1&electron=1` with no session id, so a relaunch opens one empty pane. `reveal.ts:97–101` attaches `?session=<id>` when the URL carries it, which covers a reload, not a relaunch. Theme, type size and the nested-descent setting persist in `localStorage['substrate-ui.settings']` (`reveal_component.ts:893–905`; phase 7 status: "whole-state restore stays SQLite per D68"). Pane grid, bindings, level and lens choices are lost on quit. Electron's `userData` is set to a `profile` folder under the app root (`main.js:52`).

**What restore has to cover once the editor level exists.** Per window: bounds, the pane grid with its `fr` weights, focus. Per pane: kind (session or shell), bound session id or shell working directory, level, active lens and granularity, for the full level the open file, cursor, scroll, active mode and each region's collapsed state. A shell pane restores its working directory and starts a fresh shell; its process and scrollback do not survive.

**Prior art, to verify in the collection research.** The media-views doc cites iTerm2 restoring window arrangements from a plist under `~/Library/Application Support/iTerm2/`, Ghostty restoring layout and starting fresh shells, and VS Code keeping workbench state in SQLite. None of the three was checked this round; the collection's research document reads each one's documentation or source before relying on it.

**Hazards.** A binding to a session that ended while the app was closed (sprint 044's unbound-pane rule covers it). A workspace folder that moved or was deleted (gate `missing_workspace_named.ts` already covers the session side). Two processes writing the store; Substrate runs one app per machine, so this means only the dev and installed apps overlapping, which is transitional.

## Keys across levels, modes and surfaces

**What is bound today.**

| Key | Where | Action | Source |
|---|---|---|---|
| ⌘M | window | toggle panes / meta | `reveal_component.ts:986` |
| ⌘E | window | open or close every tool card | `:988` |
| ⌘D, ⌘⇧D | window | split right, split down | `:989` |
| ⌘F | window | open or close find in the transcript | `:990` |
| ⌘, | window | settings | `:991` |
| Esc | window | close find → dialogs → dropdowns → surface → else interrupt the running turn (hard); ⇧Esc soft | `:992–1015` |
| ⌃C | any INPUT or TEXTAREA, caret only | interrupt the turn | `reveal.ts:179–190` |
| arrows, ↵ | records surface; unbound pane's workspace bar; language lens | list and lens navigation | `:946–985` |
| ⌘N, ⌘O, ⌘W, ⌘⇧W | menu | new window, open record, close pane, close window | `electron/menu.js:57–90` |
| ⌘Z, ⇧⌘Z, ⌘X, ⌘C, ⌘V, ⌘A | menu, `editMenu` role | standard editing | `menu.js:95` |
| ⌃⌘F, ⌘0, ⌘+, ⌘−, ⌘R, ⌥⌘I | menu, View roles | full screen, zoom, reload, developer tools | `menu.js:105–112` |

**Designed and unbound.** ⌃` level cycle (spec keyboard map, MENU-BAR View); ⌘⇧T plain shell; ⌘1 / ⌘2 / ⌘3 Records / Studio / Assays; ⌘] / ⌘[ next and previous pane. The built menu also disagrees with the menu-bar doc: the doc has New Session ⌘N, New Window ⇧⌘N and Open Workspace ⌘O; the app has New Window ⌘N and Open Record ⌘O. MENU-BAR rule 2 says the menu's keys are the canonical bindings and tooltips agree with them.

**Collisions the editor level creates.**

- **Esc.** vim's normal mode, CodeMirror's search panel, the crop tool ("esc cancels", 17c·1), and every program in the plain shell consume Esc. The window handler checks open find bars, dialogs, dropdowns and surfaces, never the focused element, so Esc in any of those would also interrupt the session's running turn.
- **⌃C.** `reveal.ts` treats any focused INPUT or TEXTAREA as the prompt. xterm.js is commonly described as taking keyboard input through a hidden helper textarea; if it does, ⌃C in the plain shell interrupts the session and calls `preventDefault`, so SIGINT never reaches the shell. A test settles it.
- **⌘F.** Find in the transcript, CodeMirror's search, and xterm's search addon each want it. It goes to whatever has focus.
- **⌘D.** Split at the tiled level; the full level has no splits (D49c). CodeMirror's search keymap is commonly bound to Mod-d for "select next occurrence"; check the installed `@codemirror/search` keymap.
- **⌘W.** Closes a pane today. In an editor, users expect it to close the file. The full level has one editor and no tabs (D44), so ⌘W there either closes the open file or leaves the level. It is a decision, recorded.
- **⌘Z.** The `editMenu` role's Undo sends the window's native undo; CodeMirror keeps its own history and binds Mod-z. A VS Code issue (#64724) reports a key firing twice, once through a native menu item and once through a forwarder in a webview; a Qiita note reports that `preventDefault` in keydown suppresses the Electron accelerator. Neither is authoritative for Electron 44, so the editor's research tests ⌘Z in the packaged app.
- **Space, J, K, L, I, O.** Video and audio transport conventions (play and pause, shuttle, in and out marks) are plain letters. They act only while the timeline has focus, never while a text field does.

**How other tools route keys.** VS Code's keybinding rules carry a `when` clause (`editorTextFocus`, `!editorReadonly`); rules are evaluated bottom to top and the first rule matching both key and `when` wins, and user rules are appended after the defaults. Its terminal intercepts only commands on `terminal.integrated.commandsToSkipShell`, a hard-coded default list the user can edit; `sendKeybindingsToShell` sends most keys to the shell instead, and its docs warn this disables ⌘F find in the terminal; chords skip the shell by default (VS Code docs, "Keyboard shortcuts" and "Terminal advanced"). xterm.js's `attachCustomKeyEventHandler` runs before xterm processes a key, and returning `false` stops xterm from handling it (xterm.js API docs). Electron's `before-input-event` fires before the window dispatches keydown (Electron docs, "Keyboard Shortcuts").

**What follows for Substrate.** One keymap table, each binding carrying a focus context: tiled terminal, reveal, full-level editor text, write mode, plain shell, image tool, timeline, dialog, surface. The window handler looks up the focused context before acting, which fixes Esc and ⌃C at their source. The plain shell keeps a short list of keys it never sends to the shell (⌃`, ⌘D, ⌘⇧T, ⌘W, ⌘,), in the manner of `commandsToSkipShell`, through `attachCustomKeyEventHandler`. Region toggles in the full level need keys the design never named: explorer, bottom panel, machinery, write/source. VS Code's defaults are ⌘B, ⌘J and ⌥⌘B for side bar, panel and secondary side bar; check them against VS Code's default keybinding list before adopting. The menu gains the full-level verbs and the menu-bar doc's open disagreements get one recorded answer each.

## Tools and model capabilities the session lacks

**What the session has.** Eleven file and shell tools in `full_suite` (`substrate/src/substrate/topologies/tool_loop/tools.py:619`): `bash`, `bash_output`, `bash_stop`, `bash_tasks`, `edit_file`, `glob`, `grep`, `list_dir`, `read_file`, `web_fetch`, `write_file`. Substrate's own tools in `substrate_tools.py`: `run_topology`, `run_topology_poll`, `inspect_record`, `list_records`, `list_topologies`, `list_applications`, `list_sessions`; plus `delegate`. Every media operation today runs through `bash`.

**The MCP channel goes one way.** `topologies/session/mcp_channel.py` serves the session's tools to a harness driver (`claude`, `codex`, `cursor-agent`) and records each call as Substrate's own `ToolCall` with `origin = mcp`. The session cannot call an outside MCP server; the tech spec's "Substrate as MCP client" module, `tool_loop/mcp_tools.py`, does not exist. A harness driver can use its own configured MCP servers, and those calls show as harness tool cards (design spec round 4, R4).

**Gaps, by what each mode needs.**

| Gap | Needed by | Fact |
|---|---|---|
| The model cannot see an image | 17c "ask the session"; 17g the session looking at its own sheet; 17d describing a frame | No code in `tools.py` or `adapters/models.py` sends an image. Ollama's `/api/chat` takes base64 images in a message's `images` array (Ollama docs, "Vision"). On this machine only three cloud models report `vision` from `/api/show`: `kimi-k2.6:cloud`, `kimi-k2.7-code:cloud`, `kimi-k3:cloud`. No local model does. |
| `UserMessage` carries text only | 17g comment pins; 17c "ask"; a selection sent from the editor | Fields are `text`, `turn_index`, `assembled_prompt`, `slash_source`. An attachment field is a `PAYLOAD_FIELD_PROPOSED` on the kernel's session vocabulary. |
| Named media tools | 17d, 17e (D54 lists probe · cut · trim · concat · export; 17e·0 lists probe · cut · fade · gain · loudnorm · export) | Today these are `bash` calls to ffmpeg. Named tools in `tool_loop` give typed arguments, the same function the timeline calls, and one record event kind for both hands. ffmpeg is not in the bundle. |
| Finding dead air and scene cuts | 17d·0 "cut the dead air between 0:41 and 1:02" | The installed ffmpeg has `silencedetect` (noise default 0.001, minimum duration default 2 s) and `scdet` (threshold default 10 of 100). |
| Word-timed transcripts | Cutting by what was said, Descript's model | `whisper-cli` (whisper.cpp) is at `/opt/homebrew/bin/whisper-cli` and offers `-ojf` (full JSON), `-ml` (max segment length) and `-sow` (split on word). No `ggml-*.bin` model file was found within six directory levels of home. ffmpeg 8 can be built with a `whisper` filter; the installed build lacks it. |
| Audio processing | 17e | The installed ffmpeg has `afade`, `afftdn`, `arnndn` and `loudnorm`. `arnndn` needs a separate model file. |
| Image operations | 17c | Pillow 12.3.0 (undeclared) and `sips` are present; ImageMagick is not. |
| Rendering a sheet to look at it | 17g | Electron's `webContents.capturePage` in main, or Playwright, already a devDependency at `^1.49.0` for the gates. Microsoft's Playwright MCP is snapshot-first: its README calls screenshots advisory, and actions go through the accessibility snapshot (third-party reviews quoting the README). |

**Outside MCP servers for media.** Third-party ffmpeg MCP servers exist: `mcp-video` on PyPI claims 82–87 tools across versions; others expose a single `execute_ffmpeg` that takes a command string. These are package listings, not audited code. A server whose one tool takes a raw ffmpeg command gives the session nothing `bash` lacks. A large third-party server puts dozens of tool names in front of the model that the timeline does not share, which breaks D54's rule that hand and session run the same operation. Named tools in `tool_loop`, matching the timeline's operations one for one, keep both hands on one record event kind. Building the MCP client stays the tech spec's Wave-B item; nothing in turns 16–17 needs it.

## How established tools solve each mode

Each row names the source and its genre: vendor documentation describes its own product, an engineering post is the team's own account, a README is a project's claim about itself, a forum thread is one person's report.

**The full level's layout.** VS Code's workbench has the same four regions (side bar, editor, panel, secondary side bar), and so does Zed. The lesson the media-views doc draws holds: explorer, editor and terminal share only a workspace root and couple through the file system.

**The text editor.** CodeMirror 6 over Monaco. Sourcegraph's engineering post on leaving Monaco: about 2.4 MB, roughly 40% of the JavaScript on their search page; a global model that made several configured instances hard; theme colours as hex values in JavaScript. Replit's post records the cost: features they had used in Monaco did not exist in CodeMirror 6, and they built them. D53's OUT list (debuggers, language plugins, extension marketplaces) is what Monaco's weight buys. Packages, from npm on 2026-11-04: `@codemirror/view` 6.43.15 (MIT), `@replit/codemirror-vim` 6.4.0 (MIT). In-file search is `@codemirror/search`; global search is a backend `rg` call. Nano bindings are a small keymap. D53's exclusion list is the guard against the pull toward language servers and autocomplete once an editor exists.

**17a write mode.** Two families differ on the property D52 depends on. Source-backed live preview keeps the markdown string as the document and hides syntax away from the cursor with CodeMirror 6 decorations (Obsidian plugin docs; forum posts on Live Preview; Atomic Editor and Silkdown READMEs). A save writes back the bytes typed. Model-backed WYSIWYG (ProseMirror, Milkdown, Tiptap) parses to a node tree and serializes on save; ProseMirror's forum states the markdown conversion is lossy, and `prosemirror-markdown` issue #82 reports nested marks of one type cannot be serialized; Tiptap claims fidelity (vendor). The session writes these files with `write_file`, so a lossy save rewrites the session's markdown and puts diffs the user never made on the worktree and the record. Source-backed is the fit; the cost is syntax showing at the cursor, less like Google Docs than D52 asks. The media-views doc's round-trip test diffs the DOM tree after toggling, which passes on exactly the loss that matters. The test is: open a file the session wrote, edit one word by hand, save, and diff the file's bytes; only that word changes.

**17b the plain shell.** VS Code, Hyper, Tabby and Wave Terminal draw with xterm.js and run the shell behind a PTY in a separate process (VS Code's pty host runs node-pty, per third-party descriptions; check `src/vs/platform/terminal`). node-pty's README states every spawned process runs at the parent's permission level and that the library is not thread-safe. Packages: `@xterm/xterm` 6.0.0, `@xterm/addon-fit` 0.11.0 (MIT). The Python backend already holds a PTY; it needs a shell spawn and a resize. Transport is the open question: today's SSE out and POST in costs a request per keystroke. The other known pitfall: a shell not killed when its pane closes leaks a process; the gate checks no orphaned shell remains after close.

**17c image mode.** macOS Preview is the benchmark for "basic but real". Crop and annotate overlays are canvas work; a histogram is `getImageData`. Toast UI Image Editor (crop, flip, rotate, resize, draw, shapes, text) and Fabric.js (a canvas object model, used by projects that keep annotations as overlay objects apart from base pixels) are the libraries the media-views doc names; neither was checked this round. Conversion runs in the backend through Pillow or `sips`, the same operation the session's tool calls (D50).

**17d video.** LosslessCut, an Electron app that keeps a cut list and exports through ffmpeg, states in its README that lossless cuts copy streams and land on keyframes, with "keyframe cut" placing `-ss` before `-i` and "normal cut" after. 17d·0 shows a cut at 0:41.6, so the research decides between keyframe stream copy and re-encoding around each cut. Descript's help pages describe the transcript as the editing surface: deleting text hides media without destroying it, a timeline stays available, and the edit exports as an XML edit record; that is D54 with a transcript in place of the session. From the media-views doc: a cut-list entry shaped `{type, start, end, author: 'hand' | {seq}}`; two preview strategies, skipping cut regions during playback for interaction and rendering through ffmpeg for export; and the coupling risk that tool results must reach the timeline. That routing goes through the record the timeline already projects, never through a call from the session controller into the timeline module.

**17e audio.** wavesurfer.js 8.0.5 (BSD-3-Clause) draws the waveform; its Regions plugin gives draggable segments and its Envelope plugin a fade curve; its docs leave trim and export to the application. The edits run in ffmpeg (filters listed under the tools gap) or the Web Audio API for preview. Plugin hosting needs JUCE (`JUCE_PLUGINHOST_AU`, `JUCE_PLUGINHOST_VST3`) or a host like minihost (PyPI, JUCE-based, Python bindings), scanned out of process because plugins can pass a scan and freeze the host (JUCE forum report).

**17g design mode.** The handoff's `.dc.html` sheets are live HTML/CSS frames on a pannable canvas, rendered by the `support.js` runtime the shell already loads; 17g's sheets are the same kind of file. Figma pins a comment to a canvas element; D71 sends that pin into the next `UserMessage`, which needs the attachment field above. Each sheet renders in a sandboxed `<iframe srcdoc>` so its CSS cannot reach the shell's.

## Researching each mode before building it

Each mode gets one research document in this folder answering the same questions, with sources, before any sprint card is written.

1. **Record contract.** Which record events the mode projects; which events each hand action produces; whether a kernel vocabulary change is needed and of which proposal type. A row that maps to neither record nor workspace fails D1 and D2.
2. **Session parity and model capability.** Which tool the session uses for the same operation; the hand path and the session path produce one event kind. Which model capability the mode assumes (vision, speech-to-text) and which installed models provide it.
3. **Prior art.** Two or three tools, read from docs or source, labelled by genre; what we copy and what D53 refuses.
4. **Library and bridge mapping.** Package, API read from installed source (TECHNIQUES #46) into `WORKING_AGREEMENT.md`'s bridge mappings, bundled size after `vite build`, licence against PolyForm Noncommercial.
5. **Shell seam.** Island kind, dc-component state, partial, and what the collection restores for it.
6. **Keys.** Every key the mode binds, its focus context, and a check against the keymap table for collisions with existing and designed bindings.
7. **UI vocabulary.** View-category tags proposed for v0.4, one dual-contract audit row per projected record event.
8. **Observation contract.** The Electron gate, with structural, decode and adversarial checks (Addendum A1, A2), including the code-boundary import check.
9. **Scope line.** In and refused, against D53's bar.

**Order.** Shared work first, then modes as their dependencies allow.

0. **Shared seams, once.**
   - (a) The level state: three values replacing `revealed`, the name settled, ⌘M and ⌃` settled.
   - (b) The island registry, with the re-attach test: does a CodeMirror instance keep undo history and cursor across a dc-runtime commit?
   - (c) The workspace file API: list, read, write, watch, confined per workspace shape as `_worktree_diff` is.
   - (d) How a hand edit becomes a record event, researched in the kernel repo.
   - (e) The keymap table with focus contexts; fixes Esc and ⌃C before any widget that consumes them mounts.
   - (f) Model input beyond text: images to the responder, attachments on `UserMessage` (kernel).
   - (g) The pane type: `SessionPane | ShellPane` in `PaneRegistry` and the pane loop.
1. **16, the full level, with code mode.** Every other mode mounts inside it; reuses the machinery pane as a partial and the transcript with a third `view` value.
2. **The collection.** Its data shape includes the full level's state, so it follows 16; SQLite per D66, no save verb per D68, the unbound-pane rule from sprint 044.
3. **17b·0 and 17b·1, the plain shell.** Backend PTY plus resize and shell spawn; xterm.js; the shell pane type from 0(g); the skip-shell key list.
4. **17a, write mode.** Reuses CodeMirror; settles source-backed versus model-backed with the byte-diff test.
5. **17c, image mode.** First hand edit that writes a file; first use of 0(d) and 0(f).
6. **17g, design mode.** Canvas, sandboxed sheets, comment pins through 0(f), sheet capture for a vision model.
7. **17d, video.** Named media tools, `silencedetect`, the bundling decision for ffmpeg, keyframe versus re-encode, optional word-timed transcripts through whisper.cpp.
8. **17e, audio, without plugin hosting.** Reuses 17d's timeline, edit list and named tools; adds wavesurfer.js.

## Open

- The scope of "most of 17": assumed out are 17f and 17e's plugin hosting.
- How a hand edit reaches the record blocks the editing modes; it does not block 16 with read-only code, the collection, or 17b.
- Vision runs only on three cloud models on this machine; whether image modes require a cloud model or a local vision model gets pulled is part of 17c's research.

## Sources

Local: `design/received/handoff_latest/README.md`; sheet turns 16–17; `DESIGN-DECISIONS -through 2026-09-01-.md` (D48–D59, D66, D68, D71); `MENU-BAR -2026-09-01-.md`; `DESIGN-SPEC-2026-08-31-round4.md`; `design/received/handoff_latest/docs/RESEARCH-2026-11-04-editor-and-media-views.md`; product spec round 15 ("The UI — two views, one toggle", "What this deliberately is not"); tech spec round 9 ("Extension seams", "Piece G"); `process/sprints_v0.1/sprint-043-collection-persist.md`, `sprint-044-collection-restore.md`; `../substrate-ui-old-versions/substrate-shell-abandoned-2026-09-08/signals/0.1-rationale.md`; `process/planning/2026-09-14-flat-design-parity/STATUS-2026-09-14-phase-7-closed.md`; `sdd-kit-3/` in full; the code paths cited above; `ffmpeg -h filter=…`, `whisper-cli -h`, `curl :11434/api/show` and `npm view`, run 2026-11-04.

Outside, as read on 2026-11-04:

- VS Code docs, "Terminal advanced" (`commandsToSkipShell`, `sendKeybindingsToShell`, chords): https://code.visualstudio.com/docs/terminal/advanced
- VS Code docs, "Keyboard shortcuts" (`when` clauses, rule order): https://code.visualstudio.com/docs/configure/keybindings
- Electron docs, "Keyboard Shortcuts" (`before-input-event`, `acceleratorWorksWhenHidden`): https://electronjs.org/docs/latest/tutorial/keyboard-shortcuts
- VS Code issue #64724 (key firing through menu and webview): https://github.com/microsoft/vscode/issues/64724
- Qiita note on `preventDefault` and Electron accelerators (single blog test): https://qiita.com/pochman/items/3aa40ad71e5320192820
- xterm.js `Terminal` API docs (`attachCustomKeyEventHandler`): https://xtermjs.org/docs/api/terminal/classes/terminal ; xterm.js PR #712: https://github.com/xtermjs/xterm.js/pull/712
- Ollama docs, "Vision": https://docs.ollama.com/capabilities/vision ; OpenAI compatibility: https://docs.ollama.com/openai
- `mcp-video` on PyPI (package listing): https://pypi.org/project/mcp-video/1.2.2/ ; Video Editor MCP Server listing: https://lobehub.com/ko/mcp/christopher-stevers-video-mcp ; video_editor_mcp: https://awesome.ecosyste.ms/projects/github.com%2Fkush36agrawal%2Fvideo_editor_mcp
- Playwright MCP (Microsoft) project listing: https://awesome.ecosyste.ms/projects/github.com%2Fmicrosoft%2Fplaywright-mcp ; review quoting the README: https://testingbot.com/resources/articles/playwright-mcp
- whisper.cpp CLI README: https://huggingface.co/datasets/echodict/whisper.cpp/blob/main/examples/cli/README.md ; token-level JSON commit: https://huggingface.co/spaces/Xenobd/whisper.cpp/commit/d1667419b1de8326d49fd69eff8a0fe3acbf883d
- Sourcegraph, "Migrating from Monaco Editor to CodeMirror": https://sourcegraph.com/blog/migrating-monaco-codemirror
- Replit, "Betting on CodeMirror": https://blog.repl.it/codemirror
- Obsidian docs, "Decorations": https://docs.obsidian.md/Plugins/Editor/Decorations ; forum thread: https://forum.obsidian.md/t/simplest-possible-example-of-a-decorating-editor-extension/91652
- Atomic Editor: https://github.com/kenforthewin/atomic-editor ; Silkdown: https://sveltethemes.dev/magarcia/silkdown
- ProseMirror forum on lossy markdown: https://discuss.prosemirror.net/t/possible-to-collaborate-in-different-docformat-of-the-same-document/63 ; `prosemirror-markdown` #82: https://github.com/ProseMirror/prosemirror-markdown/issues/82
- Tiptap markdown (vendor post): https://tiptap.dev/blog/release-notes/introducing-bidirectional-markdown-support-in-tiptap
- Electron `release.gn` and codec test page (mirrors): https://source-hub.etos-pro.ru/Electron/electron/src/branch/main/build/args/release.gn ; https://ayakael.net/mirrors/electron/commit/5b4f715d2e6ffc1427205448825e85857f28240b
- node-pty README: https://lively-kernel.org/lively4S2/lively4-server/node_modules/node-pty/README.md
- LosslessCut README (mirror): https://git.morozoff.pro/aiden/lossless-cut/src/tag/v3.4.0
- Descript help centre: https://help.descript.com/hc/en-us/articles/15726742913933 ; review: https://www.tella.com/blog/descript-video-editing-how-does-it-work
- wavesurfer.js Regions plugin: https://wavesurfer.xyz/docs/plugins/regions/ ; plugin list: https://wavesurfer.xyz/docs/plugins/
- minihost (PyPI): https://pypi.org/project/minihost/ ; JUCE `juce_audio_processors`: https://www.ccoderun.ca/juce/api/juce__audio__processors_8h.html ; JUCE forum, VST3 scan freeze: https://forum.juce.com/t/problems-scanning-vst3-plugins-multiport-midi-perhaps/37190
