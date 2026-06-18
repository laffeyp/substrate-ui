# Sprint 006 — model-backed Producer seam (real Responder, deterministic-testable)

```yaml
---
id: 006
status: closed
phase: 1
pass_kind: functional
---
```

*Lift the deterministic-stub emit-once ceiling: an authored Producer can be MODEL-BACKED — its body calls the runtime's own `Responder.respond(prompt)` and emits its kind carrying the response. Tested end-to-end with the runtime's `DeterministicResponder` (CI mode — pure, seeded, no network), with `OllamaResponder` as the real-LLM path selected at build. This is the runtime's actual pattern (the reference topologies are written against `Responder`, the mode chosen by which Responder the run is handed) — not a fake. Backend only: `builder.py` + `server.py`. The Studio authoring UI for it is sprint 007.*

---

## scope

`builder.py`: a Producer spec with `model: true` (+ optional `prompt`) builds a real Producer whose body calls `responder.respond(prompt)` and emits each declared kind with `note=<the response>` (vs the stub's `note=kind`). `build_from_spec(spec, responder=None)` defaults `responder` to the runtime's `DeterministicResponder(seed=spec.get("seed", 0))` so model Producers compute reproducibly with no network. `server.py`: `/api/build` reads `spec.responder` (`"deterministic"` default | `"ollama"` → `OllamaResponder(model=spec.get("model_name","llama3.2"))`) and passes the constructed Responder to `build_from_spec`; `/api/validate` is unaffected (static build never calls the responder). Honest: with `responder:"ollama"` and no Ollama running, the model Producer FAILS loudly (ProducerFailed) — not a silent fake.

---

## prerequisites

- Sprint 001 (the build/validate seam + `builder.py`). Closed 2026-06-17.

---

## context_files

- `../sdd-kit-2/AGENTS.md`
- `WORKING_AGREEMENT.md` (dependency boundary — `substrate.api` + the reference responders, which are public in `substrate.reference`)
- `builder.py` (the translator — `build_from_spec`, `make_stub`; mint a model-producer variant)
- `server.py` (`_build`/`_validate` — pass the responder; the build response shape)
- `../substrate/src/substrate/reference/_models.py` (`DeterministicResponder(seed,menu).respond(prompt)->str`; `OllamaResponder(model,…)`)
- `test_server.py` (where the model-Producer build test lands)

---

## signal contract

### Emits
No NEW substrate vocabulary. A model Producer emits its declared application kind, carrying the Responder's output in the payload (`note`). The runtime lifecycle (RunStarted…RunFinalised, ProducerFailed if the responder raises) is unchanged.

### Invariants
- The model Producer calls the runtime's REAL `Responder` (DeterministicResponder / OllamaResponder) — no fabricated model output; truth over fake.
- `DeterministicResponder` is pure + seeded → the same model topology replays byte-identically (D-8 holds; the emit is deterministic).
- `responder:"ollama"` with no Ollama → ProducerFailed (loud), never a silent stub.
- The UI imports the responders from `substrate.reference` (public); no kernel internals.

### Invariants (tone)
- Eight words: a model-backed Producer is still a Producer; never "agent". (grep clean.)

---

## artifact contract

### Files modified
- `builder.py` (the model-producer variant + `build_from_spec(spec, responder=None)`)
- `server.py` (construct + pass the responder in `_build`)

### Content assertions
- `builder.py` `build_from_spec` accepts a `responder` param and builds a model-backed Producer when `producer.model` is truthy; defaults to `DeterministicResponder`.
- `server.py` `_build` constructs `DeterministicResponder` (default) or `OllamaResponder` from `spec.responder` and passes it.
- `test_server.py` adds `test_build_model_producer_runs_the_responder`: a spec with a model Producer (model:true, prompt) built with the default DeterministicResponder → the emitted event's `note` equals `DeterministicResponder(seed=0).respond(prompt)` (proves the real responder ran, deterministically).

### Command exit codes
- `cd ../substrate && uv run python -m pytest ../substrate-ui/test_server.py -q` returns 0 (now 22 tests).
- `cd ../substrate && uv run ruff check ../substrate-ui/builder.py ../substrate-ui/server.py` returns 0.

---

## observation contract

`pass_kind: functional` — backend behavior change. The observation surface is the RECORD the model topology produces (the run's events), asserted in `test_server.py` over real HTTP against the real `api.Runtime`. (No front-end this sprint — the Studio model-authoring UI + its two-track front-end observation is sprint 007.)

### Expected runtime signals (in the built model-topology record)
- `substrate.RunStarted` … the model Producer's `ProducerStarted` → its emitted kind with `note` = the DeterministicResponder output for the prompt → `ProducerCompleted` … `substrate.RunFinalised`. Status `finalised`.

---

## done criteria

An authored Producer can be model-backed via the runtime's real `Responder`; built with `DeterministicResponder` it computes reproducibly (the emitted payload carries the responder's deterministic output), and `OllamaResponder` is selectable for a real LLM (loud failure if absent); `test_server.py` proves the responder actually ran; ruff + the suite green.

---

## notes

This is the runtime-faithful "real model Producer": the seam is `Responder`, the mode is which Responder the run is handed — exactly the reference-topology pattern. DeterministicResponder keeps CI honest (it "does NOT pretend to reason"; trivial output no one mistakes for a model). The async Producer calls the sync `respond()` directly (mirrors the reference topologies; OllamaResponder blocks on httpx — acceptable for the demo, the 120s timeout bounds it). Sprint 007 exposes `model` + `prompt` + the responder selector in the Studio with the two-track front-end observation contract.
