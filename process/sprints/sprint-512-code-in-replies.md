# Sprint 512 — Fenced code in replies highlighted

```yaml
---
id: 512
status: pending
phase: editor features (roadmap 2026-11-14 r5, E12)
pass_kind: functional
---
```

## scope

Taken up from `process/sprints/later/later-code-in-replies.md`. A fenced block in a reply draws in one grey (`ModelReply.tsx`). A block with a language, or one whose language the editor can name, is highlighted with the editor's parsers and palette (`ToolText`'s path, card 505), in the look and scheme the settings name. While the reply streams, a block draws plain until its closing fence lands, then highlights once; a long reply does not reparse on every chunk. The pane keeps wrapping code. One verifiable property: a Rust block in a reply draws its keyword in the keyword colour, during the stream and after.

## signal contract

No new tag.

## observation contract

Gate on the bundle: a scripted reply holding fenced Rust, Python, shell and an untagged block, streamed in chunks; ink from pixels after the fence closes; the parse count per block read from a test hook stays one. A live `claude` reply with a code block, screenshot read. Mutants: one grey; a reparse per chunk.
