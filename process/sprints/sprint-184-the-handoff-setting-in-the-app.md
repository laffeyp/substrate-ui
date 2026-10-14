# Sprint 184 — The handoff setting in the app

```yaml
---
id: 184
status: closed
closed_at: 2026-10-14
phase: topologies
pass_kind: functional
roadmap: ../substrate/process/planning/ROADMAP-2026-10-14-core-topologies-r3.md
---
```

## scope

`/handoff rare`, `/handoff normal` and `/handoff eager`, and the bar line's handoff segment (r9 § 9).

## observation contract

Gate: the change reaches the manifest, the bar line and the next message's prompt.

## result

- **Built** (UI sprint 179, unchanged): `/handoff rare|normal|eager`, the bar line's handoff segment with its hover, the snapshot field, the generated positions.
- **Gate.** `controls_mid_session.ts` passes with the handoff step (the change reaches the manifest, the bar line and the next message's prompt); `language_bar_line.ts` passes.
