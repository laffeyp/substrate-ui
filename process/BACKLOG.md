# BACKLOG — running notes & ideas (substrate-ui)

*A living document. The Architect surfaces notes while using the console — things to fix, or just to
think about (not necessarily to fix now). Captured here so nothing is lost; promoted into a sprint
card when picked up. Append-only-ish; mark items done/promoted rather than deleting.*

---

## Actionable (small fixes)

- **[2026-11-11] Open after the code editor's roadmap closed (sprint 486).** The roadmap's Later list (`process/planning/2026-11-09-code-editor/ROADMAP-2026-11-09-code-editor-r20.md`) holds code colours in replies (a research program), the reply's length as an option, the red-green scheme, wrapping, and C and C++ in the outline. Also open, and held here:
  - **Change marks as a mode.** Off while the person types, on when the session edits the file; a `git` toggle in the status line and in Settings (the Architect, 2026-11-11: "This is definitely a mode … maybe it shouldn't be default for humans"). Set aside with the next item.
  - **The marks in the line numbers' margin**, so a first change does not shift the code sideways ("We keep the shift for now … We can think about this later").
  - **The tree's dot on every file** in a mostly uncommitted workspace (BLACKBOARD `surfaced`, 2026-11-11): "differs from HEAD" tells little there.
  - **The workspace search's long-line hang**: Python `re` backtracks on a long line (`_workspace_search`, `_workspace_replace`); set aside 2026-11-11 ("Just mark it and go"); the `regex` module's `timeout=` is the known fix.
  - **The frames' parts not built** (`CLOSE-2026-11-11-code-editor.md`): the inspector header's ⌃⇧` record chip; the top bar's short worktree chip and the model chip's ▾; the footer's `clean · record … · N events` (E11, waiting on what "clean" means); the record column's `RECORD` header and its chip; a 16c capture with every column folded.
  - **The large-file views retired by sprint 471** still in the code: `web/app/editor/LinesView.tsx` (imported by `Centre.tsx`) and the server's `/lines` route; no file reaches them since every file opens in the code editor.
  - **Images to the models that see them** (BLACKBOARD `deferred`, 2026-11-11): kernel work, set aside.
  - **The tree's find returning no file** once (BLACKBOARD `open question`, 2026-11-10): instrumented, not seen again in 85 runs.

- **[2026-11-11] The editor highlights every occurrence of what is selected.** The Architect: "when I double click on part of a word … I want to see everywhere that's used highlighted Every time I do that by default … I'm talking about in code … every object dot function call In the editor should become highlighted, maybe it should be highlighted a little less … You highlight a line and you can see where that line is duplicated throughout the whole thing." On by default for code, not Markdown or prose; a tweak in Settings (the tweaks panel). Highlighted more softly than find's matches; in view and through the whole file. `@codemirror/search` 6 ships `highlightSelectionMatches({ highlightWordAroundCursor, minSelectionLength, maxMatches, wholeWords })` (`node_modules/@codemirror/search/dist/index.d.ts`): it marks matches in the viewport with `cm-selectionMatch`, and stops at `maxMatches` (default 100) in view. The whole-file count (a scrollbar mark, or a count in the status line) is not in it and needs its own design. Not started.

- **[2026-10-09] Shell in the cockpit: a plain terminal pane, and `!` in the session input.** Two notes from the Architect.
  - **Terminal pane on a key.** Not built. Design decision D59 ("shells can be panes": shell name, cwd, "no record") plans it, and the 2026-09-10 Layer 0 review lists the binding as `plain terminal pane ⌘⇧T` in settings. The Architect asked for ⌘T. No pane in `web/` runs a shell today; the only pty is the CLI login prompt (`AuthPromptCard`, `/api/cli/<cli>/pty/*`).
  - **`!command` runs a shell command.** A session input line that starts with `!` runs the rest in the session's workspace shell, with no model call; the output lands in the transcript and on the record, where the next model step can read it. The convention is old and widely copied: `ed` runs `!command` in a shell (Debian `ed(1)`), `vi` has `:!command`, and Claude Code's bash mode runs a `!` line in its shell and adds the output to the conversation (Claude Code docs; third-party guides describe the same). Open design points: which record kind carries the command and its output (the tool seam's `ToolCall`/`ToolResult` with a user source, or a new kind in the session vocabulary); whether the model is told, as Claude Code's `respondToBashCommands` setting allows either way; and how long-running commands join the background-task table (ROADMAP-2026-10-02).
  - **Wider survey.** Before building, list the terminal conventions people assume without thinking about them (`!` escape, `/` commands, ⌃R history search, ⌃C/⌃D, tab completion from history, ↑ recall), trace each to where it started (ed, vi, readline, csh), and mark which Substrate has.

- **[2026-09-27] Post-ship cockpit directions — see `process/planning/FUTURE-DIRECTIONS-2026-09-27-cockpit-post-ship.md`.** Five threads captured from Peter's Sprint 087c dictation: Studio rewrite (topology dropdown + read-only shape display, or hide for ship), Records keyboard nav (↑↓ walks workspaces, enter opens, ↑↓ walks sessions, enter attaches), workspace picker (immediate ↑↓ on pane open + real-filesystem autocomplete + drop the "fills nearest recent" glyph the placeholder still promises), every existing topology session-runnable + terminating, and the long-term multi-pane topology viewer (session pane spawns sub-topologies, each opens as its own pane with a topology-specific left half + standard stream/graph/IO/scene right half; control stays in the session pane).

- **[2026-06-22] [DONE — sprint 011] Inspector should work on the OUTPUT ARTIFACTS (I/O pane).** Each
  output artifact row is now clickable -> `inspectEvent(seq)` (cursor + hover), filling the inspector
  with its full content, like a stream event. Gated in e2e §16.

## Legibility

- **[2026-06-22] [DONE — sprint 011] Application content/code views are too terse.** The inspector now
  renders string payload fields that are code/prose/model-output (newlines or ≥40 chars) as a
  dedicated readable CONTENT block (real newlines, monospace, green left-border) above the raw
  payload — e.g. a `CodeChunk` shows `def solve(x):` as actual code. Verified both tracks (e2e §16 +
  viewed). RESIDUAL (future, low): syntax-aware highlighting; the content detection is a heuristic.

- **[2026-06-22] [DONE] Run-as-graph: the spawn dot lands mid-bar and reads as "spawned inside
  itself."** Diagnosed by correlating `run_graph` (cells: fired=5/7/9…, started=55/58/61…,
  ended=57/60/63…; dot@0.96 of the firing-anchored bar) with the screenshot — the bar conflated
  QUEUED time (94%, waiting in the single-writer admission queue) with RUNNING time (~4%). FIXED:
  each lane now splits into a faint hatched `fired->started` (queued) segment + a solid status-
  coloured `started->ended` (ran) segment, with the dot at the boundary (the run START). Verified
  both ways: 53/53 lanes correlate render↔log (`dot==run-start`); viewed. Gated in e2e_console.js §2.

- **[2026-07-30] [promoted -> sprint 015] The selected call options must be OBVIOUS in the agent terminal.** After the token-cap fix, the Architect ruled: the parameters a turn runs with (driver, thinking on/off, token cap, timeout) must be visible in the dock head and settable in place — not implicit constructor state you discover by reading a record.

- **[2026-07-30] A parameters pane.** Beyond the head strip: a pane that shows every parameter the call is made with, per instantiation, per gateway (Ollama and a CLI driver have different knob sets). Design direction; ties to the thinking-capture decision (THINKING-CAPTURE-RESEARCH-2026-07-30) — `think on` changes behavior today and should capture the monologue once the engine records it.

- **[2026-07-31] Workflow parity — ship the patterns as applications.** The agent-CLI products' workflow features (subagent fan-out, pipelines, verify panels, background notify, standing multi-agent mode) map onto existing substrate primitives almost 1:1 — the capability table is in `../../docs/cockpit/COCKPIT-DIRECTION-round2-2026-07-30.md` item 11. The build items it resolves to: the `delegate` tool, the MCP servers, the application manifest, and a workflow-shaped application library (fan-out review, best-of-N + adversarial verify, research sweep) registered and launchable. Substrate's edge over all of them: every step is on a replayable record.

## Long-shot / aesthetic

- **[2026-08-27] Winamp-visualizer tab.** Once the daily-driver arc is far enough along that a session runs mostly hands-off, add a visualizer surface — a tab that renders shapes driven by whatever the LLM is doing right now (token cadence, tool-call rhythm, producer fan-out, cancel/retry pulses, whatever's in the record's live tail). Not a debugging surface; an ambient one. The Winamp reference is the whole spec — feed the log stream through a visualizer the way Winamp fed audio through Milkdrop. Far out; capture now, revisit when everything upstream of it is boring enough to watch.

## Research directions (park; revisit when the interactive-agent terminal lands)

- **[2026-06-22] substrate-ui -> an agent-IDE / code editor.** Beyond reading: *control your LLMs from
  the terminal*, and VIEW + WRITE their code in the UI as a full editor. "Why not also write code in
  here / control your LLMs from here and view their code, as a full editor?" The honest answer is
  mostly "why not" — park as one of the very-next directions once the interactive model agent in the
  terminal exists. Ties to: the terminal (sprint 010), the interactive open-source-model agent (next),
  the application-content code views (above), and the parked tool-suite note
  (`../substrate/docs/tool-loop-tool-suite.md`). The arc: read -> converse-with-a-model -> view its
  output -> edit -> a full agent-driven editor over the substrate record.

- **[2026-10-02] Sessions in a virtual machine or container.** The Architect: Substrate should
  eventually run a session's tools inside virtualization and/or a container, "for this exact task of
  getting these models their own space they cannot break out of." The shape: start a VM or
  container from a folder holding everything the model should have context on, and the session
  works only inside it. Some teams run in-house virtualization already, which makes this simple for
  them. Today the bash tool runs on the host with the user's rights (sprint 103's process groups
  supervise it; they do not confine it). Ties to: the test-only `sandbox-exec` profile
  (`../substrate/tests/_sandbox.py`), the queued containerization requirement for SWE-bench grading,
  and the per-session workspace.

---

*Append new notes with a date and a one-line context. Promote to a sprint card when worked; mark the
item `[promoted -> sprint NNN]` rather than deleting (the audit trail is the work).*
