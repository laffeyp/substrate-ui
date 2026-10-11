# ROADMAP: before distribution

*2026-10-11. From the Architect's direction of 2026-10-11, given in conversation. Item numbers refer to `OPEN-ITEMS-2026-10-10.md`. Everything under "Before distribution" ships before the app is distributed; everything under "After distribution" waits.*

## Before distribution

### Fixes

- **5. `electron_smoke` fails on the first launch after an install.** It passes on every rerun. Find the root cause and fix it.
- **8 (U126). `model_half_starts_session.ts` clicks a model row that is not in the real roster.** The test picks models as a user does.
- **10. The login card.** Remove "ready to pick a session" (`AuthPromptCard.tsx:213`) and check the layout of that bottom row.
- **Harness tool calls in the session bar.** The session bar's turn line (turns, seconds, tools) reports no tools used when a harness driver's tools ran. A `HarnessToolCall` counts there as a `ToolCall` does.
- **The input bar's hint.** Before a session exists, the hint in the input bar lists its keys. Two parts are false and come out: "type a path" (typed text is not treated as a folder path) and "‹symbol› fills nearest" (nothing autocompletes). The other key hints stay where they are true: ↑↓ moves, shift-enter opens, enter picks the folder. The input bar itself, the program's text input, is unchanged.

### One top bar

Today the app has two top bars: one in the terminal view and one in the reveal view. They have the same elements at different sizes and layouts, and some contents differ. Split panes each carry their own header.

- **Only the reveal view's top bar is kept,** with its sizes and layout. It always sits at the top of the app. The terminal view's top bar is removed.
- **Panes carry no top bar of their own.** Splitting no longer creates, moves or duplicates a top bar per pane.
- **The bar shows the focused pane.** When focus moves to another pane, the same bar changes its contents to that pane's: the reveal button's state, the model indicator, the workspace indicator, the pane name and the session name.

### The workspace bar

- **Picker steps in sequence.** Model and guidance come after the workspace step, not to its right. The order is: workspace; then, unless a previous session was picked, model; then the guidance row beneath it. Picking each in turn starts the session. Nothing is greyed out: each step appears when its turn comes. The model list is left-aligned like the workspace list, and its carets point the same way. A control added later becomes the next step in the sequence.
- **13–14. Hints beside the headings.** A grey hint on the same line as each heading. WORKSPACE (`web/reveal.html:122`): "choose where you want to work · or open a previous session". MODEL (`web/reveal.html:143`): "choose a model to work with".
- **15. The GUIDANCE hint.** Worded once the Length and Tone rows exist.
- **16. Length and Tone rows.** Length: terse, normal, full. Tone: blunt, neutral, formal, dry. Each position is one or two sentences of guidance sent at session open, the same on every driver. No measurement is built; the rows are checked by reading replies. Source: `substrate/process/planning/RESEARCH-2026-10-10-guidance-controls-r4.md` §7.
- **7 (U125). The header model chip becomes an indicator.** No dropdown; a click opens a card with driver, version and bundle, as the workspace chip does.
- **9 (U127). Spec rounds.** New rounds of the product, tech and design specs that describe the picker in the bar, in place of the header dropdown (product spec round 13 line 704, tech spec round 7 line 1257, design spec round 2 §3). Written after the items above, so they describe the final form.

### The session

- **The session-start line.** Before the first message, the empty transcript shows a line in its top left, such as "session started with ‹model› at ‹workspace›". The user's first message appears below it, beside its blue caret. The line tells the user that the empty area is where the conversation will appear.

- **Expand or collapse all tool output.** One toggle sets every tool execution in the transcript to expanded or collapsed. Flipping it expands or collapses all existing tool output at once, and tool executions that arrive later open in the current state. It is flipped by a key command or by a control in the top bar.

### 18. The terminal pane

Cmd+T opens a terminal pane in the pane system. It runs the user's shell (`$SHELL`, with the user's own config files) and draws it, so the pane works as the user's terminal does. The user can set a different shell.

The terminal pane has no reveal view, no records, no studio and no model picker. It has no tie to Substrate's runs or record. It opens in the workspace of the place it was opened from. While it is the focused pane, the one top bar shows it.

### Topologies: real and useful from a session, or dropped from it

Every topology that ships with Substrate and that a session can run is gone through one by one. Each is either made real and useful in an actual session, or dropped from what the session can see. Today none of this has been tested from a session: a coding topology, for example, cannot be loaded and run from a session and be relied on to work.

- **Kept:** the session can load it, run it and use its result, and that has been tested from a session against a real model.
- **Dropped:** removed from Substrate UI and from what the session topology is told exists (`list_topologies`, `run_topology`, the guidance). The topology stays in Substrate itself.

The app is not released with a topology the session can reach that has not passed this.

## Order

Set from each item's dependencies. Sprint cards are written one step at a time: cards for a step, the step, then cards for the next.

| # | Item | Why here |
|---|---|---|
| 1 | 5. `electron_smoke` fails on first launch | The Electron gates check every later step; they must report truly first. |
| 2 | 10. Login card; the input bar's false hints; harness tool calls in the session bar | Small fixes; depend on nothing, block nothing. |
| 3 | Topology audit | Depends on no UI step and is the largest unknown; starting early shows its size. What it drops leaves the guidance text that step 9 then builds on. |
| 4 | One top bar | Steps 5, 6 and 12 put things in the top bar. |
| 5 | 7 (U125). Model chip becomes an indicator | Lives in the top bar; built once, on the single bar. |
| 6 | Tool-output toggle | Its control sits in the top bar. |
| 7 | Picker steps in sequence, with 8 (U126) | U126 tests the model step this rewrites, so the test is fixed once, here. |
| 8 | 13–14. WORKSPACE and MODEL hints | The headings move in step 7. |
| 9 | 16. Length and Tone rows | The next steps in the new sequence. |
| 10 | 15. GUIDANCE hint | Worded once the rows exist. |
| 11 | Session-start line | Names the model and workspace the finished picker chose. |
| 12 | 18. Terminal pane | Needs the single top bar. A shell drawn in Electron needs a terminal emulator and a native pty module, which must be rebuilt for Electron and signed with the app; doing it before the end leaves room for signing trouble. |
| 13 | 9 (U127). Spec rounds | Describe the final form, so after every UI change. |
| 14 | Full gates, signed build, distribution | Full suites and all Electron gates once on the installed app, then the signed build ships. |

Steps 4–6 are one top-bar group; steps 7–10 are one picker group.

## After distribution

- **Authoring new topologies.** The ability to make new topologies, taken up after the audit above.
- **The centred menu.** The picker's steps move into one box in the middle of the empty pane, detached from the input bar, with no left and right halves. Same steps, same order. Taken up once the sequential picker is in and looks right.
- **6.** The `deterministic` stand-in's 4,096-token context.
- **11 (K269).** The parallel test suite.
- **17.** Language measurement, its own project: `substrate/process/planning/RESEARCH-2026-10-10-language-metrics.md` and rounds 2–4.
