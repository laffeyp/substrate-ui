# Sprint 007 — Studio authoring for model-backed Producers (model + prompt + responder)

```yaml
---
id: 007
status: closed
phase: 1
pass_kind: functional
---
```

*Expose the sprint-006 model-Producer seam in the Studio: a `model` checkbox + a `prompt` field per Producer, and a responder selector (deterministic | ollama) for the build. The form assembles `producer.model`/`producer.prompt` + `spec.responder` — exactly what `build_from_spec`/`_responder_for` accept. Front-end only: `web/studio.html` + `web/studio.js`. Both observation tracks (structural E2E + perceptual capture-and-view).*

---

## scope

`web/studio.html`: add a `model` checkbox + a `prompt` input to the Producer row, and a responder `<select>` (deterministic (CI) | ollama (real LLM)) near the build action with a one-line hint. `web/studio.js`: `buildSpec()` includes `model` + `prompt` per Producer and `responder` at the top level (default `deterministic`). Validate/build (sprints 003/006) carry these through unchanged — a model Producer built with the deterministic responder runs reproducibly; ollama is the real-LLM path. Console dark-theme, eight words, no new deps.

---

## prerequisites

- Sprint 003 (the Studio form + buildSpec) + Sprint 006 (the model-Producer backend seam). Closed 2026-06-17.

---

## context_files

- `../sdd-kit-2/AGENTS.md`
- `WORKING_AGREEMENT.md` (TWO-track observation contract — both required)
- `web/studio.html`, `web/studio.js` (the Producer row template + `buildSpec()` to extend)
- `builder.py` (the spec fields the form must emit: `producer.model` bool, `producer.prompt` str; `spec.responder` "deterministic"|"ollama", `spec.model_name`)
- `server.py` (`_responder_for` — the responder values; `/api/build`)

---

## signal contract

### Emits
No NEW substrate vocabulary. The form now also assembles `producer.model`/`prompt` + `spec.responder`; a built model Producer emits its kind carrying the real Responder's output (sprint 006).

### Invariants
- The emitted spec is EXACTLY what `build_from_spec`/`_responder_for` accept (model/prompt on producers; responder/model_name at top level).
- Front-end only; eight-word tone canon (grep clean — a model-backed Producer is still a Producer, never "agent").

---

## artifact contract

### Files modified
- `web/studio.html` (model checkbox + prompt input in the Producer row; the responder selector)
- `web/studio.js` (buildSpec: producer.model + .prompt + spec.responder)

### Content assertions
- `web/studio.js` `buildSpec()` includes `model` (bool) + `prompt` (str) per Producer and `responder` at the top level.
- `web/studio.html` Producer row has a `model` checkbox + a `prompt` input; a responder `<select>` exists.
- `node --check web/studio.js` passes.

### Command exit codes
- `cd ../substrate && uv run python -m pytest ../substrate-ui/test_server.py -q` returns 0 (backend unchanged; 22 pass).

---

## observation contract (BOTH tracks — REQUIRED, front-end change)

### Track 1 — structural (E2E)
- Extend `e2e_studio.js`: mark the `judge` Producer `model` + give it a prompt, leave responder = deterministic, build → finalised; follow the deep-link → the built run's `Verdict` payload carries the responder's output (not `judge`), i.e. a model-backed run that executed. Keep prior assertions green.

### Track 2 — perceptual (capture + VIEW)
- Extend `capture_studio.js`: a frame showing a Producer with `model` checked + a prompt filled + the responder selector; the agent READS the PNG and grades: the model controls are clear and legible, the responder selector is obvious, on-vocabulary, no overflow.

### Expected screenshot / visual state
- The Producer row shows a `model` checkbox + a `prompt` field; a responder selector (deterministic / ollama) sits by the build action; coherent with the existing form.

---

## done criteria

The Studio authors model-backed Producers (model + prompt) and selects the responder, carried through the real build seam to a genuine model-backed run; both observation tracks pass (E2E incl. a model run that executed; the model controls captured AND viewed); prior surfaces don't regress. After close: send the drag-canvas + model-Producer batch to the duplex-pipe reviewer (per the Architect's request).

---

## notes

Keep the deterministic responder the default in the selector (CI-honest, no network); ollama is opt-in (real LLM, loud failure if absent). The prompt field can stay visible always (builder ignores it for non-model Producers). After this sprint the E2 "full parity" Studio is functionally complete: visual + structured authoring of Producers (stub or model) / Views / Triggers / Routes / composed Termination → real validate + build. Then the review.
