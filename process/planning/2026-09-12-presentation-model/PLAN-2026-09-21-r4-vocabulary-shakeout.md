# Vocabulary shakeout — 2026-09-21 (r4)

Supersedes `PLAN-2026-09-21-r3-vocabulary-shakeout.md`. r1 broke under
model non-determinism. r2 fixed grading. r3 closed the mechanical
gaps. r4 names the second purpose the earlier revisions implied but
never stated as a first-class goal.

## Two purposes

1. **Prove / refine the vocabulary lock.** Every emit call site fires
   under a real user path; every declared tag covers a real code
   path; every payload field lands with the shape the lock names.
   Under-covered tags and mismatches surface here.
2. **Hunt bugs in the reveal shell.** Every flow drives real code
   through real Chrome against a real server against a real model.
   Bugs the smoke test never touched — a broken slash handler, a
   stream that never reconnects, a delegate that never attaches, a
   silent SSE, a stale-pane bleed — surface here too, and they are
   the whole point of running the shakeout live rather than as an
   isolated vocabulary check.

Both purposes share one harness. Each flow's report names two
outcomes: tag coverage (per Grading discipline below) and defects
observed (a list of anything wrong on screen, in the log, in the
transcript, or in the substrate record — filed against the reveal
shell as sprint work, not the lock). The lock ratifies on tag
coverage. The bug list drives the next round of fixes.

## Purpose

The reveal shell's v0.1 lock is drafted at
`web/vm/signals/versions/0.1.json` (30 tags, `locked: false`). Before
we ratify, drive every emit call site through a real user path and
prove every tool the model can call actually round-trips through
substrate. Every throw inside `sddEmit` at runtime, every
under-covered tag, every wrong payload field, and every code defect
the driven flow surfaces gets caught here.

Two axes of coverage. Axis A drives the reveal shell's own emits.
Axis B drives the model's tool calls and checks the substrate record.

## Axis A — reveal-shell user flows

Each flow drives a real action through `/` in real Chrome. Assertions
read `window.__vmSignals` (the validated buffer) and `window.__vmTape`
(the per-pane ring). The lock is right when every flow closes without
a validator throw and every tag it names fires at least once under
the coverage rule. In addition, each flow captures a defect list —
anything the run does wrong that a user would call broken.

- **Cold boot.** Load `/`. `DRIVER_ROSTER_LOADED`, `SESSIONS_LOADED`,
  `WORKSPACES_LOADED`, `BUNDLE_ROSTER_LOADED` fire once each.
  `TOPOLOGY_LOADED` fires only if the URL binds a record. Watch for
  boot loaders that hang, empty rosters when the server has content,
  incorrect defaults.
- **Chat, one turn.** Pick a driver, submit a prompt, wait for Park,
  end. Asserts `DRIVER_PICKED`, `SESSION_OPEN_REQUESTED`,
  `SESSION_OPEN_ACKED`, `STREAM_ATTACHED` (session_id variant),
  `TURN_SUBMITTED`, `TURN_ACK`, `STREAM_ENVELOPE_APPENDED` ≥ 1,
  `TURN_PARKED`, `SESSION_END_REQUESTED`, `SESSION_ENDED_LOCAL`,
  `STREAM_CLOSED`. Already green in `npm run smoke:vm`. Watch for
  transcript rows that render wrong, tool cards that show
  `[object Object]`, empty replies, stuck spinners.
- **Attach to existing session.** Load `/?session=<id>` or click a rail
  row. Asserts `SESSION_ATTACH_STARTED`, `STREAM_ATTACHED`, replay via
  `STREAM_ENVELOPE_APPENDED`. Watch for a URL rewrite that loses the
  bookmark, an SSE that never opens, a rail click that opens the
  wrong record.
- **Interrupt in flight.** Ctrl+C during a long turn (hard, signal
  true), then `/interrupt` on another (soft, signal false).
  `TURN_INTERRUPTED` fires under both entry points with the correct
  `tier`, `signal`, `scope` fields. Watch for a tier that carries
  across turns, a signal that fires but the model does not stop, a
  soft interrupt that acts like a hard one.
- **Delegate a child.** Prompt the model to spawn a child via
  `delegate`. `CHILD_RECORD_ATTACH_REQUESTED`, then `STREAM_ATTACHED`
  in the `record_root` variant, `STREAM_ENVELOPE_APPENDED` on the
  child stream, `STREAM_CLOSED` on child finalise. Watch for a card
  that never opens the child pane, a child that runs but never
  streams to the UI, `[object Object]` outputs from the parent's
  view of the child's answer.
- **Refused open.** Open a session while the server is stopped.
  `SESSION_OPEN_REQUESTED` then `SESSION_OPEN_REFUSED` with
  `failure_class` and `detail` non-empty. Watch for a UI that hangs
  instead of surfacing the refusal, a message that reads like a
  crash instead of a rejection.
- **Refused turn.** Submit a turn against an ended session.
  `TURN_SUBMITTED` then `TURN_REFUSED`. Watch for the input clearing
  before the refusal renders.
- **Slash router.** Run every known slash (`/help`, `/model`,
  `/clear`, `/ls`, `/list`, `/name`, `/tools`, `/workspace`,
  `/bundle`, `/isolate`, `/interrupt`, `/exit`) and one nonsense
  slash. Each known one fires `SLASH_ROUTED` with the right `cmd`;
  the nonsense fires `SLASH_UNKNOWN`. Watch for a slash that fires
  but the terminal transcript never reflects the effect.
- **Bundle picked.** Click a bundle. `BUNDLE_PICKED` with the slug.
  Watch for a picker that shows bundles the server does not know or
  omits ones it does.
- **Studio build.** Author a fixture spec, validate, build against the
  `deterministic` responder. `SPEC_VALIDATE_REQUESTED`,
  `SPEC_VALIDATED (valid=true)`, `SPEC_BUILD_REQUESTED`, `SPEC_BUILT`
  with `run_name` non-empty and `status` a known status string. A
  malformed fixture fires `SPEC_BUILD_REJECTED`. Watch for a build
  that succeeds server-side but the UI never confirms.
- **Stream drop and reconnect.** SIGSTOP the server mid-turn, wait,
  SIGCONT. `STREAM_RECONNECTING`, then `STREAM_ATTACHED` again on
  recovery. Watch for a UI that stays silent through the outage or
  that reconnects but drops events.

## Axis B — model tool coverage

For each tool in the `tool_loop` suite, drive the model through the
reveal shell to demonstrate it and verify the substrate record.

Tools: `add`, `mul`, `read_file`, `list_dir`, `glob`, `grep`,
`web_fetch`, `edit_file`, `write_file`, `bash`, `inspect_record`,
`list_records`, `list_sessions`, `list_topologies`,
`list_applications`, `run_topology`, `run_topology_poll`, `delegate`.

### Tool-coercion strategy

Substrate is self-describing. The `tool_loop` topology passes every
tool's `name`, `description`, and JSON-schema `parameters` into the
model's system prompt at session boot. The model sees the full
inventory. Induction is a one-liner per tool:

> "Please demonstrate the `<tool_name>` tool by calling it once and
> reporting what you got back."

Works for every tool in the list — including meta-tools like
`list_topologies`, `list_applications`, `inspect_record`,
`run_topology_poll`. One session-configuration knob matters: open
the session with the full toolset (no `/tools` filter, no bundle
that restricts tooling).

### Per-tool assertion shape

- The substrate record on disk contains **at least one** `ToolCall`
  envelope with `tool_name == <the tool>` and `arguments` matching
  the tool's schema (key presence and value types; not value
  equality).
- A paired `ToolResult` envelope follows with `output` present. A
  non-error output is the pass case; a typed error observation is
  acceptable only when the flow deliberately tests a failure path.
- Where the tool's use should fire a controller tag (today only
  `delegate` → `CHILD_RECORD_ATTACH_REQUESTED`), assert that tag
  lands in `window.__vmSignals`.

### Bug list (Axis B)

For each tool, the flow logs: whether the tool card renders
readable output (not `[object Object]`), whether error observations
render clearly, whether long outputs truncate or overflow, whether
the paired result reaches the UI at all.

## Grading discipline

The test drives a model. The model is non-deterministic. Grading
strictly by value breaks on the second run. Grade by shape.

- **Payload shape, not payload value.** `payload.turn_index` is a
  non-negative integer. `payload.text_length` is a positive integer.
  `payload.park_reason` is a non-empty string. Do not assert exact
  values.
- **Tag presence, not tag ordering across independent chains.** Enforce
  order inside a pair (`TURN_SUBMITTED` precedes `TURN_ACK`;
  `SESSION_OPEN_REQUESTED` precedes `SESSION_OPEN_ACKED` or
  `SESSION_OPEN_REFUSED`). Do not enforce order across independent
  boot loaders.
- **At least once, not exactly N.** `STREAM_ENVELOPE_APPENDED` fires
  once per envelope; a chat turn produces variable counts.
- **Substrate tool calls: type match, not arg match.** For `read_file`,
  `arguments.path` is a string; do not assert which path.
- **Perceptual check by look, not by pixel equality.** Capture a
  screenshot at the flow's terminal state. The agent or the human
  reads it. Do not diff against a golden PNG.

Pixel-anchor decode (`sdd-kit-2/ADDENDUMS.md`, Addendum A, section
A2) is the strict-perceptual gate for surfaces whose state is
mechanically recoverable — the session status pill's color from the
design-token palette, the connection-state indicator, the
selected-driver pill. Elsewhere the state is text and cards; "look
at it" is the right check.

### Coverage rule and ratification threshold

- Run each flow **five times**.
- **5 / 5** on every declared tag: pass. The lock can flip to
  `locked: true`.
- **4 / 5** on any tag: pass with warning. Diagnose before
  ratification. Either the flow is flaky, the tag is conditional in
  a way the plan did not name, or the code has a race. The lock does
  not flip until every tag runs 5 / 5.
- **≤ 3 / 5** on any tag: blocker. Do not ratify.
- **0 / 5** on any tag: either a lock defect (dead tag) or a code
  defect (an emit call site never reached).

### Bug triage

Defects surfaced by the run get filed against the reveal shell (not
the lock). Each entry names: the flow that surfaced it, what
happened vs what should have happened, the screenshot path, whether
it reproduces on repeat runs, and a severity guess. The list drives
follow-on sprint cards; the lock can ratify with open bugs on the
list as long as tag coverage is 5 / 5, but the Architect can also
choose to hold ratification until specific bugs close.

## Server lifecycle and environment control

The harness owns the server. It is not "start the server, then run
the tests" — the tests need to start, stop, and impede the server on
demand.

- **Start / stop.** The harness spawns `server.py` in a subprocess it
  owns.
- **Refused open.** SIGTERM the server, open a session, expect
  `SESSION_OPEN_REFUSED`, restart the server.
- **Stream drop and reconnect.** SIGSTOP freezes the server without
  killing it; SIGCONT resumes it.
- **Interrupt in flight.** The flow prompts a long-running turn (a
  `bash` sleep, a large `read_file`), fires the interrupt.

Model routing: deterministic flows use `deterministic`; tool-coverage
flows use `llama3:8b` locally if Ollama is up, or
`kimi-k2.7-code:cloud` when a cloud key is present.

## Runbook

- **Command.** `npm run shakeout` (to be added to `package.json`).
- **Cleanup.** Between flows the harness wipes:
  - `~/.substrate/sessions/s_<any>/` for any session id the run
    opened,
  - `~/.substrate/runs/<name>` for any studio-built run,
  - `/tmp/shakeout/` — the scratch path every `edit_file` /
    `write_file` test writes under.
- **Duration budget.** Ten Axis A flows × 5 runs each ≈ 50 driven
  turns. Eighteen Axis B tools × 5 runs each ≈ 90 driven turns.
  Deterministic flows finish in under a second; real-model flows
  bounded by model latency. ~20 minutes with a local model.
- **Environment.** Assumes Chrome installed, the substrate repo
  present at `../substrate/`, and either Ollama running or a cloud
  key set. The server lives on `http://127.0.0.1:8765`.
- **Report.** Each pass writes a JSON report under
  `captures/shakeout-<YYYY-MM-DD>/` naming, per flow: which tags
  fired in which count over five runs, which shape assertions
  passed, the screenshot path, and the bug list from the run.

## Process (SDD scaffold)

One sprint card covers the shakeout. It declares:

- **Signal contract** — the set of tags each flow's harness asserts
  against.
- **Artifact contract** — the harness files under `harness/`, one per
  flow; the JSON report under `captures/shakeout-<date>/`; the
  screenshot directory.
- **Observation contract** — for each flow, the expected transcript
  shape, the terminal-state screenshot the agent captures and reads,
  the specific pixel-anchor checks where they apply, the bug list
  the flow produces.
- **Rubber Duck Pass at close** — walk each flow's signal trace in
  vocabulary terms; log gaps or over-coverage as v0.2 proposals; log
  the bug list as pending sprint cards.

The card cites this plan as `context_files`.

## Separate: testing-system review

The shakeout is one plan. The harness architecture — server ownership,
model routing, retry policy, cleanup guarantees, report format, CI
integration, isolation between concurrent test runs — is another. It
gets its own review pass before harness code lands.

## After the pass

1. Flip `web/vm/signals/versions/0.1.json` to `locked: true`, fill
   `locked_at` with the date and `locked_by` with the Architect's
   ratification citation. Tag coverage 5 / 5 is the gate.
2. Architect writes the `## Decisions` entry.
3. Move to phase 6 (retire the classic shell).
4. Bug list from the shakeout becomes phase-6-adjacent sprint work,
   scheduled by severity.
