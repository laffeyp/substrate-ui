# Sprint 033 — language pass (REVERTED 2026-08-17)

```yaml
---
id: 033-language-pass
status: reverted-2026-08-17
phase: 4
pass_kind: docs
---
```

## Note

**This card is a retro-authored audit-trail placeholder.** Restored 2026-08-28
per REVIEW-2026-08-28-piece-g-work-so-far H6 (rule-12 audit-trail thinness).
The card was originally authored, dispatched, and reverted on 2026-08-17;
the original file was deleted at revert time. The slug `033` was later
re-used by the two-view scaffold sprint (`sprint-033-two-view-scaffold.md`).
Under AGENTS.md rule 12 (audit trail is the work), the reverted card should
have stayed on disk. This file closes that gap.

The two-view scaffold under slug `033` remains the executable v0.7 shape.
Same slug prefix, distinct filenames.

## Original scope

Filter White/Orwell across user-facing strings in `web/index.html`,
`web/app.ts`, and the studio's rendered prose. Nine prose edits:

- assay board "the bar" → "the baseline" (four sites in app.ts + one CSS
  `content` in index.html)
- rail meta "N arms" → "N approaches"
- I/O tooltip "toggle Inputs & Outputs" → "show inputs and outputs"
- diff tooltip drops the stale "D-8" citation
- play tooltip removes the duplicated "replay"
- inspector placeholder "Select an event or a Producer to trace its
  provenance" → "Click an event or a Producer to see how it was caused"
  (two sites)
- health message "halted resumably — awaiting …" → "paused — awaiting …"
- health message drops the repeat "Finished is not worked."

Three e2e substring assertions updated in lockstep.

## What happened

Card closed clean on 2026-08-17. Same day, the Architect ruled the card
was UI-NEXT item 1 — a different work stream from the SDD arc — and the
Agent had picked it up under "continue" without an explicit go. Every
edit was reverted the same day; every gate returned to green after the
revert.

## Revert record

See `process/BLACKBOARD.md ## Built` entry dated 2026-08-17 — "Sprint 033
(language pass) REVERTED. Architect-directed rollback. ..." — for the
verbatim list of restored strings and the four gates verified after
revert (build, console e2e, assay e2e, signals).

## Why this file exists

Rule 12: the audit trail is the work. A sprint that was authored and
dispatched must have an on-disk card, even when reverted. A `status:
reverted-{DATE}` file with a body pointer to the reverting BLACKBOARD
entry is the disciplined shape.
