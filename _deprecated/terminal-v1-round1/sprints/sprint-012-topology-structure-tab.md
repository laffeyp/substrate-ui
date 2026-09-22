# Sprint 012 — Topology structure tab port

```yaml
---
id: 012
status: closed
phase: 2
pass_kind: functional
---
```

## scope
Topology structure tab reads the selected record's topology via `/api/records/<name>/topology_graph` (parent's projection). Renders five groups: producers (with kind, initial flag, emits), triggers (id, on-kinds, starts, policy), views, routes, termination policy. Text-only rendering — no canvas.

## prerequisites — Sprint 011 closed.

## context_files — parent `renderTopology()` at web/app.js:579.

## artifact contract
- `web/index.html` topology pane has `#topopane` + `[data-testid="topopane"]`.
- `web/app.js` `renderTopology()` fetches on tab activation, renders groups.
- After selecting a record + opening tab, DOM shows `.grp` headers ≥ 5 (producers, triggers, views, routes, termination).

## observation contract
All six discipline items. E2E asserts DOM after render. Capture 13 (capture-only, records vary).
