# Sprint 144 — The session-start line

```yaml
---
id: 144
status: closed
closed_at: 2026-10-11
phase: 1
pass_kind: functional
roadmap: substrate-ui/process/planning/ROADMAP-2026-10-11-before-distribution.md (step 12)
asked: 2026-10-11 (Architect)
---
```

## scope

- Before the first message, the empty transcript shows one line at its top left: "session started with ‹model› at ‹workspace›". The first message then appears below it, beside its caret. The line tells the user the empty area is where the conversation goes.
- ‹model› is the pane's driver (the model picked in the workspace bar, or a resumed session's own). ‹workspace› is the workspace path with the home folder written `~`, or "a per-session sandbox" for the session's own sandbox, before and after it opens.
- The line is the transcript's first row in both views (`web/reveal/transcript/Transcript.tsx`), in the transcript's grey; it is not a record event.

## checks

- An Electron gate: bind a pane; the transcript shows the line naming the model and the workspace before any message; after one message the line is still first and the user's message is below it; the meta view shows the same line.
- `tsc` clean; unit specs; the Electron gates; a screenshot.

## result

- **Built** (`Transcript.tsx`, `startLine`): the line is the transcript's first row (`data-session-start-line`), grey, in both views. A path under the home folder reads `~/…`; the session's own sandbox (`…/sessions/<id>/workspace`) reads "a per-session sandbox" before and after the session opens, where the first try showed the temp path once the session opened.
- **Gate** `session_start_line.ts` (in `gates:electron`): before a message the line reads "session started with deterministic at a per-session sandbox"; after one it is still first, with the message below; the meta view's first row is the same. A screenshot at 1512 points shows it at the top left.
