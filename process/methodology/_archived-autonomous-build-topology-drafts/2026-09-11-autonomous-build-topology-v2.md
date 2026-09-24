# parallel_build_topology — a substrate topology for autonomous, human-out-of-the-loop parallel builds

*Design paper, round 2. 2026-09-11. Supersedes v1 (`2026-09-11-autonomous-build-topology.md`,
which stays on disk as audit trail per the no-in-place-edits rule). v1 was correctly criticised
as too thin and factually wrong at one point: sprint cards were not authored by a human, they
were authored by the machine under human direction — the Architect's role is ratification and
correction, not typing. This round grounds the design in substrate's actual primitives as
declared in `substrate/src/substrate/kernel/topology.py`,
`substrate/src/substrate/protocols.py`, `substrate/src/substrate/kernel/policies.py`, and the
canonical `substrate/src/substrate/topologies/session/__init__.py`.*

---

## 0. Abstract

Substrate's `session_topology` implements a turn loop that pauses after every model reply and
waits for an external event before continuing. That pause is a substrate `TerminationPolicy`
named `pause_await_input`. It exists because the current single-session use case has one human
operator sitting on one shell pane, reading the model's reply and deciding what to type next.
The pause is the load-bearing constraint on human throughput and on the topology's failure
mode when the human walks away.

This paper designs a new topology, `parallel_build_topology`, that composes N `session_topology`
instances via substrate's `embedded_substrate` primitive, replaces the human-facing pause with
an intra-topology dispatcher, and drives every embedded session's next `UserMessage` from a
mechanised watcher's classification of the session's own emitted signals. The dispatcher's
reply vocabulary is derived empirically from a corpus mined out of prior successful sessions,
not designed a priori. The topology's convergence measurement across the N runs is the
research artifact when the topology is used as an SDD instrument rather than as a build
accelerator.

The paper covers: substrate's primitives at the depth this design needs; what
`session_topology` actually does today; the parallel topology's Producer graph; the
user-input-seam expansion; the watcher's detector bank and rotation schedule; the dispatcher's
corpus-driven reply mechanism; convergence and divergence as measurable outputs; what
substrate must ship to enable this; what the shell must ship to visualise it; and the risks
that determine whether this is a productivity tool, a research instrument, or both.

---

## 1. Substrate's primitives, at the depth this design requires

Everything below refers to declarations that already exist in substrate's kernel.

### 1.1 Producer, View, Responder

`substrate/src/substrate/protocols.py:24` defines `Producer` as a callable
`(input) -> AsyncIterable[Event]`. The factory returns one Producer per instantiation; the
runtime consumes the event stream until the Producer completes, fails, or is cancelled. State
lives on the log, not in the Producer.

`substrate/src/substrate/protocols.py:61` defines `View` as a deterministic incremental
projection over the bus: `update(event)`, `value()`, plus a `Subscription` naming what kinds
and producers the view listens to.

`substrate/src/substrate/protocols.py:50` defines `Responder` as an application-layer seam,
NOT a kernel primitive: `respond(prompt: str) -> str`. Reference implementations at
`substrate/src/substrate/adapters/models.py:97` (`DeterministicResponder`), `:124`
(`OllamaResponder`), and `:374` (`CliResponder`).

### 1.2 TopologyBuilder

`substrate/src/substrate/kernel/topology.py:130` defines `TopologyBuilder`. Its methods are
the vocabulary a topology factory has:

- `producer_kind(kind, *, schemas, schema_version, factory | start, deterministic, budget)` —
  register a Producer with its frozen msgspec event schemas and an optional resource `Budget`.
- `view(name, view)` — register a named `View`; subscription must be non-empty.
- `trigger(id, *, subscription, predicate, starts, input_builder, policy, cooldown)` — on an
  event matching subscription, if `predicate(TriggerContext)` holds, start `starts` with
  `input_builder(TriggerContext)`.
- `route(id, *, subscription, slot, transform)` — on an event matching subscription, stage
  `transform(event)` into `slot` for a later Trigger's `input_builder` to read via
  `ctx.staged[slot]`.
- `instrument(name, *, on, schemas, input_builder, factory | start, into, via)` — helper that
  collapses the observe-and-stage triple (`producer_kind` + `trigger` + optional `route`) into
  one call.
- `initial(kind, *, input)` — declare a Producer started at seq 0.
- `termination(policy, *, scope="run")` — set the `TerminationPolicy`; only `run` scope
  ships in v1.0.
- `baseline(**metadata)` — attach run metadata into `RunStarted`.

### 1.3 Termination policies

`substrate/src/substrate/kernel/policies.py:20` declares `Decision` with four terminal
outcomes: `CONTINUE`, `FINALISE_RUN`, `CANCEL_OTHERS`, `PAUSE_AWAIT_INPUT`. The recipes:

- `threshold_count(kind, n)` — finalise once N of `kind` have been appended.
- `all_completed()` — finalise when every started Producer has ended (NOT resume-safe).
- `cancel_all_others(when)` — cancel every other running Producer when `when` holds.
- `quiescence_with_watchdog(seconds)` — finalise on quiescence.
- `pause_await_input(when, resume_condition)` — pause with a typed resume condition (the
  primitive `session_topology` uses to wait for the operator).
- `any_of(*policies)`, `all_of(*policies)` — composition.

### 1.4 The composition primitive

Substrate ships an `embedded_substrate` composition point (referenced at
`kernel/topology.py:202-214` and `:370-376`). An embedded Producer carries an
`__substrate_export_map__` attribute that names how the inner substrate's event kinds map to
the outer topology's schema names. The runtime derives the composition boundary from that
single source; there is deliberately no `b.export` method (the earlier parallel copy was
removed as a two-sources-of-truth defect). This is the primitive that lets one topology
instantiate other topologies as Producers.

### 1.5 The reusable N-parallel pattern

`substrate/src/substrate/topologies/best_of_n/__init__.py:90` defines `best_of_n_correction`.
It fans out N Drafts, validates each Candidate, and a judge either selects the passing one,
seeds the next round with N new Drafts feeding failure context back in, or gives up. It uses:

- One `seeder` Producer as the initial (or triggered by a `seed_on` kind).
- A `drafter` Producer triggered per `Draft`.
- A `validator` Producer triggered per `Candidate`.
- A `judge` Producer triggered per `Verdict` when all N verdicts for a round are in.
- A `KindBuffer("Verdict")` view accumulating verdicts.
- `any_of(threshold_count("Solved", 1), threshold_count("Exhausted", 1), quiescence_with_watchdog())`.

`best_of_n` is the closest existing pattern to what `parallel_build_topology` needs. The
build topology is not a fan-out on the same task (that is what `best_of_n` covers); it is a
fan-out on N unrelated build workspaces from shared initial conditions. But the mechanical
shape — N Producers with a per-instance verdict path and a judge — is identical.

### 1.6 The reference session topology

`substrate/src/substrate/topologies/session/__init__.py` (1200 lines) declares
`session_topology`. Its event schemas include `SessionStarted`, `UserMessage`, `ModelReply`,
`Park`, `SessionEnded`, `SessionEndRequested`, `SessionWarning`, `PromptFragment`,
`PromptComposed`. Its Producers include composer, parent-context, per-turn, role,
tools-suite, bundle, user-message-fragment, and a CI/walkthrough dual-mode. Its termination
is a composition that includes `pause_await_input`: after every `ModelReply` (and after
`Park`, and after `SessionEndRequested` in some paths), the topology halts until a fresh
`UserMessage` is appended by the external caller — the shell.

This is the pause the parallel topology removes.

---

## 2. Why the human is separable from the loop

The reason an operator sits on a session today is not that the model's text is inscrutable.
It is that no signal reports on-track / off-track directly, so the operator's role reduces to
reading the model's reply and inferring whether the model has drifted. The inference is a
signal-detection task. When the signals exist as tags on the bus, the detection is
mechanisable and runs in milliseconds instead of minutes.

Every drift kind an experienced reviewer catches has a mechanical detector already
demonstrated in this build:

- **SDD-vocabulary drift.** Invented tag names raise from
  `substrate-ui/src/observability/Emitter.ts:22`. Payload-shape drift raises from the
  Layer-2 check that landed at commit `e33f36b`. Sequence drift against Layer 5 is a diff
  against `signals/0.1.json § layer_5_state_transitions`. Missing `BLACKBOARD.md` entries
  after sprint close is an `ls`.
- **Coding-canon drift.** Retyped literals against enums that already exist (mapped from
  memory item `feedback-read-the-code-grep-repeated-literals`). Raw string switch cases
  where a discriminated union is authoritative. Function length past a project threshold.
  Standard static analysis.
- **Design-lock drift.** Playwright screenshots of every state the sprint's card claims to
  render, region-diffed against the corresponding PNG in
  `handoff_latest/prototypes/Substrate Prototype v7.dc.html` (already captured, sitting on
  disk).
- **Prose-register drift.** Machine register has a fingerprint the plain-register memo names
  (uniform sentence length, adverb frequency, LLM-tell tokens like "admits", "load-bearing",
  "surfacing rather than building"). The `dellm` skill's editing rules run as a linter over
  any committed markdown; the output is a scalar per file.
- **Sprint-completion drift.** The sprint card's stated done-criteria are checkable against
  the harness's exit code and the JSONL trace's tag list.

A watcher assembled from those five detectors reads the session's state at higher fidelity
than the operator did during the sprint 1-14 build, on every turn, without pausing.

Two important observations follow. First: the model's own words are almost never the
load-bearing signal. The detectors read *what the model did* (which tags emitted, which
payload shapes, which sprint closed, which linter score changed), not *how it phrased the
turn's summary*. Second: silence — the sequence of turns where the operator did not
intervene — is data. In the current session's transcript, the ratio of silent-continue turns
to correction turns is a headline statistic; a dispatcher that never permits `CONTINUE` when
the detectors are green will hang.

---

## 3. The topology's Producer graph

The topology instantiates via `register_topology("parallel_build", parallel_build_topology)`
and receives a `TopologyBuilder` per the standard authoring surface at
`kernel/topology.py:130`.

### 3.1 Event schemas the topology introduces

Every schema below is a `msgspec.Struct` with `frozen=True` per the substrate registration
contract at `kernel/topology.py:190`.

```
class RunGroupSpawned(Struct, frozen=True):
    run_group_id: str
    n: int
    bootstrap_variant: str
    design_lock_id: str
    substrate_version: str
    sprint_queue_id: str

class SessionSpawned(Struct, frozen=True):
    run_group_id: str
    session_slot: int
    embedded_session_id: str
    workspace_path: str

class WatcherVerdict(Struct, frozen=True):
    run_group_id: str
    session_slot: int
    checkpoint_kind: str   # "vocabulary" | "sdd_hygiene" | "coding_canon" | "design_lock" | "prose_register" | "sprint_close"
    verdict: str           # "green" | "yellow" | "red"
    drift_kind: str | None
    drift_detail: str | None
    detector_scores: dict[str, float]

class DispatcherReplied(Struct, frozen=True):
    run_group_id: str
    session_slot: int
    reply_kind: str        # empirically-derived label from the corpus
    reply_text: str
    triggering_verdict_id: str

class RunGroupCheckpoint(Struct, frozen=True):
    run_group_id: str
    checkpoint_index: int
    per_slot_verdicts: list[str]

class RunGroupConverged(Struct, frozen=True):
    run_group_id: str
    layer: int             # 0-10, from the SDD grammar stack
    converged_tag_count: int

class RunGroupDiverged(Struct, frozen=True):
    run_group_id: str
    layer: int
    diverged_at: str       # tag name where slots stopped matching

class RunGroupHalted(Struct, frozen=True):
    run_group_id: str
    session_slot: int
    reason: str            # "operator_ratification_required" | "watcher_uncertain" | "detector_bank_unavailable"
    resume_condition: str
```

### 3.2 Producer kinds

- **`spawner`** — the initial. Emits one `RunGroupSpawned` and N `SessionSpawned`. Reads the
  run manifest that names the design lock, the substrate version, the sprint queue file, the
  bootstrap variant per slot, and the workspace shape (`flat` / `worktree` / `isolate` per
  substrate's `WorkspaceShape` at `session_registry.py`).
- **`embedded_session`** — an `embedded_substrate` Producer wrapping `session_topology`.
  Registered N times conceptually (once per slot via the trigger); the export map lifts every
  inner event kind to the outer topology's schema names so the outer bus carries per-slot
  copies with `session_slot` in the payload.
- **`watcher`** — one instance per slot, triggered per inner event that the detector bank
  cares about. Emits `WatcherVerdict`. The watcher is a Producer that holds the detector
  bank (five detectors above); each detector is a pure function
  `(events_since_last_verdict, project_state) -> Score`. The watcher composes their outputs
  into a verdict.
- **`dispatcher`** — one instance per slot, triggered per `WatcherVerdict`. Consumes the
  transcript-mining corpus (loaded once as a run baseline) as its rule table. Emits
  `DispatcherReplied` whose `reply_text` becomes the next inner-session `UserMessage`
  through a route.
- **`convergence_monitor`** — a single Producer that reads across all slots' vocabulary
  events, computes per-layer overlap via a `KindBuffer` view keyed on
  `(run_group_id, layer)`, and emits `RunGroupCheckpoint` at each epic boundary,
  `RunGroupConverged` when all slots agree at a layer, and `RunGroupDiverged` otherwise.

### 3.3 Views

- **`slot_transcripts`** — one View per slot (or one keyed View), `KindBuffer` scoped to
  that slot's `SessionStarted..SessionEnded` window. The watcher reads it.
- **`slot_vocabularies`** — per-slot projection of ratified tags at the moment of vocabulary
  lock. The convergence monitor reads across all slots.
- **`dispatcher_corpus`** — a baseline-loaded View exposing the transcript-mining rule table
  as a keyed lookup: `(watcher_verdict_shape) -> [candidate_reply_kinds]`. Deterministic;
  read-only after `RunStarted`.
- **`per_slot_sprint_pointer`** — the last closed sprint id per slot, updated by a
  `SprintClosed` observer.

### 3.4 Triggers and routes

- `SessionSpawned -> embedded_session` (per slot).
- Every inner event matching `{ModelReply, Park, SessionEnded, SessionWarning}` per slot
  routes into a staged slot `last_turn_boundary` and triggers `watcher`.
- Every `WatcherVerdict` triggers `dispatcher`.
- Every `DispatcherReplied` routes its `reply_text` into a staged slot the embedded session's
  `user_message_fragment_producer` reads via the composition boundary (see §5).
- Every inner `SessionEnded` or outer `RunGroupHalted` decrements a "live slots" counter view;
  when it reaches zero, `all_completed()` fires.

### 3.5 Termination

```
b.termination(api.any_of(
    api.threshold_count("RunGroupHalted", n=N),           # any slot halts for ratification
    api.all_completed(),                                  # all slots ran to SessionEnded
    api.quiescence_with_watchdog(seconds=1800),           # nothing has moved in 30 minutes
))
```

`all_completed` is safe here because the outer topology never uses `pause_await_input`. The
inner sessions do — that pause is what the dispatcher releases each time it fires — but the
outer topology's termination compares the outer bus's counts, and the outer bus never sees
a pause.

### 3.6 Budget

Each `watcher` and `dispatcher` Producer registers a `Budget` (`kernel/topology.py:47`) with
a `wall_seconds` cap keyed to a per-slot per-turn ceiling (say, 10 seconds), so a runaway
detector cannot stall the whole group.

---

## 4. What runs inside each slot

The embedded Producer is `session_topology` unchanged. Its termination stays
`pause_await_input`. Its `Responder` is whatever the run manifest names — most parallel
build slots run against `OllamaResponder` or `CliResponder`, some run against
`DeterministicResponder` for deterministic replay in convergence experiments. The Responder
is picked per slot from the run manifest's `bootstrap_variant`, allowing three slots to run
identical everything except for the model choice — which is itself a variant experiment.

Each slot's inner session emits into its own record root and its own JSONL trace exactly as
today. The outer topology's bus additionally carries the composed-up events per the export
map. Both channels persist; the outer channel is what the watcher, dispatcher, and
convergence monitor read.

---

## 5. The user-input seam

This is the one place substrate's current primitives may not be enough. The paper's honest
position: read the following as a proposal for one small kernel-adjacent addition, and check
the kernel runtime before implementing.

### 5.1 The gap

`session_topology`'s pause is released by an external `UserMessage` event being appended to
the inner session's bus. In the current shell, the substrate-ui bridge (`bridge/main.py`)
constructs that `UserMessage` and calls `SessionRegistry.turn_sync` which internally appends
it. From outside a topology this is straightforward — the shell owns the registry. From
inside a topology composing that session as an embedded Producer, appending an event to the
embedded substrate's bus requires the composition boundary to support inbound events, not
only outbound ones.

Reading `kernel/topology.py:370-376` and the export-map comment, the composition boundary
today lifts inner events out. The inbound direction is either present in the kernel runtime
(not verified in this session) or must be added.

### 5.2 The proposal

Add an `import_map` mirror to the `embedded_substrate` primitive: a declaration of which
outer-topology event kinds inject into the inner bus as which inner kinds. Concretely, the
outer `DispatcherReplied` event with a matching `session_slot` injects as an inner
`UserMessage` into the embedded session whose slot matches. The kernel already knows the
composition boundary; extending it with the inbound direction preserves the single-source
principle (the map lives on the embedded Producer's declaration, not in a parallel
`b.import`).

Two constraints follow from substrate's determinism guarantees:

- The inbound injection must be recorded on the inner bus with sufficient provenance that
  L3a replay (deterministic re-derivation of view state) still holds: the outer event id
  that caused each inner append must be traceable.
- The inner bus's schema for `UserMessage` must accept a `slash_source` of `"dispatcher"`
  or equivalent so the transcript can distinguish an operator-typed message from a
  dispatcher-typed one. The `UserMessage` struct already carries `slash_source: str | None`
  per `topologies/session/__init__.py:121`; the existing field takes the value.

### 5.3 The fallback if inbound composition is not accepted

If the kernel maintainer rejects inbound composition on principle, the fallback is
architectural: each slot runs as a full substrate process, not an embedded Producer. The
outer topology becomes a process supervisor that speaks to each slot over its stdio
JSON-lines protocol (the same protocol the shell already uses). This loses the single-bus
determinism and the convergence-monitor view has to correlate across process boundaries,
but it works with substrate as it exists today. The paper's preference is the composition
route; the fallback is here as an honest escape hatch.

---

## 6. The watcher

The watcher is a Producer per slot, triggered by inner events indicating a turn boundary.
It reads the `slot_transcripts` view for events since the last verdict, runs the detector
bank, and emits one `WatcherVerdict` per turn.

### 6.1 Detector bank

Five detectors, each a pure function returning a float score in `[0, 1]` and a boolean
`green/yellow/red` classification.

- **vocabulary_conformance** — reads the slot's `signals/0.1.json`, greps the sprint's diff
  and the trace for tag names, computes ratio of ratified to invented. Score 1.0 = all
  emissions match ratified schema; anything less is a hard fail because the mouth-side
  Emitter should have caught it (a non-1.0 score means the Emitter has a hole to patch).
- **sdd_hygiene** — checks for `BLACKBOARD.md` and `KIT_DIARY.md` presence, for a
  Signal Report from the latest closed sprint, for proposals filed against any drift.
- **coding_canon** — runs the linter suite (retyped-literals detector, function-length
  scanner, unused-code finder, discriminated-union coverage) on the slot's git diff since
  last verdict.
- **design_lock** — for UI-touching sprints only. Screenshots the shell states the sprint's
  card claims to render and diffs them against the design-lock PNGs. Skipped on
  non-UI sprints (a `sprint_metadata` view names the sprint's kind).
- **prose_register** — runs the `dellm` skill's checks over every committed markdown file
  changed by the slot's diff. Returns a machine-tell fingerprint score.

### 6.2 Rotation schedule

Running every detector on every turn is wasteful and produces noise on sprints where a
given detector has nothing to say. The rotation:

- **every turn** — `vocabulary_conformance` and `sprint_close`.
- **every second turn** — `sdd_hygiene`.
- **every fifth turn** — `coding_canon`.
- **every UI-touching sprint** — `design_lock`.
- **every commit-touching-markdown turn** — `prose_register`.

The `checkpoint_index` in the `WatcherVerdict` payload names which detectors ran; a run's
detector coverage is reconstructable from the trace.

### 6.3 Verdict composition

The verdict is `red` if any run detector reports `red`; `yellow` if any reports `yellow`
and none report `red`; `green` otherwise. The full `detector_scores` dict is carried
forward so the dispatcher and the convergence monitor can inspect it.

---

## 7. The dispatcher

The dispatcher is a Producer per slot, triggered by `WatcherVerdict`. It emits one
`DispatcherReplied` per verdict, whose `reply_text` becomes the next inner `UserMessage`
through the import map (§5).

### 7.1 The corpus, not the design

The dispatcher's reply repertoire is not designed a priori. It is derived from a
transcript-mining pass over prior successful sessions. The pass:

1. Load the transcripts from
   `~/.claude/projects/-Users-peterlaffey-Documents-Claude-Projects-Agent-Orchestration/*.jsonl`
   (the current session's transcript is one of them; others sit in the same directory).
2. For each transcript, enumerate every operator turn.
3. Classify each operator intervention: what did the prior assistant turn contain that made
   the operator type this? Store `(signal_shape, reply_text, reply_kind_label)`.
4. Include silent-continue evidence — every assistant turn the operator accepted without
   correction is a `(signal_shape, "", "silent_continue")` datum.
5. Cluster the `signal_shape` inputs; each cluster becomes a dispatcher rule.
6. Store the corpus as a keyed lookup: `verdict → [candidate reply_kinds with template text]`.

The rule table's cardinality falls out of the corpus. The paper's earlier five-name
placeholder (`CONTINUE`, `NEXT_SPRINT`, `HALT_AND_ARTICULATE`, `PROPOSE_AND_HALT`,
`REVERT_AND_TRY_AGAIN`) is the working guess; the mining pass will confirm, refine, or
enlarge it. Two properties matter: the corpus must include silent-continue and the corpus
must include tonal corrections (the operator's writing-style interventions, which shape
the prose-register detector's response prompts).

### 7.2 The dispatcher's minimum behaviour

Independent of the corpus, three invariants hold:

- On any green verdict, emit a reply drawn from the `silent_continue` cluster ("continue",
  "keep going", "next", empty prompt where the topology permits).
- On any red verdict flagged `operator_ratification_required` — chiefly a
  `NEW_TAG_PROPOSED` from the mouth-side Emitter's refusal — emit no reply; instead emit
  `RunGroupHalted{reason="operator_ratification_required"}`. The outer topology's
  termination catches it.
- On any yellow verdict, emit a reply from the cluster matched by the verdict's
  `drift_kind`. If no cluster matches, emit `RunGroupHalted{reason="watcher_uncertain"}` and
  wait for the operator.

The dispatcher is deliberately dumb. Its intelligence is in the corpus, not the code.

### 7.3 Every-so-often prompts

Independent of any verdict, the dispatcher inserts periodic reminders keyed to detector
staleness. If `sdd_hygiene` has not been checked in the last five turns, the next
dispatcher reply prepends "before continuing, confirm SDD hygiene." If `design_lock` has
not been checked since the last UI-touching commit, the reply prepends the corresponding
reminder. These are the topological equivalent of the operator's periodic "remember to use
SDD" and "look at the designs again" prompts observed in prior sessions.

---

## 8. Convergence and divergence as measurable output

The interesting scientific claim inside SDD is that a well-designed grammar is a genuine
attractor — three independent builders working from the same design lock, the same
substrate, and the same sprint queue should produce the same `signals/0.1.json` layer by
layer. `parallel_build_topology` is the instrument that tests this.

The `convergence_monitor` reads across slots at each vocabulary-affecting checkpoint (Layer 0
entity list ratified, Layer 1 tag list ratified, Layer 2 payload schemas ratified, and so
on through Layer 10) and computes:

- **convergence at layer K** — the set intersection of ratified elements at layer K across
  all N slots, normalised by the max-slot cardinality at that layer.
- **divergence taxonomy** — for each tag present in fewer than N slots, whether the
  discrepancy is (a) present-versus-absent, (b) named-differently-with-same-semantics per
  the payload schema, or (c) present-with-incompatible-payload.

The topology emits `RunGroupConverged{layer=k, converged_tag_count=t}` when the
intersection ratio is 1.0; `RunGroupDiverged{layer=k, diverged_at=tag}` otherwise. These
tags are the research output. Across many run groups against many design locks, their
statistics are what supports or refutes the compounding claim in `PRINCIPLES.md`
commitment 1.

Two experimental configurations follow immediately:

- **Same bootstrap, different Responder.** All N slots run with identical bootstrap_variant
  but different `Responder` (Ollama at one context size, Ollama at another, CLI Claude,
  CLI Gemini). Convergence data isolates the effect of the model on the vocabulary.
- **Same Responder, different bootstrap_variant.** All N slots run with identical Responder
  but different bootstrap kits (mouth-side Emitter present versus absent, Layer 5
  enforcement hard versus soft, primitive library present versus absent). Convergence data
  isolates the effect of the bootstrap kit — which is the direct evidence for the
  streamlining lessons in `2026-09-11-bootstrap-streamlining-lessons.md`.

---

## 9. What substrate must ship

Two substantive additions, one minor.

### 9.1 Inbound composition (import_map)

Per §5.2. Extends the existing `embedded_substrate` primitive with a declared inbound
event mapping so an outer topology can inject events into an inner topology's bus. Single
source of truth on the embedded Producer's declaration, mirroring the outbound export map.
This is the load-bearing change; without it the topology has to fall back to per-slot
processes.

### 9.2 A `WorkspaceShape` per slot

`SessionManifest.workspace_shape` at `substrate/src/substrate/session_registry.py` already
supports `flat`, `worktree`, `isolate`. The parallel topology's spawner uses `isolate` per
slot so slots do not race on the same working tree. The primitive exists; no substrate
change required — but the spawner needs to construct N isolated workspaces per group, which
means the topology's baseline metadata carries the isolation policy.

### 9.3 A `run_group_id` field on `SessionManifest`

A single optional field so a session's manifest carries the parent run-group when it exists.
Enables cross-session queries like "show every session that was slot 2 of run group X" from
the shell. Purely additive.

### 9.4 What is deliberately not added

- No new kernel Producer type. `Producer` at `protocols.py:24` already suffices.
- No new termination-policy primitive. `any_of` composition over the existing recipes
  covers the run-group case.
- No `b.import` on `TopologyBuilder`. Per the export-map's single-source-of-truth
  principle, the import map lives on the embedded Producer's declaration, not on the outer
  builder.

---

## 10. What the shell must ship

The topology runs entirely inside substrate. The shell need not know about it to make it
run — a CLI invocation of substrate's `--topology parallel_build --manifest run.json` is
enough. To *use* it interactively, the shell needs:

- A new bridge op `op_parallel_build_start(manifest_path)` that returns a `run_group_id`.
- A new bridge op `op_parallel_build_watch(run_group_id)` that streams the run-group's
  outer bus events.
- A pane kind (`RunGroupPane`) that visualises N session panes side by side with the
  convergence monitor's per-layer status bar across the top. The existing per-pane
  vocabulary (`Pane`, `PaneHeader`, `Prompt`, `Anchor` in `substrate-ui/src/render/`) is
  reused per slot.
- A `Layer 1 v0.1` addition to `signals/0.1.json` for the shell-side observation of the
  run group (five to eight new tags: `RUN_GROUP_OPENED`, `RUN_GROUP_SLOT_FOCUSED`,
  `RUN_GROUP_CONVERGENCE_BAR_RENDERED`, and so on). These are shell tags, not substrate
  events; they observe the visualisation, not the underlying run.

None of this is required to start using `parallel_build_topology` from a CLI; a headless
run producing a JSONL trace and a set of per-slot records is a complete artefact for the
convergence experiments.

---

## 11. The variant-runs research programme

The topology is a productivity tool if used against a fixed bootstrap and Responder — three
parallel builds finish in roughly one build's wall clock, at 3× tokens, with the reviewer
overhead absorbed by the watcher. That is the least-interesting use.

The more interesting use is as a research instrument. Two programmes follow directly.

### 11.1 The bootstrap-variant programme

Fix design lock (v7) and Responder (a specific Ollama model at a specific context size).
Vary `bootstrap_variant` across slots. Read the convergence data at each vocabulary layer.
The hypothesis under test is the compounding claim: better-bootstrapped builds converge
higher and faster. The direct output is empirical support (or its absence) for the eight
streamlining primitives.

### 11.2 The Responder-variant programme

Fix bootstrap variant and design lock. Vary Responder across slots (different models,
different context sizes, different providers). Convergence data isolates model dependence.
A convergence ratio of 1.0 at all layers across families would be strong evidence that a
well-designed grammar is model-invariant — a claim SDD implicitly makes but has never
tested at scale.

### 11.3 The prose-register programme

Fix everything except the prose register the dispatcher enforces. One slot's dispatcher
enforces plain register aggressively (yellow verdict on any machine-tell fingerprint above
threshold); one slot's dispatcher enforces it laxly (only red on gross violations); one
slot's dispatcher does not enforce it at all. Read the coding-canon and vocabulary-
conformance scores across slots. The hypothesis: prose-register discipline correlates with
code discipline. If it does not, the connection is decorative and can be dropped from the
watcher.

---

## 12. Risks, open questions, honest limits

### 12.1 Ratification bottleneck

The Architect's ratification queue is the one place the topology cannot mechanise. Every
`RUN_GROUP_HALTED{reason="operator_ratification_required"}` waits for the operator. If
three slots each propose a new tag at similar sprint moments, the operator has three
proposals to read. Either the operator processes them serially (reducing effective
parallelism) or the topology accepts a `unified_ratification` mode where the same
proposal from multiple slots is de-duplicated and ratified once (which requires slots'
proposals to be structurally comparable, which is not obviously true).

### 12.2 Corpus quality dominates dispatcher quality

If the transcript-mining pass produces a rule table with poor coverage, the dispatcher
either sends the wrong reply (progressing a session into deeper drift) or halts too
often (killing throughput). The mitigation is scale: mine many transcripts, cluster,
manually review a sample of the clusters, then iterate. The corpus is versioned; the
topology carries the corpus version in the run manifest so replays are exact.

### 12.3 Convergence measurement across incompatible vocabularies

Two slots that ratify tags at semantically equivalent points but under different names
should count as convergent, but the naive set intersection reads them as divergent. The
divergence taxonomy in §8 already covers this (`named-differently-with-same-semantics`)
but the check requires a semantic equivalence oracle — probably a separate small model
that reads the two rationales and returns `{same, different, unclear}`. This is the one
place a model reads model output in the whole topology; it is bounded, offline, and
audited.

### 12.4 Substrate composition inbound is unverified

Per §5.1, the kernel's support for inbound-composition events was not verified in this
session. If it does not exist, §5.3's fallback (per-slot processes) is what actually
ships. The fallback works but costs the single-bus determinism guarantee for
cross-slot observation.

### 12.5 The topology is heavier than substrate's other reference topologies

`best_of_n_correction` is 214 lines. `debate` is 51 lines. `session_topology` is 1200
lines and is the current heavyweight. `parallel_build_topology` is going to sit
between `session_topology` and `swebench_solver` in complexity — many Producers, many
schemas, cross-slot views. The mitigation is composition: the watcher and dispatcher are
each their own module with their own tests, and the topology file itself is roughly a
graph declaration.

---

## 13. What this replaces and what it does not

**Replaces.** The operator typing "continue" into three terminal panes. The reviewer
running in a fourth pane, reading three transcripts sequentially and hand-writing
Signal Reports. The manual bookkeeping that today lives in the operator's head about
which slot is where in its sprint queue.

**Does not replace.**

- *Architect ratification.* `NEW_TAG_PROPOSED` still becomes `signals/0.2.json` only
  because the operator says so. The topology gathers proposals; the operator ratifies.
- *Design lock authorship.* Prototype v7 was designed by a designer. The topology
  drives builds from a design lock; it does not create one.
- *Sprint card authorship correction.* Sprint cards are written by the model under the
  operator's direction, not by the operator directly. This was misstated in v1 of this
  document and is corrected here.
- *Bootstrap kit authorship.* The eight primitives in
  `2026-09-11-bootstrap-streamlining-lessons.md` are the specification of what each
  slot's bootstrap_variant contains. The topology consumes them; it does not invent
  them.

---

## 14. Adjacent work in this repo

- **`sdd-kit-2/foundations/02-sdd-practice.md`** — Stage-2 and Stage-3 of the automated
  loop (subscribers, streaming observers). `parallel_build_topology` is the Stage-3
  claim made concrete for a specific workload: many concurrent builders, mechanised
  supervision, human at ratification.
- **`substrate/src/substrate/topologies/best_of_n/__init__.py`** — the closest
  existing pattern; N Producers with a per-verdict path and a judge terminal.
- **`substrate/src/substrate/topologies/session/__init__.py`** — the topology being
  composed inside each slot. Untouched by this design.
- **`substrate/src/substrate/session_registry.py`** — the per-session registry the
  spawner drives when constructing N isolated workspaces.
- **`substrate-ui/process/methodology/2026-09-11-bootstrap-streamlining-lessons.md`**
  — the specification of what each slot's bootstrap_variant should contain.

---

## 15. Concrete next steps

Not a promise to execute; a sequenced list.

1. Verify or falsify the kernel's inbound-composition support. Read
   `substrate/src/substrate/kernel/runtime.py` and `sequencer.py` for how events cross
   the composition boundary. If inbound is supported, §5.2 is a declaration change
   only. If not, decide between §5.3 (per-slot processes) and proposing the kernel
   addition.
2. Run the transcript-mining pass on the four to six strongest prior sessions. Produce
   a first-cut corpus with cluster labels. Manually review a sample; iterate.
3. Implement the watcher's five detectors as standalone functions under
   `substrate-ui/tools/detectors/` with unit tests against fixture events. The
   detectors need to be usable from outside the topology (a solo operator running one
   detector over one JSONL) so their interface is a plain function.
4. Implement `parallel_build_topology` in `substrate/src/substrate/topologies/parallel_build/`
   against a stub Responder for the initial pass.
5. Register the shell tags Layer 1 v0.2 needs for the `RunGroupPane` before writing any
   pane code (the vocabulary-first discipline).
6. Run a two-slot convergence experiment against a small design lock (a toy grammar of
   ten tags) as a proof of instrument, not a proof of anything about SDD.
7. Scale to three slots against v7 and read the convergence data at each epic
   boundary.

---

## 16. Closing frame

The topology is a small idea with a large surface. Its smallest version is a productivity
tool that runs three unattended builds where one used to run attended. Its largest
version is the experimental instrument that turns SDD's compounding claim into a
measurable quantity. The two versions share the same code; they differ only in whether
the run manifest carries variant fields per slot.

The primitives it needs already exist in substrate, with one exception whose resolution is
either a small kernel amendment or an architectural fallback both of which are named and
sized here. The corpus that gives the dispatcher its voice is mined from transcripts the
operator has already produced. The convergence data that turns it into an instrument is
what falls out of running the topology at N greater than one against the same design lock.

Nothing in this design requires believing anything not already visible in the substrate
source, the sdd-kit-2 foundations, or the four completed epics of substrate-ui. The
question is whether it is worth building. That question is not answered by this paper.

---

*Round 2 draft. Companion: `2026-09-11-bootstrap-streamlining-lessons.md`. v1 stays on disk
at `2026-09-11-autonomous-build-topology.md` per the no-in-place-edits discipline.*
