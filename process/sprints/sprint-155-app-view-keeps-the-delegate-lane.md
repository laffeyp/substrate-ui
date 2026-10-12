# Sprint 155 — The graph's app view keeps the delegate lane on the rows it shows

```yaml
---
id: 155
status: closed
closed_at: 2026-10-12
phase: 1
pass_kind: functional
asked: 2026-10-12 (Architect: "when you go from all view to app view in the down graph, you lose everything in the delegate lane … on every row that we keep, just keep what's in the delegate lane in the expanded view.")
context_files:
  - web/reveal_component.ts
---
```

## scope

The down graph draws three lanes (model, delegate, external); a row's lane cell is coloured when a span covers its seq. In app view the rows of runtime plumbing are hidden (`LOW`), and `_laneFilter` also drops every span marked `plumbing`: the producer spans (session_prompt, first_message and the rest) that run in the delegate lane. A user message row that sits inside such a span shows it in all view and loses it in app view.

After: the down graph stops filtering spans by view. App view hides the same rows as now; every row it keeps draws its lane cells exactly as all view does.

## signal contract

No controller tags change.

## observation contract

Electron gate `app_view_delegate_lane.ts`: a deterministic session, one message; the meta view's graph; read each row's seq and lane cell colours in all view, then in app view; every row app view shows has the same three colours it has in all view, and at least one kept row has a coloured delegate cell.

## checks

- The gate red on the current code, green after; `graph_model_lane_on_resume` passes.

## result

- **Built** (`reveal_component.ts`): `_laneFilter` is gone, and with it the spans' `plumbing` field, which nothing else read. App view hides the same rows; the lanes come from every span.
- **Gate** `app_view_delegate_lane.ts` (in `gates:electron`): red on the old code (row 17, UserMessage: delegate cell `rgb(77, 107, 110)` in all view, empty in app view), green after (3 of 28 rows kept, each drawn as in all view; the UserMessage carries the delegate lane). `graph_model_lane_on_resume`, `structure_lists_producers` pass.
- **Rubber Duck Pass.** No controller tag moved; the gate compares each kept row's computed lane colours across the two views.
