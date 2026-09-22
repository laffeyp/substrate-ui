# DESIGN r5 — Session transparency + interrupt · 2026-09-14

Supersedes r4. r4 named the surface at the session level. The
Architect's turn-21 sheet (21e, 21f) drew the same surface descended
into a delegate: the child's tool rows and cards read from the
child's record, ESC scopes to the level the user is at, and cancel
goes to the CHILD's runtime, not the session's. r5 folds those into
the plan.

## What we are building

A substrate session should be legible to the user while it runs, and
the user should be able to stop it. The same is true for every
delegate the session opens. Today the terminal shows two glyphs per
tool call and no way to see what the tool did. Today ESC does not
stop a running tool. Today descent into a delegate reads scripted
demo content, not the child's real record. This project fixes all
three across the substrate + ui codebase we own.

## What exists today

The terminal transcript renders a `ToolCall` envelope as `⚙ call
bash` and a `ToolResult` envelope as `⚙ bash → ok`. The row builder
that produces those strings lives in
`web/vm/session_controller.ts:698`. The envelope payloads on the
wire carry the full args and the full output —
`ToolCall.payload.args`, `ToolResult.payload.output` — but the row
builder throws both away and keeps only the tool name.

Tools do not stream. A tool producer emits one final `ToolResult`
when it finishes. There is no intermediate envelope. A tool that
runs for five minutes shows nothing until minute five.

The interrupt path stops the model only, at the session level.
The client's ESC posts `/api/session/<id>/interrupt`. The server
calls `SessionRegistry.interrupt(session_id)` at
`substrate/src/substrate/session_registry.py:912`. That method walks
`kind_by_instance` on the SESSION's runtime and at line 953 matches
the literal string `"model"`. Nothing else can be cancelled through
it. Between two ToolCalls the model producer has already completed
and a tool producer is live; the registry returns `None`, the server
returns `{interrupted: false}`, the client prints `^C — no turn in
flight`, and the tool runs to completion.

Descent into a delegate reads the scripted `CH` map in
`web/reveal.html:1032` for demo content. There is no path to attach
the pane's controller to a real child record; the delegate's own
tool rows, output, and depth do not reach the shell.

Three capabilities exist below the registry that are not being used.
`Runtime.cancel_producer(instance, *, cause, caller)` at
`substrate/src/substrate/kernel/runtime.py:817` cancels one Producer
by instance id; it will cancel a tool given a tool instance, on any
runtime. `prompt_composer` in the session topology folds every
emitted `PromptFragment` into the model's next prompt; a new
fragment producer that emits under an interrupt condition would
reach the model without any composer change. The delegate machinery
already writes each child as its own record —
`ToolResult(tool='delegate').payload.child_root` on every delegate
call — so the child record's envelope stream is on disk and only
needs a reader.

## What the terminal will show

Every ToolCall row will name the tool and preview the first arg —
`bash pwd && ls -la` instead of `call bash`. The status glyph
carries state: `⚙` for a completed tool, `◌` for one still running
(no ToolResult yet), `⚠` for a failed one. A `▸` caret on the right
opens the row into an inline card with the full args (one line per
element, monospace), the `call_id` and `step` dimmed, the result
output in a `#1a1c20` panel with a scroll cap, the error text when
failed, and a footer reading `call_id · step N · ok=true · 1024
bytes`. Completed rows show the tool's latency (`ok · 0.3s`).

While a ToolResult has not landed, the row shows a running-seconds
counter next to the `◌` glyph. When the tool starts streaming
progress (see below), the card shows the growing output beneath the
row; a blinking teal caret marks the write head; the pane seals
when `eof` arrives or when the ToolResult lands.

The status bar under the pane reads `● live · turn running · record
<name> · <n> events · esc — soft interrupt`.

## What the terminal will show inside a delegate

When the user descends into a delegate, the same row and card rules
apply to the CHILD's transcript. The child's tool rows expand and
stream by the same idiom, reading from the child record's own
envelopes. The parent transcript's `⑂` line for the delegation
shows the child's currently-running tool (`⑂ delegate → reviewer-a
· ◌ bash python stripe_model.py --sweep 2..16 · 38s`). The card's
subtitle reads `ToolProgress · child record's own envelopes · offset
<n>`. Depth applies the D70 hue ramp to every accent on the child
level.

## How ESC will work

At the session level (no descent):

- First ESC on a running turn signals the model on its next turn:
  "stop the tool, return a summary." The tool completes on its own,
  its result reaches the model, and the model returns rather than
  starting the next tool. No process dies.
- Second ESC while the same turn is still running kills the tool.
  The tool's runtime returns a failed `ToolResult(ok=False,
  error="cancelled")`. The session topology's `park-on-interrupt`
  trigger — already subscribed to `substrate.ProducerCancelled` —
  fires the park.
- Third ESC and beyond is inert until something changes.

Descended into a delegate at record `<child>`:

- ESC tiers scope to that record. Soft records
  `InterruptRequested(tier="soft")` on the child's record and its
  fragment producer folds into the child's next model prompt. Hard
  cancels the tool producer on the CHILD's runtime, not the
  session's. The refusal folds up the chain as failed ToolResults
  while the session above keeps running.
- Transcript row for soft: `^C — soft interrupt requested; the model
  will stop after this tool · scoped to <child>`.
- Transcript row for hard: `^C — hard interrupt; tool cancelled ·
  cancel_producer on the CHILD's runtime`.

The existing ESC cascade (close modal, close find, close descent,
close surface) still runs first. The interrupt tiers apply when
nothing else is on screen to close.

## The changes

Nine edits. Ordered so each step is green on its own.

**1. `session_controller.ts:698` carries args + output into the
transcript row.** The row builder reads `payload.args` on ToolCall
and `payload.output` on ToolResult, stores them on the
`TranscriptRow`, and the pane header on the row keeps the tool
name preview. No substrate change.

**2. `reveal.html` renders the tool card.** `S.toolOpen[call_id]`
carries the disclosure state per row. Click the row → toggle. The
expanded card reads args + output off the row. Reuses the nine
existing dc-runtime expand bindings. Row-scoped fields, not row
swaps. No substrate change.

**3. Live running seconds counter.** For any ToolCall whose
ToolResult has not landed, the row shows `◌ <tool> <arg-preview> ·
Ns`. Counter reads from `snap.rawEnvelopes`, ticks on a shell
timer. No substrate change.

**4. Child-record reader on the controller.** `SessionController`
grows `attachRecordRoot(record_root, sinceSeq)` that streams a
record's envelopes without a session id. A new server endpoint
`GET /api/records/by-path?path=<child_root>&since_seq=<n>` reads the
child record from disk and streams it as SSE. Delegate ToolResult
rows carry `payload.child_root`; clicking the ⑂ inset attaches the
descended pane's controller to that path. No shell change beyond
the descent wiring.

**5. `SessionRegistry.interrupt(target, tier="soft"|"hard")` where
`target` is `session_id` OR `record_root`.** The method grows a
tier argument and a target that may name a descended record. For a
session target it walks the SESSION runtime's `kind_by_instance`.
For a record-root target it looks up the runtime that owns that
record — the delegate machinery keeps a handle per child record
under `Runtime._children` — and walks the CHILD runtime's
`kind_by_instance`. `"soft"` records
`InterruptRequested(tier="soft")` on the target's record; `"hard"`
cancels through `cancel_producer` with caller
`daemon:interrupt-<tier>@<record>`. `server.py:1620` reads a
`tier` query param and, when descended, a `record_root` param and
passes both through. The client wires two-press ESC, and when
descended, the second press hits the child's runtime.

**6. `InterruptRequested` envelope kind.** New envelope, added
under the SDD vocabulary lock (`signals/versions/` bump), schema,
kernel vocab entry.

**7. `interrupt_fragment_producer`.** New producer under
`topologies/session/`, one trigger subscribing to
`InterruptRequested`, emits `PromptFragment(source="interrupt",
text="[user requested interrupt — stop tool, return summary]")`.
The existing `prompt_composer` folds it into the next model
prompt. Because the fragment producer sits inside the session
topology, a delegate whose child record uses the same session
topology (the default) gets it for free.

**8. `ToolProgress` envelope + emission from `tools/runner.py`.**
Shape: `ToolProgress { call_id, tool, step, chunk, offset, eof? }`.
Emitted from the shared tool runner at
`substrate/src/substrate/topologies/tool_loop/tools/runner.py`,
rate-limited to at most one per 250ms, size-capped at 4KB per
chunk, with `eof` set on the last emit before the ToolResult. The
client subscribes to `ToolProgress`, appends `chunk` to the live
pane in the open tool card, and seals the pane when `eof` arrives
or when the ToolResult lands. Vocabulary lock bump for the new
envelope kind.

**9. Descent scope routing.** `reveal.ts` tracks the current
descent stack per pane. When ESC fires the interrupt, the client
reads the top of the descent stack and posts to the correct
`(session_id, tier)` or `(record_root, tier)`. The failed
ToolResults fold up the chain naturally through the existing
delegate ToolResult path — no additional wiring needed at the
parent level.
