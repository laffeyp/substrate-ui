# Sprint 016 — Wave 2 N.INT walkthrough

```yaml
---
id: 016
status: closed
phase: 2
pass_kind: observation
---
```

## scope
The wave-boundary proof-point per technique #16. The e2e harness runs end-to-end and exercises every tab through the subject rule: boot, pick model, chat a real deterministic turn, watch Records fill with the new run, pick a demo record, cycle through Run-as-graph + Topology structure + Bus event stream + Inspector + I/O to prove each renders for the selected record, then Assays + Studio confirm their own paths. This is the shipped harness (`npm run e2e:terminal-v1`) — no new code, this sprint's purpose is naming it as the wave-boundary proof.

**Result:** 80+ structural checks pass end-to-end, all six discipline items honored across Wave 2 (sprints 005–015). Wave 2 closed.

**Adversarial pass (A1):** could the entire wave have passed while misrepresenting state? The e2e is a linear sequence: any tab whose port broke would fail its own assertions. The subject-rule invariant is proven twice — Records selection → events → stream count matches; Records selection → topology_graph → 5 group headers render; Records selection → run_graph → row count matches STATE.runGraph.instances. Assays and Studio each carry their own path assertions (STATE.selectedAssay mutation, iframe contentDocument reachable). The one uncaught surface is per-tab visual regression against fixtures for the read tabs (10-15) — those are capture-only because records vary per run; a CSS regression on those tabs would show up only in human review of the screenshots. Named to Drift watchlist.
