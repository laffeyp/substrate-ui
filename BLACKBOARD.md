# BLACKBOARD.md — substrate-ui

*Single writer per section. Discipline, not code-enforced. See `../sdd-kit-2/AGENTS.md` § The BLACKBOARD protocol. The Architect reads `## Surfaced for review`; the Agent surfaces what matters there plus plain-English summaries in chat.*

*Instantiated 2026-06-17 as the artifact-discipline retrofit ruled by review #39. Rounds #30–#38 predate this board; their audit trail is the review envelopes (`../.review-pipe/resp-03*.txt`) + the 5 "UI BUILD" entries currently in `../substrate/BLACKBOARD.md ## Built` (pointed-to below, to be physically relocated at the next substrate housekeeping pass).*

---

## Surfaced for review

*Agent + Architect. Halts, partials, comprehension affirmations, Rubber Duck observations marked `surfaced`.*

- **2026-06-17 Claude Code (Opus 4.8, 1M)** — COMPREHENSION_AFFIRMATION (recorded as substrate-ui comes under formal kit discipline). This project is **substrate-ui**, the read + thin-control console over the **Substrate** runtime. It is a SEPARATE CONSUMER of substrate, reaching it ONLY through the public `substrate.api` read seam (F-API-6) — a small stdlib-`http.server` + msgspec backend (`server.py`) serving a vanilla-JS console (`web/`), plus the Studio build seam (`builder.py`: an authored JSON Topology spec → a real `TopologyBuilder` topology → a genuine recorded run). **What SDD is at root, for this project:** the lossy human-description step is replaced by reading the runtime's own typed record directly — the UI does not narrate what a run "did", it projects the actual sequenced events (`read_record`, `run_graph`, `narrate`, `explain_producer`, `first_divergence`, `view_at`) the runtime already emitted. The UI emits NO signals of its own, so it locks no vocabulary; the contract that binds it is the eight-word tone canon (Producer, Bus, View, Predicate, Trigger, Route, TerminationPolicy, Topology — no anthropomorphism, no marketing reframes), verified clean by a standing grep. **The kit loop here:** from the Studio increment forward, each increment gets a sprint card with a declared dual + observation contract BEFORE code; build → `test_server.py` (real server/real api over HTTP) → live `e2e_console.js` (real Chrome) → independent review via the duplex-pipe reviewer → fold. **The hard rule binding me:** halt-and-articulate, and never present looks-done-but-inert as done — review #39 caught exactly that (a live Studio seam with zero tests because no card forced its artifact contract); the retrofit closes it.

- **2026-06-17 Claude Code — REVIEW #39 DISPOSITION (whole-arc sanity check; verdict: IT IS REAL).** The independent reviewer ran both gates + the disk-vs-api cross-check + a real Studio build and confirmed: the runtime does what it claims (282 passed, mypy clean, conformance 15/0/1/1, ruff clean on the uncommitted tree); the UI reads the REAL runtime (identical events disk vs `/api/records`); the Studio seam genuinely executes an authored topology (an authored Trigger fired a real View predicate → a real emitted event). Nothing lost, no regression, no ghosts. The ONE big finding was D — substrate-ui under no version control + no artifact discipline — ruled a real breach requiring a LIGHT, ORDERED retrofit. Folding now (see ## Built). Lower findings: write the two Studio translator tests (the live-but-untested seam); `builder.py` stub emit-once honesty edge (a count predicate above the producer count finalises green having fired nothing) — disclose/surface; relocate the 5 leaked UI entries out of substrate's BLACKBOARD (low urgency).

---

## Decisions

*Architect-only, append-only. The Agent never writes here. (Seeded 2026-06-17 from rulings the Architect already made in-session; the Architect edits/extends as canonical.)*

- **2026-06-17 — Project scope.** substrate-ui is the read + thin-control console over the Substrate runtime, reading run records and live runs through `substrate.api` ONLY (no kernel imports). Surfaces: record rail, run-as-graph (firing-anchored Producer-instance lifespans + spawn-cohort bands), event stream, provenance inspector, health verdict, record diff (first-divergence by seq), I/O pane, and thin control (launch a bundled Topology; resume a paused run; the Studio: author a Topology and build-and-launch it for real). The runtime is the source of truth; the UI is a lens, never a controller of run semantics.

- **2026-06-17 — Git home.** substrate-ui is its OWN git repo (not a subdir of substrate), because it consumes substrate only as an installed library through `substrate.api` (F-API-6); this keeps the boundary honest and substrate's published v1.0 history clean. (Architect ruling, review #39.)

- **2026-06-17 — The five product calls (ruled in-session, "derisk the eventual build").** **Q-A2 (tool-use):** GENERIC — the UI does not special-case any tool/model; a Producer is a Producer. **Q-C1 (control surface):** LAUNCH + RESUME-ONLY — no mid-run mutation of run semantics from the UI. **Q-C2 (operators):** SINGLE-OPERATOR. **Q-D1 (scale):** DOZENS of Producers per run (not thousands). **Q-E2 (Studio):** NEAR-TERM FULL PARITY — a visual TopologyBuilder (Producers/Triggers/Views/Predicates/TerminationPolicy + Routes + any_of/all_of composition + REAL build-and-launch to a Runtime).

---

## Built

*Agent appends one entry per sprint/increment close. Append-only.*

- **POINTER — rounds #30–#38 (UI build-out, 2026-06-15..16).** The observe+control console was built and folded across these rounds BEFORE this board existed. Their record:
  - Review envelopes: `../.review-pipe/resp-030.txt` … `resp-038.txt` (each finding folded + re-verified).
  - The 5 "UI BUILD step N" entries currently in `../substrate/BLACKBOARD.md ## Built` (a category leak into substrate's board; to be physically relocated here at the next substrate housekeeping pass — review #39 finding 4, low urgency).
  - Net shipped #30–#38: record rail + run-as-graph + event stream + provenance + health verdict + diff + I/O pane (#30–#34); thin control — launch (#35), live-attach + torn-record handling (#36–#37), resume + the "interrupted" status + the NOT-CLEAN-flicker fix (#38). All under `test_server.py` (18) + `e2e_console.js` (live).

- **2026-06-17 — Artifact-discipline retrofit (review #39 fold).** Gave substrate-ui its own git repo (`git init -b main`, `.gitignore` for generated `runs/*.record` + bytecode, baseline commit `cbdd22e` capturing the #30–#38 green tree). Instantiated the three core kit artifacts: this `BLACKBOARD.md`, `WORKING_AGREEMENT.md` (class web+backend; canonical home registry; `substrate.api`-only dependency boundary; the eight-word tone canon + its standing grep), `KIT_DIARY.md`. No own `signals/` vocabulary (the UI reads substrate's v0.2; a second lock would be ceremony — review #39 ruling). Dual contract: artifact (the files exist + parse) + signal (vacuous — content sprint). Closes review #39 finding D.

---

## Deferred

*Anyone may append. Re-visit conditions noted.*

- **2026-06-17 — Relocate the 5 UI ## Built entries out of `../substrate/BLACKBOARD.md` into this board.** Low urgency (the pointer above suffices now); do it at the next substrate housekeeping pass so substrate's published board carries no UI-build noise. (Review #39 finding 4.)

---

## Open questions

*Anyone may append.*

- None outstanding.

---

## Drift watchlist

*Agent maintains. Patterns to monitor across increments.*

- **Eight-word tone canon** — run the standing grep (WORKING_AGREEMENT § Tone canon) before any close. Clean at baseline (review #39); a Studio UI with many authored labels is the most likely place anthropomorphism/marketing-reframe drift would creep in.
- **`substrate.api`-only boundary** — the backend must never import substrate kernel internals. If a Studio feature tempts a kernel import, that is a finding (build the projection on the public surface instead, the established pattern).

---

## Sprint tail

*Agent maintains. Last 10 increment closes; older roll into ## Built as compressed paragraphs.*

### Retrofit (2026-06-17, closed) — review #39 fold
- **Scope:** git home + the 3 core artifacts for substrate-ui. No code behavior change.
- **Dual contract:** artifact pass (repo initialized, baseline `cbdd22e`, three artifacts authored + parse); signal vacuous (content sprint).
- **Rubber Duck Pass:** vacuous (no runtime trace this increment). Closed clean.
- **Next:** the Studio increment proper — FIRST a sprint card with declared dual + observation contract, THEN finish the two translator tests (the live-but-untested seam, review #39 finding 2), THEN the visual canvas.

---

*BLACKBOARD.md for substrate-ui. Instantiated as the review-#39 retrofit. Rounds #30–#38 pointed-to, not re-derived. From the Studio increment forward: a sprint card with a declared dual+observation contract before code.*
