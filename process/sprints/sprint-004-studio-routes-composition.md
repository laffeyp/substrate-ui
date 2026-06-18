# Sprint 004 — Studio: Routes + any_of/all_of termination composition authoring

```yaml
---
id: 004
status: closed
phase: 1
pass_kind: functional
---
```

*Studio depth toward the E2 "full parity" ruling: expose the two authoring primitives the form-first MVP (sprint 003) left out but `builder.py` already translates — Routes (stage an event into a future Producer's input slot) and nested TerminationPolicy composition (`any_of` / `all_of` over member policies). One concept (two more authoring sections) in one file (`web/studio.js`) + its markup (`web/studio.html`). No backend change — `build_from_spec` already accepts `routes[]` and recursive `any_of`/`all_of` members.*

---

## scope

Extend the Studio with (1) a ROUTES section: add-row authoring of Routes (id, of = event kind, slot = target input slot) → emitted into `spec.routes[]`; and (2) a composable TERMINATION section: when the kind is `any_of`/`all_of`, author the member policies (each a `{kind, …params}` row: all_completed / quiescence_with_watchdog(seconds) / threshold_count(of,n) / cancel_all_others) → emitted into `spec.termination.members[]`. The assembled spec stays EXACTLY what `builder.py` accepts. Validate + build paths (sprint 003) unchanged; they now carry routes + composed termination through the real seam.

---

## prerequisites

- Sprint 003 (the Studio author→validate→build loop). Closed 2026-06-17.

---

## context_files

- `../sdd-kit-2/AGENTS.md`
- `WORKING_AGREEMENT.md` (TWO-track observation contract — both required)
- `builder.py` (the EXACT shapes: `routes[]` = {id, of, slot} → `b.route(id, Subscription(kinds={of}), slot=slot, transform=…)`; termination recursion: `any_of`/`all_of` with `members[]`, each a `{kind,…}` the same `_termination` builder accepts)
- `web/studio.html`, `web/studio.js` (the existing authoring sections + buildSpec/buildTermination to extend)
- `test_server.py` (`/api/validate` + `/api/build` shapes; a routes/composition spec round-trips)

---

## signal contract

### Emits
No NEW substrate vocabulary. Routes (a Route stages an event into a future Producer's input slot) + composed TerminationPolicies are authored and carried through the real seam.

### Invariants
- The emitted spec is EXACTLY `build_from_spec`-accepted (routes[{id,of,slot}]; termination any_of/all_of with members[]). A divergent client spec is the failure mode.
- Front-end only; reads `substrate.api`; eight-word tone canon (grep clean — "Route", "TerminationPolicy", never "step/stage-name as a verb").

---

## artifact contract

### Files modified
- `web/studio.html` (a ROUTES section + the composable-termination member area)
- `web/studio.js` (route rows → `spec.routes`; `buildTermination()` extended for any_of/all_of members)

### Content assertions
- `web/studio.js` `buildSpec()` includes `routes: [{id, of, slot}]` from the routes rows.
- `web/studio.js` `buildTermination()` returns `{kind: "any_of"|"all_of", members: [{kind,…}, …]}` from the authored member rows when the kind is composite.
- `node --check web/studio.js` passes.

### Command exit codes
- `cd ../substrate && uv run python -m pytest ../substrate-ui/test_server.py -q` returns 0 (backend unchanged).

---

## observation contract (BOTH tracks — REQUIRED, front-end change)

### Track 1 — structural (E2E)
- Extend `e2e_studio.js`: author a topology WITH a Route (e.g. a producer that emits `Suggestion`, a Route of=Suggestion→slot=suggestions, a trigger that starts a consumer) AND a composed `all_of(all_completed, quiescence_with_watchdog)` termination; validate → valid; build → finalised; confirm the built record exists (the Route + composed policy carried through the real builder without error). Keep the existing sprint-003 assertions green.

### Track 2 — perceptual (capture + VIEW)
- Extend `capture_studio.js` with a frame showing the Routes section filled + the composed-termination members; the agent READS the PNG and grades: the new sections are legible, clearly distinct, on-vocabulary, no overflow/overlap with the existing form.

### Expected screenshot / visual state
- The Studio shows a ROUTES section (id / of / slot rows) and, when termination kind is any_of/all_of, an authored list of member policies — both in the console dark-theme, visually coherent with the producers/views/triggers sections.

---

## done criteria

The Studio authors Routes and composed (any_of/all_of) TerminationPolicies, both carried through the real validate/build seam to a genuine run; both observation tracks pass (E2E incl. a real build with a Route + composed termination; the new sections captured AND viewed); sprint-003 surfaces don't regress.

---

## notes

`builder.py` already supports both — this is purely the authoring UI catching up to the translator, so the risk is spec-shape drift (mirror builder.py exactly), not new backend behavior. After this, the remaining "full parity" gap is the drag-canvas presentation (cosmetic over the same spec) + real-model Producers (lifts the deterministic-stub emit-once ceiling). The deterministic stub still applies: a Route whose `of` kind is never emitted just stages nothing — honest, not an error.
