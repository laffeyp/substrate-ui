---
sprint: 014
slug: assay-view
status: done
pass_kind: web-frontend
cadence: plan-mode-per-sprint
context_files:
  - web/app.js
  - web/index.html
  - harness/capture_console.js
  - process/BLACKBOARD.md
---

# Sprint 014 — the arm-matrix VIEW (frontend, the visual half of the assay)

## Why

Sprint 013 added the data seam (`/api/assays`, `/api/assay/<name>`). This renders it: a new rail group
ASSAYS beside RUN RECORDS, and a center **arm matrix** view at the above-a-run altitude. The review's
hard-won invariants become DISPLAY RULES the surface can't violate.

## Scope

`web/index.html` — CSS for `.assay` (rail item), `.am` (the matrix), the margin-verdict colors, the
provenance header, the note; an `#assaypane` div beside `#readpane`/`#iopane`. `web/app.js` —
`loadAssays()` (prepend the ASSAYS group to the rail), `selectAssay(name)` (fetch `/api/assay/<name>`,
cache, render), `renderAssayFrom(report, meta)`; `render()` toggles assay mode (show `#assaypane`, hide
the run-only cursor / health / health-verdict — they're run-scoped, meaningless here). No backend change.

## Invariants (display rules, not conventions)

- BOTH currencies always rendered: reliable (pass^k) AND per-trial (pass@1) + a flake column
  (per-trial − reliable). A bare single number is structurally unrenderable — the metric-splice can't recur.
- `margin-verdict` colored by class (inferior=red, equivalent=green, superior=blue, inconclusive=amber),
  shown WITH the CI; the note states "significantly worse (CI excludes 0) ≠ inferior (CI clears −margin)".
- Provenance pinned: fingerprint, control model vs ensemble, margin, trials, control-ran.
- null → "—" (a salvage/unmeasured delta never reads as 0). Control arm marked "the bar".

## Dual contract

**Artifact:** `node --check web/app.js` exits 0; eight-word grep clean; existing `npm run e2e` stays
green. **Signal:** none.

## Observation contract (both tracks)

- **Structural (`e2e_console.js` extension / DOM):** the ASSAYS rail group lists `coding_cells`;
  clicking it shows `.am` with 4 `.arm-row`s; the `full` row carries a reliable cell `48/71`, a
  per-trial `0.861`, a flake `+0.185`, and a `.v-inconclusive` margin-verdict.
- **Perceptual (`harness/capture_assay.js` → Read the PNG):** drive real Chrome against the real
  backend, select `coding_cells`, screenshot the matrix; the agent Reads it — the two currencies legible,
  the verdict colored, provenance pinned, on-vocabulary, clean. AND the server is left UP so the human
  opens `http://127.0.0.1:8765/` and sees it too.

## Close

Rubber Duck Pass; BLACKBOARD `## Built` + `## Sprint tail`.
