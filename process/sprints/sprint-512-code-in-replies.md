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

Taken up from `process/sprints/later/later-code-in-replies.md`. A fenced block in a reply draws in one grey (`ModelReply.tsx`). A block with a language, or one whose language the editor can name, is highlighted with the editor's parsers and palette (`ToolText`'s path, card 505), in the look and scheme the settings name. While the reply streams, a block is drawn in its final form from its opening fence: the code box, its language label, monospace, the pane's wrapping, each line where it will stay (the Architect, 2026-11-15: "it must be built in the correct format while that happens"). `mdBlocks` already parses an unclosed fence as a `code_block` with its language (checked 2026-11-15); it gains `closed: boolean`, so the view knows when the fence has landed. Only the colours wait: the block highlights once, when its closing fence lands, and the box, lines and wrap do not move when they do. A long reply does not reparse on every chunk. One verifiable property: a Rust block's box, label and line positions are the same before and after its closing fence lands, and after it its keyword draws in the keyword colour.

## signal contract

No new tag.

## observation contract

Gate on the bundle: a scripted reply holding fenced Rust, Python, shell and an untagged block, streamed in chunks. While a fence is open: the block drawn as a code box with its label and monospace lines, read from the DOM and a screenshot. When it closes: each line's rectangle and the box's width unchanged within 1 px, and ink from pixels in the palette's colours. The parse count per block, read from a test hook, stays one. A live `claude` reply with a code block, screenshot read. Mutants: one grey; a reparse per chunk; an open fence drawn as prose.
