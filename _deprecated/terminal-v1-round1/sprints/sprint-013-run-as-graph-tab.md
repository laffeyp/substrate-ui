# Sprint 013 — Run-as-graph tab (text summary port)

```yaml
---
id: 013
status: closed
phase: 2
pass_kind: functional
---
```

## scope
Text-summary port of the run-as-graph. Fetches `/api/records/<name>/run_graph`; renders one row per producer instance showing: kind, seq range (fired→started→ended), status (queued/ran/cancelled/failed). Not the SVG lane rendering — that's a full-canvas port for later. This is the minimal read of the same data.

Prereq: 012. Six discipline items honored. Capture 14 (capture-only).
