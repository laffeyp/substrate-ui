# Sprint 187 — A composed run in the app

```yaml
---
id: 187
status: open
phase: topologies
pass_kind: functional
roadmap: ../substrate/process/planning/ROADMAP-2026-10-14-create-topology.md
---
```

## scope

Research § 5, § 6. The daemon serves `POST /api/session/<id>/topology/plan` and `/topology/run` with the session's tools; a composed run's start opens a pane on its record, view-only, whose transcript shows one row per step event (the step, its kind and the first line of its text, reply or output) and its end; agent steps open their panes as builds do; the structure view shows the plan's steps.

## observation contract

Gate: a scripted session runs a composed plan; its pane shows the step rows in order and the end, the structure view lists the steps, and `/run stop` stops it.

## result
