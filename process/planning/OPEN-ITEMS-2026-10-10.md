# OPEN ITEMS (2026-10-10)

*Written at the Architect's request on 2026-10-10, late night, after the harness tool-call work (K282–K286, U129–U131). One list for both repos. An item leaves the list when its card closes.*

## Closed tonight

- **The compaction row's "?–?".** See item 6.
- **The graph's time column.** Every event read `t+0.0s` or `t+2s`, and the selected event always said "into turn 9". The labels came from a table copied from the design prototype's sample record (`seqToTimeLabel`, keyed on seqs 214–244), plus a fallback keyed on seq ranges (`reveal_component.ts:1587-1588`). They never read the record's own clock. The intent, visible in the "into turn" detail, was each event's time into its turn. `web/reveal/timeline.ts` now measures that from each envelope's `t`, the commit time to the microsecond. Times run from the turn's `UserMessage`, or from the session's first event before any turn, and use the unit that fits: `t+143ms`, `t+2.31s`, `t+12.4s`, `t+2m05s`. Checked in a running build: each turn restarts at `t+0ms`.

## Guidance

1. **Review the imported Claude text, line by line.**
   - **What it is.** The `standard` bundle (`style.md`, `methodology.md`, `per-turn.md`), `standard-small`, the `dellm` and `dellm-small` skills and `prompts/default-small.md` were copied from this machine's Claude Code setup, as "copy first, improve later".
   - **What to do.** Make every text generic to any model and harness, run it through `dellm`, and check each line makes sense to a model that is not Claude.
   - **Found so far.** `standard/methodology.md` opens with Claude Code's own header ("Codebase and user instructions are shown below…"). Its "No Claude attribution in git, ever" section names Claude six times; it should state the rule for any model.
2. **Three guidance levels, plus the default.**
   - high: today's `standard`, after item 1's edit;
   - medium: an edited-down version;
   - low: a basic version;
   - default: the bare `harness` bundle, which already exists.

   Today's model classes (`harness_agent`, `large`, `small`) pick between `standard` and `standard-small`; the levels replace or extend that mapping.
3. **A control for the level, in the workspace bar.** Divide the model half again, or add a row below it, where a session's guidance level is chosen. Name to settle: "level of control" or "harness prompting level".

## Harness drivers

4. **New spec rounds for K286.** Product round 14, tech round 8 and design round 3 still describe MCP calls as `HarnessToolCall` with `via = mcp`. They need product round 15, tech round 9 and design round 4, matching vocabulary § Q.6: Substrate's tools are `ToolCall` and `ToolResult` with `origin = mcp`.
5. **`electron_smoke` fails on the first launch after an install.** It failed once with 0 signals, then passed on the next two runs (U131). Cause not found.
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
