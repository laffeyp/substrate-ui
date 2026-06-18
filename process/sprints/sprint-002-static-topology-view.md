# Sprint 002 — static topology-structure view in the console

```yaml
---
id: 002
status: closed
phase: 1
pass_kind: functional
---
```

*Closes the design-§6 read-side gap the wider perceptual re-verification surfaced: the `/topology_graph` endpoint is built + tested but the console only renders the dynamic run-as-graph. This adds the STATIC topology-structure view (Producers / initial-set / Triggers / Views / Routes / TerminationPolicy as AUTHORED, before any run) as a toggle alongside the run-as-graph, consuming the existing endpoint. Two files, one concept (a read view + its toggle). Behavior-touching → BOTH observation tracks required (structural E2E + perceptual capture/view).*

---

## scope

Add a static topology-structure view to the console. A new toggle in the graph pane header switches the center read-pane between RUN-AS-GRAPH (existing, dynamic, run-instance lifespans) and TOPOLOGY (new, static structure from `/api/records/<name>/topology_graph`): the Producer kinds (initial ones marked), the Triggers (id, on-kind, predicate gist, starts-kind), the Views, the Routes (of-kind → slot), and the TerminationPolicy. Render it as a legible structural list/graph in the existing dark-console style — NOT a run timeline. The toggle is per the design §6 "two graph surfaces" intent. `web/app.js` (the render fn + toggle wiring) + `web/index.html` (the toggle control + any CSS).

---

## prerequisites

- Sprint 001 (the build seam) + the full verification pass (both observation tracks green, foundation confirmed hard). Closed 2026-06-17.

---

## context_files

- `../sdd-kit-2/AGENTS.md`
- `WORKING_AGREEMENT.md` (the TWO-track observation contract — both required here; canonical home: web/app.js owns the console render, web/index.html owns the DOM/CSS)
- `web/app.js` (renderGraph + render() + the mode toggle — the pattern to mirror)
- `web/index.html` (the graph-pane header + the existing toggle button styles)
- `server.py` (`/api/records/<name>/topology_graph` — the endpoint to consume; already served + tested)
- `test_server.py::test_topology_graph_endpoint_nodes_and_edges` (the served shape: producers[{kind,is_initial}], triggers[{id,on,starts,…}])

---

## signal contract

### Emits
No NEW substrate vocabulary (a read view over substrate's v0.2). The view RENDERS the topology_graph projection (Producer/Trigger/View/Route/TerminationPolicy — the eight words).

### Invariants
- Reads only `substrate.api` via the existing endpoint — no new backend, no kernel import.
- The eight-word tone canon: the view labels Producers/Triggers/Views/Routes/TerminationPolicy — never "agent/workflow/node/step". (standing grep clean.)
- The new view does NOT regress the run-as-graph or any existing surface.

---

## artifact contract

### Files modified
- `web/app.js` (a `renderTopology()` fn + a topology/run toggle in the graph header; `render()` routes to it)
- `web/index.html` (the toggle control + minimal CSS for the structural rows)

### Content assertions
- `web/app.js` defines a topology-structure render path that fetches `/api/records/<name>/topology_graph` and renders producers (initial marked), triggers, views, routes, termination.
- A toggle in the graph-pane header switches RUN-AS-GRAPH ↔ TOPOLOGY without losing the selected record or the seq cursor.
- `cd ../substrate && uv run ruff check` (unaffected) — backend untouched; `node -e "require('./web/app.js')"` not applicable (browser JS), so the gate is the E2E + capture below.

### Command exit codes
- `cd ../substrate && uv run python -m pytest ../substrate-ui/test_server.py -q` returns 0 (unchanged backend; 21 pass).

---

## observation contract (BOTH tracks — REQUIRED, this is a front-end change)

### Track 1 — structural (E2E)
- `npm run e2e` green, PLUS a new assertion: select code_review, click the TOPOLOGY toggle, assert the static view shows the authored Producers (e.g. `judge`, `reviewer-security`) with the initial-set marked and the `adjudicate` Trigger (on CritiquePosted → starts judge) — and that toggling back to RUN-AS-GRAPH restores the run timeline.

### Track 2 — perceptual (capture + VIEW)
- `npm run capture` extended with a frame for the topology view (toggle on, code_review); the agent READS the PNG and grades: the structure is legible, distinct from the run timeline, on-vocabulary, no overflow/overlap, the initial Producers and the Trigger wiring are visually clear. Looking is the contract.

### Expected screenshot / visual state
- The TOPOLOGY view shows the 6 code_review Producers (5 reviewers initial + judge non-initial), the `adjudicate` Trigger wiring reviewers→judge, the Views, and the TerminationPolicy — rendered as static structure (no time axis), visually distinct from the run-as-graph.

---

## done criteria

The console renders the static topology-structure view (design §6's missing surface) as a toggle beside the run-as-graph, consuming the existing tested endpoint; both observation tracks pass (E2E incl. the new toggle assertion; the topology frame captured AND viewed); no existing surface regresses.

---

## notes

This is the read-side completion the verification surfaced — a working/tested endpoint finally gets its UI consumer. Mirror the existing `renderGraph`/`render()`/`modeToggle` pattern (app.js) rather than inventing a new structure. The Studio authoring canvas (the bigger E2-ruling piece) is a SEPARATE later sprint; this is read-only structure, not authoring.
