# Sprint 181 — Real observation, round 2

```yaml
---
id: 181
status: pending
phase: topologies
pass_kind: functional
depends_on: [K325, K326, 178, 179, 180]
roadmap: ../substrate/process/planning/ROADMAP-2026-10-13-core-topologies-r2.md
---
```

## scope

In the installed app, a session on a real model delegates a task, runs an autonomous build of three cards, and runs a swarm of two disjoint cards in a real repository.

## observation contract

The delegate child answers in its own pane; every card's checks pass on its branch; the reports return to the session; the windows and panes showed the runs as they went.
