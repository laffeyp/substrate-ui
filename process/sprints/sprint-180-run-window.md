# Sprint 180 — A run's window

```yaml
---
id: 180
status: open
phase: topologies
pass_kind: functional
depends_on: [K326, 176]
roadmap: ../substrate/process/planning/ROADMAP-2026-10-13-core-topologies-r2.md
---
```

## scope

A run with several sessions opens a window of its own with a pane per session, view-only where the topology writes the next message (r8 § 3.6; open item 30). The caller's row focuses the window.

## observation contract

Gate: a scripted swarm of two cards opens one new window with two panes, each on its card's session; `/run focus` brings the window forward; closing it leaves the run running.
