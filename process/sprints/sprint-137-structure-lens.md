# Sprint 137 — The structure lens: checked against the record, laid out as tables

```yaml
---
id: 137
status: closed
closed_at: 2026-10-11
phase: 1
pass_kind: functional
asked: 2026-10-11 (Architect)
---
```

## scope

- Check that the structure lens shows the running session topology.
- A caret sat in an odd place (`▸ initial` inside a fixed 120px name column, and `▸` in the heading). Fixed-width columns let long names, such as `interrupt_fragment`, run into "emits". Lay it out the standard way.

## result

- **Accuracy.** The lens reads `api.topology_graph` on the record's one `RunStarted` manifest. The 40 most recent sessions each hold one `RunStarted`; the 31 newest list 9 producers and 16 triggers. The page matched the record and `session/__init__.py` for producers, emitted kinds, the initial marker and triggers. `first_message` is correctly not initial: it starts on `session_prompt`'s completion. The page left out the record's 6 views and its termination policy; it now shows both (VIEWS, ENDS). The controller had dropped them (`loadTopologyGraph`).
- **Layout** (`web/reveal.html`). Producers and triggers are grid tables with headed columns sized to their content. A trigger name wraps at a hyphen; each ON kind sits on its own line and never breaks inside a word. `initial` is a plain tag after the name, with a one-line legend. The carets are gone.
- **Gate.** `structure_lists_producers.ts` now fetches the record's `topology_graph` and requires the page to list exactly its producers, triggers and views. It passes: 9, 16, 6.
- **Checks.** `tsc` clean; unit specs 34/34. Screenshots at full width show no overlap and no clipped column.
