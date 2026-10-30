# STATUS · Phase 8 closed · 2026-09-15

Ratified prior: `PLAN-2026-09-14-phase-8.md` (nine items),
`DESIGN-2026-09-14-r5-session-transparency.md` (design r5),
`STATUS-2026-09-14-phase-8-checkpoint.md` (items 1–6 done),
`STATUS-2026-09-15-phase-8-item-7-closed.md` (item 7 + item 9 first
half done). This status closes the phase.

## All nine items landed

**1. TranscriptRow grows callId, args, output, error, toolStep.** Substrate-ui
`78601de`. Snapshot fields flow from `payload.args` on ToolCall and
`payload.output` on ToolResult.

**2. Tool card in the reveal shell.** Substrate-ui `78601de`. Each
ToolResult folds into its matching ToolCall by `call_id`. The row
renders `⚙|◌|⚠ <tool> <arg-preview> · <status> ▸/▾` with an
expandable inline card carrying args, output, error, and a `call_id ·
step · status · bytes` footer.

**3. Live running-tool state.** Substrate-ui `78601de`. A ToolCall
whose paired ToolResult has not landed renders `◌ <tool>
<arg-preview> · running`.

**4. Child-record reader.** Substrate-ui `eaee80c`. `GET
/api/records/by-path/events?path=<record_root>&since_seq=<n>` streams
an arbitrary record over SSE (path-safety against RUNS +
`~/.substrate/sessions` + `/tmp` + `/var/folders`). Client
`client.streamRecordByPath` and
`SessionController.attachRecordRoot(record_root)`.

**5. `SessionRegistry.interrupt(tier)` + two-tier ESC.** Substrate
`1d3fb8ce` + substrate-ui `c2538ad`. `?tier=soft|hard` on `/interrupt`,
default hard preserves pre-Phase-8 semantics. Plain ESC = hard,
Shift+ESC = soft.

**6. `InterruptRequested` envelope kind.** Substrate `1d3fb8ce`.
`substrate.topologies.session.InterruptRequested(session_id, tier,
source)` Struct.

**Substrate defect fix.** Substrate `806c6680`. Tool body runs in a
worker thread through `asyncio.to_thread` so the runtime's event loop
stays free during a long subprocess.

**7. `interrupt_fragment_producer` + composer refire on ToolResult.**
Substrate `9503152e` (Runtime.inject_event), `e9a22734`
(interrupt_fragment_producer + emit-interrupt-fragment +
compose-on-interrupt-tool-result + CONTINUE/WRAP_UP mirror
predicates), `3c4bb1cf` (SessionRegistry.interrupt(tier="soft")
injects), `36e5cf82` (end-to-end test). Substrate-ui-working
`fd93a5f` (shadow mirror). Design pass in
`DESIGN-2026-09-15-interrupt-injection-path.md`.

**8. `ToolProgress` envelope + `_bash` Popen streaming.** Substrate
`ea5ec655`: ToolProgress Struct + `_CURRENT_RUNTIME` contextvar +
`emit_tool_progress` helper + `_bash` refactor from
`subprocess.run(capture_output=True)` to `subprocess.Popen(stdout=PIPE,
bufsize=1)` reading stdout line by line. Substrate-ui `32233b6`:
Snapshot.progressByCallId + tool-card streaming pane.

**9. Descent-scope routing.** First half substrate-ui `b17960c` (real
delegate ToolResult click → attachRecordRoot(child_root) → S.descent
gains a real record_root). Second half substrate `84a6005a`
(`_ACTIVE_RUNTIMES_BY_RECORD_ROOT` + `Runtime._loop` +
`SessionRegistry.interrupt(record_root=...)`) + substrate-ui `b451c86`
(shadow mirror + server routes `?record_root=<path>` + client threads
`S.descent[-1]` through `interruptTurn(tier, recordRoot)`).

## What now works end-to-end

Session-scope Shift+ESC. Press → server posts
`SessionRegistry.interrupt(session_id, tier="soft")` → daemon calls
`runtime.inject_event(InterruptRequested)` → frame lands on the
record with `producer=null` → `emit-interrupt-fragment` fires →
`interrupt_fragment_producer` yields `PromptFragment(source="interrupt",
precedence=95)` → cohort updates → tool completes → `ToolResult` →
`compose-on-interrupt-tool-result` fires (`CONTINUE` and `WRAP_UP`
refuse via `_has_pending_interrupt`) → fresh `PromptComposed` lands →
model wakes with the tool result and the interrupt directive at
precedence 95.

Descent-scope Shift+ESC. Press while descended into a delegate → client
reads `S.descent[-1]` as the child's record_root → posts
`/interrupt?tier=soft&record_root=<path>` → daemon reads the
`_ACTIVE_RUNTIMES_BY_RECORD_ROOT` map → routes to the CHILD's runtime
on the CHILD's event loop → InterruptRequested lands on the CHILD's
record → same wiring fires there. The transcript row reads `^C — soft
interrupt requested; the model will stop after this tool · scoped to
child`.

Streaming bash. A bash tool call runs `Popen` line-buffered → each
line emits a `ToolProgress(call_id, tool, step, chunk, offset)`
envelope → the tool card shows a teal streaming pane under the row
that grows as bash writes → the paired `ToolResult` seals the pane.

Delegate descent. A `delegate` ToolResult renders a `· descend ⏎`
affordance on the row. Click → pane attaches to the child's record
via item 4's endpoint → transcript switches to the child's envelopes
→ descent crumbs show the child's record_root.

## Verification

Substrate scoped suite (`session_topology_e2e`, `session_topology_bundled`,
`session_vocabulary_constants`, `fragment_source_failure_handling`,
`session_prompt_vocabulary_v02`, `prompt_fragment_*` (5),
`tool_loop_topology`, `runtime`, `cancel_producer`, `inject_event`,
`active_runtimes`, `session_registry_core`, `interrupt_e2e`,
`tool_progress`) — every test that touches the affected wire green.
Substrate-ui typecheck clean. Bundled CI records regenerated across
all 18 topologies (interrupt_fragment producer_kind is on every
session-shape topology).

## Follow-ups outside Phase 8

The interrupt directive text at 95 precedence assumes a real model
that reads the phrase and returns. The DeterministicResponder in CI
does not; the e2e tests scope their assertions to the RECORD SHAPE
(fragment landed, composer refired, model wake path fired), not to the
model's next answer. A real-model test session against Kimi K2.7 with
Shift+ESC during a bash `for i in {1..10}; sleep 1; done` is the
demonstration.

`ToolProgress` cadence: `_bash` emits per line, which is fine for
line-oriented programs. A program that writes bytes without newlines
(a progress bar with `\r`) will not emit until the bash process exits.
r5 §8 named a 250ms rate limit and 4KB per-chunk cap; the current
implementation emits per line without those caps. If a real live
session shows unwanted burstiness or oversized chunks, the caps land
in a follow-up sprint at `_bash`'s read loop.
