# Vocabulary shakeout — 2026-09-21 (r2)

Supersedes `PLAN-2026-09-21-vocabulary-shakeout.md`. That draft graded
by strict equality; a model-driven test breaks under equality on the
second run because the reply text, tool arg strings, and per-turn
tool ordering are all non-deterministic. r2 grades by shape, not by
value.

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
a validator throw and every tag it names fires at least once.

- **Cold boot.** Load `/`. `DRIVER_ROSTER_LOADED`, `SESSIONS_LOADED`,
  `WORKSPACES_LOADED`, `BUNDLE_ROSTER_LOADED` fire once each.
  `TOPOLOGY_LOADED` fires only if the URL binds a record.
- **Chat, one turn.** Pick a driver, submit a prompt, wait for Park,
  end. Asserts `DRIVER_PICKED`, `SESSION_OPEN_REQUESTED`,
  `SESSION_OPEN_ACKED`, `STREAM_ATTACHED` (session_id variant),
  `TURN_SUBMITTED`, `TURN_ACK`, `STREAM_ENVELOPE_APPENDED` at least
  once, `TURN_PARKED`, `SESSION_END_REQUESTED`, `SESSION_ENDED_LOCAL`,
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
  `STREAM_CLOSED` when the child finalises.
- **Refused open.** Open a session against an unreachable server or a
  bad driver. `SESSION_OPEN_REQUESTED` then `SESSION_OPEN_REFUSED`
  with `failure_class` and `detail` non-empty strings.
- **Refused turn.** Submit a turn against an ended session.
  `TURN_SUBMITTED` then `TURN_REFUSED`.
- **Slash router.** Run every known slash (`/help`, `/model`,
  `/clear`, `/ls`, `/list`, `/name`, `/tools`, `/workspace`,
  `/bundle`, `/isolate`, `/interrupt`, `/exit`) and one nonsense
  slash. Each known one fires `SLASH_ROUTED` with the right `cmd`;
  the nonsense fires `SLASH_UNKNOWN`.
- **Bundle picked.** Click a bundle. `BUNDLE_PICKED` with the slug.
- **Studio build.** Author a spec, validate, build.
  `SPEC_VALIDATE_REQUESTED`, `SPEC_VALIDATED (valid=true)`,
  `SPEC_BUILD_REQUESTED`, `SPEC_BUILT` with `run_name` and `status`.
  A deliberately bad spec fires `SPEC_BUILD_REJECTED` with `reason`.
- **Stream drop and reconnect.** Kill the server mid-turn, restore.
  `STREAM_RECONNECTING`, then `STREAM_ATTACHED` again on recovery.

## Axis B — model tool coverage

For each tool in the `tool_loop` suite, drive the model through the
reveal shell to demonstrate it and verify the substrate record.

Tools (from `substrate/src/substrate/topologies/tool_loop/tools.py`
`TOOL_NAMES`): `add`, `mul`, `read_file`, `list_dir`, `glob`, `grep`,
`web_fetch`, `edit_file`, `write_file`, `bash`, `inspect_record`,
`list_records`, `list_sessions`, `list_topologies`,
`list_applications`, `run_topology`, `run_topology_poll`, `delegate`.

Per-tool assertion shape:

- The substrate record on disk contains **at least one** `ToolCall`
  envelope with `tool_name == <the tool>` and `arguments` matching
  the tool's schema (structural — key presence and value types, not
  value equality).
- A paired `ToolResult` envelope follows with `output` present. A
  non-error output is the pass case; a typed error observation is
  acceptable only when the flow deliberately tests a failure path.
- If the tool's use should fire a controller tag (today only
  `delegate` → `CHILD_RECORD_ATTACH_REQUESTED`), assert that tag
  lands in `window.__vmSignals`.

## Grading discipline

The test drives a model. The model is non-deterministic. Grading
strictly by value breaks on the second run. Grade by shape:

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
  once per envelope the stream carries; a chat turn produces
  variable counts. Assert count ≥ 1 for chat-turn flows; assert exact
  count only for a deterministic bundled record played back.
- **Substrate tool calls: type match, not arg match.** For `read_file`,
  assert `arguments.path` is a string; do not assert which path. For
  `bash`, assert `arguments.command` is a string; do not assert the
  command text.
- **Coverage over five runs.** Run each flow five times. A declared
  tag must fire in ≥ 4 / 5 runs. A tag that fires 0 / 5 is a lock
  defect (dead tag) or a code defect (missing emit). A tag that fires
  in ≤ 3 / 5 flags a flaky path worth diagnosing before ratifying.
- **Perceptual check by look, not by pixel equality.** Capture a
  screenshot at the flow's terminal state. The agent (a vision-model
  judge) or the human reads it and grades whether the surface
  matches the intent. Do not diff against a golden PNG — the model's
  reply text lands in the transcript and never renders the same
  twice.

Pixel-anchor decode (Addendum A2) is the strict-perceptual gate for
surfaces whose state is mechanically recoverable from pixel colors
at known coordinates — a status pill's color from a design-token
set, a card row count along a known column, a diagram cell. The
reveal shell has two or three such surfaces (session status pill,
selected driver pill, connection-state indicator). Everywhere else
the state is text and cards; the "look at it" check is the right
tool.

## Method

Drive Axis A with a small Playwright suite under `harness/`, one
file per flow, all `channel:'chrome'` against the live server. Each
suite reads `window.__vmSignals` and asserts the shape rules above.
Where the natural test needs the model to work (Axis B), the prompt
lives inside the harness file so the driven turn is real, not
mocked. A per-flow driver picks `deterministic` when payload-shape
alone is enough and a real model (`kimi-k2.7-code:cloud`, `llama3:8b`
locally) when the flow needs tool calls the deterministic responder
does not produce.

Each flow captures its screenshot at close. The suite writes a JSON
run report: which tags fired in which count, which shape assertions
passed, the screenshot path.

## Process (SDD scaffold)

One sprint card covers the shakeout. It declares:

- **Signal contract** — the set of tags each flow's harness will
  assert against, per the axis lists above.
- **Artifact contract** — the harness files under `harness/`, one per
  flow; the JSON report file per run; the screenshot directory.
- **Observation contract** — for each flow, the expected transcript
  shape, the terminal-state screenshot the agent captures and
  reads, the specific pixel-anchor checks where they apply.
- **Rubber Duck Pass at close** — walk each flow's signal trace in
  vocabulary terms; log gaps or over-coverage as v0.2 proposals.

The card cites this plan as `context_files`. The card lands, the
harnesses land, the runs land, the report reads either "every tag
covered in ≥ 4 / 5" or "these tags need attention." Fix, re-run,
ratify.

## After the pass

1. Flip `web/vm/signals/versions/0.1.json` to `locked: true`, fill
   `locked_at` with the date and `locked_by` with the Architect's
   ratification citation.
2. Architect writes the `## Decisions` entry.
3. Move to phase 6 (retire the classic shell).
