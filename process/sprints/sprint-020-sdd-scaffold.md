# Sprint 010 — SDD scaffold: emitter, parity gate, grader

```yaml
---
id: 010
status: closed
phase: 2
pass_kind: architecture
---
```

## scope
Port the SDD instrumentation surface from Katybird (adapted for substrate-ui) and wire the first two emit calls at the natural boot points. This is the founding infrastructure the remaining sprints stand on.

## artifacts
- `substrate-ui/web/instrumentation/vocabulary.ts` — loads `signals/versions/0.1.json` at module load, builds typed dict.
- `substrate-ui/web/instrumentation/sdd.ts` — `emit(name, payload)` throws on unknown tag or missing required field; buffer exposed at `window.__signals` for the Playwright harness.
- `substrate-ui/tools/check-vocabulary-parity.ts` — greps `web/` + `harness/` for emit call sites; validates lock structure; exit 0/1/2.
- `substrate-ui/tools/capture-grade.ts` — reads a JSONL capture; asserts contains-in-order + declared pairing invariants; exit 0/1/2.
- `substrate-ui/captures/` — directory for per-sprint JSONL captures (initially empty).
- `substrate-ui/web/app.ts` — imports `emit` + `VOCAB_VERSION`; fires `SESSION_INIT` at boot and `RECORDS_LOADED` after `/api/records` returns.

## dual-contract outcome
`npx tsx tools/check-vocabulary-parity.ts` → OK (44 tags, code emits 2 distinct tags, all locked). `npm run build` → green. `npm run e2e` → green (parent regression clean). Two live emits: SESSION_INIT and RECORDS_LOADED.

## rubber duck pass
*Observations:* two resolved-here — (a) my first draft of the RECORDS_LOADED emit redeclared `const runs`/`const demos` that already existed later in `loadRecords()`; esbuild failed the build; fixed by inlining the counts into the emit payload without new locals. (b) tag_count mismatch caught by parity gate on first run (see Sprint 009 pass). *Adversarial pass:* could this close green while `emit` silently no-ops? No — the harness will assert `window.__signals.length > 0` post-boot in Sprint 019; and the parity gate would still catch drift regardless. Could `emit` throw on load and break the page? Yes if a required-field bug ships. That's exactly what the emitter is supposed to do (fail-fast on drift). Zero halted.

## follow-on
Subsystem emits land in sprints 011–018 per the arc plan below.
