# OPEN ITEMS (2026-10-10)

*Written at the Architect's request on 2026-10-10, late night, after the harness tool-call work (K282–K286, U129–U131). One list for both repos. An item leaves the list when its card closes.*

## Closed tonight

- **The compaction row's "?–?".** See item 6.
- **The graph's time column.** Every event read `t+0.0s` or `t+2s`, and the selected event always said "into turn 9". The labels came from a table copied from the design prototype's sample record (`seqToTimeLabel`, keyed on seqs 214–244), plus a fallback keyed on seq ranges (`reveal_component.ts:1587-1588`). They never read the record's own clock. `web/reveal/timeline.ts` now uses each envelope's `t`, the commit time to the microsecond.
  - **The column** is the time since the session's first event. It only increases, and the gap between turns shows.
  - **The selected event's line** adds its time into its turn, for example `t+42.6s · 1.38s into turn 0`.
  - **Units fit the span:** `t+143ms`, `t+2.31s`, `t+12.4s`, `t+2m05s`.
  - **A first version reset the column at every message.** The Architect caught it, and it was corrected the same night.
  - **Checked in a running build:** the second message landed at `t+2.27s`.

## Guidance

Items 1–3 closed on 2026-10-10 (roadmap `substrate/process/planning/ROADMAP-2026-10-10-guidance-levels.md`, K287, K288, U132):
1. **The imported text.** It is generic: no model, vendor or person named, the operator's memory index removed, one voice, `dellm`-ed. A test scans all 17 shipped texts.
2. **Four levels.** `harness` (291 tokens), low (562), medium (1,218) and high (2,995).
3. **The control.** A GUIDANCE line in the workspace bar, with a default level that follows the model.

## Harness drivers

4. *Closed (K289).* Product round 15, tech round 9 and design round 4 describe MCP calls as Substrate's `ToolCall` with `origin = mcp`, along with the guidance levels.
5. **`electron_smoke` fails on the first launch after an install.** It has failed on the first gate run after two of the night's installs (U131: 1 bug; the activity-strip install: 2 bugs), passed on the first run after the others, and passed on every rerun. It has never failed on a rerun. Cause not found; the first launch of a freshly copied app is the common factor.
6. **The `deterministic` stand-in compacts every turn.** The `standard` guidance (head, system part and reminder line) measures about 4,988 tokens, more than the stand-in's declared 4,096-token context. So every turn after the first drops the earlier turns. Real drivers declare far more room (CLI drivers 100,000 tokens; Ollama models their advertised context), and none of the 70 sessions on this machine holds a `TranscriptCompacted` event. To decide: raise the stand-in's context, or keep it small as the compaction test bed.
   - *Closed, the display half.* The console read `dropped_seq_start` and `dropped_seq_end`, but the kernel's event carries one pair, `dropped_seq_range`. So every compaction row printed "?–?". Fixed, with a unit test.

## The workspace bar (picker roadmap)

7. **U125.** The header model chip becomes an indicator with a detail card.
8. **U126.** `model_half_starts_session.ts` still clicks a model row that is not in the real roster. `bindPaneAsUser` now picks models as a user does.
9. **U127.** Spec rounds for the picker move.
10. **The login card.** Remove "ready to pick a session" (`AuthPromptCard.tsx:213`) and check the layout of that bottom row.

## Queued from earlier

11. **K269.** The parallel test suite.
12. **Distribution.** Named by the Architect as the next direction.

## The workspace bar: a hint beside each heading (Architect, 2026-10-10)

*13–14 tried 2026-10-11 and taken out (Architect: not appropriate); see sprint 142.* 13. **Workspace.** The WORKSPACE heading (`web/reveal.html:122`) gets a grey hint on the same line that says what the column is for: choosing where to work, or opening a previous session. The Architect's wording to start from: "choose where you want to work · or open a previous session".
14. **Model.** The MODEL heading (`web/reveal.html:143`) gets the same kind of hint: "choose a model to work with".
*15 dropped 2026-10-11 (Architect): no GUIDANCE hint.* 15. **Guidance.** This section needs design work before it gets a hint. It is to grow from one level picker into a set of controls chosen after the model: induced language patterns (verbosity, tone, controlled languages, specification forms, order, argument and evidence shape, range, language) and subtle behaviour dials (delegation, topologies, autonomy, reporting, scope). Research: `substrate/process/planning/RESEARCH-2026-10-10-guidance-controls-r4.md`.

## Guidance: two rows first, measurement later (Architect, 2026-10-11)

16. **Length and Tone rows.** Two rows beside GUIDANCE in the workspace bar, chosen after the model, as a short sprint toward release. Length: terse, normal, full. Tone: blunt, neutral, formal, dry. Each position is one or two sentences of guidance sent at session open, the same on every driver. Warm stays out of this sprint: a study in round 4 §5 found warmth tuning raised agreement with wrong beliefs. Length is relative, never a word count; LIFEBench found models miss exact length targets. This project builds no measurement; the rows are checked by reading replies. Source: `substrate/process/planning/RESEARCH-2026-10-10-guidance-controls-r4.md` §7. Later candidates, in order: answer order, output form, then the behaviour dials of §8 once it is known whether `delegate` and `run_topology` reach the `claude`, `codex` and `cursor-agent` harnesses.
17. **Language measurement, a separate project after release.** The `LanguageProfile` and `LanguageDrift` events in the run, and the process outside the run that appends `<workspace>/.substrate/language/<session_id>.jsonl`. Designed in `substrate/process/planning/RESEARCH-2026-10-10-language-metrics.md` and rounds 2–4. Nothing is built: no code in either repo names these events or the path. When it lands, the Length and Tone rows get their measures (tokens and sentences per reply; hedge, intensifier and politeness rates).

## Before release (Architect, 2026-10-11)

18. **A terminal, opened with Cmd+T.** A plain terminal session inside the app, with no tie to Substrate's runs or record, for ordinary shell work. It uses whatever terminal the machine uses by default, and the user can set another. Nothing exists yet: the only terminal-related code in substrate-ui is the ANSI colour renderer for transcripts (`web/reveal/transcript/ansi.ts`). To settle in design: whether the session is a pane inside the app (a terminal emulator running the user's login shell from `$SHELL`) or a window of the user's terminal app opened at the workspace path. macOS has no single "default terminal" setting; which app counts as the default has to be found or chosen.

## Before release, added 2026-10-11 (Architect)

20. **Text entry in the input bar.** Shift+Enter makes a new line (it does not today), and a sweep for the other standard behaviour a text box like this has. Release roadmap step 8, in place of the picker sequence. *Found 2026-10-11:* the panes view and the meta view draw two different input bars with two handlers; the meta view takes the panes view's bar, so there is one. Card `process/sprints/sprint-141-one-input-bar.md`.
21. **Tool output: no clickable control.** Fold and unfold every tool card with ⌘E or the slash commands `/fold` (flips: fold, unfold, fold) and `/unfold`.

22. **Naming sessions.** A user names a session, and the name holds in the top bar, in records, in the list of previous sessions, and across a restart.
23. **A new pane from the meta view returns to the panes view.** ⌘D in meta makes the pane and leaves the user in meta, where it cannot be seen.
24. **New windows, and the macOS menu bar.** After the window is closed nothing makes a new one. Check the menu bar against macOS conventions while building it.

26. **The records page: workspaces in the main view's style.** The list of workspaces takes the panes view's workspace-bar style (darker background, rounded corners) and is centred. Style only; the page's content stays its own.
27. **"sessions get work trees".** Check whether it is true for a git workspace; wherever the phrase appears, a workspace with worktrees reads "git · worktree".

*Item 8 (U126) moves with the picker sequence to after distribution: the workspace, model and guidance steps stay as they are for now.*

## Future direction (Architect, 2026-10-11)

28. **Future: the session's guidance, length and tone, shown in the pane and changeable mid-session.** A session's picks (for example low, normal, neutral) are visible in the panes view while it runs, and can be changed during the session (the kernel already records a change as SessionChanged and rewrites the text, § T.3). Where they go is undecided and needs best-practice research first. Two shapes named (Architect, 2026-10-11): the values alone appended to the session bar line ("turn 3 · 12s · 2 tools · returned · low · normal · neutral", no labels), or one chip per control in the top bar ("guidance-low", "length-normal", "tone-formal"), with more controls adding more chips.
25. **Substrate makes the topology the user needs.** A make-topology tool builds topologies that replicate the user's own workflows. Example: a parallel swarm whose typed input is sprint cards and a roadmap; a stronger model finds the dependency graph, the smallest capable models each implement one card in their own worktree, the main model merges and tests, and the result returns to the session topology, where the user keeps or replaces the topology. Any topology's inputs, outputs and whole history can feed another topology (the adversarial pair, made real, is one such flow). The roadmap's "After distribution" section has it in full.

19. **Child runs shown inside Substrate.** When a session delegates or starts a topology, the child run can be watched where it happens.
    - **In a new pane.** The child opens in a pane of its own with the same controls as any pane. If the topology takes messages, its input bar takes them; if not, the pane only watches. Its header says plainly that it is a child and whose, and the controls a child cannot use are restricted.
    - **Along the Z axis, the long-term default.** Panes tile across the window, and child runs also tile in depth, behind the pane that started them. The front pane is the one in use; the children sit behind it, blurred, their text still moving, several levels deep. With the input bar not focused, WASD or the arrow keys move forward and back through the levels, with a short animation.
    - **Breaking out.** A child held in depth can move out to its own pane or its own window, and keeps the child header.
    - An experimental design for the depth view exists outside this repo; the build starts from it. Also on the roadmap, under "After distribution".

*2026-10-11: the order and scope for items 5–18 and the new picker items are in `ROADMAP-2026-10-11-before-distribution.md`, which supersedes item 18's open design question.*

## Future direction (Architect, 2026-10-13)

29. **Exclude turns from what is sent to the model.** In the transcript, the user selects a stretch (for example four off-topic turns) and excludes it. Nothing is deleted: the turns stay in the transcript and the record, and the history sent to the model leaves them out from then on. The exclusion is an event on the record, so it can be undone and replayed, and each later prompt shows what it left out. Finding such stretches: the language measures can suggest turns whose relation to the session's main thread drops (research and design first). "Click highlight and click exclude."
