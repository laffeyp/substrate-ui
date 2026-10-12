# Sprint 167 — The controls gate reads what the model received

```yaml
---
id: 167
status: closed
closed_at: 2026-10-12
phase: 1
pass_kind: functional
roadmap: substrate/process/planning/ROADMAP-2026-10-12-changes-on-time-r2.md
postmortem: substrate/process/planning/POSTMORTEM-2026-10-12-mid-session-changes-arrive-late-r2.md
context_files:
  - harness/shakeout/controls_mid_session.ts
---
```

## scope

`controls_mid_session` (U161) passed while every change reached the model a message late: it checked the manifest, the bar line and the recorded `SessionChanged`. After: it reads, from the record, the `PromptComposed` for the message sent after `/tone blunt` and after `/guidance low`, and asserts the new text is in its system text and the old is not. A live check on a cloud model sends one message after `/length terse` and reads that prompt and reply. With K299 in, the transcript's "it applies from the next message" is true; the card checks it against the record.

## observation contract

The gate fails on the current kernel (the old tone text in that prompt) and passes after K299.

## result

- **Built.** `harness/shakeout/lib/prompt_after_change.py` reads a session record through the kernel (long prompt text sits in blobs) and reports, for each `SessionChanged`, how many fragments the change wrote (any generation from that message up to the next) and whether the prompt for that message holds them and none of the same sources' older text. `controls_mid_session.ts` requires, for the tone and bundle changes, text written, the new text in the prompt and the old text gone.
- **Red, then green.** The first version passed on the pre-K299 kernel (`c6ab5702`): it looked for fragments tagged with the message's seq, found none (the old kernel tagged the change's seq), and `all()` of nothing is true. With the generation window and `written > 0` required, it fails on the pre-K299 kernel ("the prompt for \"again\" after tone neutral→blunt lacks the new text") and passes on `6d2d5114`.
- **Live** (deepseek-v4-pro:cloud): one message at normal, `/length terse`, one message: the prompt for the second held the terse text and none of the old (`written: 1, new_text_in_prompt: true, old_text_in_prompt: false`); replies 245 then 201 words, on different questions.
- The transcript's "it applies from the next message" is now what the record shows.
