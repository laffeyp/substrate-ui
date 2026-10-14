# Sprint 183 — Delegate's pane

```yaml
---
id: 183
status: open
phase: topologies
pass_kind: functional
roadmap: ../substrate/process/planning/ROADMAP-2026-10-14-core-topologies-r3.md
---
```

## scope

A delegate child opens an interactive pane beside its caller, attached to the child's session (r9 § 4, § 8.5).

## observation contract

Gate: a scripted session delegates; the child's pane opens on its own, shows the task, takes a typed message, and stays.
