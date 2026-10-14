# Sprint 187 — A composed run in the app

```yaml
---
id: 187
status: withdrawn
closed_at: 2026-10-14
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

- **Daemon** (`server.py`): `POST /api/session/<id>/topology/plan` and `/topology/run` call the session's own topology tools with the body as arguments (a tool's refusal is a 400 with its text); `run` adds the run's `record_root`. `GET /api/records/by-path/topology_graph?path=` gives a run record's structure; it and the by-path event stream share one path check (`_allowed_record_path`).
- **Kernel** (vocabulary v0.16.2, committed separately): `TopologyRunStarted.record_root`; a run started from the app has its start written at the session's next model step with `call_seq` -1, before its end; the run listing carries `record_root`. The `session` and `daily` CI records were regenerated for the model step's schema; the other 16 were restored.
- **App.** The controller reads a composed run's plan from its record's `RunStarted` and draws one row per step event: a model step's text as a reply headed by its step, an agent's outcome, branch, files and first line, a command's exit and first line (a warning when it failed), a collect's count, a split's item; then `stopped (<source>)` and `run finished` or `run failed`. `planTopology` and `runTopology` call the endpoints; a run started from the app opens its pane at once. A composed run's start (no sessions) opens one view-only pane on its record, reading "view only: the steps of <plan> write here", with the structure graph loaded by path; the structure view shows the plan as `draft (model) → critic (model) → fix (model)`, and other object baselines as one line of JSON. `ComposePart` and `RunStopRequested` are generated from the kernel.
- **Gate.** New `harness/shakeout/composed_run_pane.ts` (in `gates:electron`): a scripted session's `topology_run` of `draft_and_critique` opens a pane reading draft, critic, fix and `run finished`, its graph lists the three steps and the structure view shows the plan; the app checks a plan with `sleep 30`, runs it, its pane opens, `/run stop` ends it `stopped` and no `sleep` survives. `run_panes`, `delegate_pane`, `structure_lists_producers` and `find_counts_transcript` pass; the app's Python tests pass (257, 5 skipped).
- **2026-10-14, zeroed with the create-topology tool.** Everything this card built is removed: the plan and run endpoints, the by-path graph, the composed-run rows and pane, `ComposePart` and `RunStopRequested` in the generated files, and the gate `composed_run_pane.ts`. The kernel side (v0.16.2) is withdrawn with it. See `../substrate/process/planning/POSTMORTEM-2026-10-14-create-topology-without-substrate-r2.md`.
