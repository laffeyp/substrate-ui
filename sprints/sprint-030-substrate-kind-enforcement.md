# Sprint 030 — substrate_kind foreign key enforcement

```yaml
---
id: 030
status: closed
phase: 4
pass_kind: implementation
---
```

## scope

Promote `payload_types: { kind: substrate_kind }` on EVENT_INSPECTED and PRODUCER_INSPECTED from documentary to runtime-enforced. The v0.2 vocabulary already names the foreign key; today the emitter accepts any string. This sprint wires the substrate vocab into the loader, exposes a closed set to the emitter, and throws when a `kind` field carries a value not in the set. Closes the retyped-literal drift class the F3 mapping review named at its enforceable end.

## context_files

- `signals/versions/0.2.json` (§ external_vocabulary_ref, § payload_types on EVENT_INSPECTED + PRODUCER_INSPECTED)
- `web/instrumentation/vocabulary.ts` (loader)
- `web/instrumentation/sdd.ts` (emit-time validation)
- `web/app.ts` (`inspectProducer` — the current "unknown" fallback breaks the check; the fallback must drop instead of emit)
- `../substrate/process/signals/0.2.json` (the external vocabulary)

## artifact contract → Files created/modified

- `substrate-ui/web/instrumentation/vocabulary.ts` — imports substrate's `signals/0.2.json` at build time; exports `SUBSTRATE_KINDS: Set<string>` (populated from substrate's `tags[].name`) alongside VOCABULARY + VOCAB_VERSION.
- `substrate-ui/web/instrumentation/sdd.ts` — after the required-field check, walks each spec.payload_types entry; when the entry names `substrate_kind`, validates the emit payload's value against SUBSTRATE_KINDS and throws on drift.
- `substrate-ui/web/app.ts` — `inspectProducer` drops the "unknown" fallback; when the graph doesn't carry the instance, the emit is skipped rather than lying with a bogus kind. Same treatment for any real edge case surfaced in testing.
- `substrate-ui/tsconfig.json` — extends `include` (or a resolver alias) so Vite can bundle the JSON from `../substrate/process/signals/0.2.json`.
- `substrate-ui/sprints/sprint-030-substrate-kind-enforcement.md` — this file.

## signal contract → Emits

No new tags. Every existing EVENT_INSPECTED and PRODUCER_INSPECTED emit continues to fire; the values under `kind` now come from a real closed set. The fixture regenerates and grades unchanged.

## observation contract

- Harness continues to click one `.ev` and one `.lane` per Sprint 023's flow; both emit sites now pass their `kind` through the closed-set gate.
- Failure mode covered: if `inspectProducer` runs before the graph populates STATE.graph.instances (a lane click racing the record load), the emit is dropped; no spurious "unknown" reaches the fixture.
- Grader change: the `checkInspectorPayloads` non-empty-string check tightens implicitly — an emit that would have carried "unknown" no longer fires, so the check now measures real coverage rather than fallback padding.

## dual-contract close

Four gates: parity, build, e2e, grader. All expected green.

## rubber duck pass

*Sequence narration:* the vocabulary loader now reads two files: `signals/versions/0.2.json` (the UI vocab) and `signals/mirror/substrate-0.2.json` (66 KB mirror of substrate's runtime vocab, sha256 pinned at 9c1c97f7... in `signals/mirror/README.md`). SUBSTRATE_KINDS holds the 12 `substrate.*` runtime tags; SUBSTRATE_PRODUCER_KINDS is empty in the current substrate ontology (falls through the empty-domain branch). The emitter walks each spec's `payload_types` after the required-field check; for values in the `substrate.*` namespace it enforces closed-set membership, for others (application kinds like CodeChunk, ToolCall, Critique) it accepts any non-empty string. `inspectProducer`'s "unknown" fallback drops instead of emits when the lane click races the graph mutation. Bundle grew from 55 KB to 87 KB — the mirrored substrate vocab is 66 KB and bundles in.

*Observations:* missing pair — none; order — none disturbed (no vocabulary changes); vocabulary gap — none; payload anomaly — the initial e2e run FAILED on the CodeChunk inspection because the naive check enforced closed-set membership across ALL values, not just the substrate.* namespace. Root cause: `substrate_kind` names an OPEN set from the UI's perspective — runtime kinds plus every application kind declared by a bundled topology, and substrate's vocab only enumerates the 12 runtime kinds. Fix: split enforcement by namespace — `substrate.*` values must be in the closed set (catches typos like "substrate.RunStartedd"); other-namespace values need only be non-empty strings. Grader caught the fault immediately; the fix took two lines; tone trace — payloads structural.

*Adversarial pass — what does the split miss?* Application-namespace typos (e.g., `CodeChunck` for `CodeChunk`) still slip through — the UI has no closed set for application kinds to check against. Substrate's ontology could enumerate them per topology in a future v0.3; then SUBSTRATE_KINDS would widen and the split would catch more. The current cut catches the substrate-namespace class of drift (retyped runtime kinds) at the emit boundary; it doesn't try to solve the topology-declared-kind class. Noted; the split is the sharpest tool the current mirror supports. Zero halted, zero surfaced.

## follow-on

Wait for the workflow-parity hold to lift (substrate-side, per `docs/cockpit/WORKFLOW-PARITY-PLAN-2026-07-31.md`) — or pick up the two remaining Wave-2 candidates in `process/ROADMAP-2026-08-16.md § 2`: fold `capture_scene.js` assertions into `e2e_console.js`, and an optional signal-capture tail on the standing e2e harnesses behind an env flag.

