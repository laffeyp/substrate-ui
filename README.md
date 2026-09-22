# substrate-ui

A console for watching, steering, and authoring runs on the **Substrate** runtime. Pick a run from
the rail and watch its graph and event stream unfold; launch or resume a run; or author a new
topology and build it for real. substrate-ui is a lens — it reads the runtime through its public
surfaces only, never kernel internals, and never changes what a run means.

## Quickstart

The console runs against **substrate's** venv — it imports `substrate` as a library and has no venv of
its own. From the parent directory that holds both repos:

```bash
cd substrate && uv run python ../substrate-ui/server.py    # backend on :8765
open http://127.0.0.1:8765/                                # the console
```

No build step, no framework, no CDN. It opens on the bundled demo records immediately — pick one from
the rail and the graph + stream light up. **Running it** below has the fuller notes (tests, fixtures).

**Deployment boundary (read before changing the bind address):** `POST /api/agent` spawns a live
tool-using agent with the UNGATED tool suite — real `bash`, `edit_file`, `write_file` on the host,
at any workspace path the request names. That autonomy is the product posture (approval gating is
opt-in, never the default). The entire barrier in front of it is the `127.0.0.1` default bind plus a
same-origin check on POSTs and a concurrency cap. That is adequate for a single-user localhost
cockpit and for nothing else: anyone who can reach the port can direct a shell-capable agent at the
host. Do not bind beyond loopback (`SUBSTRATE_UI_HOST`) without putting real authentication in front.

---

## What it does

Three capabilities, all on the real runtime:

- **Observe** — a record rail; the **run-as-graph** (firing-anchored Producer-instance lifespans +
  spawn-cohort bands) and the **static topology-structure** view (the authored Producers / Triggers /
  Views / Routes / TerminationPolicy); the event stream; a provenance inspector; the health verdict
  (green FINALISED, red FAILED / NOT-CLEAN, cyan PAUSED, amber INCOMPLETE, green ● LIVE); record diff
  (first-divergence by seq, D-8); an I/O pane (seed / baseline / artifacts). One seq-cursor drives the
  graph + stream in lock-step.
- **Control** — launch a bundled topology; resume a paused run; live-attach (follow a run as it's
  written). Launch + resume only — the UI never mutates run semantics.
- **Author (the Studio, `/studio.html`)** — structured-form **and** drag-canvas authoring of Producers
  (deterministic stub *or* model-backed), Views, Triggers/Predicates, Routes, and composed
  (`any_of`/`all_of`) TerminationPolicies → live validation through the real `TopologyBuilder` → build &
  launch a genuine recorded run → deep-link back into the console to observe it.

---

## Architecture

A thin, dependency-light stack — the runtime is the source of truth; the UI is a lens.

| File | Owns |
|---|---|
| `server.py` | stdlib `http.server` + msgspec backend. HTTP routing + read projections over `substrate.api` (records index, run_graph, topology_graph, summary, io, diff, explain). Thin control (`/api/launch`, `/api/resume`) + the Studio seam (`/api/validate`, `/api/build`). Imports only substrate's public surfaces — no kernel internals. |
| `builder.py` | The authoring translator: an authored JSON spec → a real `topology(b)` function. Mints a frozen msgspec Struct per event kind; Producers are deterministic stubs or **model-backed** (call the runtime's real `Responder.respond(prompt)`). |
| `web/index.html` + `web/app.js` | The console (vanilla JS, no build step): rail, run-as-graph + topology-structure, stream, inspector, verdict, diff, I/O, launch/resume, live-follow. |
| `web/studio.html` + `web/studio.js` | The Studio: form + drag-canvas authoring → validate/build. |
| `demo_topologies.py` / `gen_demo_records.py` | Shared demo topologies + reproducible `demo_*` fixture records. |

**Repository layout.** The backend Python (`server.py`, `builder.py`, the demo generators) sits at
the root; the rest is grouped: `web/` (frontend), `harness/` (the Playwright e2e + capture scripts,
driven by the `npm run` scripts), `tests/` (`test_server.py`), and `process/` (the SDD audit trail —
`BLACKBOARD.md`, `KIT_DIARY.md`, `WORKING_AGREEMENT.md`, `sprints/`).

No web framework, no ORM, no frontend bundler, no CDN. Backend deps: Python stdlib + `msgspec` +
`substrate` (installed library). The UI is its **own git repo** because it consumes substrate only as a
library, through its **public** surfaces — `substrate.api`, the public `substrate.reference` Responders,
`substrate.topologies` — never kernel internals. That boundary is enforced by `tests/test_server.py`'s
import-boundary test, not just by convention.

---

## Running it

The Quickstart above starts the backend and console; the Studio is at `/studio.html`.

### Tests + the two-track observation contract

Behavior-touching changes are graded on **both** tracks (this is mandatory — see process/WORKING_AGREEMENT.md):

```bash
# Track 0 — server (real server on an ephemeral port, real substrate.api over HTTP)
cd substrate && uv run python -m pytest ../substrate-ui/tests/test_server.py -q   # 30 tests

# Playwright is a repo-local devDependency (run once)
cd substrate-ui && npm install

# Track 1 — STRUCTURAL (DOM assertions in real Chrome) — three harnesses, all gated in CI
cd substrate-ui && npm run e2e            # the observe+control console
cd substrate-ui && npm run e2e:studio     # the Studio author -> validate -> build -> view
cd substrate-ui && npm run e2e:assay      # the assay matrix (both currencies; the metric-splice guard)

# Track 2 — PERCEPTUAL (screenshots a vision-model judge then VIEWS)
cd substrate-ui && npm run capture         # console key frames -> screenshots/
cd substrate-ui && npm run capture:states  # dynamic/edge states (live, torn, resume)
cd substrate-ui && npm run capture:studio  # the Studio frames

# regenerate the demo fixtures the tests + E2E read
cd substrate && uv run python ../substrate-ui/gen_demo_records.py
```

`screenshots/` and `node_modules/` are gitignored; `package-lock.json` is committed so the harness is
reproducible. **Looking at the screenshots is part of the contract, not optional** — DOM-passing is
necessary, not sufficient, for a visual surface.

---

## How it was built (the SDD audit trail)

This UI is the worked record of sdd-kit-2 applied to a real build. The substance held throughout, but
the discipline's ceremony — sprint cards, the git ledger — arrived mid-build, not at the start: the
early console (#30–#38) was built test-first and observation-tracked *before* that ledger was in
place, a gap an external review (#39) caught and retrofitted. The history lives in the project's own
artifacts — read them in this order:

- **`process/BLACKBOARD.md`** — `## Decisions` (scope + binding rulings), `## Built` (one entry per increment),
  `## Sprint tail` (the Rubber Duck pass per close), `## Surfaced for review` (the discipline failures
  the Architect caught + their fixes), `## Drift watchlist`.
- **`process/sprints/`** — `sprint-001` … `sprint-007`, each a dual + observation contract declared **before**
  the code.
- **`process/KIT_DIARY.md`** — what the kit did well, what got in the way, the next-kit-version findings + the
  hypotheses (the lessons, including the two the Architect had to catch).
- **`../.review-pipe/resp-0NN.txt`** — the independent duplex-pipe reviews (#30–#42); the reviewer
  verifies by running, not by trusting the builder's "green".

The arc, briefly:

- **#30–#38** — the observe+control console (built before this repo existed; pointed-to in `## Built`).
- **#39** — a whole-arc sanity check ruled it REAL but flagged the missing artifact discipline → the
  retrofit (own git repo + the three core artifacts + sprint-card discipline). It had already cost a
  live, untested seam.
- **001** — the Studio build seam under test + made honest.
- **002** — the static topology-structure view (closed a design-§6 read gap the verification surfaced).
- Two discipline failures the Architect caught, both folded into the kit's lessons: the **observation
  contract skipped** ("backend-only" rationalization → repo-scoped harness), and the **perceptual track
  skipped for the whole UI** (DOM-only → built `harness/capture_*.js`, looked, and it found a real stale-inspector
  bug a green DOM E2E never could).
- **003–007** — the Studio to full parity: form-first authoring → Routes + `any_of`/`all_of` composition
  → drag-canvas → model-backed Producers (seam) → model authoring (UI).
- **#42** — independent review of the canvas + model Producers: REAL and HONEST (the model seam genuinely
  calls the runtime's own `Responder`; Ollama fails loud; the canvas is a faithful projection). Two
  findings folded (honest Route→slot edges; responder seed/model inputs).

---

## Where we are

**Observe, control, and author** all work end-to-end on the real runtime: both observation tracks
green and the frames viewed, independently reviewed (#42: REAL and HONEST). The SDD discipline —
cards, Rubber Duck passes, two-track observation, the eight-word vocabulary — held throughout.

Known, recorded follow-ups (none blocking; see `process/BLACKBOARD.md ## Drift watchlist`): `runs/` has no
lifecycle management (launched/built records accumulate); the `unfired_triggers` signal will need
hardening once real-model Producers with custom input_builders land; canvas-based *creation* (drop
nodes / draw edges to author) is deferred — the canvas is a view, the form is the editor.
