# New views in substrate-ui: a code editor, media editors, a plain shell and a design canvas (round 7)

*2026-11-04, round 7. Rounds 1–6 are in this folder, unchanged. Round 7 states how edits made in a view reach the record (`Runtime.inject_event`, and the one kernel addition for edits made between turns) and drops round 6's "hand edit" wording. This document follows the Architect's decision of 2026-11-04 (`BLACKBOARD.md`, `user` entry): each new view opens by its own command, has its own menu item, and has its own key bindings while open; the design's ⌃` three-stop cycle (D48, D49) is not built; the app's names, panes and meta, replace the design's "terminal" and "reveal".*

*Design input: sheet turns 16 and 17 in `design/received/handoff_latest/sheets/Substrate Shell Directions v3.dc.html`; decisions D50–D59, D66, D68 and D71 in `DESIGN-DECISIONS -through 2026-09-01-.md`; `MENU-BAR -2026-09-01-.md`. Prototype v7 has none of turns 16–17.*

## The seven new views

| View | What it is | Sheet frames | Decisions |
|---|---|---|---|
| Code editor | A classic code editor, laid out as VS Code and Zed are, around one session. Left: a file tree of the session's workspace, with a dot on each file the session changed. Centre: a text editor with vim and nano bindings and search in the file and across the workspace. Bottom: the session's transcript and input bar. Right: meta's lenses. Each side panel collapses to a labelled rail; the bottom panel collapses to its input bar. | 16a, 16c | D48 (layout only), D51, D53 |
| Document editor | Markdown that looks and edits like a document; one toggle shows the markdown source | 17a | D52 |
| Image editor | Crop, resize, annotate, convert, analyze, and "ask the session". Each tool draws over the image, with its buttons in a bar fixed above it. | 17c·0, 17c·1 | D50, D59 |
| Video editor | One timeline, cut by the session or in the editor. A cut list names who made each cut. Export runs ffmpeg. | 17d·0, 17d·1 | D50, D54 |
| Audio editor | One file: split, trim, fade, gain, normalize, denoise | 17e·0 | D58 |
| Plain shell | The user's own shell, started in the workspace. It opens as a tab in the code editor's bottom panel, or as a pane beside the session panes, with no session and no record. | 17b·0, 17b·1 | D49b, D59 |
| Design canvas | Chat on the left. On the right, the session's HTML/CSS design sheets on a canvas that pans and zooms; a comment pinned to an element goes out with the next message. | 17g | D71 |

Each view shows the focused pane's session and fills the window, as meta does. A file opened from the code editor's file tree opens in the view for its type; that is how 17c·0's "open in place like any file" works.

**Left out, by assumption.** 17f, real-time translation: it is a topology, shown in the transcript and structure lens the app already has, and needs no new view. 17e's AU/VST plugin hosting: it needs a native audio host, and neither Electron nor the bundled Python has one.

## Meta, the view the app already has

Meta sits beside panes in the shipped app. The new views copy its shape. Facts below come from `web/reveal_component.ts`, `web/reveal.html`, `web/reveal.ts`, `web/reveal/language_lens.ts`, `web/reveal/timeline.ts`, `electron/menu.js` and `web/vm/session_controller.ts`, each read in full on 2026-11-04.

**Opening it.** Three controls call `_toggleMeta` (`reveal_component.ts:1090`): ⌘M, caught by the window's key handler; View ▸ Meta in the menu bar (`menu.js`, id `menu-toggle-meta`); and the top-bar button, labelled `meta` in panes and `panes` in meta. The menu item shows no key, because Electron on macOS registers any key a menu item shows (U147). Meta stays shut while the focused pane is still at its workspace picker. The Architect named meta on 2026-10-11; U147 renamed the menu's "Toggle Reveal ⌃`" to "Meta".

**Its state.** One boolean, `revealed` (`:98`), sits beside `surface` (records, assay, studio). A surface draws over both panes and meta (`:2265`). ⌘D or ⌘⇧D from meta makes a pane and returns to panes (U146). Meta also keeps the open lens, the stream's all/app filter and direction, the selected seq, the language lens's stream, lane and view, and `revealL`, the split between its halves (0.5–3).

**Left half.** The focused pane's transcript, drawn by the same React `Transcript` panes uses; the activity line ending in guidance, length and tone; one row per background task; and the same input bar as panes (U141).

**Right half: the lenses.**

| Lens | What it shows | Data |
|---|---|---|
| stream+graph | One row per envelope: seq, `t+` time, kind, producer, gist. `all`/`app` hides 11 plumbing kinds. Down: three lanes (model, delegate, external) with connectors. Side: a bar chart, one lane each for model, every tool name, ⑂ delegate and returned. Stays at the bottom until scrolled up (U158). | `rawEnvelopes`, from the session's SSE stream |
| i/o | UserMessage, ModelReply, FinalAnswer and ToolResult texts, in seq order | `rawEnvelopes` |
| structure | Events (what emits each, which triggers it fires), producers, triggers, views, ends, routes, run; each heading defined on hover | `/api/records/s_<id>/topology_graph` |
| language | 13 measures as lanes over turns; streams: replies, messages, turns; views: bars, deviation, ribbons, side by side, measures; keys ↑↓ ←→ ↵; `/language` opens it | `/api/session/<id>/language` |
| scene | A grid up to 20×20 from a payload's `grid`, `cells` or `matrix` | `rawEnvelopes` |

A click on a stream row opens an inspector under it: kind, seq, schema, time ("t+42.6s · 1.38s into turn 0"), producer, payload JSON. The inspector's content blocks are always empty, because each envelope is built with `content: []`. The design's CAUSED BY → LEADS TO line (D22) is not drawn. The down graph has three fixed lanes, not one per producer kind, and overlapping calls share a lane (D29 not built). ⌘F searches the transcript or the stream, whichever half was clicked last. Gates: `graph_model_lane_on_resume`, `stream_follows_bottom`, `stream_reconnect`, `structure_lists_producers`, `app_view_delegate_lane`, `split_returns_to_panes`, and five `language_*` gates.

**What the new views take from meta.** A view fills the window with the focused session, opens by its own command and menu item, keeps its own state, and binds its own keys while open, as the language lens binds its arrows. The code editor reuses both halves of meta: the transcript and input bar become its bottom panel, the lenses its right panel.

## Rules for every view

**A view shows the record and the workspace, and writes only to them.** D1 and D2 say the UI owns no state. The sheets say the same of each edit: "the open image came from seq 251" (17c·0); "the timeline's cut list and the record agree by construction" (17d·0); "export runs ffmpeg and the write lands on the record" (17d·1); converted files "land on the record" (D50); comments "travel as UserMessage context" (D71). Foundation 04 of the kit (`sdd-kit-3/foundations/04-sdd-claude-design.md`) asks that each visual state be named by the event it shows.

**Two checks per view.**

- *Record check.* List every value the view shows and every action it offers. Each maps to a record event or a workspace file. A value that maps to neither is state the UI owns, and the design changes before the build.
- *Import check.* No view module imports from the transcript, the lenses or `PaneRegistry`. A view reaches the rest of the app only through workspace files, the session's tool calls, and the field that says which view is open. Each view's gate runs this check.

**Every edit made in a view goes on the record.** A view saves a file, crops an image, makes a cut or draws a fade through the workspace write endpoint the app adds, and that endpoint writes an event to the session's record. The sheets ask for this: 17d·1's cut list shows "2 · trim demo pt 1 −0:02.4 · by hand, just now" beside the session's own cut at seq 260. The kernel already has the call. `Runtime.inject_event` (`substrate/src/substrate/kernel/runtime.py:1009`) appends an application event to a live run's record, with no producer, on the same sequence; the session registry uses it today for the soft interrupt, `InterruptRequested` (`substrate/src/substrate/topologies/session_registry.py:1130`).

**One case needs a kernel addition: an edit made between turns.** `inject_event` raises when the run is not live, and a session's run is live only during a turn. Between turns the run is paused on disk. `Runtime.resume` (`runtime.py:212`) appends to a paused record, but the event it appends resumes the run, and for a session that event is the `UserMessage` that starts a turn. An edit made while the session waits for input, the usual case, needs a kernel call that appends an application event to a paused session's record without resuming it. The edit events themselves (a file written, an image converted, a cut made, a fade drawn) are new kernel vocabulary, proposed under `grammar/PRINCIPLES.md`.

**Each record event a view shows gets a UI vocabulary tag.** The kit's step 9 (`grammar/BOOTSTRAP.md`) pairs every record event with a tag in the `view` category. `web/vm/signals/versions/current.json` (v0.3) has 36 tags in 11 categories and no `view` category. Each view's research adds its tags to v0.4.

## What the app has and lacks for the new views

| Area | Has | Lacks |
|---|---|---|
| Open view | `revealed`, a boolean: panes or meta (`reveal_component.ts:98`); `surface` drawn over both | One field naming the open view, with room for seven more |
| Commands and keys | ⌘M from the window's key handler (`:986`); View ▸ Meta in the menu (`menu.js:97–112`); the language lens's own arrows | An open command, a View menu item and bindings for each new view; the key handler passing keys to the open view first |
| Layout | Each view an `<sc-if>` block in `reveal.html` (563 lines); `includePartials` inlining two partials | Meta's lenses as a partial (inline at lines 160–342); a third transcript mount value beside `terminal` and `reveal` |
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

A terminal has two parts. The shell, such as zsh, runs commands. The emulator draws the shell's output, text mixed with escape codes for colour and cursor moves, and turns key presses into bytes. A pseudo-terminal (PTY) connects them.

**The shell is the user's own.** The backend starts the user's login shell, `$SHELL -l`, in a PTY, in the session's workspace. Terminal.app, iTerm2, VS Code and Warp all run the user's shell this way. Warp wrote its own emulator and still runs the user's zsh, bash or fish, with hooks in each to see where a command starts (a third-party write-up of Warp's "How Warp Works"; Warp's docs list the three shells and fall back to zsh). D49 calls the plain shell "pure commodity". A shell of our own would replace the user's aliases, PATH, prompt and history, and turns 16–17 ask for no such thing. The app already starts the user's shell once: `electron/main.js:73–117` runs `$SHELL -ilc` at boot to read the user's PATH, and the backend inherits it.

**The emulator: three choices.**

- *Extend `ansi.ts`.* Our own, 246 lines, written for login screens: colour, cursor moves, erasing. Its header lists what it lacks: a second screen buffer, scroll regions, mouse input, character sets. A shell also needs bracketed paste, OSC codes (window title, links, working directory), wide-character widths, scrollback, selection and copy, and redraw on resize. Adding all that means writing a full emulator.
- *xterm.js* 6.0.0 (MIT). VS Code, Hyper, Tabby and Wave Terminal use it. Addons fit it to its box, search it, and draw it with WebGL.
- *ghostty-web* (`@coder/ghostty-web`). Ghostty's terminal core compiled to WebAssembly, with a `Terminal` class shaped like xterm.js's. Its README aims to replace xterm.js outright and supports macOS and Linux. A separate fork, `humanlayer/ghostty-web`, was archived on 2026-03-12. Its release state was not checked.

xterm.js it is, behind one interface shaped like its `Terminal` class. If a later test shows ghostty-web works, switching to it changes one module.

**One PTY module for the shell and the login card.** The login PTY (`_cli_pty_start`, `server.py:1437`) and the plain shell differ in six ways. One backend module runs both, with the command passed in.

| | Login card today | Plain shell |
|---|---|---|
| Command | a catalog command: `claude auth login`, `codex login --device-auth`, `cursor-agent login` | `$SHELL -l` |
| Working directory | the server's | the session's workspace |
| Size | never set; nothing calls `TIOCSWINSZ` | set at start and on every resize, with `fcntl.ioctl(fd, termios.TIOCSWINSZ, …)` |
| Lifetime | ends with the login; kept 60 s for a late stream, then dropped (`_CLI_PTY_LINGER_S`) | lasts until its pane or tab closes; then its process group is killed (`start_new_session=True` already lets `killpg` reach every child) |
| Environment | inherited; the server sets no `TERM` or `LANG` | `TERM=xterm-256color`, `COLORTERM=truecolor`, a UTF-8 `LANG` |
| Scrollback | a 512 KB rolling buffer, replayed from the start to any stream that connects | xterm.js keeps scrollback; the backend buffer replays the backlog after a window reload |

The login card moves to xterm.js too. It gets a real size, full-screen login pickers draw right, and its own key mapping (`web/reveal/transcript/AuthPromptCard.tsx:142–160`) goes. `ansi.ts` then has no caller and gets a deprecation entry. The catalog and the login endpoints keep their paths.

**Transport.** Output reaches the window over SSE in base64 chunks. Each key press is a POST to `/api/cli/<name>/pty/stdin/<sid>` (`AuthPromptCard.tsx:153`). The backend runs on the standard library's `ThreadingHTTPServer` and `BaseHTTPRequestHandler` (`server.py:170`, `:2340`), which have no WebSocket support. SSE plus POST works on the server as it is. The plain shell's research times a key press to its echo before anyone adds a socket.

**Guard.** A shell endpoint runs whatever is typed, as the user. The server already refuses a foreign Host header (against DNS rebinding) and a foreign Origin on every method, the output stream included (`_refuse_foreign_host`, `server.py:2366–2400`). File permissions guard its Unix socket. The shell endpoints go behind the same check.

**The session's `bash` tool has no PTY.** It runs commands through `subprocess.Popen` (`substrate/src/substrate/topologies/tool_loop/tools.py:445`), so a full-screen program cannot draw there. The plain shell does not touch that tool; it has no session and writes no record (D59).

## Tools and model abilities the session lacks

**Tools it has.** Eleven file and shell tools in `full_suite` (`substrate/src/substrate/topologies/tool_loop/tools.py:619`): `bash`, `bash_output`, `bash_stop`, `bash_tasks`, `edit_file`, `glob`, `grep`, `list_dir`, `read_file`, `web_fetch`, `write_file`. Substrate's own tools in `substrate_tools.py`: `run_topology`, `run_topology_poll`, `inspect_record`, `list_records`, `list_topologies`, `list_applications`, `list_sessions`; and `delegate`. Every media job today is a `bash` call.

**The session cannot use outside MCP servers.** `topologies/session/mcp_channel.py` offers the session's own tools to a harness driver (`claude`, `codex`, `cursor-agent`) and records each call as a `ToolCall` with `origin = mcp`. Nothing lets the session call an outside server; the tech spec's `tool_loop/mcp_tools.py` does not exist. A harness driver can use its own MCP servers, and those calls show as harness tool cards.

| Missing | Needed by | Fact |
|---|---|---|
| Images sent to the model | the image editor's "ask the session"; the design canvas, so the session sees its own sheet; the video editor, to describe a frame | Nothing in `tools.py` or `adapters/models.py` sends an image. Ollama's `/api/chat` takes base64 images in a message's `images` array (Ollama docs, "Vision"). Three models here report `vision`: `kimi-k2.6:cloud`, `kimi-k2.7-code:cloud`, `kimi-k3:cloud`. No local model does. |
| Attachments on `UserMessage` | design-canvas comment pins; the image editor's question; a selection sent from the code editor | `UserMessage` carries text only. An attachment field is a `PAYLOAD_FIELD_PROPOSED` on the kernel's session vocabulary. |
| Named media tools | the video editor (D54: probe, cut, trim, concat, export) and the audio editor (17e·0: probe, cut, fade, gain, loudnorm, export) | Today each is a `bash` call. A named tool in `tool_loop` takes typed arguments and runs the same function the timeline calls, so an edit made in the view and the same edit made by the session write the same event kind. ffmpeg is not bundled. |
| Finding dead air and scene cuts | 17d·0's "cut the dead air between 0:41 and 1:02" | The installed ffmpeg has `silencedetect` (noise 0.001, minimum 2 s by default) and `scdet` (threshold 10 of 100). |
| Transcripts timed per word | cutting video by what was said | `whisper-cli` (whisper.cpp) at `/opt/homebrew/bin/whisper-cli` offers `-ojf`, `-ml`, `-sow`. No `ggml-*.bin` model file turned up within six directory levels of home. The installed ffmpeg has no `whisper` filter. |
| Audio processing | the audio editor | The installed ffmpeg has `afade`, `afftdn`, `arnndn` (which needs a model file) and `loudnorm`. |
| Image operations | the image editor | Pillow 12.3.0 and `sips` are here; ImageMagick is not. |
| A picture of a rendered sheet | the design canvas | Electron's `webContents.capturePage`, or Playwright (`^1.49.0`, already a devDependency). Microsoft's Playwright MCP works from accessibility snapshots, and its README calls screenshots advisory (third-party reviews quoting it). |

**Outside MCP servers for media.** `mcp-video` on PyPI claims 82 to 87 tools, depending on the version. Others offer one `execute_ffmpeg` tool that takes a command string. These are package listings; nobody here has audited the code. A tool that takes a raw command does nothing `bash` cannot. A large outside tool set gives the model operations the timeline lacks, which breaks D54's rule that the view and the session run the same operation. Named tools in `tool_loop`, one per timeline operation, keep the view and the session on the same event kind. The MCP client stays where the tech spec put it, Wave B.

## How other tools build each view

Each source is labelled by kind: vendor docs describe the vendor's own product, an engineering post is the team's own account, a README is a project's claim about itself, a forum post is one person's report.

**Code editor.** VS Code's window has the same four regions (side bar, editor, panel, secondary side bar), and so does Zed's. The file tree, the editor and the terminal share only the workspace folder. CodeMirror 6 over Monaco: Sourcegraph's engineering post on leaving Monaco reports about 2.4 MB, roughly 40% of their search page's JavaScript; a global model that made several differently set-up editors on one page hard; and theme colours set as hex values in JavaScript. Replit's post lists features they had used in Monaco that CodeMirror 6 lacked, which they then built. Monaco's size pays for what D53 leaves out (debuggers, language plugins, extension marketplaces), and D53 also rules out language servers and autocomplete. Packages, from npm on 2026-11-04: `@codemirror/view` 6.43.15 (MIT), `@replit/codemirror-vim` 6.4.0 (MIT). `@codemirror/search` searches a file; a backend `rg` call searches the workspace; nano bindings are a short keymap.

**Document editor.** Two kinds of editor exist. A source-backed editor keeps the markdown text as the document and hides the markup except near the cursor, using CodeMirror 6 decorations (Obsidian's plugin docs; forum posts on Obsidian's Live Preview; the Atomic Editor and Silkdown READMEs). Saving writes back exactly what was typed. A tree-backed editor (ProseMirror, Milkdown, Tiptap) parses the markdown into a tree and writes it back out on save. ProseMirror's forum says that conversion loses detail, and `prosemirror-markdown` issue #82 reports that it cannot write nested marks of one type. Tiptap claims it loses nothing (vendor post). The session writes these files with `write_file`, so a lossy save would put changes the user never made into the workspace and the record. Source-backed is the choice. The cost: markup shows at the cursor, which is less like Google Docs than D52 asks. The test: open a file the session wrote, change one word in the document editor, save, and diff the bytes. Only that word should differ.

**Plain shell.** VS Code, Hyper, Tabby and Wave Terminal draw with xterm.js and run the shell behind a PTY in another process. Third-party descriptions say VS Code's runs node-pty in a separate pty host; `src/vs/platform/terminal` in the VS Code repo would confirm it. node-pty's README says its spawned processes run with the parent's permissions and that it is not thread-safe. Packages: `@xterm/xterm` 6.0.0 and `@xterm/addon-fit` 0.11.0 (MIT). xterm.js's `attachCustomKeyEventHandler` decides which keys the shell receives (xterm.js API docs). VS Code keeps a list of keys its terminal never sends to the shell, `terminal.integrated.commandsToSkipShell` (VS Code docs). The gate checks that no shell process is left after its pane closes.

**Image editor.** macOS Preview sets the bar for "basic but real". Crop and annotate draw on a canvas over the image; a histogram reads pixels with `getImageData`. Toast UI Image Editor and Fabric.js are candidate libraries; neither was checked. Conversion runs in the backend through Pillow or `sips`, the same code the session's tool calls (D50).

**Video editor.** LosslessCut is an Electron app that keeps a cut list and exports through ffmpeg. Its README says lossless cuts copy the streams and so land on keyframes; "keyframe cut" puts `-ss` before `-i`, "normal cut" after it. 17d·0 shows a cut at 0:41.6, so the research chooses between keyframe cuts and re-encoding around each cut. Descript's help pages describe editing video by editing its transcript: deleting text hides the media without destroying it, a timeline is still there, and the edit exports as an XML edit list. A cut-list entry is `{type, start, end, author: 'view' | {seq}}`; the record event behind each entry gives its seq either way. Preview skips cut regions while playing; export renders through ffmpeg. The session's results reach the timeline through the record the timeline already reads, not through a call into the timeline's code.

**Audio editor.** wavesurfer.js 8.0.5 (BSD-3-Clause) draws the waveform. Its Regions plugin gives segments that drag and resize; its Envelope plugin draws a fade curve. Its docs leave trimming and export to the app. Edits run in ffmpeg; the Web Audio API plays the preview. Plugin hosting, left out here, needs JUCE (`JUCE_PLUGINHOST_AU`, `JUCE_PLUGINHOST_VST3`) or a host such as minihost (PyPI), with scanning done in a separate process, because a plugin can pass a scan and then freeze the host (JUCE forum report).

**Design canvas.** The handoff's `.dc.html` sheets are HTML/CSS frames on a canvas that pans, drawn by the `support.js` runtime the app already loads. 17g's sheets are the same kind of file. Figma pins a comment to an element on the canvas; D71 sends the pin with the next `UserMessage`, which needs the attachment field. Each sheet renders in a sandboxed `<iframe srcdoc>`, so its CSS cannot touch the app's.

## The collection

**What the design says.** D57: on relaunch the app restores its whole layout: windows, pane grids, which session each pane shows, which view each pane has open, lens choices, collapsed panels, focus. D68 (2026-09-03) replaces D57's save-and-browse screens: a collection is whatever is open, with no save command and no list of saved collections, and the app restores it across quit by itself. D66(a) picks SQLite as the app's store. `MENU-BAR -2026-09-01-.md` rule 3 repeats D68.

**Earlier work, never built.** `process/sprints_v0.1/sprint-043-collection-persist.md` and `sprint-044-collection-restore.md`, both `pending`, were written for the September prototype-port tree. That tree now sits at `../substrate-ui-old-versions/substrate-shell-abandoned-2026-09-08/` and holds no collection code. Both cards keep a save command (Collection ▸ Save, ⌘⇧S), which D68 dropped. One rule from sprint 044 stands: a session gone between quit and relaunch comes back as an empty pane with a note. The abandoned tree's vocabulary notes call the SQLite writes "shell app-store internals, not events": the collection is screen layout and writes nothing to any session's record.

**What the app does today.** `electron/main.js:379` loads `/?atom-transcript=1&electron=1` with no session id, so a relaunch shows one empty pane. `reveal.ts:97–101` reattaches `?session=<id>` when the URL has it, which covers a reload. Theme and type size persist in `localStorage['substrate-ui.settings']` (`reveal_component.ts:893–905`). The pane grid, the sessions in each pane, the open view and the lens choices are lost on quit. Electron keeps its `userData` in a `profile` folder under the app root (`main.js:52`).

**What a restore covers.** Per window: its bounds, the pane grid with its `fr` weights, focus. Per pane: its kind (session or shell); its session id or its shell's directory; its open view, lens and filter; meta's split. For the code editor: the open file, cursor, scroll and collapsed panels. For a media view: the open file and the playhead. A shell pane restores its directory and starts a new shell.

**Prior art, not yet checked.** The media-views doc says iTerm2 restores windows from a plist under `~/Library/Application Support/iTerm2/`, Ghostty restores layout and starts new shells, and VS Code keeps window state in SQLite. The collection's research checks each claim.

## Questions each view's research answers

Each view gets its own research document in this folder. It answers these questions, with sources, before any sprint card is written.

1. **Record.** Which record events the view shows; which event each edit made in the view writes; whether the kernel's vocabulary changes, and by which proposal type.
2. **Session tool and model.** The tool the session uses for the same job, writing the same event kind; the model ability the view needs (vision, speech to text) and which installed models have it.
3. **Prior art.** Two or three tools, read from their docs or source, each labelled by kind; what we copy, and what D53 leaves out.
4. **Library.** The package; its API, read from the installed source (TECHNIQUES #46) into the bridge mappings in `WORKING_AGREEMENT.md`; its size after `vite build`; its licence, checked against PolyForm Noncommercial.
5. **Command, menu item and keys.** The command that opens the view, its View menu item, and the keys it binds while open.
6. **Where it plugs in.** Its widget kind, the state the component keeps for it, the partials it uses, and what the collection restores for it.
7. **UI vocabulary.** The `view`-category tags it adds to v0.4, one per record event it shows.
8. **Gate.** The Electron gate that proves it works, with structure, pixel and adversarial checks (Addendum A1, A2) and the import check.
9. **Scope.** What it includes and what it leaves out, held against D53.

**Order of work.**

0. **Shared work, done once.** (a) One field for the open view, replacing `revealed`, with the key handler passing keys to the open view first. (b) The widget registry, with a test that a CodeMirror editor keeps its undo history and cursor through a re-attach. (c) The workspace file API: list, read, write, watch, each held to its workspace. (d) A kernel call that appends an event to a paused session's record, and the edit event kinds, in the kernel repo. (e) Images sent to the model and attachments on `UserMessage`, in the kernel. (f) Two pane kinds, `SessionPane` and `ShellPane`.
1. **Code editor.** The other editors open from its file tree. It uses meta's lenses as a partial and the transcript with a third mount value.
2. **The collection.** It saves the code editor's state too. SQLite (D66), no save command (D68), and sprint 044's empty-pane rule.
3. **Plain shell.** One PTY module for the shell and the login card, with resize and the shell's environment; xterm.js behind one interface; the shell pane kind; the login card moved to xterm.js; key-to-echo time measured on SSE plus POST.
4. **Document editor.** Uses CodeMirror again; the byte-diff test confirms the source-backed choice.
5. **Image editor.** The first view whose edits write new files, so the first to need 0(d) and 0(e).
6. **Design canvas.** Sandboxed sheets, comment pins through 0(e), and a picture of each sheet for a vision model.
7. **Video editor.** Named media tools, `silencedetect`, whether to bundle ffmpeg, keyframe cuts or re-encoding, and transcripts timed per word if wanted.
8. **Audio editor, without plugin hosting.** Uses the video editor's timeline, edit list and named tools; adds wavesurfer.js.

## Open

- "Most of 17": the assumption leaves out 17f and 17e's plugin hosting.
- Edits made between turns cannot be recorded until the kernel can append to a paused session's record. The code editor for reading code, the collection and the plain shell do not need it.
- Vision runs only on three cloud models on this machine. The image editor's research decides whether its question to the session uses a cloud model or a local vision model is installed.

## Sources

Local: `design/received/handoff_latest/README.md`; sheet turns 16–17; `DESIGN-DECISIONS -through 2026-09-01-.md` (D48–D59, D66, D68, D71); `MENU-BAR -2026-09-01-.md`; `DESIGN-SPEC-2026-08-31-round4.md`; `design/received/handoff_latest/docs/RESEARCH-2026-11-04-editor-and-media-views.md`; product spec round 15; tech spec round 9; `BLACKBOARD.md` (2026-10-11 "Meta and panes", U141, U146, U147, U154, U158; the 2026-11-04 `user` entry); `process/sprints_v0.1/sprint-043-collection-persist.md`, `sprint-044-collection-restore.md`; `../substrate-ui-old-versions/substrate-shell-abandoned-2026-09-08/signals/0.1-rationale.md`; `sdd-kit-3/`, read in full; the code paths cited above; `ffmpeg -h filter=…`, `whisper-cli -h`, `curl :11434/api/show` and `npm view`, run on 2026-11-04.

Outside, as read on 2026-11-04:

- VS Code docs, "Terminal advanced": https://code.visualstudio.com/docs/terminal/advanced
- Electron docs, "Keyboard Shortcuts": https://electronjs.org/docs/latest/tutorial/keyboard-shortcuts
- xterm.js `Terminal` API docs: https://xtermjs.org/docs/api/terminal/classes/terminal
- ghostty-web README: https://github.com/coder/ghostty-web ; archived fork: https://github.com/humanlayer/ghostty-web
- Warp, a third-party write-up of "How Warp Works": https://willhbr.net/2023/08/02/warp-terminal/ ; Warp docs on shells: https://docs.warp.dev/terminal/warpify/subshells
- Ollama docs, "Vision": https://docs.ollama.com/capabilities/vision ; OpenAI compatibility: https://docs.ollama.com/openai
- `mcp-video` on PyPI: https://pypi.org/project/mcp-video/1.2.2/ ; Video Editor MCP Server: https://lobehub.com/ko/mcp/christopher-stevers-video-mcp ; video_editor_mcp: https://awesome.ecosyste.ms/projects/github.com%2Fkush36agrawal%2Fvideo_editor_mcp
- Playwright MCP listing: https://awesome.ecosyste.ms/projects/github.com%2Fmicrosoft%2Fplaywright-mcp ; a review quoting its README: https://testingbot.com/resources/articles/playwright-mcp
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
