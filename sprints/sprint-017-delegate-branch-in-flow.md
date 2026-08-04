# Sprint 017 — the delegate child as a navigable branch in the parent's flow (W2.2)

---

```yaml
---
id: 017
status: closed
phase: terminal
pass_kind: observation
---
```

> PRESSURE-TEST (2026-08-03, before build): (1) NOT already solved — the UI navigates records by name from
> the rail (`selectRecord`) but has no in-record linking and no `embedded_substrate`/inner-root handling.
> (2) A cockpit `/api/agent` run records to `runs/<name>.record` (SERVED) but its tool WORKSPACE is
> `~/.substrate/sessions/<session>`, and delegate roots child records under the workspace — so REAL cockpit
> delegate children land UNSERVED (and delegate is not yet in the cockpit suite). The server serves records
> BY NAME from `runs/` only. **Refinement (Architect: go with A):** the server RESOLVES a `ToolResult`'s
> `child_root` against the served set — servable (under `runs/`, as the demo's child is) → a navigable
> `▸ child` link; not servable → display-only `▸ child recorded at <path>`, never a dead link. The
> resolver matches the path against served records; it never READS the arbitrary path, so the traversal
> posture holds. The committed `demo_delegate` pair is the CI proof; live cockpit delegation (children into
> the served dir) is the named follow-on. (3) A committed record renders in the record/graph view
> (`render()`), a live run streams to the terminal dock (`_agentLine`) — the branch renders in both, off
> the one resolver.

---

## why

Phase W2.2 of application-parity (`docs/cockpit/WORKFLOW-PARITY-SPRINTS-2026-07-31.md`). W2.1 shipped
`delegate` in substrate: a parent agent hands a subtask to a child agent that runs as its OWN record,
and the parent's `ToolResult` carries `{answer, child_root, steps}`. Right now the UI shows the parent's
`ToolResult` as one line; the child run is invisible. W2.2 makes the child a NAVIGABLE BRANCH off that
`ToolResult` — click the delegated result, land in the child's record; a breadcrumb returns. This is the
UI half of the run-granularity provenance the tool result already carries: two records, stitched by
`child_root`, NOT one interleaved stream (the wire `ProducerRef` has no inner-provenance slot;
composition.py:28).

## the design fork (plan-mode decision)

The server serves records BY NAME from `runs/` only (`_record_path`, strict `_SAFE_RECORD_NAME` +
no-`..` traversal guard). The delegate `child_root` is an ABSOLUTE path outside `runs/`
(`<workspace>/delegate-runs/dN/record`). So the UI cannot just open `child_root` — that would punch a
read-arbitrary-path hole in the traversal-safety posture. Two ways to stitch:

- **A (recommended) — served-name convention.** The parent and child records the UI shows both live
  under the served dir, and the parent's `ToolResult` carries a servable child RECORD NAME (not only the
  absolute path). The UI links parent→child by name, through the existing `_record_path`; no new
  path-loading surface, the security posture is unchanged. The CI demo (a parent record with a delegate
  `ToolResult` + its child record, both under `runs/`, deterministic) is generated the way the other demo
  records are. This is the substrate-ui-idiomatic path (records are named things served from `runs/`).
- **B — resolve `child_root` server-side.** A `/api/records/<parent>/child/<n>` endpoint reads the
  parent's `ToolResult`, extracts `child_root`, and loads THAT absolute record. Rejected unless the
  Architect wants it: it reintroduces arbitrary-path reads the `_record_path` guard exists to prevent,
  and `child_root` points wherever the delegating run's workspace was — outside the server's control.

Recommendation: **A**. It keeps the read surface `runs/`-only and matches how every other record is
served. The cost is a small convention (delegate, when driven through the cockpit, writes child records
into the served dir and the result carries the name) — deferred to when live cockpit-delegation lands;
W2.2 proves the UI stitch on a committed demo pair first.

## scope (pending the fork ruling; written for A)

1. **`gen_demo_records.py`** — add a `demo_delegate` parent record whose transcript includes a delegate
   `ToolResult` carrying a child record NAME, plus that child record, both under `runs/`. Deterministic
   (scripted parent + scripted calculator child, no network) so it ships as a committed demo like the
   others.
2. **`server.py`** — `_io` (or the terminal projection) surfaces, for a `ToolResult` whose output names a
   child record, that child's name + a one-line summary, so the front end can render a link. No new
   record-loading path; it resolves the child by name through `_record_path`.
3. **`web/app.js`** — render a delegated `ToolResult` in the terminal dock with a `▸ child: <name>`
   affordance; clicking loads the child record into the view; a breadcrumb (`◂ parent`) returns. On-vocab
   copy (tone canon: lowercase, no emoji, textual markers).

## observation contract (two-track — REQUIRED, this touches the UI)

- **Track 1 — structural (`harness/e2e_*.js`, CI-gated real Chrome).** Load the `demo_delegate` parent;
  assert the delegated `ToolResult` renders a child-branch affordance naming the child record; click it;
  assert the child record's events render (its `FinalAnswer`); assert the breadcrumb returns to the
  parent. Folded into a gated harness (Addendum A7 — an assertion outside the gate does not protect).
- **Track 2 — perceptual (`harness/capture_*.js` → screenshot the agent VIEWS).** The parent flow with
  the child-branch affordance visible, and the child view with the breadcrumb — VIEWED and graded for
  legibility (Addendum A6 — element-screenshot a bounded surface, cap dimensions).

## context_files

- `../substrate/src/substrate/topologies/tool_loop/delegate.py` (the `ToolResult` shape: `child_root`)
- `server.py` (`_record_path`, `_records_index`, `_io`, `_PROJECTIONS` — the record read surface)
- `web/app.js` (the terminal dock: ToolCall/ToolResult/FinalAnswer rendering, `renderTerm`)
- `gen_demo_records.py` (how committed demo records are generated)
- `process/WORKING_AGREEMENT.md` (the eight-word tone canon — this UI has no vocabulary, the canon binds)
- `harness/e2e_console.js` + `harness/capture_console.js` (the two-track patterns to extend)

## done criteria

A committed `demo_delegate` record renders its delegated `ToolResult` as a branch that navigates to the
child record and back; both tracks of the observation contract pass in CI; the read surface stays
`runs/`-only. Live cockpit-driven delegation (child records into the served dir + the name on the result)
is a follow-on, noted not built.
