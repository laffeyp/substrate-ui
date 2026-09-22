# Vocabulary shakeout — 2026-09-21 (r3)

Supersedes `PLAN-2026-09-21-r2-vocabulary-shakeout.md`. r1 graded by
strict equality (broken under model non-determinism). r2 fixed the
grading discipline. r3 closes the mechanical gaps a review of r2
surfaced: server lifecycle for negative flows, studio-build fixture
strategy, ratification threshold, runbook, and the tool-coercion
question.

## Purpose

The reveal shell's v0.1 lock is drafted at
`web/vm/signals/versions/0.1.json` (30 tags, `locked: false`). Before
we ratify, drive every emit call site through a real user path and
prove every tool the model can call actually round-trips through
substrate. Every throw inside `sddEmit` at runtime, every
under-covered tag, every wrong payload field surfaces here.

Two axes of coverage. Axis A drives the reveal shell's own emits.
Axis B drives the model's tool calls and checks the substrate record.

## Axis A — reveal-shell user flows

Each flow drives a real action through `/` in real Chrome. Assertions
read `window.__vmSignals` (the validated buffer) and `window.__vmTape`
(the per-pane ring). The lock is right when every flow closes without
a validator throw and every tag it names fires at least once under
the coverage rule.

- **Cold boot.** Load `/`. `DRIVER_ROSTER_LOADED`, `SESSIONS_LOADED`,
  `WORKSPACES_LOADED`, `BUNDLE_ROSTER_LOADED` fire once each.
  `TOPOLOGY_LOADED` fires only if the URL binds a record.
- **Chat, one turn.** Pick a driver, submit a prompt, wait for Park,
  end. Asserts `DRIVER_PICKED`, `SESSION_OPEN_REQUESTED`,
  `SESSION_OPEN_ACKED`, `STREAM_ATTACHED` (session_id variant),
  `TURN_SUBMITTED`, `TURN_ACK`, `STREAM_ENVELOPE_APPENDED` ≥ 1,
  `TURN_PARKED`, `SESSION_END_REQUESTED`, `SESSION_ENDED_LOCAL`,
  `STREAM_CLOSED`. Already green in `npm run smoke:vm`.
- **Attach to existing session.** Load `/?session=<id>` or click a rail
  row. Asserts `SESSION_ATTACH_STARTED`, `STREAM_ATTACHED`, replay via
  `STREAM_ENVELOPE_APPENDED`.
- **Interrupt in flight.** Ctrl+C during a long turn (hard, signal
  true), then `/interrupt` on another (soft, signal false).
  `TURN_INTERRUPTED` fires under both entry points with the correct
  `tier`, `signal`, `scope` fields.
- **Delegate a child.** Prompt the model to spawn a child via
  `delegate`. `CHILD_RECORD_ATTACH_REQUESTED`, then `STREAM_ATTACHED`
  in the `record_root` variant (the branch a chat-only flow never
  exercises), `STREAM_ENVELOPE_APPENDED` on the child stream,
  `STREAM_CLOSED` on child finalise.
- **Refused open.** Open a session while the server is stopped (see
  Server lifecycle below). `SESSION_OPEN_REQUESTED` then
  `SESSION_OPEN_REFUSED` with `failure_class` and `detail` non-empty.
- **Refused turn.** Submit a turn against an ended session.
  `TURN_SUBMITTED` then `TURN_REFUSED`.
- **Slash router.** Run every known slash (`/help`, `/model`,
  `/clear`, `/ls`, `/list`, `/name`, `/tools`, `/workspace`,
  `/bundle`, `/isolate`, `/interrupt`, `/exit`) and one nonsense
  slash. Each known one fires `SLASH_ROUTED` with the right `cmd`;
  the nonsense fires `SLASH_UNKNOWN`.
- **Bundle picked.** Click a bundle. `BUNDLE_PICKED` with the slug.
- **Studio build.** Author a fixture spec, validate, build against the
  `deterministic` responder so the run finishes in milliseconds.
  `SPEC_VALIDATE_REQUESTED`, `SPEC_VALIDATED (valid=true)`,
  `SPEC_BUILD_REQUESTED`, `SPEC_BUILT` with `run_name` non-empty and
  `status` a known status string. A deliberately malformed fixture
  fires `SPEC_BUILD_REJECTED` with `reason` non-empty.
- **Stream drop and reconnect.** SIGSTOP the server mid-turn, wait,
  SIGCONT. `STREAM_RECONNECTING`, then `STREAM_ATTACHED` again on
  recovery. See Server lifecycle for the control mechanism.

## Axis B — model tool coverage

For each tool in the `tool_loop` suite, drive the model through the
reveal shell to demonstrate it and verify the substrate record.

Tools (from `substrate/src/substrate/topologies/tool_loop/tools.py`
`TOOL_NAMES`): `add`, `mul`, `read_file`, `list_dir`, `glob`, `grep`,
`web_fetch`, `edit_file`, `write_file`, `bash`, `inspect_record`,
`list_records`, `list_sessions`, `list_topologies`,
`list_applications`, `run_topology`, `run_topology_poll`, `delegate`.

### Tool-coercion strategy

Substrate is self-describing. The `tool_loop` topology passes every
tool's `name`, `description`, and JSON-schema `parameters` into the
model's system prompt at session boot. The model sees the full
inventory. This means induction is a one-liner per tool:

> "Please demonstrate the `<tool_name>` tool by calling it once and
> reporting what you got back."

That prompt works for every tool in the list above — including
meta-tools like `list_topologies`, `list_applications`,
`inspect_record`, `run_topology_poll` — because the model does not
have to invent them; it reads the schema and picks.

One session configuration matters: the harness opens the session with
the full toolset (no `/tools` filter, no bundle that restricts
tooling), so every tool is reachable. That is the only configuration
knob the coercion strategy depends on.

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
  boot loaders (`DRIVER_ROSTER_LOADED` / `SESSIONS_LOADED` /
  `WORKSPACES_LOADED` / `BUNDLE_ROSTER_LOADED` race by design).
- **At least once, not exactly N.** `STREAM_ENVELOPE_APPENDED` fires
  once per envelope; a chat turn produces variable counts. Assert
  count ≥ 1 for chat-turn flows; assert exact count only for a
  deterministic bundled record played back.
- **Substrate tool calls: type match, not arg match.** For `read_file`,
  `arguments.path` is a string; do not assert which path. For `bash`,
  `arguments.command` is a string; do not assert the command text.
- **Perceptual check by look, not by pixel equality.** Capture a
  screenshot at the flow's terminal state. The agent (vision-model
  judge) or the human reads it and grades whether the surface
  matches the intent. Do not diff against a golden PNG.

Pixel-anchor decode (`sdd-kit-2/ADDENDUMS.md`, Addendum A, section
A2) is the strict-perceptual gate for surfaces whose state is
mechanically recoverable from pixel colors at known coordinates. In
the reveal shell that is a small set: the session status pill's
color from the design-token palette, the connection-state indicator,
the selected-driver pill. Elsewhere the state is text and cards;
"look at it" is the right check.

### Coverage rule and ratification threshold

- Run each flow **five times**.
- **5 / 5** on every declared tag: pass. The lock can flip to
  `locked: true`.
- **4 / 5** on any tag: pass with warning. The flake gets diagnosed
  before ratification. Either the flow is flaky (fix the harness),
  the tag is conditional in a way the plan did not name (fix the
  plan), or the code has a race (fix the code). The lock does not
  flip until every tag runs 5 / 5.
- **≤ 3 / 5** on any tag: blocker. Do not ratify. Diagnose and refix.
- **0 / 5** on any tag: either a lock defect (dead tag — remove) or a
  code defect (an emit call site never reached — remove or fix the
  path).

## Server lifecycle and environment control

The harness owns the server. It is not "start the server, then run
the tests" — the tests need to start, stop, and impede the server on
demand.

- **Start / stop.** The harness spawns `server.py` in a subprocess it
  owns. On flow entry it ensures the server is up; on flow exit it
  can leave it running (fast flows) or SIGTERM and respawn (flows
  that need a fresh state).
- **Refused open.** The `refused open` flow SIGTERMs the server, opens
  a session in the browser, expects `SESSION_OPEN_REFUSED`, then
  restarts the server before the next flow.
- **Stream drop and reconnect.** SIGSTOP freezes the server without
  killing it; SIGCONT resumes it. The SSE connection sees no bytes
  during the freeze, the client's 1s reconnect timer fires,
  `STREAM_RECONNECTING` lands, and SIGCONT restores traffic so
  `STREAM_ATTACHED` fires again.
- **Interrupt in flight.** The flow prompts a long-running turn (a
  `bash` sleep, a large `read_file`), fires the interrupt (Ctrl+C
  via Playwright keyboard event; `/interrupt` via the terminal
  input), and reads `TURN_INTERRUPTED`.

Model routing: the harness picks the driver per flow. Deterministic
flows (studio build, cold boot) use `deterministic`. Tool-coverage
flows use a real model — `llama3:8b` locally if Ollama is up, or
`kimi-k2.7-code:cloud` when a cloud key is present. The routing is
one env-var away from the smoke test's pattern.

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
  Deterministic flows finish in under a second; real-model flows are
  bounded by model latency. Full budget with a local model is
  ~20 minutes; with a cloud model it depends on the model.
- **Environment.** Assumes Chrome installed (Playwright
  `channel:'chrome'`), the substrate repo present at
  `../substrate/`, and either Ollama running or a cloud key set. The
  server lives on `http://127.0.0.1:8765` per project convention.
- **Report.** Each full pass writes a JSON report under
  `captures/shakeout-<YYYY-MM-DD>/` naming, per flow: which tags
  fired in which count over five runs, which shape assertions
  passed, which failed with reason, the screenshot path for the
  terminal state.

## Process (SDD scaffold)

One sprint card covers the shakeout. It declares:

- **Signal contract** — the set of tags each flow's harness asserts
  against.
- **Artifact contract** — the harness files under `harness/`, one per
  flow; the JSON report under `captures/shakeout-<date>/`; the
  screenshot directory.
- **Observation contract** — for each flow, the expected transcript
  shape, the terminal-state screenshot the agent captures and reads,
  the specific pixel-anchor checks where they apply (the three
  named surfaces above).
- **Rubber Duck Pass at close** — walk each flow's signal trace in
  vocabulary terms; log gaps or over-coverage as v0.2 proposals.

The card cites this plan as `context_files`. The card lands, the
harnesses land, the runs land, the report reads either "every tag
covered 5 / 5" or "these tags need attention." Fix, re-run, ratify.

## Separate: testing-system review

The shakeout is one plan. The harness architecture — server ownership,
model routing, retry policy, cleanup guarantees, report format, CI
integration, isolation between concurrent test runs — is another. It
gets its own review pass before harness code lands, so the shakeout
plan is not carrying the weight of "how do we run any model-driven
test suite in general." That review comes after r3 is ratified.

## After the pass

1. Flip `web/vm/signals/versions/0.1.json` to `locked: true`, fill
   `locked_at` with the date and `locked_by` with the Architect's
   ratification citation.
2. Architect writes the `## Decisions` entry.
3. Move to phase 6 (retire the classic shell).
