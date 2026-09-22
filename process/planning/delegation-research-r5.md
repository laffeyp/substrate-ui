# Delegation — r5 (2026-09-22)

*Supersedes `delegation-research-r4.md`. r4 left two questions
open. Both fall out of SDD + substrate principles under a plain
reading. r5 rules them in and closes the memo.*

## The four items, unchanged

1. Same task, N models in parallel.
2. Different tasks, N children in parallel.
3. Nested delegation with caller-set style.
4. Three caps: `max_depth=5`, `max_children=16`,
   `max_total_children=64`. All root-settable, all inherited by
   descendants, all refuse with typed `ToolResult(ok=false)`.

## Q1 — child spec fields, ruled

**Every one of the six fields is overridable per child.** No
partial set, no field marked inherit-only.

Reasoning from principle:

- Every child is a session. `POST /api/session` accepts `task,
  driver, workspace, tools, isolate, name` at create time.
- Same vocabulary at every seam (SDD principle: the vocabulary
  is the contract). The child spec cannot use a narrower
  subset than the session-open API without introducing a second
  vocabulary for the same primitive.
- Absent fields inherit from substrate's session defaults, which
  is how `POST /api/session` already treats absent fields.
- A caller who wants three children on three workspaces should
  be able to say so. Silently inheriting the parent's workspace
  removes an observable choice the caller made — legibility
  suffers.

## Q2 — failure fold policy, ruled

**Partial fold.** ToolResult carries `answers` for successful
children and `failed` for the ones that errored, alongside each
other. Overall `ok: true` when at least one child produced a
FinalAnswer. Overall `ok: false` only when every child failed
and there is nothing to fold.

Reasoning from principle:

- Halt-and-articulate: errors surface with typed reasons.
  Silence on a failed child violates the rule; the ToolResult
  needs to carry the failure.
- The record is truth. Both success and failure envelopes are
  first-class; a fan-out result that hides the failures makes
  the record less honest, not more.
- Human reasoning about fan-out: "give me three answers from
  three models; if one flakes, use the other two." Partial fold
  matches how a caller actually uses the result.
- Strict fold discards work: three children run, two succeed,
  one fails — strict fold returns `ok: false` with no successful
  answers surfaced, forcing the caller to re-run everything.
  Wasteful, and un-substrate: the two successful child records
  are on disk anyway; the fold should reflect that.

## The final ToolResult shape

```
{
  ok: true | false,
  answers: {<child_name>: "..."},
  child_roots: {<child_name>: "/path/to/record"},
  steps: {<child_name>: N},
  failed: {<child_name>: {error, failure_class}},
}
```

- `answers` and `failed` are disjoint. A child name appears in
  exactly one.
- `child_roots` and `steps` cover every child (successful and
  failed) so the caller can descend into any child's record.
- `ok: false` when `answers` is empty AND `failed` is non-empty.
- `ok: true` otherwise (at least one child produced a
  FinalAnswer).

## The delegate call shape, final

```
delegate(
  # single-child (existing):
  task,
  [model], [child_session_name], [context], [baseline],
  [timeout_seconds],

  # fan-out (r2, r3):
  children: list of {task, [driver], [workspace], [tools],
                     [isolate], [name]},

  # caps (r4; all inherited by descendants):
  [max_depth],           # default 5
  [max_children],        # default 16, per parent
  [max_total_children],  # default 64, whole tree
)
```

## The concrete change list, final

1. `substrate/src/substrate/topologies/tool_loop/delegate.py` —
   grow the run closure for `children`; carry the three caps
   from root through the child factory to every descendant.
2. Delegate schema — add `children`, `max_depth`, `max_children`,
   `max_total_children` fields.
3. Substrate's shipped defaults — bump `max_depth` from 2 → 5,
   `max_children` from 4 → 16, introduce
   `max_total_children=64`.
4. Reveal shell tool card — D72 aggregation variant (one ⑂ line,
   expandable to N rows, `↑↓` walks, `↵` descends, per-row end
   affordance).
5. Vocabulary — optional `DELEGATE_FANOUT_CHILD_ATTACHED` tag on
   the reveal-shell side.
6. Shakeout — `tool_delegate_many` Axis B flow with three
   variants (same-task-N-models, different-tasks-N-children,
   nested).

## What r5 closes

Every question. r5 is the ratifiable memo. Sprint cards land
against it.
