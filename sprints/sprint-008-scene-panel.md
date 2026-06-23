---
sprint: 008
slug: scene-panel
status: pending
pass_kind: web-frontend
cadence: auto-within-phase
context_files:
  - web/app.js
  - web/index.html
  - ../sdd-kit-2/AGENTS.md
  - WORKING_AGREEMENT.md
  - process/BLACKBOARD.md
---

# Sprint 008 — the scene panel (custom visual output for applications)

## Why (the design note)

A run record is a typed event log; the console projects it as a run-as-graph, an event
stream, and provenance. But some topologies emit an **application-domain artifact** whose
meaning is visual, not structural — `game_of_life` emits a `Generation.grid` (a 2-D int
matrix) that means a board of live/dead cells, and the natural way to verify the blinker
oscillates is to *see* it, not to read 264 frames. The graph/stream panels render the
substrate's shape; they do not render the domain's.

The fix stays inside the lens contract — it does NOT add app code to the UI, does NOT change
run semantics, and reads only the record's public events:

- A third graph view, **"scene"**, beside run-as-graph and structure.
- It is **opt-in by SHAPE, not by app code**: the panel scans the record's event payloads for a
  generic renderable shape — a 2-D numeric array — and renders it as a cell grid. `game_of_life`
  qualifies via `Generation.grid`; any board / heatmap / matrix topology qualifies for free. No
  per-app renderer, no coupling.
- It is **driven by the existing seq-cursor**: it shows the latest renderable frame at or before
  the cursor, so scrubbing animates the generations in lock-step with the graph and stream —
  reusing the one-cursor architecture, adding no second time axis.
- The tab appears **only when the record contains a renderable shape**; otherwise the console is
  unchanged.

Escalation (NOT this sprint): a per-app plugin renderer keyed to an event kind, for visuals a
generic shape cannot express. The shape-driven panel covers grids/boards/heatmaps; the plugin is
the documented fallback if a future topology needs more.

## Scope

`web/index.html` (a `scene` tab in the graph header + grid CSS) and `web/app.js` (`findGrids`
shape detection, `renderScene`, `updateScene` tab-visibility, the view toggle + cursor wiring).
No backend change — the scene reads `STATE.events`, already fetched from `/api/records/<name>`.

## Dual contract

**Artifact (Files created/modified):**
- `web/app.js` — `findGrids` / `renderScene` / `updateScene`; `gvScene` toggle; `STATE.scene`.
- `web/index.html` — `#gvScene` tab (hidden by default) + `.scene-grid` / `.cell` CSS.
- Assertions: `node --check web/app.js` exits 0; `test_server.py` still passes (no backend change);
  the eight-word grep stays clean (`scene`/`cell`/`grid` are not primitive names, not anthropomorphic).

**Signal (Emits):** none — substrate-ui emits no signals (it is a reader of substrate's v0.2
vocabulary; per WORKING_AGREEMENT there is no `signals/` here). The "trace" the Rubber Duck Pass
narrates is the rendered scene over the `game_of_life` record's `Generation` events.

## Observation contract (REQUIRED — both tracks, behavior-touching front-end)

- **UI driving steps:** start the real backend; load the console; select `game_of_life`; confirm
  the `scene` tab appears; click it; scrub the seq-cursor across the three `Generation` events.
- **Track 1 — STRUCTURAL (`e2e_console.js`, real Chrome):** the `scene` tab is present for
  `game_of_life` and absent for a record with no grid shape (e.g. `code_review`); clicking it
  renders a `.scene-grid` with the expected cell count (25 for the 5×5); scrubbing to an earlier
  `Generation` seq changes the live-cell positions.
- **Track 2 — PERCEPTUAL (`capture` → screenshot → the agent READS the PNG):** the grid renders as
  a board of filled/empty cells; the blinker reads as a 3-cell bar; scrubbing flips it
  vertical→horizontal→vertical; layout is clean, on-vocabulary, no overflow. Looking is the
  contract, not optional.

## Rubber Duck Pass + close

Narrate the scene over the `game_of_life` record; six-category observation; four-state
disposition; BLACKBOARD `## Built` + `## Sprint tail`; KIT_DIARY entry. Then the duplex-pipe
review per the standing discipline.
