# Sprint 505 — A tool's summary shows two or three lines

```yaml
---
id: 505
status: pending
phase: editor features (roadmap 2026-11-14 r3, E7)
pass_kind: functional
---
```

## scope

A tool card's closed summary is one line, cut with an ellipsis (`ToolCard.tsx`). It shows up to three lines of the call's preview, wrapped, the status and caret on the last line; a longer command ends in an ellipsis on line three. One verifiable property: a 200-character `bash` command shows three lines closed.

## observation contract

Gate on the bundle: short and long commands; line count read from the box height; screenshot read. Mutant: one line fails.
