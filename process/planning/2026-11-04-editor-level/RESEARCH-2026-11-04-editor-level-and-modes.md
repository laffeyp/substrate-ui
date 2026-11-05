# The editor level and its modes: what the shell has, how other tools do it, and how each mode gets researched

*2026-11-04. The design is sheet turn 16 (the editor level) and turn 17 (contextual modes) in `../../../../design/received/handoff_latest/sheets/Substrate Shell Directions v3.dc.html`, with decisions D48–D59 and D71 in `DESIGN-DECISIONS -through 2026-09-01-.md` beside it. Prototype v7 carries none of this: it has no explorer, no editor, no plain shell, no media tool. Turns 16 and 17 exist only as static sheet frames, so the frames and the decisions are the whole design input.*

## 1. What is being built

Turn 16 adds a third level. Today the shell has two, terminal and reveal. Turn 16 makes the toggle a cycle, terminal → reveal → full → terminal, on one ⌃` button whose label names the next stop (16b). The full level (16a) puts four regions around the focused session: an explorer rooted at that session's workspace, with modified-file dots from the worktree diff; a central editor with vim and nano bindings; the substrate terminal as a bottom panel; and the machinery pane on the right with the same lens chips as the reveal. Each region collapses: the explorer and machinery to labelled rails, the terminal to a sill that keeps its input (16c, D51). There are no splits inside the full level (D49c).

Turn 17 lists what the editor's centre can show. These are modes, not levels (D49):

| Frame | Mode | Decision |
|---|---|---|
| 17a | Documents in write mode: rendered and editable, markdown underneath, `source` one toggle away | D52 |
| 17b·0 | The user's own shell as a tab beside the substrate terminal, ⌘⇧T, rooted at the workspace | D49b |
| 17b·1 | A plain-shell pane at the tiled level: no session, no record | D59 |
| 17c·0, 17c·1 | Image mode: crop, resize, annotate, convert, analyze, "ask the session"; tools open as overlays on the viewer with a docked action bar | D50, D59 |
| 17d·0, 17d·1 | Video: one timeline edited by the session ("cut the dead air between 0:41 and 1:02") or by hand; one cut list that names who made each cut | D50, D54 |
| 17e·0 | Audio, one file: split, trim, fade, gain, normalize, denoise, effects from plugins scanned on the machine | D58 |
| 17f | Real-time translation as `translate_in` / `translate_out` producers | D65 |
| 17g | Design mode: chat left, a pannable canvas of live HTML/CSS sheets right, comments pinned to elements | D71 |

**Scope of "most of 17", stated as an assumption.** This document covers 17a, 17b·0, 17b·1, 17c, 17d, 17g, and 17e without plugin hosting. Two items are left out. 17f is a topology: its frame shows the existing transcript and structure lens, and nothing in it is a new screen. 17e's "plugins scanned from the machine" means AU/VST hosting, which needs a native audio host; no part of Electron or the Python runtime provides one (the audio prior-art row below). Whether these two are the intended exclusions is the Architect's call; the rest of the document holds either way.

**A word on "view".** The tone canon in `WORKING_AGREEMENT.md` reserves View for the kernel primitive: a running projection of the Bus that a Predicate reads. The design uses level, mode, lens and surface for screens, and this document keeps to those words.

## 2. How the frames read under the kit

Foundation 04 (`sdd-kit-3/foundations/04-sdd-claude-design.md`) says every visual state is the visible form of a domain event, and that the design should name each state by its event. Turns 16 and 17 already state this in their own captions:

- 17c·0: "this file's provenance — the open image came from seq 251".
- 17d·0: "the timeline's cut list and the record agree by construction".
- 17d·1: "hand edits stage on the timeline; export runs ffmpeg and the write lands on the record".
- 17e·0: "the waveform's fade region and the record agree by construction".
- D50: converted files "write beside the original and land on the record".
- D71: comments and selections "travel as UserMessage context".

Read that way, each mode is a projection of two sources the shell already treats as truth, the session record and the workspace on disk, plus one or more ways to write to them. D1 and D2 say the UI owns no state. The test for whether a mode keeps to the product is therefore mechanical: list every piece of state the mode shows and every action it offers, and name the record event or workspace file each one maps to. A row that maps to neither is UI-owned state. That is the way a mode drifts into being a separate application with its own truth.

Running that test on the frames turns up one gap that every editing mode shares. The session's edits reach the record today as `ToolCall` / `ToolResult` pairs. A hand edit does not reach the record at all. 17d·1's cut list reads "2 · trim demo pt 1 −0:02.4 · by hand, just now", and 17e·0's edit list reads "1 · gain +2.5 dB · whole file · by hand". Both attribute a hand edit as if the record carried it. 16a's modified-file dots avoid the question because they read the worktree diff, which sees the file and not the author. So before any editing mode is built, one question needs an answer: how does a hand edit become a record event? The candidates are a new kernel event kind (a vocabulary change through the proposal taxonomy in `grammar/PRINCIPLES.md`, in the kernel repo), a `UserMessage` that carries the edit, or an edit-list file in the workspace that the session reads like any other file. Each has a different cost to the kernel and to replay. It is the first item in the research order below, under shared seams.

Under the dual-contract audit (`grammar/BOOTSTRAP.md`, step 9), each behavior event a mode projects pairs with a view-category tag in the UI vocabulary. The UI vocabulary, `web/vm/signals/versions/current.json` (v0.3), has 36 tags in 11 categories (session 6, turn 6, spec 5, stream 4, runs 4, driver 3, bundle 2, records 2, slash 2, workspace 1, topology 1) and no `view` category. The handoff README's build entry already says the shell's UI-tag vocabulary needs a bump against these designs. Each mode's research produces its share of that bump.

## 3. What the current shell has and lacks

Facts from the code on 2026-11-04.

**Levels.** The component state holds `revealed: false` (`web/reveal_component.ts:98`), a boolean. `renderVals` derives `showTerminal: !surf && !state.revealed` and `showRevealed: !surf && state.revealed` (`:2265`). The button label is `state.revealed ? 'panes' : 'meta'` (`:2279`), and ⌘M toggles it through `_toggleMeta` (`:986`, `:1090`). Turn 16's cycle needs a three-valued level in place of the boolean. The obvious enum name collides: `RevealLevel` in `web/vm/kinds.ts` already names the all/app granularity toggle. Settling the name is a vocabulary decision, recorded as one. The shortcut also differs: the shell binds ⌘M, while the design and product spec say ⌃`.

**Layout.** `web/reveal.html` (563 lines) holds every screen as an `<sc-if>` block under one root: terminal, revealed, records, assay, studio, then the dialogs. The full level becomes a sixth block. The reveal's right pane (lens chips, stream, i/o, structure, language, scene, inspector) is written inline inside the revealed block, lines 160–342. 16a reuses "the same machinery pane", so that markup has to move into a partial before a second layout can include it. The include mechanism exists: `includePartials` in `vite.config.ts` already inlines `partials/input-bar.html` and `partials/choice-line.html`.

**Stateful widgets.** The template runs on dc-runtime (`web/public/support.js`, the design tool's runtime). `reveal_component.ts` is one `DCLogic` class, `@ts-nocheck`, 2,576 lines, inlined into the page by the `inlineDcScript` Vite plugin. dc-runtime clears a mount div's children on every commit. `web/reveal.ts:192–240` handles this for the transcript: a `MutationObserver` on `document.body` finds each `data-vm-transcript-mount` div and re-attaches a React root keyed by `view:paneId`. Every turn-17 mode is a stateful DOM widget: a text editor with an undo history, a terminal emulator with a scrollback buffer, a `<video>` element at a playhead, a canvas. Each must live in such an island, or a parent re-render destroys it. The island code handles one component and two view names today. It needs to become a registry of widget kinds. Whether a re-attach preserves a widget's internal state (cursor, undo stack, scrollback) or rebuilds it is untested. A text editor that loses its undo history whenever the parent commits is broken, so this is the first thing to measure.

**Organization.** Adding five modes to the 2,576-line untyped class would repeat what sprint 058 started unwinding. Each mode belongs in its own typed module under `web/`, mounted as an island. The dc component keeps the level, the active mode, and the region sizes, and nothing else.

**React.** `reveal.html:11–12` loads React and ReactDOM 18.3.1 from cdnjs at page load, because dc-runtime reads `window.React` at parse time. Mode libraries do not follow that route; Vite bundles them.

**Workspace files.** The backend has no endpoint that lists, reads, or writes files in a workspace. `/api/worktree_diff` (`server.py:4352`, implemented at `:2009`) returns `substrate.app.workspace.worktree_diff` and refuses any path outside the sessions' `wt/` folder (lens audit F301). Of the three workspace shapes (repo → worktree, directory → flat, blank → sandbox), only the worktree shape gets modified-file dots from it. The explorer, the editor, and every media mode need a file API confined the same way `_worktree_diff` is, plus change notification. `watchfiles` 1.2.0 imports in the kernel environment, but `../substrate/pyproject.toml` does not declare it; a mode that depends on it declares it.

**PTY.** `_cli_pty_start` (`server.py:1437`) opens a pseudo-terminal with `pty.openpty()`, runs a CLI's `login_command` from the `KNOWN_CLI_ADAPTERS` catalog, drains output into a 512 KB rolling buffer, and serves it over SSE at `/api/cli/<name>/pty/stream/<sid>`. Input arrives by POST at `/pty/stdin/<sid>`. There is no resize; nothing sets `TIOCSWINSZ`. A plain shell needs `$SHELL -l` spawned with the workspace as its working directory, a resize call, and a terminal emulator in the window. `web/reveal/transcript/ansi.ts` colours transcript text; it is not an emulator. Product spec round 15, in "What this deliberately is not", lists "Not a real PTY" as deferred work. 17b lifts that deferral.

**Electron.** The window runs with `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false` (`electron/main.js:342–345`). Native Node modules such as node-pty cannot load in the renderer. Process-owning work runs in the Python backend, which already owns a PTY, or in Electron main.

**Media.** Electron builds its bundled ffmpeg with proprietary codecs by default, H.264 included, so an `.mp4` plays in a plain `<video>` element. Electron also ships a codec-free ffmpeg build. The sources are Electron's own `build/args/release.gn` and its proprietary-codecs test page, both seen through mirrors; confirm against the installed Electron 44 before the video research closes. Export is another matter. ffmpeg 8 is on this machine only as Homebrew's `/opt/homebrew/bin/ffmpeg`, and the app bundle carries none. ImageMagick is not installed, though 17c's example tool call runs `bash magick`. macOS `sips` is at `/usr/bin/sips`. Pillow 12.3.0 imports in the kernel environment and is likewise undeclared.

**Gates.** `npm run gates:electron` chains 45 Electron gate scripts under `harness/shakeout/`. Each mode adds at least one, under the three lenses of Addendum A1 (structural, perceptual decode, adversarial). The pixel-anchor decode in Addendum A2 fits image mode (assert the cropped pixels) and the waveform (assert the fade region's envelope).

## 4. How established tools solve the same problems

Each row names the source and its genre. Vendor documentation describes the vendor's own product, an engineering post is the team's own account, a README is the project's claim about itself, and a forum thread is one person's report.

**The editor level's layout.** VS Code's workbench has the same four regions (side bar, editor group, panel, secondary side bar), and so does Zed. Nothing about 16a's layout is new. The new part is the bottom panel holding the agent's transcript instead of a shell.

**The text editor component.** The choice is CodeMirror 6 or Monaco. Sourcegraph's engineering post on leaving Monaco gives three reasons: Monaco was about 2.4 MB, roughly 40% of the JavaScript on their search page; its global model made several differently configured instances on one page hard; and its theme colours had to be hex values set in JavaScript. Replit's post on the same move records the cost: features they had used in Monaco did not exist in CodeMirror 6, and they built and published them. D53 settles most of it. Its OUT list is debuggers, language plugins and extension marketplaces, which is what Monaco's weight buys. The D7 palette lives in CSS, which CodeMirror themes read directly. Candidate packages, versions from npm on 2026-11-04: `@codemirror/view` 6.43.15 (MIT), `@replit/codemirror-vim` 6.4.0 (MIT). In-file search ships as `@codemirror/search`; global search is a backend `rg` call. Nano bindings have no package; they are a small keymap.

**17a write mode.** Two families exist, and they differ on exactly the property D52 cares about.

- *Source-backed live preview.* The markdown string is the document; decorations hide syntax away from the cursor and show it at the cursor. Obsidian's plugin docs describe CodeMirror 6 decorations (mark, widget, replace, line). Forum posts, not Obsidian source, say Live Preview uses replace widgets that drop away when the cursor overlaps them. Atomic Editor and Silkdown are open CodeMirror 6 implementations of the same idea; their READMEs state that the raw markdown stays the source of truth. A save writes back exactly the bytes the user typed.
- *Model-backed WYSIWYG.* ProseMirror-based editors (Milkdown, Tiptap) parse markdown into a node tree and serialize it back on save. ProseMirror's forum states that the conversion is lossy: indentation, line breaks and list-marker characters change. `prosemirror-markdown` issue #82 reports that nested marks of one type cannot be serialized. Tiptap's `@tiptap/markdown` claims fidelity; that is a vendor claim, untested by anyone independent.

The session writes these documents with `write_file`. A lossy serializer rewrites the session's markdown on every hand save, which puts diffs the user never made on the worktree and on the record. That points at the source-backed family. The cost is that syntax shows at the cursor, which is less like Google Docs than D52 asks for, and 17a's frame shows no syntax at the caret. The 17a research has to settle that trade. The frame's own "source (live)" strip, showing the markdown under the caret's sentence, suggests the design already expects the source to stay visible somewhere.

**17b the plain shell.** VS Code, Hyper, Tabby and Wave Terminal all draw the terminal with xterm.js and run the shell in a separate process behind a PTY. For VS Code that is a pty host process running node-pty; the sources found are third-party skill pages, so the process diagram needs a check against `src/vs/platform/terminal` in the VS Code repository. node-pty's README states that every spawned process runs at the parent's permission level. Candidate packages: `@xterm/xterm` 6.0.0 and `@xterm/addon-fit` 0.11.0 (both MIT). The backend half already exists; it needs resize and a shell spawn. The research question is transport. Today's SSE out and POST in costs one HTTP request per keystroke; every tool above uses a socket.

**17c image mode.** macOS Preview is the benchmark for "basic but real": crop, resize, annotate, adjust, and export to a fixed list of formats. Crop and annotate overlays are canvas work in the window; a histogram is `getImageData` over the decoded pixels. Conversion to webp, jpg, ico and pdf can run in the backend through Pillow or `sips`. D50's rule settles where. A hand convert and the session's convert must produce the same kind of record event, and the session converts through a tool call, so the hand path calls the same backend operation the session's tool does.

**17d video.** LosslessCut is the closest prior art for the timeline. It is an Electron app that keeps a cut list and exports by running ffmpeg. Its README is explicit that lossless cuts copy streams without re-encoding, so they land on keyframes, not exact frames; "keyframe cut" puts `-ss` before `-i` and "normal cut" after. 17d·0 shows a cut at 0:41.6, a tenth of a second, so the video research has to decide between keyframe-bounded stream copy and re-encoding the segments around each cut. Descript is the closest prior art for "say it and it is cut". Its help pages describe the transcript as the editing surface: deleting text hides the media without destroying it, a timeline stays available for precise work, and the edit can be exported as an XML edit record. That is D54 with the transcript in place of the session, and its non-destructive edit list answers part of the question of how a hand edit reaches the record.

**17e audio.** wavesurfer.js (8.0.5, BSD-3-Clause) draws the waveform. Its Regions plugin gives draggable, resizable segments, and its Envelope plugin draws a volume or fade curve. Its docs leave trimming and export to the application. Plugin hosting is a separate subsystem. JUCE gates AU and VST3 hosting behind `JUCE_PLUGINHOST_AU` and `JUCE_PLUGINHOST_VST3`. minihost, on PyPI, is a headless JUCE-based host with Python bindings. A JUCE forum thread reports plugins that pass a scan and then freeze the host, which is why hosts scan out of process. None of this runs inside Electron or the bundled Python today, which is why plugin hosting sits outside the assumed scope.

**17g design mode.** The nearest prior art is in this workspace. The handoff's `.dc.html` sheets are live HTML/CSS frames on a pannable canvas, rendered by the same `support.js` runtime the shell already loads, and 17g's sheets are the same kind of file. Figma's comment model pins a note to a canvas element; D71 sends that pin into the next `UserMessage`. The research question is isolation: whether each sheet renders in a sandboxed `<iframe srcdoc>` so a sheet's CSS cannot reach the shell's.

## 5. Researching each mode before building it

The danger the Architect named is the extensions pulling the product: each mode growing its own state, its own idea of a file, its own way of editing, until the shell is five applications around a chat. The guard is the record test: every state a mode shows and every action it offers maps to a record event or a workspace file. Each mode gets one research document under this folder, and every document answers the same eight questions, with sources, before any sprint card for that mode is written.

1. **Record contract.** Which record events does the mode project? Which events does each hand action produce? Is a kernel vocabulary change needed, and of which proposal type? A row that maps to neither the record nor the workspace fails D1 and D2, and the design changes before the build starts.
2. **Session parity.** Which tool does the session use for the same operation (D54: "the same operations exposed to the session")? The hand path and the session path produce the same event kind. Name the tool: an existing `bash` or `write_file` call, or a new `Tool` passed into `tool_loop_topology(tools=...)`.
3. **Prior art.** Two or three tools, read from their docs or source, each labelled by genre. What we copy, and what D53 refuses.
4. **Library and bridge mapping.** The candidate package, its API read from the installed source (TECHNIQUES #46) and written into the "External SDK bridge mappings" section of `WORKING_AGREEMENT.md`. Its bundled size, measured after `vite build`. Its licence, checked against the project's PolyForm Noncommercial licence.
5. **Shell seam.** Which island kind it mounts as, what state the dc component holds for it, which partial it uses, which keys it binds. The binding is checked against the keys already taken: ⌘D, ⌘⇧D, ⌘M, ⌘E, ⌘F, ⌘, and ⌃C over an input.
6. **UI vocabulary.** The view-category tags it proposes for v0.4, with one dual-contract audit row per record event it projects.
7. **Observation contract.** The Electron gate under `harness/shakeout/` that proves it, with its structural, decode and adversarial checks (Addendum A1, A2).
8. **Scope line.** What is in and what is refused, measured against D53's bar: enough that nobody leaves for VS Code mid-session, and no more.

A research document is done when it answers all eight with citations. Sprint cards follow from it, each at most two files and one concept (hard rule 6).

**Order.** Shared work first, then modes in the order their dependencies allow.

0. **The shared seams.** Done once, before any mode. (a) The level state: three values replacing the boolean, the enum name settled against `RevealLevel`, the ⌘M / ⌃` binding settled. (b) The island registry, with the re-attach test: does a CodeMirror instance keep its undo history and cursor across a dc-runtime commit? (c) The workspace file API: list, read, write, watch, confined per workspace shape the way `_worktree_diff` is confined. (d) How a hand edit becomes a record event, researched in the kernel repo because it may change the kernel's vocabulary.
1. **16, the editor level, with code mode.** Every other mode mounts inside it. It reuses the machinery pane once that pane is a partial, and the transcript once `Transcript` accepts a third view value for the bottom panel.
2. **17b·0 and 17b·1, the plain shell.** The smallest new surface: the backend PTY exists and needs resize and a shell spawn; the window needs xterm.js. 17b·1 has no session and no record, so it is the one mode the record test passes by having nothing to project. That has to be stated in its research document, not assumed.
3. **17a, write mode.** Reuses the CodeMirror setup from step 1. It decides the source-backed versus model-backed question.
4. **17c, image mode.** First mode with a hand edit that writes a new file, so it is the first real use of the answer to 0(d). It also settles where conversion runs (Pillow or `sips` in the backend).
5. **17g, design mode.** The canvas and the comment-to-`UserMessage` path. In-house prior art in `support.js`.
6. **17d, video.** The hand-edit question at its hardest, since hand cuts stage before export. ffmpeg has to be bundled or declared as a machine requirement, a decision recorded on its own. Frame-accurate versus keyframe cuts gets settled here.
7. **17e, audio, without plugin hosting.** Reuses 17d's timeline and edit list; adds wavesurfer.js.

## 6. Open

- The scope of "most of 17": the assumption is that 17f and 17e's plugin hosting are out.
- How a hand edit reaches the record blocks the editing modes. It does not block 16 with read-only code, or 17b.

## Sources

Local: `../../../../design/received/handoff_latest/README.md`; the sheet turns 16–17 named above; `DESIGN-DECISIONS -through 2026-09-01-.md` (D48–D59, D71); `DESIGN-SPEC-2026-08-31-round4.md`; `../../../../design/current-design-direction/product-spec/PRODUCT-SPEC-2026-08-17-round15.md`, the sections "The UI — two views, one toggle" and "What this deliberately is not"; `TECH-SPEC-2026-08-25-round9.md`, the sections "Extension seams" and "Piece G"; `sdd-kit-3/` in full; the code paths cited under "What the current shell has and lacks".

Outside, as read on 2026-11-04:

- Sourcegraph, "Migrating from Monaco Editor to CodeMirror" (engineering post): https://sourcegraph.com/blog/migrating-monaco-codemirror
- Replit, "Betting on CodeMirror" (engineering post): https://blog.repl.it/codemirror
- Obsidian developer docs, "Decorations": https://docs.obsidian.md/Plugins/Editor/Decorations
- Obsidian forum, live-preview decoration threads (user reports): https://forum.obsidian.md/t/simplest-possible-example-of-a-decorating-editor-extension/91652
- Atomic Editor (README): https://github.com/kenforthewin/atomic-editor ; Silkdown: https://sveltethemes.dev/magarcia/silkdown
- ProseMirror forum on lossy markdown conversion: https://discuss.prosemirror.net/t/possible-to-collaborate-in-different-docformat-of-the-same-document/63 ; `prosemirror-markdown` issue #82: https://github.com/ProseMirror/prosemirror-markdown/issues/82
- Tiptap, bidirectional markdown (vendor post): https://tiptap.dev/blog/release-notes/introducing-bidirectional-markdown-support-in-tiptap
- Electron, proprietary-codec build flag and test page (repository, via mirrors): https://source-hub.etos-pro.ru/Electron/electron/src/branch/main/build/args/release.gn ; https://ayakael.net/mirrors/electron/commit/5b4f715d2e6ffc1427205448825e85857f28240b
- node-pty README: https://lively-kernel.org/lively4S2/lively4-server/node_modules/node-pty/README.md
- LosslessCut README (mirror): https://git.morozoff.pro/aiden/lossless-cut/src/tag/v3.4.0
- Descript help centre and reviews: https://help.descript.com/hc/en-us/articles/15726742913933 ; https://www.tella.com/blog/descript-video-editing-how-does-it-work
- wavesurfer.js Regions plugin docs: https://wavesurfer.xyz/docs/plugins/regions/ ; plugin list: https://wavesurfer.xyz/docs/plugins/
- minihost (PyPI): https://pypi.org/project/minihost/ ; JUCE `juce_audio_processors` reference: https://www.ccoderun.ca/juce/api/juce__audio__processors_8h.html ; JUCE forum, VST3 scan freeze (user report): https://forum.juce.com/t/problems-scanning-vst3-plugins-multiport-midi-perhaps/37190
- npm registry, versions and licences for `@codemirror/view`, `@replit/codemirror-vim`, `@xterm/xterm`, `@xterm/addon-fit`, `wavesurfer.js` (queried with `npm view`).
