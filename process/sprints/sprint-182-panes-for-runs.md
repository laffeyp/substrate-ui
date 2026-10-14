# Sprint 182 — Panes for runs

```yaml
---
id: 182
status: closed
closed_at: 2026-10-14
phase: topologies
pass_kind: functional
roadmap: ../substrate/process/planning/ROADMAP-2026-10-14-core-topologies-r3.md
---
```

## scope

A run's start in the caller's record opens a view-only pane beside the caller, bound to the run's record; typing there is refused; the caller's `/run stop` stops the run (r9 § 4).

## observation contract

Gate: a scripted session starts two builds; two view-only panes open on their own; typing is refused; the pane stays after the run ends; `/run stop` ends a run `stopped`.

## result

- **Built** (from UI sprint 176, without the card, checks and pause rows): the app server gives every session `build`, `review` and `run`, and serves `GET /api/session/<id>/runs` and `POST .../runs/<run id>/stop`; the controller tracks the session's runs, draws a row per run and the run's report, refuses typing in a run's pane, and takes `/run [stop|focus] [run id]`; the shell opens a view-only pane per run session beside the caller for a run that starts now. A deterministic session may carry its tool calls in its driver params, for the gates. Signal vocabulary 0.3 is current again.
- **Gate.** `harness/shakeout/run_panes.ts`: two builds open two view-only panes on their own; each ends with its report and its pane stays; typing is refused. Stopping a running build is tested where a run can be held open: `tests/test_run_routes_182.py` lists the build running, stops it through the route while its model (a stand-in CLI) sleeps, finds it `stopped`, and gets 404 for an unknown run.
