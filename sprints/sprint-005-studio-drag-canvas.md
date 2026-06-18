# Sprint 005 — Studio drag-canvas (visual node-graph of the authored topology)

```yaml
---
id: 005
status: closed
phase: 1
pass_kind: functional
---
```

*The visual half of the E2 "full parity" Studio: a node-graph canvas where the authored Producers render as draggable cards and the Triggers/Routes render as edges between them — a VISUAL view over the exact same spec the form produces (`buildSpec()`). A form↔canvas toggle; the canvas reflects the current authored topology and is draggable for layout. Canvas-based CREATION (drop nodes / draw edges to author) is a later sprint; this lands the visual picture + drag. One concept (a canvas visualization) in `web/studio.js` + its markup/CSS in `web/studio.html`. No backend change.*

---

## scope

Add a form↔canvas toggle to the Studio and a `renderCanvas()` that reads the live spec (`buildSpec()`) and draws: each Producer as an absolutely-positioned card (kind, emits, an "initial" badge) in a simple layered layout (initials top row, triggered producers below); each Trigger as a solid SVG edge from every Producer that emits the trigger's `on` kind → the `starts` Producer, labelled with the trigger id; each Route as a dashed SVG edge from the `of`-emitting Producer(s) → the triggered Producers, labelled with the slot. Cards are draggable (mousedown-drag to reposition; edges follow). The validate/build actions still operate on the same spec. Vanilla JS + inline SVG, console dark-theme, eight-word vocabulary, no build step / no libraries.

---

## prerequisites

- Sprint 003 (the Studio form + buildSpec) + Sprint 004 (routes + composition in the spec). Closed 2026-06-17.

---

## context_files

- `../sdd-kit-2/AGENTS.md`
- `WORKING_AGREEMENT.md` (TWO-track observation contract — both required; web/ owns the front-end; no new deps)
- `web/studio.html`, `web/studio.js` (the form + `buildSpec()` the canvas reads; the existing toggle/section patterns)
- `web/app.js` (`renderGraph` — the existing SVG-free positioned-lane pattern + cohort layout, as a style reference)

---

## signal contract

### Emits
No NEW substrate vocabulary. The canvas VISUALIZES the authored Producers/Triggers/Routes (the eight words) — a presentation over the same `buildSpec()` the validate/build seam consumes.

### Invariants
- The canvas is a pure view of `buildSpec()` — it never diverges from what validate/build sends; toggling form↔canvas loses no authored data.
- Front-end only; no new dependency (hand-rolled SVG/drag, no d3/cytoscape); eight-word tone canon (grep clean — Producer/Trigger/Route, never "node/agent/workflow" in labels).

---

## artifact contract

### Files modified
- `web/studio.html` (the form↔canvas toggle + the `#canvas` container + canvas/card/edge CSS)
- `web/studio.js` (`renderCanvas()` — layout, SVG edges, drag handlers; the toggle wiring)

### Content assertions
- `web/studio.js` defines `renderCanvas()` reading `buildSpec()`; a toggle switches the form and the canvas without losing authored rows.
- The canvas renders one card per Producer (with an initial marker) and one labelled edge per Trigger; cards are draggable (a mousedown-move-mouseup handler repositions a card and its edges).
- `node --check web/studio.js` passes.

### Command exit codes
- `cd ../substrate && uv run python -m pytest ../substrate-ui/test_server.py -q` returns 0 (backend unchanged).

---

## observation contract (BOTH tracks — REQUIRED, front-end change)

### Track 1 — structural (E2E)
- Extend `e2e_studio.js`: toggle to CANVAS on the pre-filled example → assert 3 Producer cards render (reviewer-a, reviewer-b, judge), the `judge` card is marked non-initial / reviewers initial, and ≥1 Trigger edge labelled `adjudicate` is present; drag a card (mouse down/move/up) → assert its position changed; toggle back to FORM → assert the authored rows are intact (3 producers) and validate still → valid. Keep the existing sprint-003/004 assertions green.

### Track 2 — perceptual (capture + VIEW)
- Extend `capture_studio.js` with a CANVAS frame (pre-filled example, canvas toggled on); the agent READS the PNG and grades: the cards are legible and laid out without overlap, the Trigger edges connect the right Producers and are labelled, the initial markers are clear, it reads as a coherent node-graph, on-vocabulary.

### Expected screenshot / visual state
- The canvas shows reviewer-a / reviewer-b (initial) and judge (non-initial) as cards, with labelled `adjudicate` edges from the reviewers to the judge, in the console dark-theme; a clean node-graph, no overlap, draggable.

---

## done criteria

The Studio toggles between the form and a draggable node-graph canvas that visualizes the authored topology (Producer cards + labelled Trigger/Route edges) over the same spec; both observation tracks pass (E2E incl. card/edge presence + drag + round-trip; the canvas captured AND viewed); the form/validate/build surfaces don't regress.

---

## notes

Hand-roll the SVG edges + drag (no library — the no-deps rule). Layout can be simple/deterministic (initials in a top row, triggered producers in a row below; edges as straight or gently-curved lines). The canvas is a VIEW; the form stays the source of truth for editing this sprint (canvas-based creation is the next/last full-parity piece, alongside real-model Producers). Keep the eight words in every label.
