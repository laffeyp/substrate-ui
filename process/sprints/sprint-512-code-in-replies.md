# Sprint 512 — Fenced code in replies highlighted

```yaml
---
id: 512
status: closed
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

## close

**Found first.** A reply reaches the window as one whole `ModelReply` envelope. The window handles no reply-delta kind (its envelope cases, read 2026-11-15), so no reply streams into the window chunk by chunk. An open fence reaches the window when a reply stops inside a block: at its token limit, or on an interrupt. The card's rule is built for that case, and holds for streaming if reply deltas are ever added.

**Built.**
- `web/reveal/markdown.ts`: a `code_block` carries `closed`, false when the reply ends before the closing fence. 1 unit spec; the two specs that pinned the block's fields gained it.
- `web/reveal/transcript/ToolText.tsx` `ReplyCode`: one `pre` in the reply's box, label, font and wrap. The text is plain while the fence is open and coloured once it closes, with the editor's parsers and palette. The fence's language is named as the editor names one (`matchLanguageName`, so `sh`, `ts`, `c++` match). `useDrawn` takes that language; a global count of parses per text (`__substrateCodeParses`) serves the gate.
- `ModelReply.tsx`: the code block draws `ReplyCode`. The reply has a set width beside its glyph, not shrink-to-fit.

**Found and fixed.** A reply's box shrank to its widest content: 570.8 px with the Rust block cut off, 715.2 px whole, so a code box grew with the reply's text and its long lines could rewrap. The reply now has a set width, as card 506 gave tool cards.

**Gate `reply_code_blocks`** (new; in `gates:electron`). Two scripted deterministic replies, served from a local server and fetched with `web_fetch`: the real `memchr.rs` fixture's first 60 lines cut off at 34 inside an open `rust` fence, and the same reply closed, with 40 lines of `models.py`, a shell loop and an untagged listing. From source and on bundle 1794793319:
- the open block: label rust, the code ground, monospace, no colour tokens, its 34 lines;
- 34 lines compared between the open and closed forms: 0 moved, worst 0.00 px, both boxes 788.0 px wide;
- closed blocks parse as Rust, Python and Shell; the untagged block stays plain;
- ink, CIEDE2000: Rust keyword 2.3, Python string 1.4;
- after two trips to the editor and back, each closed block's text was parsed once and the open block's never.

**Gate `reply_code_claude`** (new; live roster, outside the chained suite as `tool_output_claude` is). One live `claude` reply in 6–7 s: a python block with 17 tokens and a sh block with 6, both closed and parsed. Screenshot read: both blocks coloured in their boxes.

Screenshots read: the cut-off block, plain in its box; the closed Rust block, coloured, its lines where they were.

**Mutants**, each failing the gate, every build checked: the code one grey; the parse not kept (5 parses per block); an open fence drawn as prose. The third first failed on a 15 s timeout; the gate now names the missing code box.

**Other gates on the bundle:** tool_output_formatted, tool_summary_lines, editor_markdown_links, chat_one_turn, transcript_follow, action_signals pass. 254 unit specs pass.

**Installed** into Substrate: 1794793319 replaced 1794792720; vocabulary 0.73, home_kind default. Substrate Next ran throughout.

**Rubber Duck Pass.** No tag changed. One observation, recorded: no reply-delta kind exists, so a reply's text never streams into the window.
