# Sprint 176 — Panes for runs

```yaml
---
id: 176
status: closed
closed_at: 2026-10-13
phase: topologies
pass_kind: functional
depends_on: [K319]
roadmap: ../substrate/process/planning/ROADMAP-2026-10-13-core-topologies.md
---
```

## scope

A run's start in the focused session's record opens a pane bound to it, in the caller's window for one session and a window of its own for several; the pane is view-only when the topology writes the session's next message; the caller's pane shows the run as a row that stops it and focuses its pane (r8 § 3.6).

## observation contract

Gate: a scripted run started from a session opens its pane on its own, shows the run's events, refuses typing, stays after the end, and the caller's row stops it.

## result

- **Built.** Kernel: `RunTable.listing(owner)` (each run's id, topology, sessions, running, paused, outcome; reading it reports nothing). `DriverParamKey.SCRIPT`: a `deterministic` session's [tool, args] calls, validated as pairs, passed to the session topology's `script`, and left out of the responder cache key. App server: `GET /api/session/<id>/runs` and `POST /api/session/<id>/runs/<run_id>/stop`. `scripts/gen_kinds.py` also reads a driven session's registration and the run start, adding `CardAccepted`, `ChecksRun`, `ReportWritten`, `RunPaused`, `RunResumed`, `TopologyRunStarted`, `TopologyRunEnded`; each is drawn as a row. Controller: `runs` and `viewOnly` on the snapshot; `refreshRuns` (every 2 s while one runs), `stopRun`, `attachRun` (record stream, name `<topology> <run id>`, workspace from the run's `SessionStarted`); a view-only pane refuses a sent line with "view only: the <topology> writes this session's messages" and its `Returned` rows drop "your turn"; `/run [stop|focus] [run id]`, the latest run when no id. Shell: a `RUN_STARTED` whose `t` is under a minute old opens a pane per run session beside the caller (or focuses one already showing it); `/run focus` focuses or reopens; at eight panes the caller's pane says to close one. The input hint and the top bar's workspace come from the pane's controller. Signal vocabulary 0.2 (`web/vm/signals/versions/0.2.json`, rationale beside it): `RUN_STARTED`, `RUN_FOCUS_REQUESTED`, `RUN_STOP_REQUESTED`, `TURN_REFUSED_VIEW_ONLY`; 0.1 stays on disk.
- **Not here.** A run with several sessions in a window of its own: no run has several sessions until Swarm, so that case is a requirement of the Swarm card, where it can be observed. There is no second-window code yet.
- **Gate.** `harness/shakeout/run_panes.ts` (in `gates:electron`): a deterministic session's one turn starts two builds; two view-only panes open on their own; the `true` build ends done and its pane shows the card, "checks passed" and "report · done" and stays; a line typed in the other pane is refused and does not reach the run; `/run stop <id>` in the caller's pane ends that build `caller_stop`, and the caller lists it `stopped`. Mutation: without the view-only guard the gate fails at "typing was not refused". A screenshot (`RUN_PANES_SHOT`) was read: the top bar names the run and its worktree.
