# Sprint 451 — the sent message's echo matched by identity; a refused message keeps its draft

```yaml
---
id: 451
status: closed
phase: code editor (roadmap r13), E10.2 part 1
pass_kind: functional
---
```

## scope

Two of the prototype's faults (`ADD-TO-MESSAGE-2026-11-10-r3.md`, "the prototype's faults"; roadmap r13 E10.2).

**The order.** `session_controller.ts` replaced a message's echo with the record's UserMessage by looking for the first echo with the same text. A refused message's echo stays in the transcript, so a later accepted message with the same words took the refused echo, moved it to the end, and left the refusal's warning above it. The Architect saw: "what is that", refused, refused, "what is this", "what is this".

The fix:
- The controller keeps the echoes still waiting for their message, in send order. A refused turn takes its echo out.
- The record's UserMessage replaces the oldest waiting echo with its text. With none waiting, a message from elsewhere or a replay is added as its own row.
- A refused echo is never moved, and its warning stays under it.

**The draft.** On a real error, the message's draft and chips go back into the bar, as round 3 asks ("a real error leaves the draft and its chips in the bar"). `submitLine` takes `onRefused`. The input bar puts the line and the chips back when the bar is still empty, so nothing typed since is overwritten.

Found in the close and fixed in it:
- Two messages sent in one millisecond shared an echo seq. Each echo's seq is now unique, with its refusal and save warnings at the two seqs below it.
- A refused turn was still counted, so the window's TURN_SUBMITTED.turn_index ran one ahead of the record. It now goes back.

Files: `web/vm/session_controller.ts`, `web/app/state/input_bar.ts`; spec `web/reveal/__tests__/echo_identity.spec.ts` (new); the vocabulary; gate `message_refused_order.ts` (new).

## context_files

- `ADD-TO-MESSAGE-2026-11-10-r3.md` ("what you see", "the prototype's faults"); roadmap r13 E10.2.
- BLACKBOARD 2026-11-10 user (chips restart; the order the Architect saw).
- `session_controller.ts` `sendTurn`, `submitLine`, the UserMessage case; `state/input_bar.ts` `barKey`, `submit`.
- Vocabulary 0.54: TURN_REFUSED, INPUT_CHIP_REMOVED.

## signal contract

Vocabulary v0.55, P-0.55-DRAFT-RESTORED: new INPUT_DRAFT_RESTORED (chips), written when a refused message's draft and chips go back into the bar. TURN_REFUSED and TURN_SUBMITTED as before.

## artifact contract

- `echo_identity.spec.ts`:
  - a refused message's echo is not taken by a later message with the same words, and its warning stays under it;
  - the record's message replaces its own echo;
  - a message with no waiting echo is added;
  - `onRefused` runs on a refusal and not on an acceptance.
- `npm run test:unit` 0; `npm run build` 0; `npm run signals` 0.

## observation contract

`message_refused_order` from source and on the bundle, deterministic driver:
1. Send "hello".
2. Type "what is this" and put a chip in the bar naming a path outside the workspace. Send: the server refuses it (400).
3. The bar holds "what is this" and the chip again. INPUT_DRAFT_RESTORED reads chips 1.
4. Remove the chip with its ×, then send.

Expected:
- The transcript reads: the refused echo "what is this", its warning, then "what is this" from the record (a positive seq), then the reply.
- TURN_REFUSED once; TURN_ACCEPTED for "hello" and the second "what is this".

## done criteria

A refused message stays where it was, with its warning under it and its draft back in the bar. The next message, whatever its words, is drawn where it was sent.
