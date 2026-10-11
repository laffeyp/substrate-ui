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

13. **Workspace.** The WORKSPACE heading (`web/reveal.html:122`) gets a grey hint on the same line that says what the column is for: choosing where to work, or opening a previous session. The Architect's wording to start from: "choose where you want to work · or open a previous session".
14. **Model.** The MODEL heading (`web/reveal.html:143`) gets the same kind of hint: "choose a model to work with".
15. **Guidance.** This section needs design work before it gets a hint. It is to grow from one level picker into a set of controls chosen after the model: induced language patterns (verbosity, tone, controlled languages, specification forms, order, argument and evidence shape, range, language) and subtle behaviour dials (delegation, topologies, autonomy, reporting, scope). Research: `substrate/process/planning/RESEARCH-2026-10-10-guidance-controls-r4.md`.

## Guidance: two rows first, measurement later (Architect, 2026-10-11)

16. **Length and Tone rows.** Two rows beside GUIDANCE in the workspace bar, chosen after the model, as a short sprint toward release. Length: terse, normal, full. Tone: blunt, neutral, formal, dry. Each position is one or two sentences of guidance sent at session open, the same on every driver. Warm stays out of this sprint: a study in round 4 §5 found warmth tuning raised agreement with wrong beliefs. Length is relative, never a word count; LIFEBench found models miss exact length targets. This project builds no measurement; the rows are checked by reading replies. Source: `substrate/process/planning/RESEARCH-2026-10-10-guidance-controls-r4.md` §7. Later candidates, in order: answer order, output form, then the behaviour dials of §8 once it is known whether `delegate` and `run_topology` reach the `claude`, `codex` and `cursor-agent` harnesses.
17. **Language measurement, a separate project after release.** The `LanguageProfile` and `LanguageDrift` events in the run, and the process outside the run that appends `<workspace>/.substrate/language/<session_id>.jsonl`. Designed in `substrate/process/planning/RESEARCH-2026-10-10-language-metrics.md` and rounds 2–4. Nothing is built: no code in either repo names these events or the path. When it lands, the Length and Tone rows get their measures (tokens and sentences per reply; hedge, intensifier and politeness rates).

## Before release (Architect, 2026-10-11)

18. **A terminal, opened with Cmd+T.** A plain terminal session inside the app, with no tie to Substrate's runs or record, for ordinary shell work. It uses whatever terminal the machine uses by default, and the user can set another. Nothing exists yet: the only terminal-related code in substrate-ui is the ANSI colour renderer for transcripts (`web/reveal/transcript/ansi.ts`). To settle in design: whether the session is a pane inside the app (a terminal emulator running the user's login shell from `$SHELL`) or a window of the user's terminal app opened at the workspace path. macOS has no single "default terminal" setting; which app counts as the default has to be found or chosen.
