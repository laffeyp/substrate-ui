# REVIEW — how the substrate-ui vocabulary maps to substrate's (2026-08-15)

*Reviewer role. Target: `signals/versions/0.1.json` v0.1 (44 tags, drafted, not locked) + `signals/versions/0.1-rationale.md`, read against substrate's locked `substrate/process/signals/0.2.json` (12 tags, 38 entities, `locked_at: 2026-06-13`, `validator_extras: strict`), plus `sdd-kit-2/grammar/PRINCIPLES.md`, `TECHNIQUES.md`, `ADDENDUMS.md` A9 + A10. New dated file per no-in-place-edits.*

*Question posed by the Architect: does the current substrate-ui vocab actually map to substrate's grammar; is there a theoretically better shape; should there be a mirrored layer + a UI layer.*

---

## What the two vocabularies look like today

Substrate v0.2 (locked 2026-06-13):

- 12 tags, all `substrate.*` namespaced (`RunStarted`, `TriggerFired`, `InputBuildFailed`, `ProducerStarted`, `ProducerEmittedInvalidEvent`, `ProducerCompleted`, `ProducerFailed`, `ProducerCancelled`, `InjectionApplied`, `PredicateQuarantined`, `TerminationMatched`, `RunFinalised`).
- 14 categories (four base strata `event | ambient | summary | incident` plus `lifecycle`, `bus`, `producer`, `predicate-trigger`, `route`, `composition`, `record`, `encoding`, `replay-inspection`, `cli`).
- 38 Layer-0 entities including `Producer`, `ProducerId`, `ProducerRef`, `Event`, `Bus`, `View`, `Predicate`, `Trigger`, `Route`, `Topology`, `Run`, `RunRecord`, `Envelope`, `TerminationPolicy`, plus the record + replay + composition entities.
- `validator_extras: strict`.

Substrate-ui v0.1 (drafted 2026-08-14, `"locked": false`):

- 44 tags, none namespaced (`SESSION_INIT`, `RECORD_SELECTED`, `VIEW_SWITCHED`, `GRAPH_RENDERED`, `TERMINAL_OPENED`, `AGENT_LAUNCHED`, `TOPOLOGY_LAUNCH_REQUESTED`, etc.).
- 11 categories (`session`, `records`, `record`, `assay`, `view`, `stream`, `terminal`, `agent`, `topology`, `diff`, `incident`).
- 10 Layer-0 entities per the rationale doc (`Session`, `Record`, `Assay`, `View`, `Cursor`, `Terminal`, `Turn`, `AgentRun`, `Topology`, `Diff`).
- Rationale line 15: "The reader-UI ontology is not the runtime's."

The rationale's claim is the load-bearing one. Every finding below either verifies or falsifies that claim.

---

## Findings

### F1 — Four Layer-0 entities in substrate-ui are silently the same as substrate entities

Cross-check of the two Layer-0 lists:

| substrate-ui entity | substrate entity | Same referent? | Layer-10 status |
|---|---|---|---|
| Record | Run (+ RunRecord + Envelope stream) | Yes — a "record" in the UI IS the substrate Run's persisted RunRecord, exposed via `/api/records/<name>` | ENTITY_MERGE_PROPOSED never filed |
| Topology | Topology | Yes — same primitive, same namespace, same `substrate.topologies.bundled` registry | ENTITY_MERGE_PROPOSED never filed |
| AgentRun | Run (the specific case where the topology is a tool-loop) | Yes — an AgentRun IS a substrate Run with a specific topology shape | ENTITY_MERGE_PROPOSED never filed |
| Event (implicit via EVENT_INSPECTED payload) | Event (Envelope) | Yes — the "event" the user clicks in the stream IS the substrate Envelope with fields `seq`, `kind`, `payload`, etc. | ENTITY_MERGE_PROPOSED never filed |

`sdd-kit-2/grammar/PRINCIPLES.md` § "The supervised-grammar-evolution proposal taxonomy" names `ENTITY_MERGE_PROPOSED` for exactly this case: "when the same conceptual entity appears under different surface forms across documents ... Surfaced for explicit Architect reconciliation rather than silent collapsing." The current vocab silent-collapses four merges without surfacing.

### F2 — One Layer-0 entity name collides across the two vocabularies with different meanings

Substrate `View`: "A deterministic RAM-resident projection over the bus (accumulated buffer, count of kind K, events since seq N)." A runtime primitive; one of the eight words in the tone canon.

Substrate-ui `View`: "which projection is active" (a pane on the browser — run-as-graph, topology, scene, io).

Same word, two meanings, both live in the same conversation about the same product. `WORKING_AGREEMENT.md:69` names the eight-word tone canon binding this project ("The eight words and nothing else for the primitives: Producer, Bus, **View**, Predicate, Trigger, Route, TerminationPolicy, Topology"). Substrate-ui's own vocab uses `view` in the DIFFERENT sense across `VIEW_SWITCHED`, `view_payload_universal`, and the entity list. This is the tone-canon breach the WORKING_AGREEMENT was written to guard against; the vocab file introduces it.

### F3 — Substrate-ui tag payloads carry substrate kinds as unpinned `string`

`signals/versions/0.1.json:62`: `EVENT_INSPECTED{seq, kind, subject_record}`. `kind` type is `string`. The value is drawn from substrate's closed set of 12 `substrate.*` kinds (plus application kinds — but those too are declared by substrate).

`signals/versions/0.1.json:63`: `PRODUCER_INSPECTED{instance, kind, subject_record}`. Same shape — `kind` is a substrate producer kind.

Neither payload declares the type as `Literal["substrate.RunStarted", "substrate.TriggerFired", ...]` or as a foreign-key reference to substrate's `tags[].name`. Retyped-literal pattern the substrate arc has already hit (Sprint 143 CellSource, Sprint 176 bench_coding migration): a string field where a closed set belongs is the drift that mypy cannot see. Substrate's own `validator_extras: strict` posture is the one substrate-ui inherits by import if the mirror lands, so the tightening is available.

### F4 — Substrate's vocabulary is an external SDK surface substrate-ui depends on; no bridge mapping exists

`sdd-kit-2/TECHNIQUES.md` #46 external SDK bridge mapping: "The Architect reverse-engineers the SDK's actual public API surface and documents it in `WORKING_AGREEMENT.md` BEFORE any sprint authoring code that imports it. Workers given only spec prose consistently invent symbols that don't exist."

`WORKING_AGREEMENT.md:35-52` (Canonical home registry) lists substrate's CODE surfaces (`substrate.api`, `substrate.topologies.bundled`, `substrate.reference`) but does not list substrate's VOCABULARY surface (`substrate/process/signals/0.2.json`). Substrate-ui reads substrate events at runtime and displays them; those events carry `kind` fields from substrate's vocab. The vocab is part of substrate's public API by every practical measure; the bridge mapping is missing.

### F5 — The rationale's "reader-UI ontology is not the runtime's" reads counter to the invariants it declares

Rationale line 15: "The reader-UI ontology is not the runtime's."

Rationale line 27 (Layer 5 invariant): "AGENT_LAUNCHED must be followed by 1..N AGENT_TURN_STREAMED and terminated by exactly one FINAL_ANSWER_RENDERED or POLL_TIMEOUT with the same run_name." The `run_name` is a substrate Run's identity — substrate's ontology, cited by string.

Vocab notes[0] line 28: "It does NOT try to model the substrate runtime itself — that runtime has its own record + vocabulary; substrate-ui reads them."

Notes[2] line 30: "The subject invariant: exactly one record is the active subject at a time (STATE.name in current app.ts)."

The vocab reads substrate's records, references substrate's Run identity in payloads, and holds a subject-invariant over substrate Runs. It DOES model the runtime — as a foreign key. Naming that foreign relationship as "not the runtime's ontology" hides the coupling from a future reader.

### F6 — Addendum A9's carve-out applies to pure readers; substrate-ui is reader + controller

`sdd-kit-2/ADDENDUMS.md` A9: "A UI that only READS a locked vocabulary needs no `signals/` of its own — a second vocabulary would be ceremony. Its founding contract is the tone canon, not a vocabulary lock. (The kit's templates assume every project locks a vocabulary; the reader/projector case is the named exception. Tentative-confirmed, one project.)"

Substrate-ui's `web/app.ts` calls POST `/api/agent` (launches a substrate Run) and POST `/api/launch` / `/api/resume` (triggers substrate topology instantiation). Every launch produces a fresh substrate record — the UI CAUSES substrate events. That crosses the pure-reader line A9 names.

`KIT_DIARY.md:12` H2: "A UI that only READS a locked vocabulary needs no vocabulary of its own; the tone canon is the binding contract instead. tentative-confirmed. Review #39 ruled a second `signals/*.json` would be ceremony." The vocab-v0.1 draft reverses H2 without a diary entry. The reversal may be right (reader+controller ≠ pure reader), but the reasoning is not on the record.

### F7 — Substrate's Layer 6 says "operators are entities also"; substrate-ui's Layer 6 is declared empty

Substrate's `ontology.entities[]` marks several entities as `also_operator: true` — `Producer`, `View`, `Predicate`, `Trigger`, `TerminationPolicy`, plus `Runtime` and `Writer`. Substrate's Layer 6 (Runtime/Operator) is populated by the same entities.

Substrate-ui rationale line 29: "**Layer 6 — Runtime / Operator.** Not populated. Substrate-ui is a browser UI, not an operator chain. The kit's Layer 6 is optional per-project."

The browser UI does have operators in the Layer-6 sense: `POLL_TIMEOUT` implies a poll operator with a 500-ms cadence; `PLAY_STARTED` / `SPEED_CHANGED` imply a replay operator at STATE.speed frames/sec; `AGENT_TURN_STREAMED` implies a stream-accumulator operator observing new events. All three are runtime operators inside the browser. Layer 6 skipped leaves them unnamed.

The other Layer 6 substrate-ui touches — the one the user's question points at — is substrate itself. Substrate is the operator chain that produces the events the UI reads. A populated Layer 6 would declare: `SubstrateReader` (the fetch loop over `/api/records/<name>`), `SubstrateController` (the launch/resume/agent POST calls). Both are runtime operators bridging the browser to substrate.

---

## Candidate shapes

Four options, each cited to the SDD-canon that governs it.

### Option A — Two vocabulary files, one pinned to substrate

- `signals/versions/substrate-mirror-v0.2.json` — byte-identical snapshot of `substrate/process/signals/0.2.json`. Locked forever at its cited version. CI check: `sha256(substrate-mirror-v0.2.json) == sha256(substrate/process/signals/0.2.json)` when the substrate submodule/repo is present; otherwise the pin holds and drift is a substrate-side vocab bump the UI has not yet absorbed.
- `signals/versions/0.1-ui.json` — UI-only tags. Layer 0 declares `mirrors_from: substrate-mirror-v0.2` for the four ENTITY_MERGE entries (Record/Run, Topology, AgentRun, Event). Layer 1 tags reference substrate kinds as typed foreign keys in payloads (e.g., `EVENT_INSPECTED{seq: int, kind: SubstrateKind, subject_record: string}` where `SubstrateKind` is the closed set defined in the mirror).
- Version relationship: UI vocab bumps independently. Substrate vocab bump forces a UI review — is any referenced kind renamed/removed?
- Precedent: OpenTelemetry semantic conventions; CloudEvents standard fields + payload; protobuf `import`; GraphQL federation.
- SDD-canon: Commitment 1 (vocabulary is the contract), Commitment 6 (originals over summaries), Layer-10 taxonomy (ENTITY_MERGE_PROPOSED surfaces the merges), Technique #46 (bridge mapping).
- Cost: two files, one CI check, one review cadence per substrate vocab bump. Discipline mechanically checkable.

### Option B — Single file with `extends` and merged Layer 0

- `signals/versions/0.1.json` gets a header `"extends": "../../../substrate/process/signals/0.2.json"` (path or URL + sha256 pin). Loader reads both, validates the union.
- Layer 0 declares `Record IS substrate.Run` explicitly, marking the merge.
- Layer 1 UI tags live inline; substrate tags visible via the import.
- SDD-canon: Same as A, mechanized in one file.
- Cost: loader has to handle the import; one file to read. No independent version bump for the UI tags.

### Option C — Runtime-fetched mirror

- Substrate-ui's Python server reads `substrate.process.signals` at startup and exposes `/api/vocabulary`. Frontend fetches at boot. Emit-time parity gate runs against the fetched snapshot.
- SDD-canon: honors "originals over summaries" strongly (no stale copy on disk). Layer-9 versioning is dynamic — the UI always sees whatever substrate is running against.
- Cost: pin discipline weaker (no on-disk snapshot to review); harder to grep-check parity in CI without a running server.

### Option D — Layer 6 as the mirror, Layer 1 stays UI-only

- Keep the current v0.1 tags. Populate Layer 6 (currently empty) with: `SubstrateVocabulary v0.2` as the read-source; `SubstrateReader` / `SubstrateController` as the internal operators. Layer 6 declaration cites the substrate vocab file by path + sha256.
- Payload references (e.g., `EVENT_INSPECTED.kind`) tighten to `Literal[<from Layer 6 source>]`.
- ENTITY_MERGE_PROPOSED entries filed for Record ↔ Run, Topology ↔ Topology, etc. Merges surfaced but the UI Layer 0 keeps its own names.
- SDD-canon: uses Layer 6 for the runtime it maps into rather than declaring a new vocabulary tier.
- Cost: less structural than A/B, more structural than C. The reference chain (UI kind → Layer 6 source → substrate vocab file) is three hops.

### Option E — Retire the UI vocab; hold to A9

- Delete `signals/versions/0.1.json`. Restore WORKING_AGREEMENT.md:25 as authoritative. Grade behavior via DOM assertions + capture screenshots + tail of substrate records via `/api/records/<name>`. Tone canon is the binding contract.
- SDD-canon: literal reading of Addendum A9 (and KIT_DIARY H2).
- Cost: no closed-set grader for UI signals (whatever the UI would have emitted is not gradable at the emit boundary — Layer-2 discipline goes away). The reader+controller argument in F6 says A9 doesn't fully apply.

---

## Tradeoff notes

- **A9 vs the vocab's existence.** A9 says pure readers need no vocab. The UI is not a pure reader. But WORKING_AGREEMENT still asserts the pure-reader carve-out. Two documents contradict; the vocab v0.1 draft assumes the carve-out has fallen without a WORKING_AGREEMENT update.
- **Grep discipline.** A/B/C all give the parity gate at `tools/check-vocabulary-parity.ts` a real closed set for substrate kinds to check UI payloads against. Current v0.1 (`kind: string`) gives it nothing.
- **The eight-word tone canon.** Substrate `View` and substrate-ui `View` collision (F2) is a tone-canon breach whichever option lands. Renaming the UI's `View` to `Pane` (which the vocab already uses in `pane_id`) closes the collision without touching substrate.
- **The four merges.** ENTITY_MERGE_PROPOSED filings are cheap (a bullet in `signals/proposals.json` or the vocab notes[]). Filing them is due whether the shape stays as v0.1 or moves to A/B/C/D. The proposal type exists for exactly this case.

---

## Consistency checks that pass

- Substrate v0.2 is genuinely locked (`"locked": true`, `"locked_at": "2026-06-13"`). The mirror premise is anchor-able.
- Substrate v0.2 declares 38 entities including all four that substrate-ui silently re-declares. The overlap is not a naming coincidence; it's structural.
- Substrate v0.2's `validator_extras: strict` matches the substrate-ui vocab's stated posture (rationale § "Project-specific overrides": "Validator-extras posture: strict"). A mirror inherits the discipline.
- WORKING_AGREEMENT.md:14 already documents substrate as the dependency: "substrate-ui is a SEPARATE CONSUMER of substrate ... imports `from substrate import api`." The bridge is real; only its vocabulary half is un-declared.
- The rationale doc's Layer-5 invariants (RECORD_SELECTED → RECORD_LOADED; AGENT_LAUNCHED → FINAL_ANSWER_RENDERED/POLL_TIMEOUT) reference substrate Run identity via `run_name` — the coupling to substrate exists at the invariant level, not just the tag level.

---

## One-line summary

The current substrate-ui v0.1 vocab silently declares four Layer-0 entities that are the same as substrate's under different names (Record/Run, Topology, AgentRun, Event), collides on the word `View` against substrate's tone-canon primitive, carries substrate kinds as unpinned `string` in two inspector payloads, leaves Layer 6 empty when the UI has three internal runtime operators and one large external one (substrate itself), and asserts "the reader-UI ontology is not the runtime's" while running invariants over substrate Run identity — the theoretically-cleaner shape the SDD grammar names is a two-layer vocabulary with substrate's v0.2 mirrored as an imported closed set and the UI's v0.1 extending it, with the four merges filed as ENTITY_MERGE_PROPOSED and the `View` collision renamed to `Pane`.

---

*Reviewer: Claude, this session. Additive to `substrate-ui/process/` alongside the 2026-08-14 vocab+port review and the 2026-08-14 SDD-ARC-PLAN review.*
