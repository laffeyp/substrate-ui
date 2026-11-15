# Sprint 505 — Tool output formatted

```yaml
---
id: 505
status: pending
phase: editor features (roadmap 2026-11-14 r4, E7)
pass_kind: functional
---
```

## scope

`ToolCard.tsx` draws a result as one grey block. A result is highlighted with the editor's parsers and palette: by the extension of the file a read, write or edit names; as shell for `bash`, its ANSI colours kept; JSON as JSON; anything else as plain text. Args are formatted the same way. Highlighting runs once, when the result lands. One verifiable property: a `read_file` of a `.py` fixture shows its keywords in the palette's keyword colour, decoded from pixels.

## observation contract

Gate on the bundle with real fixtures for each kind; pixels decoded as in `editor_highlight_seen`. Mutant: one grey fails.
