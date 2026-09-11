# autonomous_build_topology — a substrate topology for driverless build work

*Design paper, round 4. 2026-09-11. Supersedes rounds 1, 2, and 3, which stay on
disk. Round 3 dropped the outer orchestration but still shoehorned
`session_topology`'s user-oriented schemas into a loop that has no user. This
round designs the topology from its own vocabulary. Nothing named "user"
appears in the event graph because there is no user. Every event, Producer,
and field names what the driverless loop actually contains.*

---

## 1. What the topology is

A three-Producer loop that runs a build against a sprint queue with no
human in the loop. The model produces work; a watcher classifies it against
mechanical signals; a director issues the next directive. The loop runs
until the sprint queue is exhausted, the model emits a build-end, or the
watcher raises a red halt the operator must clear out of band.

The topology has no shell attached. It is not a variant of
`session_topology` and it does not compose one. It reuses substrate's
kernel primitives (`Producer`, `View`, `Trigger`, `Route`, termination
policies) and nothing from the session vocabulary.

---

## 2. Event schemas

Seven `msgspec.Struct(frozen=True)` events, defined in
`substrate/src/substrate/topologies/autonomous_build/events.py`.

```
class BuildStarted(Struct, frozen=True):
    build_id: str
    workspace_path: str
    sprint_queue_path: str
    corpus_version: str
    driver_name: str            # names the Responder the driver Producer uses
    started_at: float

class Directive(Struct, frozen=True):
    build_id: str
    turn_index: int
    text: str
    origin: str                 # "seed" | "director" | "reminder"
    triggering_verdict_id: str | None

class WorkTurn(Struct, frozen=True):
    build_id: str
    turn_index: int
    text: str                   # the model's output
    tool_calls: list[dict]      # any tool calls in this turn, with args and results
    tags_emitted: list[str]     # signal tags the shell/library fired during the turn
    files_touched: list[str]    # files changed during the turn
    duration_seconds: float

class Verdict(Struct, frozen=True):
    build_id: str
    turn_index: int
    verdict_id: str
    verdict: str                # "green" | "yellow" | "red"
    checkpoint_kinds: list[str] # which detectors ran this firing
    drift_kind: str | None
    drift_detail: str | None
    detector_scores: dict[str, float]

class SprintClosed(Struct, frozen=True):
    build_id: str
    sprint_id: str
    closed_at_turn: int
    signal_report_path: str

class BuildEnded(Struct, frozen=True):
    build_id: str
    reason: str                 # "queue_exhausted" | "model_ended" | "quiescence"
    ended_at_turn: int

class BuildHalted(Struct, frozen=True):
    build_id: str
    reason: str                 # "ratification_required" | "director_uncertain" | "turn_cap"
    detail: str
    resume_condition: str
```

No event is named for a "user". No field carries a "user id" or a
"slash source". `Directive.origin` names three legitimate sources of a
directive — the seed at build start, the director at each turn, and a
periodic reminder — none of which pretend to be a person.

---

## 3. Producer graph

Three Producers plus a small set of Views. The whole graph is under 400
lines of Python.

### 3.1 `driver`

Consumes a `Directive`. Runs the underlying model (via any substrate
`Responder`) with the directive as prompt. Emits one `WorkTurn` carrying
the model's output, any tool calls it made, the signal tags it fired, and
the files it touched.

`driver` is a Producer per the substrate protocol
(`substrate/src/substrate/protocols.py:24`) — a callable
`(Directive) -> AsyncIterable[WorkTurn]`. The Responder it wraps is
selected at build start from `BuildStarted.driver_name`; today's supported
values are `deterministic`, `ollama:<model>`, `cli:claude`, `cli:gemini`,
mirroring `substrate/src/substrate/adapters/models.py`.

### 3.2 `watcher`

Consumes a `WorkTurn`. Reads the `trace_view` and `state_view` (§4).
Runs the detectors that the rotation schedule selects this turn. Emits
one `Verdict`.

Five detectors, each a pure function
`(work_turn, trace_view, project_state) -> DetectorScore`:

- **vocabulary_conformance** — checks that every tag in
  `WorkTurn.tags_emitted` is present in `signals/0.1.json § layer_1_lexical`
  and that every payload the trace carries satisfies the Layer 2 schema.
  Any miss is red; the mouth-side Emitter should have caught it earlier.
- **sdd_hygiene** — checks that `BLACKBOARD.md` and `KIT_DIARY.md`
  carry an entry per closed sprint and that any drift the other detectors
  flagged has a proposal filed against it in `signals/proposals.json`.
- **coding_canon** — runs the linter suite against
  `WorkTurn.files_touched`: retyped-literals grep, discriminated-union
  coverage, function-length scan, unused-code finder.
- **design_lock** — screenshots the states the current sprint's card
  claims to render and region-diffs each against the design lock's PNG at
  `handoff_latest/prototypes/`. Skipped on non-UI sprints.
- **prose_register** — runs the `dellm` skill's checks over every
  markdown file in `WorkTurn.files_touched`.

Rotation, keyed on `state_view.turn_index`:

- every turn: `vocabulary_conformance`, sprint-close check.
- every second turn: `sdd_hygiene`.
- every fifth turn: `coding_canon`.
- when the sprint card names UI states: `design_lock`.
- when the diff touches `.md`: `prose_register`.

Verdict composition is monotone. Any red detector → red verdict; any
yellow detector → yellow; otherwise green.

### 3.3 `director`

Consumes a `Verdict`. Reads the `corpus_view` (§4). Emits one `Directive`
whose `text` is the next directive to feed `driver`, or emits a
`BuildHalted` if no directive in the corpus matches the verdict.

Three invariants over the director:

- On green, emit the shortest directive that keeps the model on task —
  "continue", "next", "proceed with the sprint" — drawn from the corpus's
  `continue` cluster.
- On yellow, emit the directive from the cluster matching
  `Verdict.drift_kind`. If no cluster matches, emit `BuildHalted{reason=
  "director_uncertain", detail=<drift_detail>}`.
- On red, emit `BuildHalted{reason="ratification_required", detail=...}`.

Independent of verdict, the director prepends a reminder to its directive
when a detector has gone stale. If `sdd_hygiene` has not run in the last
five turns, the directive text opens with "confirm SDD hygiene before the
next step". If `design_lock` is stale on a UI sprint, likewise. The
reminders are the mechanised version of the periodic "remember SDD" and
"look at the designs again" prompts the operator issued by hand in prior
sessions.

---

## 4. Views

Four `View`s, all deterministic per the substrate contract at
`substrate/src/substrate/protocols.py:61`.

- **`trace_view`** — a `KindBuffer` over every `WorkTurn` and `Verdict`
  since the last `Directive` was emitted. The watcher reads it.
- **`state_view`** — a small keyed struct holding `turn_index`,
  `current_sprint_id`, `last_verdict_id`, `detector_last_ran_at`. Updated
  by every `WorkTurn` and `Verdict`.
- **`corpus_view`** — a keyed lookup over the mined directive corpus
  (§5). Loaded from `BuildStarted.corpus_version` as run baseline;
  read-only after `RunStarted`.
- **`sprint_queue_view`** — parses the sprint queue file named by
  `BuildStarted.sprint_queue_path` and holds the ordered list of pending
  cards.

---

## 5. Where directives come from

The director's rule table is mined out of prior operator-driven build
sessions, not designed a priori. The pass:

1. Read the transcript files under
   `~/.claude/projects/-Users-peterlaffey-Documents-Claude-Projects-Agent-Orchestration/*.jsonl`.
2. For each transcript, enumerate every operator turn.
3. For each operator turn, record: the signal shape of the prior
   assistant turn (tags fired, tools called, sprint card referenced),
   the reply text the operator typed, and an intervention-kind label.
4. Include silent-continue evidence. Every assistant turn the operator
   let stand becomes `(signal_shape, "", "continue")`. Silent continues
   are the majority of turns in a well-run session; without them the
   corpus over-weights correction.
5. Cluster the signal shapes. Each cluster becomes a rule-table entry:
   `(verdict shape) -> [directive templates]`.

The corpus is versioned and carried in the run manifest so replays are
exact. The corpus contains tonal corrections — the operator's
writing-style interventions — mapped to the prose-register drift
handler.

---

## 6. Termination

```
b.termination(api.any_of(
    api.threshold_count("BuildEnded", 1),
    api.threshold_count("BuildHalted", 1),
    api.quiescence_with_watchdog(seconds=1800),
))
```

The run ends when the driver emits `BuildEnded`, when the watcher raises
`BuildHalted`, or when nothing moves for thirty minutes. There is no
`pause_await_input`. The topology never waits for an external event to
resume.

---

## 7. Triggers, routes, initials

- `initial("seed", input=None)` — a small Producer that emits the first
  `Directive` from `sprint_queue_view.first_card.opening_directive` with
  `Directive.origin = "seed"`.
- Trigger `drive`: subscription `{Directive}`, starts `driver`, input =
  the Directive.
- Trigger `watch`: subscription `{WorkTurn}`, starts `watcher`, input =
  the WorkTurn.
- Trigger `direct`: subscription `{Verdict}`, starts `director`, input =
  the Verdict.
- Trigger `close_sprint`: subscription `{WorkTurn}`, predicate reads
  `sprint_queue_view` and checks whether the card's done-criteria are
  satisfied by the current project state, starts a
  `sprint_closer` Producer that writes the Signal Report and emits
  `SprintClosed`.
- Trigger `end_on_exhaustion`: subscription `{SprintClosed}`, predicate
  checks `sprint_queue_view.remaining == 0`, starts a `build_ender` that
  emits `BuildEnded{reason="queue_exhausted"}`.

---

## 8. What runs the topology

```
substrate --topology autonomous_build --manifest build.json
```

`build.json` names the workspace path, the sprint queue file, the corpus
version, the driver name (any Responder identifier), and optional
detector overrides.

If a person wants to run three builds in three separate workspaces, they
open three shells and invoke the command three times. That is not a
feature of the topology.

---

## 9. What substrate needs

Nothing new.

- `Producer`, `View`, `Responder` — `substrate/src/substrate/protocols.py`.
- `TopologyBuilder`, `producer_kind`, `view`, `trigger`, `route`,
  `initial`, `termination` — `substrate/src/substrate/kernel/topology.py`.
- `threshold_count`, `quiescence_with_watchdog`, `any_of` —
  `substrate/src/substrate/kernel/policies.py`.
- Responder implementations —
  `substrate/src/substrate/adapters/models.py`.

The topology declares its own vocabulary in a new file
`autonomous_build/vocabulary.py`; it does not import from
`topologies/session/vocabulary.py`.

---

## 10. What the topology does not do

- It does not compose or wrap `session_topology`.
- It does not emit `UserMessage`, `SessionStarted`, `SessionEnded`, or
  any other schema whose name presupposes a human role. There is no human.
- It does not measure convergence across multiple runs. Someone reading
  N runs' JSONL after the fact can do that; it is not the topology's job.
- It does not ratify vocabulary proposals. On a red verdict flagging an
  invented tag or a schema refusal, the director halts and the operator
  ratifies out of band.
- It does not author sprint cards. The sprint queue is input.

---

## 11. Risks

- **Corpus coverage.** Thin corpus → poor director replies. Iterate:
  ship a first cut, grow it as more transcripts are mined.
- **Detector false positives.** A watcher that classifies clean work as
  yellow halts too often. Every detector needs a fixture set of real
  transcript excerpts before it goes live.
- **Loops.** Director and driver can oscillate green-yellow without
  progress. The termination policy carries a per-sprint turn cap: if
  `state_view.current_sprint_id` does not advance in K turns, emit
  `BuildHalted{reason="turn_cap"}`.
- **Silent drift.** A drift kind no detector covers goes unnoticed. New
  drift kinds need new detectors; detectors are pure functions and cheap
  to add.

---

## 12. Next steps

1. Run the transcript-mining pass on four to six strong prior sessions.
   Produce the first-cut corpus with cluster labels.
2. Implement each detector as a standalone function under
   `substrate-ui/tools/detectors/`. Unit-test against fixture events.
3. Implement `autonomous_build_topology` at
   `substrate/src/substrate/topologies/autonomous_build/`: the seven
   events in §2, the three Producers in §3, the four Views in §4, the
   triggers in §7, the termination in §6.
4. Run it against a small sprint queue and a deterministic Responder.
   Read the JSONL. Confirm the director's directives land at the right
   turns and its halts land at the right red verdicts.
5. Swap the deterministic Responder for an Ollama Responder and re-run.

That is the whole plan.
