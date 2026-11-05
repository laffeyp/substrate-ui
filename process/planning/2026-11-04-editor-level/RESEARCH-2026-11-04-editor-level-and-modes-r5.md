# New views in substrate-ui: a code editor, media editors, a plain shell and a design canvas (round 5)

*2026-11-04, round 5. Round 5 copies round 4 and recasts "What the app has and lacks for the new views" as one table of what the app has and lacks per area. Rounds 1–4 stay in this folder as written.*

*Round 4's note: 2026-11-04, round 4. Round 4 copies round 3 and adds "The terminal": the user's own shell behind a PTY, the choice of emulator, and what the plain shell changes in the existing login PTY. Rounds 1–3 stay in this folder as written.*

*Round 3's note: rounds 1 and 2 stay in this folder as written. This round follows the Architect's decision of 2026-11-04 (`BLACKBOARD.md`, `user` entry): each new view is a view of its own, opened by its own command and listed in the menu bar, with its own key bindings while it is open; the design's ⌃` three-stop cycle (D48, D49) is not adopted; the app's names are used throughout (panes, meta), not the design's ("terminal", "reveal"). Round 2's keys section is dropped.*

*Design input: sheet turns 16 and 17 in `design/received/handoff_latest/sheets/Substrate Shell Directions v3.dc.html`; decisions D50–D59, D66, D68, D71 in `DESIGN-DECISIONS -through 2026-09-01-.md`; `MENU-BAR -2026-09-01-.md`. Prototype v7 carries none of turns 16–17.*

## What is being built

Seven new views, each opened by its own command and its own menu item, each with its own key bindings while it is open.

| View | What it is | Sheet frames | Decisions |
|---|---|---|---|
| Code editor | A classic code editor, the shape VS Code and Zed use, built into substrate-ui around one session: a file tree rooted at the session's workspace, with dots on files the session changed; a text editor with vim and nano bindings and in-file and global search; the session's transcript and input bar as the bottom panel; meta's machinery as the right panel. Each panel collapses to a labelled rail or, for the transcript, to a sill that keeps the input bar. | 16a, 16c | D48 (layout only), D51, D53 |
| Document editor | Markdown that looks and edits like a document, with the markdown source one toggle away | 17a | D52 |
| Image editor | Crop, resize, annotate, convert, analyze, and "ask the session"; each tool is an overlay on the image with a docked action bar | 17c·0, 17c·1 | D50, D59 |
| Video editor | One timeline, cut by the session or by hand, with a cut list that names who made each cut; export through ffmpeg | 17d·0, 17d·1 | D50, D54 |
| Audio editor | One file: split, trim, fade, gain, normalize, denoise | 17e·0 | D58 |
| Plain shell | The user's own shell, rooted at the workspace: a tab in the code editor's bottom panel, and a pane among the panes with no session and no record | 17b·0, 17b·1 | D49b, D59 |
| Design canvas | Chat on the left; on the right a pannable canvas of the session's HTML/CSS design sheets, with comments pinned to elements and sent with the next message | 17g | D71 |

Each view acts on the focused pane's session, full window, as meta does. A file of the matching type opened from the code editor's file tree opens in its view; the design's "open in place like any file" (17c·0) holds through that path.

**Scope assumption.** "Most of 17" is taken to leave out 17f, real-time translation, which is a topology shown in the existing transcript and structure lens and needs no new view, and 17e's AU/VST plugin hosting, which needs a native audio host that neither Electron nor the bundled Python provides.

## Meta is the pattern

Meta is the one view the shipped app already has beside panes, and every new view follows its shape. Facts from `web/reveal_component.ts`, `web/reveal.html`, `web/reveal.ts`, `web/reveal/language_lens.ts`, `web/reveal/timeline.ts`, `electron/menu.js` and `web/vm/session_controller.ts`, read in full on 2026-11-04.

**How it opens.** Three paths run `_toggleMeta` (`reveal_component.ts:1090`): ⌘M, handled in the window; View ▸ Meta in the menu bar (`menu.js`, id `menu-toggle-meta`, no key shown, because Electron on macOS cannot show a menu key without registering it, per U147); and the top-bar button, which reads `meta` in panes and `panes` in meta. Meta does not open while the focused pane is at its workspace picker with no session. The Architect named it on 2026-10-11, and U147 renamed the menu's "Toggle Reveal ⌃`" to "Meta".

**Its state.** One boolean, `revealed` (`:98`), beside `surface` (records, assay, studio). A surface draws over both panes and meta (`showTerminal: !surf && !state.revealed`, `showRevealed: !surf && state.revealed`, `:2265`). ⌘D or ⌘⇧D from meta makes a pane and returns to panes (U146, `_split` sets `revealed: false`). Meta's own state: the active lens, the stream's all/app filter and direction, the selected seq, the language lens's stream, lane and view, and the split ratio `revealL` (0.5–3).

**Its left side.** The focused pane's transcript, the same React `Transcript` panes uses (the `view` prop keys only its scroll anchor), the activity line with the guidance, length and tone tail, background-task rows, and the same input-bar partial (U141).

**Its right side, the machinery.**

| Lens | What it shows | Data |
|---|---|---|
| stream+graph | Every envelope: seq, `t+` time, kind, producer, gist. `all`/`app` hides 11 plumbing kinds. Down: three lanes (model, delegate, external) with connectors. Side: a bar chart with a lane for model, each tool name, ⑂ delegate, returned. Follows the bottom until scrolled (U158). | `rawEnvelopes`, from the session's SSE stream |
| i/o | UserMessage, ModelReply, FinalAnswer and ToolResult texts in seq order | `rawEnvelopes` |
| structure | Events (what emits each, which triggers it fires), producers, triggers, views, ends, routes, run; each heading defined on hover | `/api/records/s_<id>/topology_graph` |
| language | 13 watched measures as lanes over turns; streams replies, messages, turns; views bars, deviation, ribbons, side by side, measures; its own keys ↑↓ ←→ ↵; `/language` opens it | `/api/session/<id>/language` |
| scene | A 2-D grid up to 20×20 from a payload's `grid`, `cells` or `matrix` | `rawEnvelopes` |

A click on a stream row opens an inspector under it: kind, seq, schema, time ("t+42.6s · 1.38s into turn 0"), producer, payload JSON. Its content blocks are always empty (`content: []` when the envelope is built), and the design's CAUSED BY → LEADS TO provenance (D22) is not drawn. The down graph has three fixed lanes rather than one per producer kind, with no sub-tracks for overlapping calls (D29). ⌘F finds in the transcript or the stream, by whichever side was clicked last. Gates: `graph_model_lane_on_resume`, `stream_follows_bottom`, `stream_reconnect`, `structure_lists_producers`, `app_view_delegate_lane`, `split_returns_to_panes`, five `language_*`.

**What meta tells the new views.** A view is a full-window projection of the focused session's record, with its own command, its own menu item, its own state, and its own keys while open (the language lens's arrows are the precedent). The code editor reuses meta's two halves: the transcript and input bar move to its bottom panel; the machinery moves to its right panel.

## How the frames read under the kit

Foundation 04 (`sdd-kit-3/foundations/04-sdd-claude-design.md`) says every visual state is the visible form of a domain event. Turns 16 and 17 say so in their captions: "this file's provenance — the open image came from seq 251" (17c·0); "the timeline's cut list and the record agree by construction" (17d·0); "hand edits stage on the timeline; export runs ffmpeg and the write lands on the record" (17d·1); converted files "land on the record" (D50); comments "travel as UserMessage context" (D71).

Each view projects two things the app already treats as truth, the session record and the workspace on disk, and writes to them. D1 and D2 say the UI owns no state. Two tests keep a view inside the product:

- **The record test.** Every piece of state the view shows and every action it offers maps to a record event or a workspace file. A row that maps to neither is UI-owned state, and the design changes before the build.
- **The code-boundary test.** No view module imports from the transcript, the lenses or `PaneRegistry`. A view couples to the rest of the app through the file system, the session's tool calls, and the component's record of which view is open. Each view's gate checks its imports.

The record test finds one gap every editing view shares. A session edit reaches the record as a `ToolCall` / `ToolResult` pair; a hand edit does not reach it, yet 17d·1 lists "2 · trim demo pt 1 −0:02.4 · by hand, just now" and 17e·0 lists "1 · gain +2.5 dB · whole file · by hand". The candidates are a new kernel event kind (a vocabulary change under `grammar/PRINCIPLES.md`, in the kernel repo), a `UserMessage` carrying the edit, or an edit-list file in the workspace. `UserMessage` has four fields today, `text`, `turn_index`, `assembled_prompt`, `slash_source` (`substrate/src/substrate/topologies/session/__init__.py:146`), so the second candidate also needs a new field.

Under the dual-contract audit (`grammar/BOOTSTRAP.md`, step 9), each record event a view shows pairs with a view-category tag in the UI vocabulary. `web/vm/signals/versions/current.json` (v0.3) has 36 tags in 11 categories and no `view` category; each view's research writes its share of v0.4.

## What the app has and lacks for the new views

| Area | Has | Lacks |
|---|---|---|
| Open view | `revealed`, a boolean: panes or meta (`reveal_component.ts:98`); `surface` drawn over both | One field naming the open view, with room for seven more |
| Commands and keys | ⌘M from the window's key handler (`:986`); View ▸ Meta in the menu (`menu.js:97–112`); the language lens's own arrows | An open command, a View menu item and bindings for each new view; the key handler passing keys to the open view first |
| Layout | Each view an `<sc-if>` block in `reveal.html` (563 lines); `includePartials` inlining two partials | Meta's machinery as a partial (inline at lines 160–342); a third transcript mount value beside `terminal` and `reveal` |
| Widgets that keep state | The transcript re-attached after every dc-runtime commit (`reveal.ts:192–240`) | A registry for more widget kinds (editor, terminal, video, canvas); a test that a re-attach keeps undo history, cursor and playhead |
| Code organization | `reveal_component.ts`: 2,576 lines, one `@ts-nocheck` class | One typed module per view |
| Workspace files | `/api/worktree_diff`, session worktrees only (`server.py:2009`, `:4352`); no session gets a worktree (U154) | List, read, write and watch endpoints; change dots for flat and sandbox workspaces; `watchfiles` declared |
| Terminal | A login PTY for catalog commands: SSE out, POST in, 512 KB buffer (`server.py:1437`); `ansi.ts` for login screens | The user's shell, resize, a terminal environment, xterm.js |
| Pane kinds | A `SessionController` for every pane (`pane_registry.ts:39`) | A shell pane with no session |
| Process work | The Python backend and Electron main; the window sandboxed (`main.js:342–345`) | Nothing |
| Media binaries | H.264 playback in Electron's ffmpeg (to confirm on Electron 44); `sips`; Pillow 12.3.0, undeclared | ffmpeg in the bundle (only Homebrew's on this machine); ImageMagick |
| Gates | 45 Electron gates in `gates:electron` | A gate per new view |
| UI vocabulary | v0.3: 36 tags in 11 categories | `view`-category tags (v0.4) |

## The terminal: the plain shell and the login card

A terminal has two halves. The shell is a process, such as zsh, that runs commands. The emulator draws the shell's output, text mixed with VT escape sequences for colour, cursor moves and screens, and turns keys into bytes for the shell. A pseudo-terminal (PTY) joins the two.

**The shell is the user's own.** The backend spawns the user's login shell, `$SHELL -l`, in a PTY with the workspace as its working directory. Terminal.app, iTerm2, VS Code and Warp run the user's shell this way. Warp wrote its own emulator and still runs the user's zsh, bash or fish, hooking into them to see where each command starts (a third-party write-up of Warp's "How Warp Works"; Warp's docs list the three shells and fall back to zsh). D49 calls the plain shell "pure commodity". A shell of our own would replace the user's aliases, PATH, prompt and history; nothing in turns 16–17 asks for that. The app already passes through to the user's shell once: `electron/main.js:73–117` runs `$SHELL -ilc` at boot to recover the user's PATH, and the backend inherits it.

**The emulator.** Three choices.

- *Extend `ansi.ts`, our own.* 246 lines, written for login screens: SGR colour, cursor moves and positioning, erase in line and display. Its header lists what it leaves out: alternate screen buffer, scroll regions, mouse tracking, character sets. A shell also needs bracketed paste, OSC sequences (window title, hyperlinks, working directory), wide-character widths, scrollback, selection and copy, and redraw on resize. That list is the body of a full VT emulator.
- *xterm.js* 6.0.0 (MIT). VS Code, Hyper, Tabby and Wave Terminal draw with it. Addons for fit, search and WebGL rendering.
- *ghostty-web* (`@coder/ghostty-web`). Ghostty's VT parser compiled to WebAssembly, behind a `Terminal` class shaped like xterm.js's. Its README states the aim of a drop-in replacement for xterm.js and support on macOS and Linux; a separate fork, `humanlayer/ghostty-web`, was archived on 2026-03-12. Release maturity was not checked.

xterm.js is the choice. The widget sits behind one interface shaped like xterm.js's `Terminal`, so ghostty-web, Ghostty's core in the browser, can replace it once its own research shows it holds. That is the route to an emulator core of our choosing without writing one.

**One PTY module for both uses.** The login PTY (`_cli_pty_start`, `server.py:1437`) and the plain shell differ in six ways. One backend module serves both, with the command as a parameter.

| | Login card today | Plain shell |
|---|---|---|
| Command | a catalog argv: `claude auth login`, `codex login --device-auth`, `cursor-agent login` | `$SHELL -l` |
| Working directory | inherited from the server | the session's workspace |
| Size | never set; nothing calls `TIOCSWINSZ` | set at start and on every resize, through `fcntl.ioctl(fd, termios.TIOCSWINSZ, …)` |
| Lifetime | ends when the login ends; kept 60 s for a late stream, then dropped (`_CLI_PTY_LINGER_S`) | lives until its pane or tab closes, then killed by process group (`start_new_session=True` already makes `killpg` reach every child) |
| Environment | inherited; the server sets no `TERM` or `LANG` | `TERM=xterm-256color`, `COLORTERM=truecolor`, a UTF-8 `LANG` |
| Scrollback | a 512 KB rolling buffer, replayed from its start to any stream that connects | the emulator keeps scrollback; the backend buffer replays the backlog after a window reload |

The login card moves onto the same emulator. It gains a real size, full-screen login pickers draw correctly, and its hand-written key translation (`web/reveal/transcript/AuthPromptCard.tsx:142–160`) goes. `ansi.ts` then has no caller and gets a deprecation entry. The catalog and the login endpoints keep their paths.

**Transport.** Output reaches the window over SSE as base64 chunks; each key press is a POST to `/api/cli/<name>/pty/stdin/<sid>` (`AuthPromptCard.tsx:153`). The backend runs on the standard library's `ThreadingHTTPServer` and `BaseHTTPRequestHandler` (`server.py:170`, `:2340`), which have no WebSocket support. SSE plus POST works on the server as it stands. The plain shell's research measures key-to-echo time on it before deciding whether a socket is worth adding.

**Guard.** A shell endpoint runs whatever is typed, as the user. The server already refuses a foreign Host header (the DNS-rebinding defence) and a foreign Origin on every method, the GET stream included, before serving anything (`_refuse_foreign_host`, `server.py:2366–2400`), and its Unix socket is guarded by file permissions. The shell endpoints sit behind the same check.

**The session's `bash` is a different thing.** The session's `bash` tool runs commands through `subprocess.Popen` with no PTY (`substrate/src/substrate/topologies/tool_loop/tools.py:445`), so a full-screen program does not draw there. The plain shell leaves that tool as it is; the plain shell has no session and writes no record (D59).

## Tools and model capabilities the session lacks

**What it has.** Eleven file and shell tools in `full_suite` (`substrate/src/substrate/topologies/tool_loop/tools.py:619`): `bash`, `bash_output`, `bash_stop`, `bash_tasks`, `edit_file`, `glob`, `grep`, `list_dir`, `read_file`, `web_fetch`, `write_file`. Substrate's own in `substrate_tools.py`: `run_topology`, `run_topology_poll`, `inspect_record`, `list_records`, `list_topologies`, `list_applications`, `list_sessions`; and `delegate`. Every media operation runs through `bash`.

**MCP goes one way.** `topologies/session/mcp_channel.py` serves the session's tools to a harness driver (`claude`, `codex`, `cursor-agent`) and records each call as a `ToolCall` with `origin = mcp`. The session cannot call an outside MCP server; the tech spec's `tool_loop/mcp_tools.py` does not exist. A harness driver can use its own MCP servers; those calls show as harness tool cards.

| Gap | Needed by | Fact |
|---|---|---|
| The model cannot see an image | image editor's "ask the session"; design canvas, so the session sees its own sheet; video editor, to describe a frame | Nothing in `tools.py` or `adapters/models.py` sends an image. Ollama's `/api/chat` takes base64 images in a message's `images` array (Ollama docs, "Vision"). Three models here report `vision`: `kimi-k2.6:cloud`, `kimi-k2.7-code:cloud`, `kimi-k3:cloud`. No local model does. |
| `UserMessage` carries text only | design canvas comment pins; the image editor's question; a selection sent from the code editor | An attachment field is a `PAYLOAD_FIELD_PROPOSED` on the kernel's session vocabulary. |
| Named media tools | video and audio editors (D54: probe · cut · trim · concat · export; 17e·0: probe · cut · fade · gain · loudnorm · export) | Today these are `bash` calls. Named tools in `tool_loop` give typed arguments and the same function the timeline calls, so both hands produce one record event kind. ffmpeg is not bundled. |
| Finding dead air and scene cuts | 17d·0, "cut the dead air between 0:41 and 1:02" | The installed ffmpeg has `silencedetect` (noise 0.001, minimum 2 s by default) and `scdet` (threshold 10 of 100). |
| Word-timed transcripts | cutting by what was said | `whisper-cli` (whisper.cpp) at `/opt/homebrew/bin/whisper-cli` offers `-ojf`, `-ml`, `-sow`. No `ggml-*.bin` model file found within six directory levels of home. The installed ffmpeg has no `whisper` filter. |
| Audio processing | audio editor | The installed ffmpeg has `afade`, `afftdn`, `arnndn` (needs a model file), `loudnorm`. |
| Image operations | image editor | Pillow 12.3.0 and `sips` present; ImageMagick absent. |
| Seeing a rendered sheet | design canvas | Electron's `webContents.capturePage`, or Playwright (`^1.49.0`, already a devDependency). Microsoft's Playwright MCP works from accessibility snapshots; its README calls screenshots advisory (third-party reviews quoting it). |

**Outside MCP servers for media.** `mcp-video` on PyPI claims 82–87 tools across versions; others expose a single `execute_ffmpeg` that takes a command string. These are package listings, not audited code. A raw-command tool gives the session nothing `bash` lacks, and a large outside tool set gives the model names the timeline does not share, which breaks D54's rule that hand and session run one operation. Named tools in `tool_loop`, matched one for one to the timeline's operations, keep both on one event kind. The MCP client stays the tech spec's Wave-B item.

## How other tools do each view

Each source carries its genre: vendor documentation describes its own product, an engineering post is the team's own account, a README is a project's claim, a forum post is one person's report.

**Code editor.** VS Code's workbench has the same four regions (side bar, editor, panel, secondary side bar); Zed has them too. The file tree, the editor and the terminal share only the workspace root and couple through the file system. CodeMirror 6 over Monaco: Sourcegraph's engineering post on leaving Monaco gives about 2.4 MB, roughly 40% of their search page's JavaScript, a global model that made several configured instances hard, and theme colours as hex values in JavaScript; Replit's post records features they had used in Monaco that CodeMirror 6 lacked and they built. D53's OUT list (debuggers, language plugins, extension marketplaces) is what Monaco's weight buys, and it is the line that holds when language servers and autocomplete are asked for later. Packages, npm on 2026-11-04: `@codemirror/view` 6.43.15 (MIT), `@replit/codemirror-vim` 6.4.0 (MIT); in-file search is `@codemirror/search`; global search is a backend `rg` call; nano bindings are a small keymap.

**Document editor.** Source-backed live preview keeps the markdown string as the document and hides syntax away from the cursor with CodeMirror 6 decorations (Obsidian plugin docs; forum posts on Live Preview; Atomic Editor and Silkdown READMEs); a save writes back the bytes typed. Model-backed WYSIWYG (ProseMirror, Milkdown, Tiptap) parses to a tree and serializes on save; ProseMirror's forum states the markdown conversion is lossy, and `prosemirror-markdown` issue #82 reports nested marks of one type cannot be serialized; Tiptap claims fidelity (vendor). The session writes these files with `write_file`, so a lossy save puts diffs the user never made on the worktree and the record. Source-backed fits; its cost is syntax showing at the cursor, less like Google Docs than D52 asks. The test: open a file the session wrote, change one word by hand, save, and diff the bytes; only that word changes.

**Plain shell.** VS Code, Hyper, Tabby and Wave Terminal draw with xterm.js and run the shell behind a PTY in another process (VS Code's pty host runs node-pty, per third-party descriptions; check `src/vs/platform/terminal`). node-pty's README states spawned processes run at the parent's permission level and the library is not thread-safe. Packages: `@xterm/xterm` 6.0.0, `@xterm/addon-fit` 0.11.0 (MIT). xterm.js's `attachCustomKeyEventHandler` decides which keys the shell receives (xterm.js API docs); VS Code keeps a list of keys its terminal never sends to the shell, `terminal.integrated.commandsToSkipShell` (VS Code docs). The Python backend already holds a PTY and needs a shell spawn and a resize. The transport question: SSE out and POST in costs a request per keystroke. The gate checks that no shell process remains after its pane closes.

**Image editor.** macOS Preview is the benchmark for "basic but real". Crop and annotate overlays are canvas work; a histogram is `getImageData`. Toast UI Image Editor and Fabric.js are candidate libraries, unchecked this round. Conversion runs in the backend through Pillow or `sips`, the same operation the session's tool calls (D50).

**Video editor.** LosslessCut, an Electron app that keeps a cut list and exports through ffmpeg, states in its README that lossless cuts copy streams and land on keyframes, "keyframe cut" placing `-ss` before `-i` and "normal cut" after. 17d·0 shows a cut at 0:41.6, so the research decides between keyframe stream copy and re-encoding around each cut. Descript's help pages describe the transcript as the editing surface: deleting text hides media without destroying it, a timeline stays available, and the edit exports as an XML edit record. A cut-list entry is `{type, start, end, author: 'hand' | {seq}}`. Preview skips cut regions during playback; export renders through ffmpeg. The session's tool results reach the timeline through the record the timeline already reads, never through a call into the timeline module.

**Audio editor.** wavesurfer.js 8.0.5 (BSD-3-Clause) draws the waveform; its Regions plugin gives draggable segments and its Envelope plugin a fade curve; its docs leave trim and export to the application. Edits run in ffmpeg, with the Web Audio API for preview. Plugin hosting, outside this scope, needs JUCE (`JUCE_PLUGINHOST_AU`, `JUCE_PLUGINHOST_VST3`) or a host like minihost (PyPI), scanned out of process because plugins can pass a scan and freeze the host (JUCE forum report).

**Design canvas.** The handoff's `.dc.html` sheets are live HTML/CSS frames on a pannable canvas, drawn by the `support.js` runtime the app already loads; 17g's sheets are the same kind of file. Figma pins a comment to a canvas element; D71 sends the pin with the next `UserMessage`, which needs the attachment field. Each sheet renders in a sandboxed `<iframe srcdoc>` so its CSS stays out of the app's.

## The collection

**Design.** D57: the whole UI configuration (windows, pane grids, pane-to-session bindings, which view each pane shows, lens choices, collapsed panels, focus) restores exactly on relaunch. D68 (2026-09-03) supersedes D57's save-and-browse surface: a collection is what is open, there is no save command and no browse place, and the app restores its whole state across quit. D66(a) ratifies SQLite as the app-state store. `MENU-BAR -2026-09-01-.md` rule 3 repeats D68.

**Prior work, unbuilt.** `process/sprints_v0.1/sprint-043-collection-persist.md` and `sprint-044-collection-restore.md`, status `pending`, target the September prototype-port tree, now at `../substrate-ui-old-versions/substrate-shell-abandoned-2026-09-08/` with no collection code. Both keep a save command (Collection ▸ Save, ⌘⇧S), which D68 retired. Sprint 044's restore rule holds: a session gone between quit and relaunch comes back as an unbound pane with a hint row. The abandoned tree's vocabulary rationale scopes the SQLite writes as "shell app-store internals, not events": the collection is UI layout and stays off every session record.

**Today.** `electron/main.js:379` loads `/?atom-transcript=1&electron=1` with no session id, so a relaunch opens one empty pane. `reveal.ts:97–101` attaches `?session=<id>` when present, which covers a reload. Theme and type size persist in `localStorage['substrate-ui.settings']` (`reveal_component.ts:893–905`). Grid, bindings, open view and lens choices are lost on quit. Electron's `userData` is a `profile` folder under the app root (`main.js:52`).

**What restore covers.** Per window: bounds, the pane grid with its `fr` weights, focus. Per pane: kind (session or shell), session id or shell directory, open view, lens and filter, the split ratio; for the code editor the open file, cursor, scroll and collapsed panels; for a media view the open file and playhead. A shell pane restores its directory and starts a fresh shell.

**Prior art, to verify in its research.** The media-views doc cites iTerm2 restoring arrangements from a plist under `~/Library/Application Support/iTerm2/`, Ghostty restoring layout with fresh shells, and VS Code keeping workbench state in SQLite. None was checked this round.

## Researching each view before building it

Each view gets one research document in this folder answering these questions, with sources, before any sprint card.

1. **Record contract.** Which record events the view shows; which events each hand action produces; whether a kernel vocabulary change is needed, and of which proposal type.
2. **Session parity and model capability.** The tool the session uses for the same operation, producing the same event kind; the model capability assumed (vision, speech-to-text) and which installed models have it.
3. **Prior art.** Two or three tools, read from docs or source, labelled by genre; what is copied and what D53 refuses.
4. **Library and bridge mapping.** The package, its API read from installed source (TECHNIQUES #46) into `WORKING_AGREEMENT.md`'s bridge mappings, its bundled size after `vite build`, its licence against PolyForm Noncommercial.
5. **Command, menu item and bindings.** The command that opens the view, its item in the View menu, the keys it binds while open.
6. **App seam.** The widget kind, the state the component holds for it, the partials it uses, and what the collection restores for it.
7. **UI vocabulary.** View-category tags proposed for v0.4, one audit row per record event shown.
8. **Observation contract.** The Electron gate with structural, decode and adversarial checks (Addendum A1, A2), including the import check.
9. **Scope line.** In and refused, against D53.

**Order.**

0. **Shared work, once.** (a) One field for the open view in place of `revealed`, with the window handing keys to the open view's bindings. (b) The widget registry, with the re-attach test on a CodeMirror instance's undo history and cursor. (c) The workspace file API: list, read, write, watch, confined per workspace. (d) How a hand edit becomes a record event, in the kernel repo. (e) Images to the model and attachments on `UserMessage`, in the kernel. (f) Pane kinds: `SessionPane | ShellPane`.
1. **Code editor.** The other editors open from its file tree; it reuses meta's machinery as a partial and the transcript with a third mount value.
2. **The collection.** Its data includes the code editor's state; SQLite per D66, no save command per D68, sprint 044's unbound-pane rule.
3. **Plain shell.** One PTY module for the shell and the login card, with resize and the shell's environment; xterm.js behind one widget interface; the shell pane kind; the login card moved onto the same widget; key-to-echo time measured on SSE plus POST.
4. **Document editor.** Reuses CodeMirror; settles source-backed live preview with the byte-diff test.
5. **Image editor.** The first hand edit that writes a file; the first use of 0(d) and 0(e).
6. **Design canvas.** Sandboxed sheets, comment pins through 0(e), sheet capture for a vision model.
7. **Video editor.** Named media tools, `silencedetect`, the decision to bundle ffmpeg, keyframe against re-encode, optional word-timed transcripts.
8. **Audio editor, without plugin hosting.** Reuses the video editor's timeline, edit list and named tools; adds wavesurfer.js.

## Open

- "Most of 17": assumed out are 17f and 17e's plugin hosting.
- How a hand edit reaches the record blocks the editing views; it does not block the code editor for reading code, the collection, or the plain shell.
- Vision runs only on three cloud models on this machine; the image editor's research settles whether its question to the session needs a cloud model or a local vision model gets installed.

## Sources

Local: `design/received/handoff_latest/README.md`; sheet turns 16–17; `DESIGN-DECISIONS -through 2026-09-01-.md` (D48–D59, D66, D68, D71); `MENU-BAR -2026-09-01-.md`; `DESIGN-SPEC-2026-08-31-round4.md`; `design/received/handoff_latest/docs/RESEARCH-2026-11-04-editor-and-media-views.md`; product spec round 15; tech spec round 9; `BLACKBOARD.md` (2026-10-11 "Meta and panes", U141, U146, U147, U154, U158; 2026-11-04 `user` entry); `process/sprints_v0.1/sprint-043-collection-persist.md`, `sprint-044-collection-restore.md`; `../substrate-ui-old-versions/substrate-shell-abandoned-2026-09-08/signals/0.1-rationale.md`; `sdd-kit-3/` in full; the code paths cited above; `ffmpeg -h filter=…`, `whisper-cli -h`, `curl :11434/api/show`, `npm view`, run 2026-11-04.

Outside, as read on 2026-11-04:

- VS Code docs, "Terminal advanced": https://code.visualstudio.com/docs/terminal/advanced
- Electron docs, "Keyboard Shortcuts": https://electronjs.org/docs/latest/tutorial/keyboard-shortcuts
- xterm.js `Terminal` API docs: https://xtermjs.org/docs/api/terminal/classes/terminal
- ghostty-web (README): https://github.com/coder/ghostty-web ; archived fork: https://github.com/humanlayer/ghostty-web
- Warp, a third-party write-up of "How Warp Works": https://willhbr.net/2023/08/02/warp-terminal/ ; Warp docs on shells: https://docs.warp.dev/terminal/warpify/subshells
- Ollama docs, "Vision": https://docs.ollama.com/capabilities/vision ; OpenAI compatibility: https://docs.ollama.com/openai
- `mcp-video` on PyPI: https://pypi.org/project/mcp-video/1.2.2/ ; Video Editor MCP Server: https://lobehub.com/ko/mcp/christopher-stevers-video-mcp ; video_editor_mcp: https://awesome.ecosyste.ms/projects/github.com%2Fkush36agrawal%2Fvideo_editor_mcp
- Playwright MCP listing: https://awesome.ecosyste.ms/projects/github.com%2Fmicrosoft%2Fplaywright-mcp ; review quoting the README: https://testingbot.com/resources/articles/playwright-mcp
- whisper.cpp CLI README: https://huggingface.co/datasets/echodict/whisper.cpp/blob/main/examples/cli/README.md
- Sourcegraph, "Migrating from Monaco Editor to CodeMirror": https://sourcegraph.com/blog/migrating-monaco-codemirror
- Replit, "Betting on CodeMirror": https://blog.repl.it/codemirror
- Obsidian docs, "Decorations": https://docs.obsidian.md/Plugins/Editor/Decorations ; forum thread: https://forum.obsidian.md/t/simplest-possible-example-of-a-decorating-editor-extension/91652
- Atomic Editor: https://github.com/kenforthewin/atomic-editor ; Silkdown: https://sveltethemes.dev/magarcia/silkdown
- ProseMirror forum on lossy markdown: https://discuss.prosemirror.net/t/possible-to-collaborate-in-different-docformat-of-the-same-document/63 ; `prosemirror-markdown` #82: https://github.com/ProseMirror/prosemirror-markdown/issues/82
- Tiptap markdown (vendor post): https://tiptap.dev/blog/release-notes/introducing-bidirectional-markdown-support-in-tiptap
- Electron `release.gn` and codec test page (mirrors): https://source-hub.etos-pro.ru/Electron/electron/src/branch/main/build/args/release.gn ; https://ayakael.net/mirrors/electron/commit/5b4f715d2e6ffc1427205448825e85857f28240b
- node-pty README: https://lively-kernel.org/lively4S2/lively4-server/node_modules/node-pty/README.md
- LosslessCut README (mirror): https://git.morozoff.pro/aiden/lossless-cut/src/tag/v3.4.0
- Descript help centre: https://help.descript.com/hc/en-us/articles/15726742913933
- wavesurfer.js Regions plugin: https://wavesurfer.xyz/docs/plugins/regions/
- minihost (PyPI): https://pypi.org/project/minihost/ ; JUCE `juce_audio_processors`: https://www.ccoderun.ca/juce/api/juce__audio__processors_8h.html ; JUCE forum, VST3 scan freeze: https://forum.juce.com/t/problems-scanning-vst3-plugins-multiport-midi-perhaps/37190
