# Sprint 188 — The Studio on plan and run

```yaml
---
id: 188
status: closed
closed_at: 2026-10-14
phase: topologies
pass_kind: functional
roadmap: ../substrate/process/planning/ROADMAP-2026-10-14-create-topology.md
---
```

## scope

Research § 6, § 8, and the Studio direction of `FUTURE-DIRECTIONS-2026-09-27-cockpit-post-ship.md` § 1 (pick from the catalog, show the shape, edit only what means something, run attached to the session). The Studio lists the plans there are (shipped and saved in the workspace); a pick puts its lines in an editable box; Check calls the session's plan endpoint and shows the lines with defaults filled, the wiring, the dry run, and the findings with their fixes, with "use the fixed plan" when there is one; Run starts the checked plan for the pane's session, with an optional input, and its pane opens. The old form (producers, views with `≥ n` predicates, routes, termination chips, responder, seed, model) and its canvas go: the plan language has no views or predicates, and the form has no role, so a mapped plan would draw `missing_role` on every step. The surface stops being dimmed and inert.

## observation contract

Gate: picking `draft_and_critique` fills the box; Check on it reads no findings; with `or quiet` taken out, Check reads `never_ends` and offers the fixed plan; using it and checking again reads no findings; Run opens the run's pane.

## result

- **Scope changed before building** (recorded above): the Studio edits plan lines rather than mapping the old form, which had no counterpart for views, predicates or roles. The 2026-09-27 direction it follows had marked the surface inert ("coming soon…"); it is live again.
- **Built.** `GET /api/session/<id>/topology/plans` (shipped plans and those saved in the session's workspace, as lines). The Studio lists them as chips; a pick fills an editable box; check calls the session's plan endpoint and shows the findings (red, `unread` grey), the wiring and the dry run, with "use the fixed plan" when there is one (it fills the box and checks again); run checks first if the lines changed, starts the plan for the focused pane's session with the optional input, and the run's pane opens over the Studio. The output line speaks to the person (the tool's `next` is written for a model). The old form, canvas, drag handlers, spec builder, validator, `validateSpec`/`buildSpec` and their deleted endpoints' callers are gone.
- **Gate.** New `harness/shakeout/studio_plan_run.ts` (in `gates:electron`; `STUDIO_SHOT` saves a screenshot, looked at): pick `draft_and_critique`, check clean, take `or quiet` off (`never_ends` and the fixed plan), use it (clean), run it: a view-only pane reads the steps and `run finished`.
