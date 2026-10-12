# ROADMAP: before distribution

*2026-10-11. From the Architect's direction of 2026-10-11, given in conversation. Item numbers refer to `OPEN-ITEMS-2026-10-10.md`. Everything under "Before distribution" ships before the app is distributed; everything under "After distribution" waits.*

## Before distribution

### Fixes

- **5. `electron_smoke` fails on the first launch after an install.** It passes on every rerun. Find the root cause and fix it.
- **8 (U126). `model_half_starts_session.ts` clicks a model row that is not in the real roster.** The test picks models as a user does.
- **10. The login card.** Remove "ready to pick a session" (`AuthPromptCard.tsx:213`) and check the layout of that bottom row.
- **`bash` cuts stdout at 8,000 bytes with no marker** (`substrate/src/substrate/topologies/tool_loop/tools.py:513`). A model read 222 lines of a 4,000-line file and answered 222. The output needs a marker naming the cut and where the rest is.
- **Harness tool calls in the session bar.** The session bar's turn line (turns, seconds, tools) reports no tools used when a harness driver's tools ran. A `HarnessToolCall` counts there as a `ToolCall` does.
- **The input bar's hint.** Before a session exists, the hint in the input bar lists its keys. Two parts are false and come out: "type a path" (typed text is not treated as a folder path) and "‹symbol› fills nearest" (nothing autocompletes). The other key hints stay where they are true: ↑↓ moves, shift-enter opens, enter picks the folder. The input bar itself, the program's text input, is unchanged.

### One top bar

Today the app has two top bars: one in the terminal view and one in the reveal view. They have the same elements at different sizes and layouts, and some contents differ. Split panes each carry their own header.

- **Only the reveal view's top bar is kept,** with its sizes and layout. It always sits at the top of the app. The terminal view's top bar is removed.
- **Panes carry no top bar of their own.** Splitting no longer creates, moves or duplicates a top bar per pane.
- **The bar shows the focused pane.** When focus moves to another pane, the same bar changes its contents to that pane's: the reveal button's state, the model indicator, the workspace indicator, the pane name and the session name.

### The workspace bar

- *Moved to After distribution 2026-10-11 (Architect): the workspace, model and guidance steps stay as they are; the sequence is a fragment of a later picker redesign.* **Picker steps in sequence.** Model and guidance come after the workspace step, not to its right. The order is: workspace; then, unless a previous session was picked, model; then the guidance row beneath it. Picking each in turn starts the session. Nothing is greyed out: each step appears when its turn comes. The model list is left-aligned like the workspace list, and its carets point the same way. A control added later becomes the next step in the sequence.
- **13–14. Hints beside the headings.** A grey hint on the same line as each heading. WORKSPACE (`web/reveal.html:122`): "choose where you want to work · or open a previous session". MODEL (`web/reveal.html:143`): "choose a model to work with".
- **15. The GUIDANCE hint.** Worded once the Length and Tone rows exist.
- **16. Length and Tone rows.** Length: terse, normal, full. Tone: blunt, neutral, formal, dry. Each position is one or two sentences of guidance sent at session open, the same on every driver. No measurement is built; the rows are checked by reading replies. Source: `substrate/process/planning/RESEARCH-2026-10-10-guidance-controls-r4.md` §7.
- **7 (U125). The header model chip becomes an indicator.** No dropdown; a click opens a card with driver, version and bundle, as the workspace chip does.
- **9 (U127). Spec rounds.** New rounds of the product, tech and design specs that describe the picker in the bar, in place of the header dropdown (product spec round 13 line 704, tech spec round 7 line 1257, design spec round 2 §3). Written after the items above, so they describe the final form.

### The session

- **The session-start line.** Before the first message, the empty transcript shows a line in its top left, such as "session started with ‹model› at ‹workspace›". The user's first message appears below it, beside its blue caret. The line tells the user that the empty area is where the conversation will appear.

- **Expand or collapse all tool output.** One toggle sets every tool execution in the transcript to expanded or collapsed. Flipping it expands or collapses all existing tool output at once, and tool executions that arrive later open in the current state. It is flipped by a key command or by a control in the top bar.
  - *Revised 2026-10-11 (Architect):* no clickable control anywhere. The key is ⌘E, and the slash commands are `/fold`, which flips (fold, unfold, fold), and `/unfold`, which unfolds.

### 18. The terminal pane

Cmd+T opens a terminal pane in the pane system. It runs the user's shell (`$SHELL`, with the user's own config files) and draws it, so the pane works as the user's terminal does. The user can set a different shell.

The terminal pane has no reveal view, no records, no studio and no model picker. It has no tie to Substrate's runs or record. It opens in the workspace of the place it was opened from. While it is the focused pane, the one top bar shows it.

### Compaction (release step 2)

Today Substrate drops whole turns, oldest first, the user's requests and the model's replies with them, once an estimate of the history passes 60% of the driver's window. It never clears old tool output, counts tokens as characters ÷ 4 against real counts it already records, and gives every CLI driver a flat 100,000-token window. A codex session lost both earlier turns, its deep review among them, to one heavy turn. And it is broken now: every tool output in the current turn reaches the model twice.

What gets built, in the Substrate way (the record never changes; the prompt stays a pure function of it; every cut is recorded):
- **K290. Tool outputs sent once.** The double send is removed.
- **K291. Vocabulary round.** `TranscriptCompacted` gains the `tool_output_cleared` strategy and the cleared seqs; user messages are never cut while a later turn is kept; no event unless the cut changes.
- **K292. Clearing, budget, cadence.** Old tool-output bodies are cleared first behind a one-line placeholder; user messages and final replies stay; whole turns drop only as a last resort; the current turn is bounded the same way; the budget uses the drivers' reported token counts; CLI windows are set per model; clearing runs in batches so the prompt's start stays stable.
- **K293. Console row and live test.** The console names what was cleared, shows a repeated cut once, and a live test reruns the codex case.

*Done 2026-10-11 (K290–K294). K294 resolves each CLI model's window in order: the harness's live report, the CLI's own settings, the maker's documented window, Substrate's config, then 100,000.*

Roadmap: `substrate/process/planning/ROADMAP-2026-10-11-compaction.md`. Research: `substrate/process/planning/RESEARCH-2026-10-11-compaction.md`.

### Sessions and windows (added 2026-10-11, Architect)

- **Naming sessions.** A user names a session, and the name holds: in the top bar, in records, in the workspace bar's list of previous sessions, and across a restart. Long overdue.
- **A new pane from the meta view returns to the panes view.** Today ⌘D in the meta view makes the pane but leaves the user in meta, where the new pane cannot be seen. Making a pane switches to the panes view.
- **New windows.** After the window is closed, nothing makes a new one. Substrate needs a way to open windows, and its macOS menu bar is to be checked against the platform's conventions while that is built.

### The records page (added 2026-10-11, Architect)

- **Workspaces in the main view's style.** The records page lists workspaces in the style the panes view's workspace bar uses: the darker background, the rounded corners, centred. Only the style changes; the records page keeps its own content and layout of that content.
- **"sessions get work trees".** Beside a git workspace the page says "sessions get work trees". First find out whether that is true. Then, wherever the phrase appears, a workspace that has worktrees reads "git · worktree".

### Topologies: real and useful from a session, or dropped from it

Every topology that ships with Substrate and that a session can run is gone through one by one. Each is either made real and useful in an actual session, or dropped from what the session can see. Today none of this has been tested from a session: a coding topology, for example, cannot be loaded and run from a session and be relied on to work.

- **Kept:** the session can load it, run it and use its result, and that has been tested from a session against a real model.
- **Dropped:** removed from Substrate UI and from what the session topology is told exists (`list_topologies`, `run_topology`, the guidance). The topology stays in Substrate itself.

The app is not released with a topology the session can reach that has not passed this.

## Order

Reordered 2026-10-11: compaction moved ahead of the small fixes, since it damages every real session in use now. Set from each item's dependencies. Sprint cards are written one step at a time: cards for a step, the step, then cards for the next.

| # | Item | Why here |
|---|---|---|
| 1 | 5. `electron_smoke` fails on first launch | The Electron gates check every later step; they must report truly first. |
| 2 | Compaction (K290–K293) | Broken now and damaging every real session; the topology audit runs real sessions whose results depend on it. |
| 3 | 10. Login card; the input bar's false hints; harness tool calls in the session bar; `bash` output cut without a marker | Small fixes; depend on nothing, block nothing. |
| 4 | Topology audit | Depends on no UI step and is the largest unknown; starting early shows its size. What it drops leaves the guidance text that step 10 then builds on. |
| 5 | One top bar | Steps 6, 7 and 13 put things in the top bar. |
| 6 | 7 (U125). Model chip becomes an indicator | Lives in the top bar; built once, on the single bar. |
| 7 | Tool-output toggle | Its control sits in the top bar. |
| 8 | ~~Picker steps in sequence, with 8 (U126)~~ Moved to After distribution (2026-10-11). In its place: **text entry in the input bar** — Shift+Enter makes a new line, and a sweep for the other standard text-box behaviour the bar lacks. | The Architect's call: small things a user meets every turn come before a picker redesign. |
| 9 | ~~13–14. WORKSPACE and MODEL hints~~ Tried and taken out 2026-10-11 (sprint 142); "pick a model first" kept at a new, fainter hint level | The headings move in step 8. |
| 10 | 16. Length and Tone rows | The next steps in the new sequence. |
| 11 | 15. GUIDANCE hint | Worded once the rows exist. |
| 12 | Session-start line | Names the model and workspace the finished picker chose. |
| 13 | 18. Terminal pane | Needs the single top bar. A shell drawn in Electron needs a terminal emulator and a native pty module, which must be rebuilt for Electron and signed with the app; doing it before the end leaves room for signing trouble. |
| 14 | 9 (U127). Spec rounds | Describe the final form, so after every UI change. |
| 15 | Naming sessions | Added 2026-10-11. |
| 16 | A new pane from the meta view returns to the panes view | Added 2026-10-11. |
| 17 | New windows; the macOS menu bar checked against convention | Added 2026-10-11. |
| 18 | The records page: workspaces in the main view's style; the worktree copy checked and reworded | Added 2026-10-11. |
| 19 | Full gates, signed build, distribution | Full suites and all Electron gates once on the installed app, then the signed build ships. (Was step 15, then 18.) |

Steps 5–7 are one top-bar group; steps 8–11 are one picker group. *(2026-10-11: step 8 is now the text-entry sweep; the picker sequence moved to After distribution.)*

*Corrected 2026-10-11: two step-3 items were not defects. The bundle's bytecode is built in and sealed: the installed app holds the same 149 `__pycache__` files as the build, all copied at install, and `codesign --verify --deep --strict` passes. The cursor model list was fixed in `a6374e1` (2026-10-10 18:34); the session with `--model Available` started at 18:14.*

## After distribution

- **The long-term direction: Substrate makes the topology the user needs** (Architect, 2026-10-11). A primary use: the user says what work they need, and a make-topology tool builds the topology for it, because Substrate has been set up to replicate the workflows the user already runs.
  - *Example, a parallel swarm.* Its input is typed: sprint cards and a roadmap in one format, with shared context. A stronger model, with automated tools, reads the cards and the roadmap and finds the dependency graph that lets the work run in parallel. It starts the smallest capable models in separate worktrees, each given one sprint card as exact instructions ("write this code"). The main model collates their work, merges it and runs the tests. If that passes, the topology returns its result to the session topology, and the user decides whether to keep running it or start another.
  - *Information flows compose.* Any topology's inputs and outputs can feed another topology; so can a run's entire history. The adversarial pair (a writer and a reviewer) can be made real this way with little work. Topologies are transformations of the flow of information, and this composition is the strongest direction the project has.

- **Authoring new topologies.** The ability to make new topologies, taken up after the audit above.
- **Picker steps in sequence** (was step 8, with U126): model and guidance after the workspace step, one at a time. A fragment of a later picker redesign, with the centred menu below. Moved here 2026-10-11.
- **The centred menu.** The picker's steps move into one box in the middle of the empty pane, detached from the input bar, with no left and right halves. Same steps, same order. Taken up once the sequential picker is in and looks right.
- **6.** The `deterministic` stand-in's 4,096-token context.
- **Future direction: child runs shown inside Substrate.** When a session delegates or starts a topology, the child run can be watched where it happens. Asked 2026-10-11.
  - **In a new pane.** The child opens in a pane of its own, with the same controls as any pane. If the topology takes messages, its input bar takes them; if not, the pane only watches. Its header says plainly that it is a child and whose, and the controls a child cannot use are restricted.
  - **Along the Z axis (the long-term default).** Panes tile across the window, and child runs also tile in depth, behind the pane that started them. The front pane is the one in use; the children sit behind it, blurred, their text still moving, several levels deep. With the input bar not focused, WASD or the arrow keys move forward and back through the levels, with a short animation.
  - **Breaking out.** A child held in depth can move out to its own pane or its own window; it keeps the child header.
  - An experimental design for the depth view already exists, outside this repo; the build starts from it.
- **I/O lens: core and expanded.** A toggle on the i/o lens like stream+graph's all/app. Core shows only user messages and model replies. Expanded opens each one into sections: under a user message, the text that actually reached the model (the composed prompt), and the steps in between. Asked 2026-10-11; not a release blocker.
- **11 (K269).** The parallel test suite.
- **17.** Language measurement, its own project: `substrate/process/planning/RESEARCH-2026-10-10-language-metrics.md` and rounds 2–4.
