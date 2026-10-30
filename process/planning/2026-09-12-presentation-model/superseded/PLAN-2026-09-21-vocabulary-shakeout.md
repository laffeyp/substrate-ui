# Vocabulary shakeout — 2026-09-21

## Purpose

The reveal shell's v0.1 lock is drafted at
`web/vm/signals/versions/0.1.json` (30 tags, `locked: false`). Before
we ratify, drive every emit call site through a real user path and
prove every tool the model can call actually fires the substrate
envelope pair we expect. Every throw inside `sddEmit` at runtime, every
under-covered tag, every wrong payload field surfaces here.

Two axes of coverage. Axis A drives the reveal shell's own emits.
Axis B drives the model's tool calls and checks the substrate record.

## Axis A — reveal-shell user flows

Each flow drives a real action through `/` in real Chrome. Assertions
read from `window.__vmSignals` (the validated buffer) and
`window.__vmTape` (the per-pane ring). The lock is right when every
flow closes without a validator throw and every tag it names actually
fires.

- **Cold boot.** Load `/`. Assert `DRIVER_ROSTER_LOADED`,
  `SESSIONS_LOADED`, `WORKSPACES_LOADED`, `BUNDLE_ROSTER_LOADED` all
  fire once; `TOPOLOGY_LOADED` fires only if the URL binds a record.
- **Chat, one turn.** Pick a driver, submit a prompt, wait for Park,
  end. Asserts `DRIVER_PICKED`, `SESSION_OPEN_REQUESTED`,
  `SESSION_OPEN_ACKED`, `STREAM_ATTACHED` (session_id variant),
  `TURN_SUBMITTED`, `TURN_ACK`, N × `STREAM_ENVELOPE_APPENDED`,
  `TURN_PARKED`, `SESSION_END_REQUESTED`, `SESSION_ENDED_LOCAL`,
  `STREAM_CLOSED`. Already green in `npm run smoke:vm`.
- **Attach to existing session.** Load `/?session=<id>` and click a
  rail row. Asserts `SESSION_ATTACH_STARTED`, `STREAM_ATTACHED`,
  history replays via `STREAM_ENVELOPE_APPENDED`.
- **Interrupt in flight.** Ctrl+C during a long turn (hard, signal
  true), then `/interrupt` during another (soft, signal false).
  Asserts `TURN_INTERRUPTED` fires under both entry points with the
  correct `tier`, `signal`, and `scope` fields.
- **Delegate a child.** Ask the model to spawn a child via `delegate`.
  Asserts `CHILD_RECORD_ATTACH_REQUESTED`, `STREAM_ATTACHED` in the
  `record_root` variant (the branch a chat-only flow never
  exercises), `STREAM_ENVELOPE_APPENDED` on the child stream,
  `STREAM_CLOSED` on child finalise.
- **Refused open.** Send `openSession` against an unreachable server
  or a bad driver. Asserts `SESSION_OPEN_REQUESTED` then
  `SESSION_OPEN_REFUSED` with `failure_class` and `detail` present.
- **Refused turn.** Submit a turn against an ended session. Asserts
  `TURN_SUBMITTED` then `TURN_REFUSED`.
- **Slash router.** Run every known slash (`/help`, `/model`,
  `/clear`, `/ls`, `/list`, `/name`, `/tools`, `/workspace`,
  `/bundle`, `/isolate`, `/interrupt`, `/exit`) and one nonsense
  slash. Asserts each fires `SLASH_ROUTED` with the right `cmd`; the
  nonsense fires `SLASH_UNKNOWN`.
- **Bundle picked.** Click a bundle in the picker. Asserts
  `BUNDLE_PICKED` with the slug.
- **Studio build.** Author a spec, validate, build. Asserts
  `SPEC_VALIDATE_REQUESTED`, `SPEC_VALIDATED (valid=true)`,
  `SPEC_BUILD_REQUESTED`, `SPEC_BUILT` with `run_name` and `status`.
  A deliberately bad spec fires `SPEC_BUILD_REJECTED` with `reason`.
- **Stream drop and reconnect.** Kill the server mid-turn, restore.
  Asserts `STREAM_RECONNECTING`, then `STREAM_ATTACHED` on recovery.

At the end of Axis A, every one of the 30 locked tags is exercised
by at least one flow.

## Axis B — model tool coverage

For each tool in the `tool_loop` suite, drive the model to call it
through the reveal shell and verify the substrate record.

Tools to cover (from `substrate/src/substrate/topologies/tool_loop/tools.py`
`TOOL_NAMES`):

- Pure calculator: `add`, `mul`.
- Read-only filesystem: `read_file`, `list_dir`, `glob`, `grep`.
- Network: `web_fetch`.
- Write filesystem: `edit_file`, `write_file`.
- Exec: `bash`.
- Substrate reflection: `inspect_record`, `list_records`,
  `list_sessions`, `list_topologies`, `list_applications`.
- Substrate composition: `run_topology`, `run_topology_poll`,
  `delegate`.

Per-tool assertion shape:

- The substrate record contains a `ToolCall` envelope with
  `tool_name` matching the tool and `arguments` matching the shape
  in the tool's schema.
- The paired `ToolResult` envelope carries a non-error output the
  tool's contract permits (or a typed error observation the tool
  emits on the failure paths worth testing).
- If the tool's use of the reveal shell should fire a controller
  tag (only `delegate` does today, via
  `CHILD_RECORD_ATTACH_REQUESTED`), assert that tag lands in
  `window.__vmSignals`.

## Method

Drive Axis A with a small Playwright suite under `harness/`, one file
per flow, all using `channel:'chrome'` against the live server. Each
suite reads `window.__vmSignals` and asserts the expected tag
sequence + payload fields. Where the natural test needs the model to
do the work (Axis B), write the prompt into the file so the harness
is a real driven turn, not a mocked one.

Result of one full pass: either every flow closes green and Axis B
proves every tool round-trips through substrate, or the run flags
which emits throw, which tags are dead, which payload fields are
wrong. Fix each, re-run, and the lock is ready for ratification.

## After the pass

Once every flow is green on Axis A and every tool is proven on Axis B:

1. Flip `web/vm/signals/versions/0.1.json` to `locked: true`, fill
   `locked_at` with today's date and `locked_by` with the Architect's
   ratification citation.
2. Architect writes the `## Decisions` entry.
3. Move to phase 6 (retire the classic shell).
