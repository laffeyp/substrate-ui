# STATUS · Phase 8 checkpoint · 2026-09-14

Ratified plan: `PLAN-2026-09-14-phase-8.md`. Ratified design:
`DESIGN-2026-09-14-r5-session-transparency.md`. Architect's frames:
21a–21f in `Substrate Shell Directions v3.dc.html`.

## Landed

**1. Tool row + args + output on TranscriptRow.**
`web/vm/types.ts` grew `callId`, `args`, `output`, `error`, `toolStep`.
`web/vm/session_controller.ts:698` carries `payload.args` on ToolCall
and `payload.output` on ToolResult onto the row. Zero substrate
change.

**2. Tool card in the reveal shell.**
`web/reveal.html` folds each ToolResult into its matching ToolCall by
`call_id` and renders the ToolCall as `⚙|◌|⚠ <tool> <arg-preview> ·
<status> ▸/▾`. `S.toolOpen[call_id]` carries the disclosure state
per row. The card holds args (`[i] <value>` one line per element),
output panel (`#1a1c20`, 220px scroll), error line when failed, and
a `call_id · step · status · bytes` footer. Reuses the nine dc-runtime
expand bindings.

**3. Live tool state.**
A ToolCall with no matching ToolResult renders `◌ <tool>
<arg-preview> · running` in teal. The counter reads from the pane's
snapshot on every render; a future refinement can add a shell timer
for wall-clock seconds while stationary.

**4. Child-record reader.**
Server `GET /api/records/by-path/events?path=<record_root>&since_seq=<n>`
streams an arbitrary record's envelopes as SSE, with a path-safety
check against RUNS + `~/.substrate/sessions` + `/tmp` + `/var/folders`.
Client `client.ts.streamRecordByPath` and
`session_controller.ts.attachRecordRoot(record_root)` open the stream
and fold its envelopes through `handleEnvelope`. Verified against a
real delegate child record — 22 envelopes served from `RunStarted` to
`RunFinalised`.

**5. `SessionRegistry.interrupt(tier)` + two-tier ESC.**
Both `../substrate/src/substrate/session_registry.py` and the
daemon-side `substrate-ui-working/session_registry.py` grew the tier
kwarg. `tier="hard"` walks `kind_by_instance` for `model` then
`tool` and cancels the first live one. `tier="soft"` cancels a live
model (soft on a model is a graceful stop); for a live tool it
returns a synthetic ref `{kind:"signal", instance:"soft"}` so the
caller renders "the model will stop after this tool." Server passes
`?tier=soft|hard` through; the response grew `{tier, signal}`.
`session_controller.ts.interruptTurn(tier)` posts the tier;
`interrupt_fragment` on the shell's ESC handler tracks
`_lastEscTier` per sessionId — first press soft, second press hard.

**6. `InterruptRequested` envelope kind.**
`substrate/topologies/session/InterruptRequested(session_id, tier,
source)` Struct + `__all__` export. The daemon-injection path and
the fragment producer that subscribes to it are queued as items 7's
follow-up.

## Deferred, with cause

**7. `interrupt_fragment_producer` + trigger.**
Wiring the producer requires three substrate architecture calls that
warrant a smaller-scope design pass first:

- Where the daemon writes the `InterruptRequested` envelope. `Runtime.resume(resume_event=…)` only fires when the runtime is
  parked; during a live tool the runtime is running and the current
  external-input path (`SessionEndRequested`, `UserMessage`) is not
  available. The choice is either (a) extend the Runtime to accept
  mid-run injections through a new API, or (b) buffer the interrupt
  on the SessionRegistry and inject on the next park via
  `resume_event`. Option (a) is a kernel primitive; option (b)
  changes the semantics because the model reads it at Park, not
  before the next tool.
- How the fragment producer sees the interrupt payload. The current
  fragment factories read from views populated by the trigger's input
  builder. `InterruptRequested` needs its own view or a direct
  trigger-input plumbing.
- How the composer folds it. Precedence choice — the interrupt
  should sit at high precedence so the model reads it before the
  next tool call directive.

**8. `ToolProgress` envelope + emission from `tools/runner.py`.**
The client card already treats a running tool as `◌`; adding a
streaming pane needs the emission site to rate-limit-emit chunks
from stdout of the tool's subprocess. `topologies/tool_loop/tools/runner.py`
today calls the tool with captured stdout; growing it to emit chunks
requires the same runtime-emission question as item 7 — a tool
producer emits its ToolResult at completion, not mid-run. Either the
tool producer yields `ToolProgress` events as it runs (natural under
the `AsyncIterator[Any]` producer shape), or the runner intercepts
subprocess stdout and calls a runtime-injection primitive.

**9. Descent scope routing.**
Wires `reveal.ts` to route ESC to the correct target based on
`S.descent`. Held for item 4's descent click path landing in the
reveal shell — the descent UI reads scripted `CH` map today; the
real-child-record descent onto item 4's endpoint has not been wired
to the shell click yet.

## Next move

- Design pass on the interrupt injection path (option a vs option b
  under item 7). Scope: which Runtime API accepts mid-run
  envelope injection; how the fragment producer's trigger input
  builder gets the tier + source.
- Design pass on `ToolProgress` emission (producer-yields vs
  runner-injects). Same substrate architecture question.
- Wire the reveal shell's descent click to
  `SessionController.attachRecordRoot` from item 4 (this is a client
  wiring; it does not need substrate design).

Items 1–6 are green. Smoke 11/11.
