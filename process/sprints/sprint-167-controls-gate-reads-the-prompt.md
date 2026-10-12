# Sprint 167 — The controls gate reads what the model received

```yaml
---
id: 167
status: open
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
