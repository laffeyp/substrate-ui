# Sprint 009 — vocabulary lock

```yaml
---
id: 009
status: closed
phase: 2
pass_kind: architecture
---
```

## scope
Lock the substrate-ui signal vocabulary at v0.1. Founding act per hard rule 12. Agent-drafted per Architect direction (not the collaborative session BOOTSTRAP.md § 1–11 defaults to — Architect explicitly delegated), ratified by Architect on read-through.

## artifacts
- `substrate-ui/signals/versions/0.1.json` — 44 tags across 11 categories (session, records, record, assay, view, stream, terminal, agent, topology, diff, incident), 4 strata (event, ambient, summary, incident), 8 invariants, `view_payload_universal` = {frame, visible, pane_id, subject_record}.
- `substrate-ui/signals/versions/0.1-rationale.md` — per-layer decisions, dual-contract audit table, four open proposals for v0.2.

## dual-contract outcome
Ratified 2026-08-14. `locked: true`, `locked_at: 2026-08-14`, `locked_by: Architect (Peter)`. Parity gate (Sprint 010) validates the lock's internal consistency and greens.

## rubber duck pass
*Observations:* one payload anomaly — declared `tag_count: 42` while `tags.length` was 44 (miscount by drafter). Caught by the Sprint 010 parity gate on first run. Corrected in place same session; ratification stamp is against the corrected file. *Disposition:* one resolved-here (tag_count fix). Zero halted.

## follow-on
Sprint 010 lands the emitter + parity gate + grader. Sprints 011–018 add emit calls per subsystem.
