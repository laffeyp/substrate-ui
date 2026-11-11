# Sprint 446 — a message is never refused for what it carries

```yaml
---
id: 446
status: closed
phase: code editor (roadmap r13), E10.1
pass_kind: functional
---
```

## scope

The server resolves a turn's attachments by rules 1 to 8 of `ADD-TO-MESSAGE-2026-11-10-r3.md`. A message goes whatever it carries. Only two things are refused: a path outside the session's workspace, and a request the server cannot parse.

- **Rule 1, the reference.** The first line of every attachment's text names its workspace path, and for a line range its lines. The kernel's header shows the chip's label alone, so this line is how the model gets the path (BLACKBOARD 2026-11-10, agent-resolved, the path in the text).
- **Rule 3, any text is text.** A byte-order mark names the encoding (UTF-8 or UTF-16). Otherwise a NUL byte in the first 8 KB means binary. Otherwise the file is UTF-8, or byte for byte Latin-1. An encoding other than UTF-8 is named on the path line.
- **Rule 4, the caps.** A file goes inline up to 64 KB, and a message carries at most 256 KB inline, counted in the attachments' order. Past either, the reference goes with the size and, for a text file, the line count.
- **Rules 2, 7 and 8, by reference.** A binary file, an image, a file past a cap, or a missing file goes as one line saying why, in round 3's form: `(not inlined: 3.2 MB, binary; media/1979.m4a; read it with your file tools)`, `(not found when the message was sent: src/gone.ts)`.
- **Rule 6, folders.** A folder goes as a listing of the files the search's walk reaches, ignore files applied: up to 200, then a count of the rest.
- **Unchanged.** `event` attachments (the meta pane's, out of scope by the Architect's ruling of 2026-11-10), and `time_range`, `element` and `plan_item` (their views wait).

Files: `server.py`; `tests/test_turn_attachments_446.py` (new); `tests/test_turn_attachments_388.py` (its refusals, now references); the vocabulary files; gate `editor_chips.ts` (the attachment's text now opens with its path).

## prerequisites

- 443 (chips), 444 (save before send: a file is on disk as shown when the message goes).

## context_files

- `process/planning/2026-11-09-code-editor/ADD-TO-MESSAGE-2026-11-10-r3.md` (rules 1–9, the prototype's faults); `ROADMAP-2026-11-09-code-editor-r13.md` E10.1; `SAVE-BEFORE-SEND-2026-11-10.md`
- BLACKBOARD: the `user` entries of 2026-11-10 (never refuse; "any text should be accepted"; meta pane out of scope); the agent-resolved entries of 2026-11-10 below
- `server.py` `_resolve_attachments`, `_attachment_file_text`, `_workspace_read`, `_workspace_files`, `_workspace_target`, `_session_turn`; kernel `substrate/topologies/session/vocabulary.py` `Attachment`, `transcript.py` `attachment_lines`
- `tests/test_turn_attachments_388.py`; vocabulary `0.50.json` (TURN_ACCEPTED)
- Sources: ripgrep's guide (NUL byte, BOM transcoding); Claude Code "Common workflows" and "Tools reference" (a file Read refuses reaches Claude as its path)

## signal contract

### Emits

Vocabulary v0.51, P-0.51-BY-REFERENCE: TURN_ACCEPTED gains `by_reference`, the attachments sent as a reference line, not content. No path or text appears in the trace (E1).

### Invariants

- No 400 for a missing, binary, non-UTF-8, oversized or image file, or for a folder ref that is not a folder.
- A 400 still for a path outside the workspace and for a malformed attachment.
- The record's `Attachment.text` is what the model read.

## artifact contract

- `server.py` defines `_attachment_text` and `_decode_any`; `_attachment_file_text` is gone from the turn path.
- `test_turn_attachments_446.py` covers each case: a JPEG; a 3 MB file; a 70 KB file; files past the message's 256 KB; Latin-1; UTF-16 with a BOM; UTF-8 with a BOM; a deleted file; a folder with an ignored file and 205 files; a line range; a line range over 64 KB; an image. Every message goes, with the expected text.
- Command exit codes: `uv run --project ../substrate python -m pytest tests/test_turn_attachments_446.py tests/test_turn_attachments_388.py tests/test_server_signals.py tests/test_signals_generated.py` 0; `uv run --project ../substrate mypy server.py` 0; `ruff check server.py` 0; `npm run build` 0; `npm run signals` 0.

## observation contract

`editor_chips` from source and on the bundle. ⌥-click cart.ts, then send. The record's UserMessage attachment text is `(src/lib/cart.ts)` followed by the file's text. TURN_ACCEPTED shows attachments 1 and by_reference 0.

`turn_attachments_signals` from source and on the bundle. A fourth attachment, a missing file, goes as its not-found line. TURN_ACCEPTED counts 4 attachments, 1 by reference, in the packaged trace.

`attachments_by_reference_live` (new) from source and on the bundle, with the live model:
- big.txt, 70 KB, goes as its reference line.
- The model's read_file follows that line.
- Its reply holds the file's first line.

The real server's tests cover the other by-reference cases.

## done criteria

No attachment the rules name refuses a message. Each reaches the model as content or as its reference, with the path, and the record holds what it read.

## self-review checklist

- [x] Scope concrete: the cases in the test list each go, with their text.
- [x] context_files cover the design, the decisions, the code and the kernel's prompt.
- [x] Emits names a v0.51 field, ratified in this sprint.
- [x] Artifact contract gradable.
- [x] Observation contract present.
- [x] Two product files (`server.py` and its test), plus the vocabulary and one gate's expectation.
