# Sprint 117 — The graph's model lane survives a resume

```yaml
---
id: 117
status: closed
opened_at: 2026-10-09
closed_at: 2026-10-09
phase: 1
pass_kind: functional
---
```

## why

Reported 2026-10-09: after reattaching to a session the model lane stops being drawn, in the down graph (each stream row's left lane cell) and in the side graph. `reveal_component.ts` drew one model span from the first envelope to `_endedSeq`, the seq of the record's FIRST SessionEnded. A resumed session's record holds a SessionEnded for every earlier end (a user end or an app restart's `daemon_shutdown`), so every row after the first end had no model bar. The side graph reads the same `spansByKind.model`.

## scope

- `reveal_component.ts`: one model span per open stretch. A SessionEnded closes the current span; the next envelope opens a new one; an open stretch runs to the last seq.

## signal contract

### Emits

None; the change is in the view.

### Invariants

- A session that never ended draws one model span from its first to its last seq, as before.
- The locked UI vocabulary is unchanged.

## artifact contract

### Files modified

- `substrate-ui/web/reveal_component.ts`
- `substrate-ui/package.json` (`gates:electron` runs the new gate)

### Files created

- `substrate-ui/harness/shakeout/graph_model_lane_on_resume.ts`

### Command exit codes

- The new gate exits 0, and non-zero on the build before the change.
- `npm run build` (tsc, harness tsc, lint, vite) and `npm run gates:electron` exit 0.

## observation contract

### Driving steps

- In the Electron app with its own home: a session turns, ends, turns, ends; the window reloads, attaches, sends one more turn; the graph is revealed (ctrl+`). Down view: every row after the first SessionEnded row has a drawn model cell. Side view: the model lane holds three segments.

## done criteria

A resumed session's model lane covers every stretch the session was open, in both graph views.

## result

- One model span per open stretch; the side graph follows from the same spans.
- Red before: `29 of 29 rows after the first end have no model lane`. Green after: 29 rows carry the lane; the side model lane has 3 segments.
- Gates: `npm run build` exits 0; `npm run gates:electron` exits 0 (shakeout, lifecycle, transcript_follow, resume_ended_session, driver_chip_on_resume, resume_after_two_ends, graph_model_lane_on_resume).
