# Sprint 052 — vocabulary shakeout

---

```yaml
id: 052
status: pending
phase: 5
pass_kind: observation
```

---

## scope

Land the shakeout harness the plan describes and run it. The harness
drives every reveal-shell user flow and every `tool_loop` tool
through `/` in real Chrome against a real server against a real
model, five runs per flow. Two products come out: a coverage grid
that grades the v0.1 vocabulary lock, and a bug list that files
defects against the reveal shell.

Ratification of `web/vm/signals/versions/0.1.json` follows a 5/5
coverage pass on every declared tag. The bug list drives
phase-6-adjacent sprint work.

## prerequisites

- `web/vm/signals/versions/0.1.json` exists and parses.
- `npm run smoke:vm` green against a live server.
- Architect ratification of the testing-system review (separate
  pass) before harness code lands.

## context_files

- `process/planning/PLAN-2026-09-21-r4-vocabulary-shakeout.md`
- `web/vm/signals/versions/0.1.json`
- `web/vm/signals/versions/0.1-rationale.md`
- `web/vm/session_controller.ts`
- `web/vm/instrumentation/sdd.ts`
- `web/vm/tools/check-vocabulary-parity.ts`
- `harness/vm_smoke.ts`
- `sdd-kit-2/ADDENDUMS.md` (Addendum A, section A2 — pixel-anchor
  decode)
- `substrate/src/substrate/topologies/tool_loop/tools.py` (the
  `TOOL_NAMES` frozenset — the Axis B tool list)

## signal contract

### Emits (per flow, assertion set)

The harness reads `window.__vmSignals` and grades under the rules
in the plan's Grading discipline section (shape not value, presence
not global order, at least once not exact N, 5/5 to lock).

- Cold boot: `DRIVER_ROSTER_LOADED`, `SESSIONS_LOADED`,
  `WORKSPACES_LOADED`, `BUNDLE_ROSTER_LOADED`, and `TOPOLOGY_LOADED`
  only when the URL binds a record.
- Chat one turn: `DRIVER_PICKED`, `SESSION_OPEN_REQUESTED`,
  `SESSION_OPEN_ACKED`, `STREAM_ATTACHED`, `TURN_SUBMITTED`,
  `TURN_ACK`, `STREAM_ENVELOPE_APPENDED` ≥ 1, `TURN_PARKED`,
  `SESSION_END_REQUESTED`, `SESSION_ENDED_LOCAL`, `STREAM_CLOSED`.
- Attach existing: `SESSION_ATTACH_STARTED`, `STREAM_ATTACHED`,
  `STREAM_ENVELOPE_APPENDED`.
- Interrupt: `TURN_INTERRUPTED` under both hard and soft entry
  points; `tier`, `signal`, `scope` fields present and correct type.
- Delegate: `CHILD_RECORD_ATTACH_REQUESTED`, `STREAM_ATTACHED` in
  the `record_root` branch, `STREAM_ENVELOPE_APPENDED` on the child,
  `STREAM_CLOSED`.
- Refused open: `SESSION_OPEN_REQUESTED`, `SESSION_OPEN_REFUSED`.
- Refused turn: `TURN_SUBMITTED`, `TURN_REFUSED`.
- Slash router: `SLASH_ROUTED` once per known slash;
  `SLASH_UNKNOWN` once.
- Bundle picked: `BUNDLE_PICKED`.
- Studio build: `SPEC_VALIDATE_REQUESTED`, `SPEC_VALIDATED`,
  `SPEC_BUILD_REQUESTED`, `SPEC_BUILT` on happy path;
  `SPEC_BUILD_REJECTED` on malformed fixture.
- Stream drop and reconnect: `STREAM_RECONNECTING`,
  `STREAM_ATTACHED`.

Union across all flows covers 30 / 30 tags in the lock.

### Consumes

- The current lock at `web/vm/signals/versions/current.json`.
- The reveal shell at `/` (real Chrome).
- The server at `http://127.0.0.1:8765` (harness-owned).

### Invariants

- No unknown tag reaches `sddEmit` — validator throws would abort
  the harness.
- Every payload field the lock names as required is present at emit
  time.
- Tag ordering inside a pair (request → ack/refused; envelope
  arrivals within a stream) holds; global ordering across
  independent boot loaders does not.

## artifact contract

### Files created

- `harness/shakeout/` — one file per Axis A flow (`cold_boot.ts`,
  `chat_one_turn.ts`, `attach_existing.ts`, `interrupt.ts`,
  `delegate.ts`, `refused_open.ts`, `refused_turn.ts`,
  `slash_router.ts`, `bundle_picked.ts`, `studio_build.ts`,
  `stream_reconnect.ts`) and one per Axis B tool
  (`tool_<name>.ts`).
- `harness/shakeout/lib/` — shared helpers: server-lifecycle
  control (spawn, SIGTERM, SIGSTOP, SIGCONT), model routing, the
  cleanup routine, the coverage grader, the report writer, the
  pixel-anchor readers for the three named surfaces.
- `harness/shakeout/run.ts` — the top-level runner that walks every
  flow, executes it five times, and produces the report.
- `captures/shakeout-2026-09-21/` — the JSON report and screenshots
  for the first run.

### Files modified

- `package.json` — add `"shakeout": "npx tsx harness/shakeout/run.ts"`.

### Content assertions

- `captures/shakeout-2026-09-21/report.json` exists.
- The report's per-flow section names every declared tag with a
  run-count array of length 5.
- The report's per-flow bug list is an array (may be empty).
- The report's summary line names `tags_at_5_of_5`, `tags_at_4_of_5`,
  `tags_below_4`, and `total_bugs`.

### Command exit codes

- `npm run shakeout` returns 0 when every declared tag is 5 / 5
  across every flow AND no harness or validator throw occurred; 1
  otherwise. The bug list does not affect the exit code — bugs are
  data, not gates.

## observation contract

### UI driving steps (per flow)

Each flow file names its own driving sequence. The plan's Axis A
section is the source. Every flow captures a terminal-state
screenshot to `captures/shakeout-2026-09-21/<flow>/run-<N>.png`.

### Expected log substrings

- `[vm-sdd]` never appears in the harness stderr — a validator throw
  would fail the run.
- Each flow's server log carries the substrate envelopes the flow
  claims land.

### Expected runtime signals

The per-flow tag lists in the signal contract above are the
expected runtime signals. Grader reads them from
`window.__vmSignals` at flow close.

### Expected screenshot / visible behavior

- Session status pill: color pixel at a known coordinate matches
  the design-token palette for the pill's declared state.
- Selected-driver pill: color pixel matches the palette.
- Connection-state indicator: color pixel matches the state
  (connected, reconnecting, closed).
- Everywhere else: the agent reads the screenshot at the end of
  each flow's five-run set and grades whether the surface looks
  right. Text and card content are not asserted; visible correctness
  is.

### Bug list

Each flow logs any defect the run observed. Categories: transcript
misrender, tool-card `[object Object]`, stuck spinner, silent SSE,
stale-pane bleed, wrong picker contents, refusal that reads as a
crash, click that opens the wrong record, tier bleed across turns,
soft interrupt behaving as hard, URL rewrite loses the bookmark. A
bug entry names: flow, run index, observed vs expected, screenshot
path, whether it reproduces across runs, severity guess.

## done criteria

- The harness runs end to end without a validator throw.
- Every declared tag runs 5 / 5 across every flow that names it.
- The bug list is written and reviewed.
- Architect writes the `## Decisions` entry ratifying the v0.1 lock.
- `web/vm/signals/versions/0.1.json` flipped to `locked: true` with
  today's date and the Decision citation in `locked_by`.

## notes

- The harness owns the server. Do not assume an external server is
  running.
- The testing-system review (`process/planning/` next round) is a
  separate pass before this card's code lands. That review sets the
  harness-architecture invariants — server ownership, model
  routing, cleanup guarantees, isolation between concurrent runs.
- Bug triage is not the lock's gate. A ratified lock can coexist
  with an open bug list; ratification depends on tag coverage
  alone. Bugs become follow-on sprint work, scheduled by severity.
- Duration budget: ~20 minutes with a local model, per r4 runbook.

## plan-mode review checklist

- [ ] Scope names two products: a coverage grid and a bug list.
- [ ] Every declared tag in `web/vm/signals/versions/0.1.json`
      appears in at least one flow's signal contract.
- [ ] Axis B covers every tool in `TOOL_NAMES`.
- [ ] Server-lifecycle plan covers refused open, stream drop,
      interrupt.
- [ ] Cleanup path names every dir the harness writes to.
- [ ] The `npm run shakeout` command lands in `package.json`.
- [ ] Sprint sweet spot honored: two files-and-a-runner is one
      concept — the shakeout harness. Sub-flow files are the
      internal decomposition, not separate sprints.
