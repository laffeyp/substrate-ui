# ROADMAP: before distribution

*2026-10-11. From the Architect's direction of 2026-10-11, given in conversation. Item numbers refer to `OPEN-ITEMS-2026-10-10.md`. Everything under "Before distribution" ships before the app is distributed; everything under "After distribution" waits.*

## Before distribution

### Fixes

- **5. `electron_smoke` fails on the first launch after an install.** It passes on every rerun. Find the root cause and fix it.
- **8 (U126). `model_half_starts_session.ts` clicks a model row that is not in the real roster.** The test picks models as a user does.
- **10. The login card.** Remove "ready to pick a session" (`AuthPromptCard.tsx:213`) and check the layout of that bottom row.
- **The input bar's hint.** Before a session exists, the hint in the input bar lists its keys. Two parts are false and come out: "type a path" (typed text is not treated as a folder path) and "‹symbol› fills nearest" (nothing autocompletes). The other key hints stay where they are true: ↑↓ moves, shift-enter opens, enter picks the folder. The input bar itself, the program's text input, is unchanged.

### The workspace bar

- **Picker steps in sequence.** Model and guidance come after the workspace step, not to its right. The order is: workspace; then, unless a previous session was picked, model; then the guidance row beneath it. Picking each in turn starts the session. Nothing is greyed out: each step appears when its turn comes. The model list is left-aligned like the workspace list, and its carets point the same way. A control added later becomes the next step in the sequence.
- **13–14. Hints beside the headings.** A grey hint on the same line as each heading. WORKSPACE (`web/reveal.html:122`): "choose where you want to work · or open a previous session". MODEL (`web/reveal.html:143`): "choose a model to work with".
- **15. The GUIDANCE hint.** Worded once the Length and Tone rows exist.
- **16. Length and Tone rows.** Length: terse, normal, full. Tone: blunt, neutral, formal, dry. Each position is one or two sentences of guidance sent at session open, the same on every driver. No measurement is built; the rows are checked by reading replies. Source: `substrate/process/planning/RESEARCH-2026-10-10-guidance-controls-r4.md` §7.
- **7 (U125). The header model chip becomes an indicator.** No dropdown; a click opens a card with driver, version and bundle, as the workspace chip does.
- **9 (U127). Spec rounds.** New rounds of the product, tech and design specs that describe the picker in the bar, in place of the header dropdown (product spec round 13 line 704, tech spec round 7 line 1257, design spec round 2 §3). Written after the items above, so they describe the final form.

### The session

- **The session-start line.** Before the first message, the empty transcript shows a line in its top left, such as "session started with ‹model› at ‹workspace›". The user's first message appears below it, beside its blue caret. The line tells the user that the empty area is where the conversation will appear.

### 18. The terminal window

Cmd+T opens a terminal window inside Substrate. It runs the user's shell (`$SHELL`, with the user's own config files) and draws it, so the window works as the user's terminal does. The user can set a different shell.

The window has no reveal pane, no records or studio top bar, and no model picker. It has no tie to Substrate's runs or record. It opens in the workspace of the place it was opened from.

## After distribution

- **The centred menu.** The picker's steps move into one box in the middle of the empty pane, detached from the input bar, with no left and right halves. Same steps, same order. Taken up once the sequential picker is in and looks right.
- **6.** The `deterministic` stand-in's 4,096-token context.
- **11 (K269).** The parallel test suite.
- **17.** Language measurement, its own project: `substrate/process/planning/RESEARCH-2026-10-10-language-metrics.md` and rounds 2–4.
