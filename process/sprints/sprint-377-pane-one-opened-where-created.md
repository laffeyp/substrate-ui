# Sprint 377 — pane 1's open signal is written where pane 1 is created

```yaml
---
id: 377
status: closed
phase: SDD re-centre
pass_kind: functional
---
```

## scope

A fault the runtime checker found (sprint 373). On a reload with `?session=`, `web/reveal.ts` spawns pane 1's controller and attaches its session before the App mounts. The App's mount wrote pane 1's PANE_OPENED. So the trace held pane 1's SESSION_ATTACH_STARTED before pane 1 had opened: a session signal outside its pane's frame (Layer 3 puts `pane_session` inside `pane`). An AI reading the trace saw a session attached to a pane that did not exist yet.

PANE_OPENED means "a pane was created". Pane 1 is created in `web/reveal.ts`, so its PANE_OPENED is written there, right after the spawn. The App's mount writes it for every other starting pane. Nothing the app does or draws changes; only where the record is written.

Vocabulary v0.23 (`P-0.23-PANE-ONE-OPENED`): PANE_OPENED's emit site names `web/reveal.ts` for pane 1.

## artifact contract

### Files modified

- `web/reveal.ts`, `web/app/App.tsx`; `harness/shakeout/graph_model_lane_on_resume.ts`; vocabulary v0.23 files

## observation contract

`graph_model_lane_on_resume.ts` reloads onto its session. After the last WINDOW_BOOTED, pane 1's records must read PANE_OPENED, then SESSION_ATTACH_STARTED.

Plant: with the emit back in the App's mount, the gate fails with "after the reload pane 1 wrote SESSION_ATTACH_STARTED, PANE_OPENED".

## result

- **Gates:** `graph_model_lane_on_resume` 0; `pane_signals` 0 (16 window records in order). The plant fails the first.
