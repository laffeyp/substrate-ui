# Sprint 182 — Panes for runs

```yaml
---
id: 182
status: open
phase: topologies
pass_kind: functional
roadmap: ../substrate/process/planning/ROADMAP-2026-10-14-core-topologies-r3.md
---
```

## scope

A run's start in the caller's record opens a view-only pane beside the caller, bound to the run's record; typing there is refused; the caller's `/run stop` stops the run (r9 § 4).

## observation contract

Gate: a scripted session starts two builds; two view-only panes open on their own; typing is refused; the pane stays after the run ends; `/run stop` ends a run `stopped`.
