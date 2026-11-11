# Sprint 452 — the sent message shows its chips

```yaml
---
id: 452
status: closed
phase: code editor (roadmap r13), E10.2 part 2
pass_kind: functional
---
```

## scope

A sent message in the transcript shows its chips beside its text, with the same labels as the input bar and the path on hover (`ADD-TO-MESSAGE-2026-11-10-r3.md`, "what you see"; D94; frame 24k). A chip that went as its reference is marked with a dashed outline, and its hover adds the server's reason (`(not inlined: …)`, `(not found when the message was sent: …)`).

- The echo shows the chips at once, from the message's own chips.
- The record's UserMessage replaces them with its attachments, which carry what the model read.
- Which chips went by reference is read from the reference line's opening words. The server writes them (sprint 446) and `web/reveal/transcript/attachments.ts` reads them. A Python test holds the two copies equal, so neither drifts from the other.

Files:
- `web/vm/types.ts` (TranscriptRow.attachments), `web/vm/session_controller.ts` (the rows' attachments), `web/reveal/transcript/Row.tsx` (the chips), `web/reveal/transcript/attachments.ts` (new, beside its one reader; nothing in `web/reveal` imports `web/app`) and its spec in `web/reveal/__tests__/`, `server.py` (the reference lines' opening words as constants);
- `tests/test_attachment_marks_452.py` (new); the vocabulary; gate `sent_message_chips.ts` (new).

The hard rule 6 bypass is logged.

## context_files

- `ADD-TO-MESSAGE-2026-11-10-r3.md`; roadmap r13 E10.2; D94, frame 24k (`runs/design/sheet-v11/24k.png`); sprint 446's card (the reference lines).
- `Row.tsx`; `InputBar.tsx` (the chip's look); `session_controller.ts` (echo, UserMessage); `server.py` `_attachment_text`.

## signal contract

Vocabulary v0.56, P-0.56-CHIPS-DRAWN: new TRANSCRIPT_CHIPS_DRAWN (pane_id, seq, chips, by_reference). It is written once when a recorded message's row with attachments is drawn, and it is the view pair of TURN_ACCEPTED's attachments and by_reference.

## artifact contract

- The `attachments.spec.ts`: the reference lines read as by reference; content and listings do not.
- `test_attachment_marks_452.py`: the server's constants appear verbatim in `attachments.ts`.
- Commands: unit specs 0; `pytest tests/test_attachment_marks_452.py tests/test_turn_attachments_446.py` 0; build 0; signals 0.

## observation contract

`sent_message_chips` from source and on the bundle, deterministic driver:
1. ⌥-click src/cart.ts in the editor's tree, and put a chip for a missing file `gone.ts` in the bar's store.
2. Send "look".

Expected:
- The sent row shows two chips, `cart.ts` and `gone.ts`. cart.ts's title is its path. gone.ts is dashed, and its title carries "not found when the message was sent".
- TRANSCRIPT_CHIPS_DRAWN chips 2 by_reference 1.
- TURN_ACCEPTED attachments 2 by_reference 1.
- A screenshot of the row beside frame 24k.

## done criteria

What was sent with a message stays visible on it, and a chip the model got only as a path is marked.
