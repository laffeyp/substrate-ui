# Sprint 188 — The Studio on plan and run

```yaml
---
id: 188
status: reverted
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

- **Built, then reverted (2026-10-14) at the Architect's direction.** Commit `ce52dd7` replaced the Studio's form (producers, views, triggers over view predicates, routes into slots, termination policies) with an editor for the plan language and made the surface live. The Architect: "This is not what the studio is." The form works at the granularity of Substrate's own primitives; the plan language replaced that granularity. The revert restores the inert form, its code and the server as they were.
