# Sprint 381 — the trace rule in the working agreement

```yaml
---
id: 381
status: closed
phase: SDD re-centre
pass_kind: docs
---
```

## scope

Plan r3 item 8. `WORKING_AGREEMENT.md`, "Observation contract environment", now opens with the trace rule: no sprint that adds or changes behaviour closes until its tags fire in the packaged app's trace, its failure rows under their named fixtures or planted faults. It states:
- the gate asserts tag, payload and order on the trace files;
- every gate fails on an INVARIANT_BROKEN in its launch, except a gate that plants them;
- the Rubber Duck Pass narrates the packaged trace through `scripts/read_trace.py`.

Also changed:
- **The registry** gains the runtime checker and names the trace reader.
- **The vocabulary row and the footer** name v0.23.
- **The build commands** gain the reader.
- **The hand-author log** gains sprint 375.

The prior copy is at `process/archive/WORKING_AGREEMENT-2026-11-08-v0.19.md`. A BLACKBOARD decision entry records the rule.
