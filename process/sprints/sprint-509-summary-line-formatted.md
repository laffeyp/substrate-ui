# Sprint 509 — The closed summary line formatted

```yaml
---
id: 509
status: closed
phase: editor features (roadmap 2026-11-14 r5, E9)
pass_kind: functional
---
```

## scope

Card 506's closed summary draws the tool's preview in one grey (`ToolCard.tsx`). The preview is drawn in its format, as card 505 draws the opened args: a shell command coloured as shell (`ToolText`, the editor's parsers and palette), a file path with its folders dim and its name bright, other previews as now. The three-line clamp, the status and caret beside the last line, and the card's width stay as card 506 left them. One verifiable property: a closed `bash` card's quoted string draws in the string colour, decoded from pixels.

## signal contract

No new tag.

## observation contract

Gate `tool_summary_lines` extended on the bundle: shell and path previews, token ink by CIEDE2000 from a screenshot, the clamp and status checks unchanged. Mutant: the preview one grey fails.

## close

**Built.**
- `web/reveal/tool_format.ts` `summaryOf`: a shell call's command, a file tool's path, a search's pattern, any other call's first arg, each without the `key=` a harness call carries. Before, a Claude Code `Bash` card's summary read `command=ls -la`. 1 unit spec, the Claude Code shapes among its cases.
- `web/reveal/transcript/ToolText.tsx`: the parse and its cache moved into `useDrawn`, shared by `ToolText` and the new `SummaryText`. `SummaryText` draws inline, so card 506's three-line clamp holds: a command in the editor's palette, a path with its folders dim (#62676f) and its name bright (#e2e5e9), other text in the preview grey.
- `ToolCard.tsx`: the summary draws `SummaryText`. The clamp, the status beside the last line and the card's width are as card 506 left them.

**Found and fixed.** The first `summaryOf` showed a `Grep` card's path, not its pattern; a unit spec caught it.

**Gate `tool_summary_lines`**, extended with a `grep` and a `read_file` card. From source and on bundle 1794778244:
- all five shell summaries parsed as Shell and the read's as a path; no summary reads a `key=`;
- ink against the palette, CIEDE2000 from screenshots: the grep's quoted pattern 1.4 from the string colour, its command 20.2 from it; the read's folders 0.6 from the dim grey, its file name 0.5 from the bright one;
- card 506's checks unchanged: 1, 3, 3 cut, 3 cut, 1, 1 lines, every status on its card's last line.

Screenshot read: shell keywords and the quoted pattern coloured, `alpha/d/e/` dim and `models.py` bright.

**Mutants**, every build checked:
- summary one grey: the gate fails ("no such token drawn");
- the folders as bright as the name: the gate fails (ΔE 38.1);
- the `key=` kept: the gate passes, since the deterministic driver makes kernel-shaped calls only, but the unit spec fails. The window check of Claude Code's shapes is card 511's live turn.

**Other gates on the bundle:** tool_output_formatted, tool_output_toggle, action_signals, chat_one_turn, transcript_follow pass. 248 unit specs pass.

**Installed** into Substrate: 1794778244 replaced 1794726458; vocabulary 0.73, home_kind default. Substrate Next ran throughout.

**Rubber Duck Pass.** No tag changed. One observation, recorded above: harness-shaped summaries are checked in a unit spec until card 511.
