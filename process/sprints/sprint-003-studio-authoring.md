# Sprint 003 — Studio authoring surface (form-first, real build & launch)

```yaml
---
id: 003
status: closed
phase: 1
pass_kind: functional
---
```

*The Studio's visual authoring surface (the E2 ruling: author a Topology and build-and-launch it for real). First increment: form-first authoring — structured rows for Producers / Views / Triggers / TerminationPolicy — that live-validates via `/api/validate` and builds a REAL run via `/api/build` (the seam sprint 001 tested), then links to the console to view the resulting record. A separate page (`web/studio.html` + `web/studio.js`), served by the existing static handler — NO backend change. Routes + any_of/all_of composition + a drag-canvas are LATER sprints; this lands the core authoring loop. Two files, one concept (structured authoring → real build).*

---

## scope

Author `web/studio.html` + `web/studio.js`: a Studio page (served at `/studio.html`) where the operator adds Producers (kind, emits, initial?), Views (name, kind, of), Triggers (id, on, predicate view/op/n, starts, policy), and a TerminationPolicy (kind + params), assembling the authored-spec JSON the `build_from_spec` translator accepts. A "validate" action POSTs `/api/validate` and shows valid / the typed error inline; a "build & launch" action POSTs `/api/build`, shows the resulting record name + status (+ any `unfired_triggers` warning), and links to the console (`/?record=<name>`) to view the real run. Vanilla JS, console dark-theme style, eight-word vocabulary, no build step.

---

## prerequisites

- Sprint 001 (the `/api/validate` + `/api/build` seam, tested). Closed 2026-06-17.
- Sprint 002 (the console it links back to). Closed 2026-06-17.

---

## context_files

- `../sdd-kit-2/AGENTS.md`
- `WORKING_AGREEMENT.md` (TWO-track observation contract — both required; canonical home: web/ owns the front-end; the UI reads `substrate.api` only)
- `builder.py` (the EXACT authored-spec shape the form must emit: producers[{kind,emits,initial,deterministic}], views[{name,kind,of}], triggers[{id,on,predicate{view,op,n},starts,policy}], routes[{id,of,slot}], termination{kind,members?,of?,n?,seconds?})
- `server.py` (`_validate`/`_build` — the endpoints; `/api/build` returns {name,status,built,unfired_triggers?})
- `test_server.py` (`_AUTHORED` fixture — a known-good spec to mirror; `test_build_runs_an_authored_topology`)
- `web/index.html`, `web/app.js` (the console style + the `?record=` deep-link target to add)

---

## signal contract

### Emits
No NEW substrate vocabulary. The Studio ASSEMBLES an authored spec and the runtime emits the real lifecycle (RunStarted … RunFinalised) when `/api/build` runs it. The form labels Producers/Views/Triggers/Predicates/TerminationPolicy — the eight words.

### Invariants
- Front-end only: reads `substrate.api` via `/api/validate` + `/api/build`; NO new backend, no kernel import.
- The spec the form emits validates through the REAL `TopologyBuilder.build()` (no client-side fake validation that could diverge from the runtime's "allowable ways").
- Eight-word tone canon (standing grep clean). No "agent/workflow/node/step".

---

## artifact contract

### Files created
- `web/studio.html`
- `web/studio.js`

### Files modified
- `web/app.js` (honor a `?record=<name>` query param on load → auto-select that record, so the Studio's "view in console" deep-link lands on the built run)

### Content assertions
- `web/studio.html` served at `/studio.html` (the static handler covers it — no server change); contains add-Producer / add-View / add-Trigger / Termination controls + validate + build buttons.
- `web/studio.js` POSTs `/api/validate` and `/api/build` with the assembled spec; renders the typed validity/error and the build result (name, status, unfired_triggers).
- `web/app.js` reads `location.search` for `record` and selects it on load when present.
- `node --check web/studio.js` and `node --check web/app.js` pass.

### Command exit codes
- `cd ../substrate && uv run python -m pytest ../substrate-ui/test_server.py -q` returns 0 (backend unchanged; 21 pass).

---

## observation contract (BOTH tracks — REQUIRED, front-end change)

### Track 1 — structural (E2E)
- A new `e2e_studio.js` (or a block in `e2e_console.js`) drives `/studio.html` in real Chrome: add 2 reviewer Producers (initial) + a judge, a KindCount View, an adjudicate Trigger (quorum ≥2 → judge), an any_of termination; click validate → asserts "valid"; click build → asserts a `build_*` record name + finalised status returns; follow the console deep-link → asserts the built record's events include the triggered `Verdict`-equivalent (proof the authored run executed). Plus a negative: an unknown-`starts` Trigger → validate shows the clean typed error.

### Track 2 — perceptual (capture + VIEW)
- `capture_console.js` (or a `capture_studio.js`) captures key Studio frames: the empty authoring surface, a filled spec, the validate-OK state, the build-result state. The agent READS each PNG and grades: the form is legible, the controls are clear, validity/error/build-result render cleanly, on-vocabulary, no overflow/overlap. Looking is the contract.

### Expected screenshot / visual state
- The Studio shows labelled Producer/View/Trigger/Termination authoring sections in the console dark-theme; the validate state shows a clear green "valid" or a red typed error; the build result shows the record name + status + (if any) an unfired-Trigger warning, with a working link to the console.

---

## done criteria

The Studio authors a Topology from structured form input, live-validates it through the real `TopologyBuilder`, builds-and-launches a REAL run via `/api/build`, and links to the console to view that run; both observation tracks pass (E2E incl. a real authored build that executes; Studio frames captured AND viewed); the backend and existing console surfaces do not regress.

---

## notes

This is the form-first MVP of the E2 "full parity" Studio — it lands the core author→validate→build→view loop on the tested seam. Deliberately deferred to later sprints (keep this one ≤2 files / one concept): Routes + any_of/all_of nested composition authoring; a drag-canvas (Producers as cards, Triggers as drawn edges); real-model Producers (the deterministic stub's emit-once ceiling, surfaced via `unfired_triggers`, still applies — show that warning honestly). Mirror the spec shape in `builder.py` EXACTLY; a divergent client spec is the failure mode.
