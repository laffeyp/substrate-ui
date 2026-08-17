# WORKING_AGREEMENT.md — substrate-ui

*Project-specific overrides and additions on top of `../sdd-kit-2/AGENTS.md`. The Agent reads AGENTS.md first (the methodology) then this file (the project specifics). This file augments; it never overrides AGENTS.md hard rules. When the two conflict, AGENTS.md wins.*

*Instantiated 2026-06-17 as the artifact-discipline retrofit ruled by review #39. The UI was built and independently reviewed across rounds #30–#38; this file gives that work its working agreement going forward. Increments from the Studio onward get a real sprint card with a declared dual + observation contract BEFORE code.*

---

## Project identity

- **Project name:** substrate-ui
- **Project type:** read/control console over the Substrate runtime — a small Python HTTP backend + a vanilla-JS frontend
- **Primary language(s):** Python 3.12+ (stdlib `http.server`); TypeScript 5 (browser, built by Vite 5 into `web/dist/` — Sprint 018 landed the conversion on 2026-08-14).
- **Relationship to substrate:** substrate-ui is a SEPARATE CONSUMER of substrate, depending on it only as an installed library through the public `substrate.api` read seam (product F-API-6). It is its own git repo for exactly this reason: the boundary is honest, and substrate's published v1.0 history stays clean. The UI imports `from substrate import api` (+ `substrate.topologies.bundled` and the reference topologies for demo enumeration) and NOTHING from the kernel internals.
- **Adopted SDD kit version:** `sdd-kit-2` (read-only canon at `../sdd-kit-2/`)

---

## Project class

**Web / frontend** + **Backend** (per `../sdd-kit-2/TECHNIQUES.md` Section 2). Notable class techniques in play:
- Web: component-tree-aligned view vocabulary (the console's panels mirror the runtime's read projections); browser-as-runtime requires out-of-process verification (→ the live Playwright E2E).
- Backend: the read seam is the contract; behavior-touching changes carry an observation contract (a real record driven through a real server, asserted in the DOM).

*Revised 2026-08-17.* Substrate-ui emits its own locked vocabulary at `signals/versions/current.json` — a symlink pinned to the current version (v0.3 as of Sprint 032, 53 tags across 12 categories including `studio`). Both `web/app.ts` (console) and `web/studio.ts` (studio authoring surface) are instrumented under the same vocabulary. Every `emit()` call site validates at the speaker's mouth via `web/instrumentation/sdd.ts`; unknown tags throw; missing required payload fields throw; foreign-key fields typed against `substrate_kind` enforce namespace-split closed-set membership (Sprint 030). The parity gate `tools/check-vocabulary-parity.ts` is the standing CI check — greps every `emit("TAG", ...)` call and confirms it exists in the lock, exit 1 on drift. Previous framing ("reader/projector, no signals/*.json here") was written before the SDD instrumentation arc (Sprints 018–032). The eight-word tone canon below still binds — it governs user-facing strings; the vocabulary above governs typed events.

---

## Project scope (verbatim from BLACKBOARD ## Decisions)

> substrate-ui is the read + thin-control console over the Substrate runtime. It reads run records and live runs through `substrate.api` ONLY (no kernel imports), and presents: the record rail, the run-as-graph (firing-anchored Producer-instance lifespans + spawn-cohort bands), the event stream, the provenance inspector, the health verdict, record diff (first-divergence by seq), the I/O pane, and thin control (launch a bundled topology; resume a paused run; the Studio: author a Topology and build-and-launch it for real). Single-operator, dozens-of-Producers scale. Control is LAUNCH + RESUME-only (no mid-run mutation). The runtime is the source of truth; the UI is a lens, never a controller of run semantics.

---

## Canonical home registry

*Per AGENTS.md hard rule 7. Name which file owns which surface; consult before authoring.*

| Surface / type | Canonical home | Notes |
|---|---|---|
| HTTP routing + read projections over `substrate.api` (`_records_index`, `_io`, `_PROJECTIONS`, the `/api/records*` GETs) | `server.py` | Sole backend. Reads only `substrate.api`. |
| Thin control endpoints (`/api/launch`, `/api/resume`, `/api/validate`, `/api/build`) + the responder selector (`_responder_for`) | `server.py` | Backgrounded daemon threads tracked in `_LAUNCHES`; launch/resume/build run real `api.Runtime`; `_responder_for` picks DeterministicResponder (default) / OllamaResponder. |
| Authored spec → real `topology(b)` translator (`build_from_spec`, `SpecError`) | `builder.py` | The Studio's build seam. Mints a frozen msgspec Struct per kind; wires Views/Predicates/Triggers/Routes/TerminationPolicy. Producers are deterministic stubs OR model-backed (call the runtime's real `Responder`). |
| The console front-end (state, rendering, polling, the run-as-graph + topology-structure view, verdict logic) | `web/app.js` | Vanilla JS, no framework. |
| Console DOM scaffold + styles | `web/index.html` | No CDN deps. |
| The Studio authoring front-end (form + drag-canvas; `buildSpec`, `renderCanvas`, validate/build) | `web/studio.js` | Assembles the authored spec EXACTLY per `builder.py`; the canvas is a view of `buildSpec()`. |
| Studio DOM scaffold + styles | `web/studio.html` | Served at `/studio.html` by the static handler. |
| Shared demo topologies (`resumable_topology`, `approval_event`) | `demo_topologies.py` | Mirrors the runtime's pause/resume reference. |
| Demo fixture generation (the `demo_*` records) | `gen_demo_records.py` | Reproducible; regenerate the fixture set. |
| Server tests (real server, real api over HTTP) | `tests/test_server.py` | The artifact contract for backend changes. (Moved from repo root into `tests/` in the folder reorg, d824aed; registry path corrected 2026-07-31, review F-29.) |
| Live structural E2E — console / Studio (real Chrome) | `e2e_console.js` / `e2e_studio.js` | Track 1 of the observation contract (DOM assertions). |
| Perceptual capture harness — console / dynamic states / Studio | `capture_console.js` / `capture_states.js` / `capture_studio.js` | Track 2 of the observation contract (screenshots the agent VIEWS). |
| Substrate-ui's own locked signal vocabulary | `signals/versions/0.1.json` (44 tags, 11 categories) + `signals/versions/0.1-rationale.md` | The contract every `emit(...)` call site in `web/`+`harness/` validates against. Sprint 019 landing; ratification pending per BLACKBOARD ## Surfaced for review 2026-08-15. |
| Substrate runtime's vocabulary — the external SDK bridge substrate-ui reads at runtime | `../substrate/process/signals/0.2.json` (substrate's v0.2 kinds: RunStarted, TriggerFired, ProducerStarted, ProducerCompleted, ProducerFailed, ProducerCancelled, RunFinalised, TerminationMatched, InputBuildFailed, PredicateQuarantined, ProducerEmittedInvalidEvent, + application-domain kinds authored by bundled topologies) | Bridge mapping per TECHNIQUES.md #46. Consumed at read time via `substrate.api` — the `kind` strings surface in `EVENT_INSPECTED.kind`, in the run-graph, in the stream. Substrate-ui does NOT redeclare substrate's kinds; it references them by string identity. Any Wave-2 typed-kind proposal (ENTITY_MERGE_PROPOSED or a closed-set import) resolves against this file, not a copy. (Retrofit for review `REVIEW-2026-08-15-vocab-mapping-to-substrate.md § F4`.) |

---

## Dependency policy

*No additions without surfacing per AGENTS.md.*

- **Backend:** Python standard library (`http.server`, `asyncio`, `threading`, `json`, `uuid`, `traceback`) + `msgspec` + `substrate` (installed library, via `substrate.api`, `substrate.topologies.bundled`, and the reference topologies). NO web framework, NO ASGI server, NO ORM.
- **Frontend:** TypeScript compiled by Vite. Dev dependencies pinned in `package.json`: typescript@^5, vite@^5, @types/node@^22, tsx@^4, playwright@^1.49. NO runtime CDN `<script>`s; no framework (no React/Vue/Svelte); no bundled runtime library at import — `web/dist/*.js` is the only shipped JavaScript. Sprint 018 replaced the earlier "no build step, vanilla JS" posture on 2026-08-14 (`sprints/sprint-018-typescript-conversion.md`).

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

- **Backend tests:** `cd ../substrate && uv run pytest ../substrate-ui/tests/test_server.py -q` — expected exit 0 (spins a real server on an ephemeral port; exercises the real `substrate.api` over HTTP). (Path corrected 2026-07-31, review F-29: the file lives in `tests/`, not the repo root — the old command could not run.)
- **Live E2E (the observation contract — REQUIRED for any front-end / behavior-touching change):** `npm install` once in `substrate-ui/` (repo-local Playwright devDependency, pinned by `package-lock.json`; drives the system Chrome via `channel:'chrome'`, no browser download), start the real backend (`cd ../substrate && uv run python ../substrate-ui/server.py &`), then `cd substrate-ui && npm run e2e` — expected exit 0 (real Chrome; §7 asserted in the DOM). The full structural gate is THREE commands, all run in CI: `npm run e2e` (console), `npm run e2e:studio` (Studio), `npm run e2e:assay` (the assay matrix — both currencies, the metric-splice guard; wired into the gate 2026-07-31, review F-28). Do NOT skip these with a "backend-only" rationalization for a behavior-touching change — running them is the contract.
- **Perceptual capture (the second observation-contract track — REQUIRED for front-end changes):** start the real backend, then `cd substrate-ui && npm run capture` — writes key-frame screenshots to `screenshots/`; the agent then Reads each PNG and grades it. Looking is the contract, not optional.
- **Regenerate demo fixtures:** `cd ../substrate && uv run python ../substrate-ui/gen_demo_records.py` (rebuilds the `demo_*` records the tests + E2E read).
- **Lint:** `cd ../substrate && uv run ruff check ../substrate-ui/server.py ../substrate-ui/builder.py` — expected exit 0.
- **Signal-contract gate:** `cd substrate-ui && npm run signals` — expected exit 0. Runs the vocabulary-parity check (every `emit(...)` call site in `web/` + `harness/` is a locked tag; every locked tag's payload contract is enforced at the speaker's mouth), captures `window.__signals` through `harness/capture_signals.js`, and grades the fixture at `captures/sprint-021/console.jsonl` against every invariant in `signals/versions/0.1.json` (contains-in-order, pairing exactly-one + matching-key, staleness-drop, chat-window turn count, payload-content). Standing gate from Wave-1 close (2026-08-15, Sprint 029). Vocabulary changes require an Architect-ratified version bump (see `signals/versions/0.1-rationale.md § Open proposals for v0.2`); the arc never edits `signals/versions/0.1.json` unilaterally.

---

## Observation contract environment — TWO-TRACK visual grading (REQUIRED, both tracks)

Per AGENTS.md hard rule 9, foundation 01 signal type #2 ("Screenshots at Key Frames"), and TECHNIQUES Visual/UI "Two-track visual grading": a behavior-touching change to this console (any projection, the run-as-graph, launch/resume/build, the verdict, the inspector, the I/O pane) is NOT done until BOTH tracks pass. This is non-negotiable; "the DOM assertions pass" is only half.

- **Track 1 — STRUCTURAL (mechanical):** `e2e_console.js` (`npm run e2e`) drives the live console in real Chrome against the real backend and asserts the DOM: verdict class, lane/cohort counts, expected substrings, that stale content CLEARS on record switch, that a launched record appears. Catches "is the right thing wired".
- **Track 2 — PERCEPTUAL (vision-model judge = the agent):** `capture_console.js` (`npm run capture`) drives the same console and saves a screenshot at each key frame to `screenshots/` (gitignored). The agent then **Reads each PNG and grades what it actually looks like** — layout renders, the graph bars/cohort bands are positioned right, verdict COLORS are correct (red FAILED, cyan PAUSED, red NOT-CLEAN, green FINALISED), no overlap/overflow/stale-pane, the copy is on-vocabulary. Catches "does it actually LOOK right" — the half that text-equality cannot cover. (Review #39-followups: this track, skipped for #30–#38, found a real stale-inspector bug the DOM E2E missed.)

A confirmed-good record is the regression fixture (technique 38). When the perceptual pass finds a defect, add a structural assertion that pins it (so it can't silently recur) AND keep the perceptual pass (text assertions cannot fully replace looking).

---

## Custom techniques (inherited from the parent project)

The Substrate project's CT-1..CT-5 (parallel teams, originals-over-summaries, worktree isolation, best-of-N, conformance-as-spine) apply here when relevant. The load-bearing one for this UI: **independent review via the duplex-pipe reviewer** (`../REVIEW_RUNBOOK.md`) at every natural review point — this is the UI's standing dual-contract grader, held #30–#38 and #39.

---

## Sprint cadence policy

- **From the Studio increment forward:** each increment gets a real sprint card under `sprints/` with a declared dual + observation contract BEFORE code (the fix review #39 ruled). Cadence is auto-within-phase (build → test → live E2E → pipe review → fold), surfacing to BLACKBOARD on a halt or a review finding.
- **Rounds #30–#38 are NOT retrofitted into sprint cards** (review #39: archaeology); their record is the review envelopes (`../.review-pipe/resp-03*.txt`) + the pointer in BLACKBOARD ## Built.

---

*WORKING_AGREEMENT.md for substrate-ui. A separate consumer of substrate through `substrate.api` only. Own locked vocabulary at `signals/versions/current.json` (v0.3 as of Sprint 032, 53 tags including the studio category); substrate's runtime vocabulary is referenced as a foreign-key bridge (see § Canonical home registry) not redeclared. The eight-word tone canon binds user-facing strings; the vocabulary binds typed events. Web + backend class. Reviewed via the duplex-pipe reviewer. Instantiated as the review-#39 retrofit; SDD-instrumented through Sprints 018–032.*
