# Sprint 188 — The Studio on plan and run

```yaml
---
id: 188
status: open
phase: topologies
pass_kind: functional
roadmap: ../substrate/process/planning/ROADMAP-2026-10-14-create-topology.md
---
```

## scope

Research § 6, § 8. The Studio's validate calls the session's plan endpoint and shows the plan's lines, the dry run and the findings with their fixes; its build calls the run endpoint and opens the run's pane. Its form fields map to plan steps (producer to step, trigger to `on` and `if`, route to `with`, termination to the end).

## observation contract

Gate: the Studio's sample validates with no findings, a broken field gets its finding and fix, and build starts the run and opens its pane.

## result
