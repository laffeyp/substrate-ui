# WORKING_AGREEMENT.md — substrate-ui

*Project-specific overrides and additions on top of `../sdd-kit-2/AGENTS.md`. The Agent reads AGENTS.md first (the methodology) then this file (the project specifics). This file augments; it never overrides AGENTS.md hard rules. When the two conflict, AGENTS.md wins.*

*Instantiated 2026-06-17 as the artifact-discipline retrofit ruled by review #39. The UI was built and independently reviewed across rounds #30–#38; this file gives that work its working agreement going forward. Increments from the Studio onward get a real sprint card with a declared dual + observation contract BEFORE code.*

---

## Project identity

- **Project name:** substrate-ui
- **Project type:** read/control console over the Substrate runtime — a small Python HTTP backend + a vanilla-JS frontend
- **Primary language(s):** Python 3.12+ (stdlib `http.server`), JavaScript (browser, no build step)
- **Relationship to substrate:** substrate-ui is a SEPARATE CONSUMER of substrate, depending on it only as an installed library through the public `substrate.api` read seam (product F-API-6). It is its own git repo for exactly this reason: the boundary is honest, and substrate's published v1.0 history stays clean. The UI imports `from substrate import api` (+ `substrate.topologies.bundled` and the reference topologies for demo enumeration) and NOTHING from the kernel internals.
- **Adopted SDD kit version:** `sdd-kit-2` (read-only canon at `../sdd-kit-2/`)

---

## Project class

**Web / frontend** + **Backend** (per `../sdd-kit-2/TECHNIQUES.md` Section 2). Notable class techniques in play:
- Web: component-tree-aligned view vocabulary (the console's panels mirror the runtime's read projections); browser-as-runtime requires out-of-process verification (→ the live Playwright E2E).
- Backend: the read seam is the contract; behavior-touching changes carry an observation contract (a real record driven through a real server, asserted in the DOM).

The UI EMITS no signals of its own — it is a reader/projector of substrate's locked v0.2 vocabulary. So there is **no `signals/*.json` here** (a second vocabulary would be ceremony). The vocabulary discipline that DOES bind is the eight-word tone canon below.

---

## Project scope (verbatim from BLACKBOARD ## Decisions)

> substrate-ui is the read + thin-control console over the Substrate runtime. It reads run records and live runs through `substrate.api` ONLY (no kernel imports), and presents: the record rail, the run-as-graph (firing-anchored Producer-instance lifespans + spawn-cohort bands), the event stream, the provenance inspector, the health verdict, record diff (first-divergence by seq), the I/O pane, and thin control (launch a bundled topology; resume a paused run; the Studio: author a Topology and build-and-launch it for real). Single-operator, dozens-of-Producers scale. Control is LAUNCH + RESUME-only (no mid-run mutation). The runtime is the source of truth; the UI is a lens, never a controller of run semantics.

---

## Canonical home registry

*Per AGENTS.md hard rule 7. Name which file owns which surface; consult before authoring.*

| Surface / type | Canonical home | Notes |
|---|---|---|
| HTTP routing + read projections over `substrate.api` (`_records_index`, `_io`, `_PROJECTIONS`, the `/api/records*` GETs) | `server.py` | Sole backend. Reads only `substrate.api`. |
| Thin control endpoints (`/api/launch`, `/api/resume`, `/api/validate`, `/api/build`) | `server.py` | Backgrounded daemon threads tracked in `_LAUNCHES`; launch/resume/build run real `api.Runtime`. |
| Authored spec → real `topology(b)` translator (`build_from_spec`, `SpecError`) | `builder.py` | The Studio's build-and-launch seam. Mints a frozen msgspec Struct per kind; wires Views/Predicates/Triggers/Routes/TerminationPolicy. |
| The console front-end (state, rendering, polling, the run-as-graph, verdict logic) | `web/app.js` | Vanilla JS, no framework. |
| DOM scaffold + styles | `web/index.html` | No CDN deps. |
| Shared demo topologies (`resumable_topology`, `approval_event`) | `demo_topologies.py` | Mirrors the runtime's pause/resume reference. |
| Demo fixture generation (the `demo_*` records) | `gen_demo_records.py` | Reproducible; regenerate the fixture set. |
| Server tests (real server, real api over HTTP) | `test_server.py` | The artifact contract for backend changes. |
| Live end-to-end test (real Chrome, real backend) | `e2e_console.js` | The observation contract for behavior-touching changes. |

---

## Dependency policy

*No additions without surfacing per AGENTS.md.*

- **Backend:** Python standard library (`http.server`, `asyncio`, `threading`, `json`, `uuid`, `traceback`) + `msgspec` + `substrate` (installed library, via `substrate.api`, `substrate.topologies.bundled`, and the reference topologies). NO web framework, NO ASGI server, NO ORM.
- **Frontend:** vanilla JavaScript. NO build step, NO bundler, NO npm runtime deps, NO CDN `<script>`s. (Playwright is a dev-only test dependency, not shipped.)

---

## Tone canon — the eight-word vocabulary contract (load-bearing)

substrate-ui presents substrate's domain, so it MUST speak substrate's language:

- **The eight words and nothing else for the primitives:** Producer, Bus, View, Predicate, Trigger, Route, TerminationPolicy, Topology.
- **No anthropomorphism:** never "agent", "actor", "speaker", "worker" for a Producer.
- **No marketing reframes:** never "workflow", "step", "task", "pipeline-stage" for the runtime concepts.
- **Sequence numbers where identification happens:** "at seq 14", never "around the third trigger".
- **No emoji** in committed files (kit tone canon).
- This binds UI labels, code identifiers, API field names, AND docs — not just prose.

**Standing check (run before any UI close):**

```bash
grep -rEn 'agent|workflow|orchestrat|\bactor\b|\bspeaker\b' server.py builder.py web/*.js \
  | grep -viE 'launch_|//|demo_topolog'   # expect: zero hits in primitive-naming positions
```

(Review #39 verified this grep clean at baseline. Keep it clean.)

---

## Build and verification commands

*The Architect runs these; the Agent reports exit codes, does not silently retry.*

- **Backend tests:** `cd ../substrate && uv run pytest ../substrate-ui/test_server.py -q` — expected exit 0 (spins a real server on an ephemeral port; exercises the real `substrate.api` over HTTP).
- **Live E2E (the observation contract — REQUIRED for any front-end / behavior-touching change):** `npm install` once in `substrate-ui/` (repo-local Playwright devDependency, pinned by `package-lock.json`; drives the system Chrome via `channel:'chrome'`, no browser download), start the real backend (`cd ../substrate && uv run python ../substrate-ui/server.py &`), then `cd substrate-ui && npm run e2e` — expected exit 0 (real Chrome; §7 asserted in the DOM). Do NOT skip this with a "backend-only" rationalization for a behavior-touching change — running it is the contract.
- **Regenerate demo fixtures:** `cd ../substrate && uv run python ../substrate-ui/gen_demo_records.py` (rebuilds the `demo_*` records the tests + E2E read).
- **Lint:** `cd ../substrate && uv run ruff check ../substrate-ui/server.py ../substrate-ui/builder.py` — expected exit 0.

---

## Observation contract environment

The "observation" surface is the running console driven against a real backend reading real records. Behavior-touching changes (any projection, the run-as-graph, launch/resume/build, the verdict) declare an observation contract whose driving steps run the live console in `e2e_console.js` and whose assertions are: expected DOM state after the steps, expected verdict class, expected lane/cohort counts, expected record appearing after a launch/build. A confirmed-good record is the regression fixture (technique 38).

---

## Custom techniques (inherited from the parent project)

The Substrate project's CT-1..CT-5 (parallel teams, originals-over-summaries, worktree isolation, best-of-N, conformance-as-spine) apply here when relevant. The load-bearing one for this UI: **independent review via the duplex-pipe reviewer** (`../REVIEW_RUNBOOK.md`) at every natural review point — this is the UI's standing dual-contract grader, held #30–#38 and #39.

---

## Sprint cadence policy

- **From the Studio increment forward:** each increment gets a real sprint card under `sprints/` with a declared dual + observation contract BEFORE code (the fix review #39 ruled). Cadence is auto-within-phase (build → test → live E2E → pipe review → fold), surfacing to BLACKBOARD on a halt or a review finding.
- **Rounds #30–#38 are NOT retrofitted into sprint cards** (review #39: archaeology); their record is the review envelopes (`../.review-pipe/resp-03*.txt`) + the pointer in BLACKBOARD ## Built.

---

*WORKING_AGREEMENT.md for substrate-ui. A separate consumer of substrate through `substrate.api` only. No own vocabulary (it reads substrate's v0.2); the eight-word tone canon binds instead. Web + backend class. Reviewed via the duplex-pipe reviewer. Instantiated as the review-#39 retrofit.*
