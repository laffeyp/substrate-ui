# Sprint 509 — The closed summary line formatted

```yaml
---
id: 509
status: pending
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
