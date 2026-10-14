# Sprint 189 — Real observation

```yaml
---
id: 189
status: withdrawn
closed_at: 2026-10-14
phase: topologies
pass_kind: functional
roadmap: ../substrate/process/planning/ROADMAP-2026-10-14-create-topology.md
---
```

## scope

Roadmap create-topology and r3's U185. In the installed app, on a real model: the session makes a plan with `topology_plan`, fixes a finding, runs it and reads its end; it delegates, reviews a branch and builds a card, and the reports return; the panes show each run.

## observation contract

Run in the installed app with a real model; the records and the panes are read and reported as they are.

## result

- **Ran** `harness/shakeout/topologies_live.ts` and the new `harness/shakeout/compose_live.ts` against `/Applications/Substrate.app` on its own state folder, `glm-5.2:cloud`.
- **Review and build:** the review named `mean([])`'s `ZeroDivisionError`; `build/r_b87e3cc7fa29` has one commit and passes both commands; two run panes opened; each end reached the session once.
- **Create-topology and delegate:** the model called `topology_help`, `topology_plan` (lines printed) and `topology_run`; the run's pane showed `draft`, `critic NONE`, `run finished`; the rewrite did not run because the critic said NONE, and the model said so; the end reached the session once. `delegate` returned 391 from a child session.
- **Found by the first run, fixed:** an unreadable `if` was dropped while the plan stayed runnable (now it stops the plan); `if Critic is not NONE` was not read (now a test without a field reads the kind's main field; vocabulary v0.16.3); `with Draft with Critic` kept only Critic (repeats now add); a model step's name broke a reply's code fence in the pane (the name is on its own line). The second run, after the fixes, behaved as asked.
- **2026-10-14, zeroed with the create-topology tool.** The create-topology half is withdrawn with the tool, and `compose_live.ts` is removed. The review-and-build half observed the tools of r3 (`topologies_live.ts`, U185) and stands. See `../substrate/process/planning/POSTMORTEM-2026-10-14-create-topology-without-substrate-r2.md`.
