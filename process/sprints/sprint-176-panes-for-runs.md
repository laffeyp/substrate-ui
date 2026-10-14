# Sprint 176 — Panes for runs

```yaml
---
id: 176
status: open
phase: topologies
pass_kind: functional
depends_on: [K319]
roadmap: ../substrate/process/planning/ROADMAP-2026-10-13-core-topologies.md
---
```

## scope

A run's start in the focused session's record opens a pane bound to it, in the caller's window for one session and a window of its own for several; the pane is view-only when the topology writes the session's next message; the caller's pane shows the run as a row that stops it and focuses its pane (r8 § 3.6).

## observation contract

Gate: a scripted run started from a session opens its pane on its own, shows the run's events, refuses typing, stays after the end, and the caller's row stops it.
