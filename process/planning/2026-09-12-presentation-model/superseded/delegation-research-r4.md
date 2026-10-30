# Delegation — r4 (2026-09-22)

*Supersedes `delegation-research-r3.md`. r3 asked for a single
`max_total_depth`. r4 rules three caps in — one vertical, one
horizontal, one tree-wide — with concrete defaults grounded in
Pass 3's research and the shell direction designs.*

## The four items, unchanged

1. Same task, N models in parallel.
2. Different tasks, N children in parallel.
3. Nested delegation with caller-set style.
4. Global caps on the tree so it cannot run away.

## Why three caps, not one

r3's single-integer cap fails two of the Architect's constraints
at once:

- **A wide-and-shallow tree needs a horizontal cap.** With one
  integer capping total depth at N, a root at depth 1 could spawn
  a thousand children (chain depth still 1). Nothing refuses it.
- **A deep-and-narrow tree needs a vertical cap.** With one
  integer capping total children summed across the tree, a
  linear chain of 64 delegates (each spawning one child) fits
  under the budget. Nothing refuses it. Debugging a 64-deep
  chain is unfixable in practice.

Both axes need guards. Add a tree-wide budget on top to catch
the wide-and-deep worst case that neither axis alone catches.

## The three caps

- **`max_depth = 5`** — vertical, chain length root → leaf. Matches
  Claude Code's built-in subagent depth cap and the shell design
  section 20f's five-level illustration. Room to compose several
  layers of orchestration without immediate refusal; too shallow
  to run away.
- **`max_children = 16`** — horizontal, fan-out at a single parent.
  Substrate today caps this at 4. That's tight for real fan-out
  work (a panel across a dozen files, an eight-model bake-off).
  Sixteen is generous enough for the common case; much larger
  than the depth cap per the Architect's steer that horizontal
  should be looser than vertical. Under Claude Code's Dynamic
  Workflows "tens to hundreds" — still cautious.
- **`max_total_children = 64`** — tree-wide budget across every
  descendant of the root. Every child spawned by any delegate
  call under the same root decrements a shared counter. When
  the counter hits zero, the next spawn refuses.

Any of the three refuses when exceeded, with a typed
`ToolResult(ok=false)` naming which cap fired.

### Sizing math, so the numbers are legible

Worst-case tree under `max_depth=5, max_children=16` alone:
1 + 16 + 16² + 16³ + 16⁴ + 16⁵ ≈ 1.1 million nodes. Absurd.
That's why `max_total_children` matters — it clips the tree
before the per-parent + per-chain caps admit an explosion.

Under all three caps at their defaults (5 / 16 / 64):

- A single flat fan-out to 16 children: 1 + 16 = 17 nodes,
  budget spent 16, well under 64.
- A three-level tree, three-wide at every level: 1 + 3 + 9 + 27 =
  40 nodes, budget spent 39, fits.
- A four-level tree, four-wide at every level: 1 + 4 + 16 + 64 =
  85 nodes → refused at the fourth level's 64th spawn. Firm cap.

64 is loose enough for real orchestration ("spin up a dozen
reviewers, each of which delegates twice for verification and
critique" = 12 + 24 = 36 nodes, fits). Tight enough that a
runaway tree refuses within seconds.

Each cap is a keyword arg on the root delegate call; nested
delegate calls cannot lift the cap they inherit from the root.

## The delegate call shape, updated

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

The three caps are settable at the root call site. When the root
sets them, every descendant inherits the same three integers.
When the root omits them, substrate's defaults apply.

## What the numbers are grounded in

- **Depth 5 comes from two independent references.** Claude Code's
  built-in subagent cap of 5. The shell direction design 20f
  showing five-level nested delegation as an illustration of the
  depth-hue rule. Both point at the same number.
- **Fan-out 16 comes from the Architect's steer that horizontal
  should be much larger than vertical.** Four times the vertical
  cap. Also matches OpenAI's guidance for practical
  parallel_tool_calls (no hard cap, but production advice
  centers ~10-20 concurrent calls before rate limits pinch).
- **Tree-total 64 comes from the "don't restrict users
  immediately" constraint** — 64 nodes lets a real orchestration
  breathe (a dozen or two children with a couple of
  sub-delegations each), while stopping a fast runaway.

If any of these turn out to be wrong in practice, they are
configurable at the root call; the defaults are just the shipped
ceiling, not the ceiling forever.

## Everything else from r2 and r3 stands

- Every child is a session; no new topology.
- `children` list on the delegate schema.
- One `ToolCall` on the parent, one folded `ToolResult` when all
  children Park or End.
- Reveal shell renders D72's aggregation card.
- Session end machinery unchanged; per-child end via the reveal
  shell's card affordance.

## Open questions

Two, unchanged:

- **Q1** — child spec fields (all six overridable per child, or
  some inherit only).
- **Q2** — failure fold policy (partial vs strict).

## The concrete change list

Same as r2/r3, tightened:

1. `substrate/src/substrate/topologies/tool_loop/delegate.py`
   — grow the run closure for `children`; carry the three caps
   from root through the child factory.
2. Delegate schema — `children`, `max_depth`, `max_children`,
   `max_total_children` fields.
3. Substrate's shipped defaults — bump `max_depth` from 2 → 5,
   `max_children` from 4 → 16, introduce `max_total_children=64`.
4. Reveal shell tool card — D72 aggregation variant.
5. Vocabulary — optional `DELEGATE_FANOUT_CHILD_ATTACHED` tag.
6. Shakeout — `tool_delegate_many` flow across all four items.
