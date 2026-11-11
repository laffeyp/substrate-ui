# Sprint 453 — a selection's attachment on the server

```yaml
---
id: 453
status: closed
phase: code editor (roadmap r13), E10.3 part 1
pass_kind: functional
---
```

## scope

The turn's `lines` attachment takes what an editor selection gives (`ADD-TO-MESSAGE-2026-11-10-r3.md` rules 5 and 9; roadmap r13 E10.3):
- **Spans.** `span` is either `[first, last]`, for whole lines, or `[line, column, line, column]`, a range inside lines. Columns count from 1, and both ends are included.
- **Text.** An optional `text` is the selection as the buffer showed it, and the record keeps it (rule 9). Without one, the server slices the file as before.
- **The path line** names the range: `(src/cart.ts, lines 85–89)` or `(src/cart.ts, 85:4–89:12)`.
- **Size.** A selection over 64 KB goes as its path and range (rule 5). Since sprint 444, the buffer is saved before the model starts, so the range names text on disk.
- **Refusals.** A malformed span or a `text` that is not a string is still refused (400).

Files: `server.py` (`_attachment_text`, `_resolve_attachments`); `tests/test_turn_attachments_453.py` (new).

## context_files

- `ADD-TO-MESSAGE-2026-11-10-r3.md` rules 5, 9 and the selections section; roadmap r13 E10.3; sprint 446's card; `server.py` `_attachment_text`, `_resolve_attachments`; `tests/test_turn_attachments_446.py`.

## signal contract

No new tag. TURN_ACCEPTED counts a selection among the attachments, and in `by_reference` when it went as a reference.

## artifact contract

- `test_turn_attachments_453.py`:
  - the page's text is what the record keeps;
  - an in-line span slices the file when no text comes;
  - the path line names the range;
  - over 64 KB goes as a reference;
  - a bad span or text is a 400.
- `pytest` on the 453, 446 and 388 attachment tests 0; mypy 0; ruff 0.

## observation contract

The server's tests drive the real server over HTTP. The page's ⌘⇧A and its gate come in sprint 454, which sends these attachments from the editor.

## done criteria

A selection reaches the record as the text the person selected, named by its path and range.
