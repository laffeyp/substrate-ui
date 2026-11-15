# Sprint 506 — A tool's summary shows two or three lines

```yaml
---
id: 506
status: closed
phase: editor features (roadmap 2026-11-14 r4, E8)
pass_kind: functional
---
```

## scope

A tool card's closed summary is one line, cut with an ellipsis (`ToolCard.tsx`). It shows up to three lines of the call's preview, wrapped, the status and caret on the last line; a longer command ends in an ellipsis on line three. One verifiable property: a 200-character `bash` command shows three lines closed.

## observation contract

Gate on the bundle: short and long commands; line count read from the box height; screenshot read. Mutant: one line fails.

## close

**Built.** `ToolCard.tsx`: the summary is a flex row. The tool name and preview sit in one box clamped at three lines (`SUMMARY_LINES`), with `pre-wrap`, so a multi-line command shows its own lines. The status and caret sit beside the last line, 6 px after it, capped at 40% of the width with an ellipsis for a long error. The card has a set width beside the row's glyph.

**Found and fixed in this card, by screenshot, then checked by the gate.**
- The clamped box's children became blocks, so the tool name stood on a line of its own; they now share one inline child.
- An inline-block card shrank to the clamped preview's narrowest wrap: "bash ls -la" broke at each space and the status read "ok…".
- A block card fell below the row's glyph. The gate's first pass missed this; it now checks that glyph and summary share a line, and that the status is spaced from the preview.

**Gate `tool_summary_lines`** (new; in `gates:electron`). One scripted deterministic turn of four real `bash` calls on the large fixtures. From source and on bundle 1794726458:
- `ls -la`: 1 line;
- a 200-character command: 3 lines, whole (at the row's 840 px);
- a 700-character command and a five-line loop: 3 lines, cut with an ellipsis;
- every status on its card's last line (gap 0.0 px), inside the row; every summary beside its glyph;
- the long card opened shows the command's end in its args.

Screenshots read: three passes, the third clean.

**Mutants**, each failing the gate, every build checked: one line; the old shrink-to-fit width; a block card.

**Other gates on the bundle:** tool_output_formatted, tool_output_toggle, action_signals, chat_one_turn, transcript_follow, editor_view pass. 247 unit specs pass.

**Installed** into Substrate: 1794726458 replaced 1794725844; vocabulary 0.73, home_kind default. Substrate Next ran throughout.

**Rubber Duck Pass.** No tag changed; nothing writes a new signal.
