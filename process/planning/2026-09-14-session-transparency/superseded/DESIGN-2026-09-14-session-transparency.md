# DESIGN — Session transparency + interrupt parity with Claude Code · 2026-09-14

## The gap

Two adjacent problems surfaced from the grep-on-home-directory
incident.

**Interrupt.** `ESC` in Claude Code stops whatever is running — the
model, the current tool, anything mid-flight. In substrate today
`ESC` reaches only the MODEL producer through
`SessionRegistry.interrupt`. When the model has just emitted a
ToolCall and the tool producer is running, there is no interrupt
verb to hit, and the tool runs to completion or timeout. A ten-second
grep of `~` blocks the session for ten seconds with nothing the user
can do.

**Tool visibility.** The terminal transcript prints `⚙ call bash` /
`⚙ bash → ok`. Two glyphs. No args. No output. No indication of
whether the tool is running, waiting, or done. The user has to open
the reveal stream and read raw envelopes to see what actually
happened.

Both are UX defects, but they share a root cause: substrate's tool
producer is a black box to the client. The runtime treats a tool as
"emit ToolCall, wait, emit ToolResult", and the ui reads only those
two envelopes. Everything in between — the args the model chose,
the intermediate progress, the stdout — is either in the ToolCall
payload (present today, unused) or lost entirely (stdout is not
streamed).

## What Claude Code does

- ESC stops the model AND cancels a running tool (the tool's process
  is killed, its partial output is preserved, a "cancelled" line
  appears).
- Every tool call renders inline with a summary that names the tool
  and its key arg. Click on it to expand: the full args at the top,
  a live output pane below, a "running" spinner while the tool is
  live and a status line when it completes.
- Long tools stream their output — a `grep` shows lines as they come
  in, not just a final blob.

## What substrate has today

- `ToolCall.payload = { call_id, tool, args, step }` — the args ARE
  on the record, the client just discards them.
- `ToolResult.payload = { call_id, tool, output, step, ok, error }` —
  the full output text is on the record.
- No intermediate stdout envelope. Tools produce one final `output`
  string.
- `SessionRegistry.interrupt` cancels only the model producer.

## The design

### Tool cards in the transcript

Every `ToolCall` renders as a row that carries:

- The tool name (`bash`, `grep`, `read_file`, …).
- A one-line preview of the first arg (`bash pwd && ls -la`,
  `grep "Choose folder" /Users/peterlaffey`).
- A left-side status glyph: `⚙` for done, `◌` for running (no
  ToolResult yet), `⚠` for failed.
- A row-scoped disclosure caret `▸` / `▾`.

Clicking the row expands an inline card with:

- The full `args` list, one per line, monospace.
- The `call_id` and `step`, dimmed.
- The result output when present, in a `#1a1c20` panel with
  monospace, wrapped, bounded by max-height with a scroll.
- The `error` when failed.
- A footer line: `call_id · step N · ok=true · 1024 bytes`.

The template already exists for pane-header disclosure patterns
(`ddOpen`, `bundleOpenP`, `fanOpen`). Reuse that idiom at row scope:
`S.toolOpen = { <call_id>: true }`, click toggles.

### Live tool output

Substrate does not stream stdout today. Two paths:

1. **Cheap.** Show `◌ <tool> <arg-preview>` while the ToolResult has
   not landed. Timer counting seconds since the ToolCall. No output.
2. **Real.** Ask substrate to emit a `ToolProgress` envelope per line
   of stdout (bounded by rate, capped in size). The client renders
   the growing output live. Follow-up plan; not blocking cheap.

Land the cheap version now.

### Interrupt — two tiers

Interrupt is a two-tier verb. `ESC` first fires the SOFT interrupt;
a second `ESC` while a tool is still running escalates to HARD.

**Soft interrupt (tier 1).** Route to the model. The model receives
a system-level signal on its NEXT turn saying "stop using the tool
and return." The model unwinds gracefully — it may write a short
summary of what it was trying and hand control back. Semantically:
"finish what you were doing safely."

Implementation:
- Client posts `/api/session/<id>/interrupt?tier=soft`.
- Server cancels the model producer if it is live (today's behavior).
- If a tool producer is live instead, the server records an
  `InterruptRequested(tier=soft)` envelope on the record.
- The session topology's next model trigger reads that envelope and
  the driver prompt gets a system message: `[user requested interrupt
  — stop tool, return summary]`.
- Model's next turn produces a FinalAnswer describing what it stopped
  and why.
- No process is killed. The tool completes; its result reaches the
  model; the model reads the interrupt signal and stops rather than
  starting the next tool.

**Hard interrupt (tier 2).** Kill the tool. Route only for cases
where the soft interrupt cannot land — a tool that will never return.

Implementation:
- Client posts `/api/session/<id>/interrupt?tier=hard`.
- Substrate cancels the tool producer via a new registry path (see
  the substrate follow-up below).
- The tool's runtime kills its subprocess, returns a failed
  `ToolResult(ok=false, error="cancelled")`.
- The session topology's `park-on-interrupt` trigger fires the park.
- The model's next turn reads the cancelled tool result.

**UX cascade.**
- First `ESC` on a running turn → soft interrupt (tier 1).
- Second `ESC` while the same turn is still running → hard interrupt
  (tier 2).
- Third `ESC` and later while a turn stays alive → inert until
  something changes.
- The transcript row for a soft interrupt reads
  `^C — soft interrupt requested; the model will stop after this tool`.
- The transcript row for a hard interrupt reads
  `^C — hard interrupt; tool cancelled`.

**Substrate follow-up.** `SessionRegistry.interrupt(session_id,
tier)` — the API grows a tier argument. Tier=soft records the
`InterruptRequested` envelope. Tier=hard cancels the live producer,
including a tool producer. The session topology grows a driver-side
system-message injection for the soft signal. Until substrate lands
it, the client keeps its honest stopgap message that names the
running tool.

### ESC semantics inside the UI

- Nothing open, no turn running: `ESC` is inert.
- Any modal / find / descent / surface open: `ESC` closes the
  nearest one (today's cascade).
- Model turn running: `ESC` cancels the model (today's behavior).
- Tool running under a session with the substrate interrupt fix:
  `ESC` cancels the tool.

The cascade order stays. `ESC` is the universal escape hatch —
menus and modals win first, then session activity.

## Scope for this design's implementation phase

Client-side, this design ships as one phase:

1. **Tool card row** — click-to-expand, args + output + status.
2. **Live tool state** — `◌` glyph + running seconds counter for a
   ToolCall with no ToolResult.
3. **Interrupt feedback** — the honest message that already landed.

The substrate-side work (registry tool cancellation, ToolProgress
envelope) is a substrate follow-up.

## Non-goals

- Rendering tool output as anything other than plain monospace text.
  No syntax highlighting inside `bash` output, no image previews
  from `read_file`.
- Rewinding a tool call to a previous state or replaying it.
- Multi-tool concurrency in a single row. When substrate emits two
  ToolCalls in parallel they render as two rows.

## Contact with reality

Everything above is a proposal. What follows is what the actual code
says today, so the plan can be scoped to what will hold.

### The interrupt primitive is already instance-scoped

`Runtime.cancel_producer(instance, *, cause, caller)` at
`substrate/src/substrate/kernel/runtime.py:817` cancels one Producer
by instance id. The docstring: "Cancel one live Producer by
instance." It writes cancel_reasons before dispatching `task.cancel()`,
and the CancelledError handler in `_producer_task` writes the
`ProducerCancelled` envelope with `cause` and `caller` on it. This
primitive already can cancel a tool if given a tool instance.

The gap is one level up. `SessionRegistry.interrupt(session_id)` at
`substrate/src/substrate/session_registry.py:912` walks the runtime's
`kind_by_instance` and calls `cancel_producer` only when
`kind == "model"`. Line 953 — hardcoded:

```
for inst, kind in list(st.kind_by_instance.items()):
    if kind == "model":
        ref = runtime.cancel_producer(inst, cause="external", caller="daemon:interrupt")
```

So the substrate follow-up is scoped: extend the registry to also
match `kind == "tool"` when tiered as hard. No kernel change. No
new envelope. The `ProducerCancelled` envelope already carries
`cause` and `caller` — the caller becomes `daemon:interrupt-hard`
and the record knows what fired.

### Soft interrupt has no envelope kind today

`InterruptRequested` does NOT exist in
`substrate/src/substrate/kernel/vocab.py` or the session topology
envelope catalog. Adding a new envelope is a vocabulary-locked change
(SDD rule): it needs a version bump to `signals/versions/`, a
producer that emits it, and a subscription somewhere.

The injection point for the soft-interrupt system message is the
per-turn fragment chain:

- `user_message_fragment_producer` at
  `substrate/src/substrate/topologies/session/user_message_fragment_producer.py:35`
  emits a `PromptFragment` when the per-turn cohort completes.
- `prompt_composer` folds every fragment into the model prompt.
- A new `interrupt_fragment_producer` could subscribe to
  `InterruptRequested`, emit a `PromptFragment(source="interrupt",
  text=...)`, and the composer picks it up automatically.

That is a real substrate change: one new envelope kind, one new
producer, one trigger, one composer fragment. Bounded but not
trivial.

### The client-side card idiom is proven

`reveal.html` already uses per-row expand nine times. The bindings
carry state on the Component (`childOpen`, `fanOpen`, `ddFor`,
`wsFor`, `bundleFor`), the template gates with `<sc-if>` on a
boolean field, and click handlers toggle. No dc-runtime reconcile
bugs on those — the working templates read row-scoped state fine.
See `reveal.html:128` for the ⑂ delegate row and `reveal.html:138`
for the fan-out row.

The two-pane transcript reconcile bug from earlier this session was
about swapping BETWEEN different rows in the SAME list (dc-runtime's
sc-for placeholder-count). Row-scoped expand adds fields to each
row, does not swap rows — the proven idiom.

### What the args + output look like on the wire today

`ToolCall.payload.args` is already an array of strings and is on
every recorded ToolCall envelope. `ToolResult.payload.output` is the
final output string. `session_controller.ts:698` discards both when
folding into the transcript row — that is the client-side change
scope. No server change, no substrate change to render args and
output today.

### Scope-holding conclusion

Client-side, this phase can land three things that DO hold against
reality:

1. **Tool card row** with args + output + status. Zero substrate
   change. `session_controller.ts` carries args and output through;
   `reveal.html` renders the row-scoped expand exactly like the ⑂
   rows already do.
2. **Live tool state (cheap)**: `◌` glyph + a seconds counter for a
   ToolCall whose ToolResult has not landed. Zero substrate change.
3. **Honest interrupt message** — already landed.

The substrate follow-ups are two named changes:

- Registry hard-interrupt: match `kind == "tool"` at
  `session_registry.py:952` when the caller says tier=hard. No
  kernel change; the primitive is already instance-scoped.
- Soft interrupt: new `InterruptRequested` envelope kind, new
  `interrupt_fragment_producer`, one new trigger. Vocabulary lock
  applies — signals/versions bump.

Both belong on the substrate roadmap, not this UI phase.

## Sources

- `handoff_latest/sheets/Substrate Shell Directions v3.dc.html` —
  the design language sets the accent hues and terminal look.
- `GAP-2026-09-14-interrupt-during-tool-call.md` — the substrate
  interrupt gap this design partly addresses.
- `web/vm/session_controller.ts` line 679 — where ToolCall/ToolResult
  are folded into a transcript row today.
