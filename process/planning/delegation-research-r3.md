# Delegation — r3 (2026-09-22)

*Supersedes `delegation-research-r2.md`. r2 named the three
delegation shapes and the "every child is a session" premise. It
missed a fourth item: a single-integer cap on the total depth of
the fan-out tree. r3 adds it.*

## The four items

1. **Same task, N models in parallel.** 20g's shape. `children:
   [{task: T, driver: M1}, {task: T, driver: M2}, ...]`.
2. **Different tasks, N children in parallel.** `children:
   [{task: A, driver}, {task: B, driver}, {task: C, driver}]`.
3. **Nested delegation with caller-set style.** A child is a
   session; its toolset carries `delegate`; the child can itself
   call `delegate({children: [...]})`. Each call chooses the
   shape at its own call site.
4. **A single global cap on total depth across the whole tree.**
   One integer set at the root. Every child spawn — vertical
   chain step or horizontal fan-out spawn — sits at a depth in
   the tree. If a call would produce a child beyond the cap,
   refuse. Not two knobs. One number.

## The premise, unchanged

Every child is a session. Nothing new to author. Delegate
orchestrates over `SessionRegistry.create` / `turn_sync` / `end`.
The reveal shell already attaches to child records.

## The delegate call shape, updated

```
delegate(
  # single-child (existing):
  task,
  [model], [child_session_name], [context], [baseline],
  [timeout_seconds],

  # fan-out (new; when present, ignore the single-child fields):
  children: list of {task, [driver], [workspace], [tools],
                     [isolate], [name]},

  # total-depth cap (new; set at the root call, inherited down):
  [max_total_depth],
)
```

`max_total_depth` is one integer. When absent, defaults to
substrate's shipped value (probably the current `max_depth=2`, but
the exact default is Q for the Architect). When present, becomes
the tree's cap for every descendant call. Any call — chain or
fan-out — whose depth would exceed the cap refuses with a typed
`ToolResult(ok=false)`.

Every child inherits the root's `max_total_depth`; a nested
delegate call cannot lift its own cap.

## What actually needs to change

Same list as r2, plus one:

1. `delegate.py` — grow the run closure to handle `children` list.
2. `delegate.py` — carry `max_total_depth` from the root through
   the child factory to every descendant delegate call. Replace
   the current `max_depth` semantics (chain-only) with the total
   tree-depth semantic.
3. `delegate.py` schema — add `children` and `max_total_depth`
   fields.
4. Reveal shell tool card — the D72 aggregation variant.
5. Vocabulary — optional `DELEGATE_FANOUT_CHILD_ATTACHED` tag.
6. Shakeout — `tool_delegate_many` flow.

## Open questions

Two, both small:

- **Q1 — child spec fields.** Same as r2. Are all six fields
  overridable per child, or do some (workspace, isolate) inherit
  and stay non-overridable?
- **Q2 — failure fold policy.** Same as r2. Partial fold (one
  child errors, other answers still returned) or strict fold
  (any error fails the whole ToolResult)?
