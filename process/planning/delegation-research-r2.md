# Delegation — r2 (2026-09-22)

*Supersedes `delegation-research.md`. That draft framed fan-out
delegation as a design problem across substrate topologies. This
one bakes the Architect's constraint in from the top: every child
is a session, nothing new to author, the pieces exist. What
follows is small, mechanical, and short.*

## The premise, plainly

- Delegate already works. One call, one child, one folded
  ToolResult. Chained up to `max_depth=2`. Provenance rides
  through. Every child today is spawned by
  `_default_child_factory` as `tool_loop_topology(walkthrough=True)`
  — but that is the OLD shape. The Architect's ruling:
  **every child is a session.** No new topology to write.
- `session_topology` already carries `parent_session_id +
  parent_seq_at_call` (line 585-586). It already accepts driver,
  workspace, tools restriction, isolate. It already emits a
  `FinalAnswer` + `SessionEnded` when its turn parks and the
  session ends. That is what the child produces; that is what
  delegate folds back.
- `SessionRegistry.create` already mints a session from a manifest.
  `SessionRegistry.turn_sync` already runs a session to its next
  Park. `SessionRegistry.end` already ends one.

Fan-out delegate is not new architecture. It is one delegate call
that mints **N sessions** through the same seam a fresh
`/api/session` uses, waits for each to Park (or a caller-set
signal, see below), folds their FinalAnswers into one ToolResult.
Each child is a session; the reveal shell already knows how to
attach to and descend into a session's record.

## The delegate call shape

```
delegate(
  # single-child (existing):
  task,
  [model], [child_session_name], [context], [baseline],
  [timeout_seconds],

  # fan-out (new; when present, ignore the single-child fields):
  children: list of {task, [driver], [workspace], [tools],
                     [isolate], [name]},
)
```

`children` is a list of session specs. Each entry carries the
same fields `POST /api/session` accepts. When `children` is
present, the tool ignores the single-child fields and spawns N
children in parallel. Backwards compatible: existing single-child
callers see no change.

Result shape:

```
{answers: {<child_name>: "..."},
 child_roots: {<child_name>: "/path/to/record"},
 steps: {<child_name>: N},
 failed: {<child_name>: {error}}    # only children that failed
}
```

Names default to `c0`, `c1`, ... if the caller does not set them.
Two children with the same name → error at call time (naming is
the caller's tool for addressing answers).

## Ending

Every child is a session, so every child is endable exactly as
today: `POST /api/session/<id>/end`. The reveal shell's
delegate-fan-out card carries an end affordance per child. The
parent's delegate call is still blocking on all children Parking;
when a child ends before the others, its slot in the folded
result carries whatever FinalAnswer or `SessionEnded` reason
landed. The parent's tool_loop resumes when all children have
Parked or Ended.

The Architect's own words: "they have to return out right. They
all have to turn out or you have to be able to end them too."
Both paths land on the same folding step. All children finish or
ended → fold → ToolResult.

## Nested fan-out

A child is a session; the child's toolset carries `delegate`
(sprint 053 landed that). A child can call `delegate` with
`children: [...]` and itself fan out. Depth counting stays
chain-length under `max_depth=2` — the parent → child → grandchild
chain is bounded as it is today. Fan-out is horizontal; it does
not consume depth. That matches the Architect's example: "the
child that is qwen 3a b actually is like okay I will spin up three
parallel separate ones."

## Envelope shape on the parent record

**ONE `ToolCall(tool="delegate", args=[{children: [...]}])`.** Not
N. Payload names each child by index and driver so the record
carries what was asked for.

**Live per-child status** while the children run. Substrate emits
each child's `RunStarted / ProducerStarted / ProducerCompleted /
FinalAnswer / SessionEnded / RunFinalised` on the child record.
The parent record does not carry per-child streaming — the child
records do that. What the parent sees:

- One `ToolCall` (the delegate call itself).
- One `ToolResult` when all children Park or end.

Between those two envelopes, per-child status the reveal shell
renders comes from the child records directly, subscribed via
`streamRecordByPath` (which the reveal shell already uses for
child descent).

## What actually needs to change

Small list, in landing order:

1. **`substrate/src/substrate/topologies/tool_loop/delegate.py`**
   — grow the run closure to detect the `children` param. When
   present, mint N sessions through `SessionRegistry.create`,
   fire `turn_sync` on each in parallel threads, wait for all,
   fold. Existing single-child paths (session name / model /
   context / plain) unchanged.
2. **`substrate/src/substrate/topologies/tool_loop/delegate.py`
   schema** — add `children` field to the JSON schema. Keep every
   existing field.
3. **`web/vm/session_controller.ts`** — no change needed. The
   controller already attaches to child records via
   `attachRecordRoot`. The delegate ToolResult carries N
   child_roots; the controller renders them per D72's shape.
4. **Reveal shell tool card** — new variant when a delegate
   ToolCall's args contain `children`. Renders the D72 shape:
   `⑂ delegate → N children · X running · Y parked`, expandable
   to N rows (name, driver, record id, event count, live
   status), `↑↓` walks rows, `↵` descends via `attachRecordRoot`.
   Per-row end affordance calls the child's session-end path.
5. **Vocabulary v0.1** — one new tag on the reveal-shell side:
   `DELEGATE_FANOUT_CHILD_ATTACHED` (fires when the shell
   auto-subscribes to a child's stream after a fan-out delegate's
   ToolCall lands). Optional; `CHILD_RECORD_ATTACH_REQUESTED`
   already covers the descend case. Whether v0.1 grows this tag
   before ratification or waits for v0.2 is a discipline call.
6. **Shakeout Axis B** — one new flow `tool_delegate_many` that
   prompts the model to fan-out to three children and asserts the
   parent record carries one ToolCall + one ToolResult with three
   child_roots.

## What does NOT change

- No new topology.
- No new session-registry seam.
- No new envelope kind on the parent record beyond `ToolCall` +
  `ToolResult` (the same pair delegate already produces).
- No new termination policy.
- No new palette entry (D3 rules out `/delegate`).
- No new depth-counting rule (fan-out is horizontal).

## Questions still open

Two, both small:

- **Q1 — child spec fields.** The list above names `task, driver,
  workspace, tools, isolate, name`. Is that the full set the
  Architect wants surfaced at call time, or should some fields
  (workspace, isolate) inherit from the parent and not be
  per-child overridable?
- **Q2 — failure fold policy.** When one child errors: parent
  ToolResult carries `ok: true` with a `failed: {name: {error}}`
  entry alongside the successful `answers` dict (partial fold),
  or the whole ToolResult is `ok: false` with the same detail
  (strict fold)? Partial fold matches how a human reasons about
  a fan-out ("give me three answers, one flaked, use the other
  two"); strict fold is closer to `all_completed`.

Rule those two and the sprint card writes itself.
