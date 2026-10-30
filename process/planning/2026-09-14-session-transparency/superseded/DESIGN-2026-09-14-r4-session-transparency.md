# DESIGN r4 — Session transparency + interrupt · 2026-09-14

## What we are building

A substrate session should be legible to the user while it runs, and
the user should be able to stop it. Today the terminal shows two
glyphs per tool call and no way to see what the tool did. Today ESC
does not stop a running tool. This project fixes both across the
substrate + ui codebase we own.

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

The interrupt path stops the model only. The client's `ESC` posts
`/api/session/<id>/interrupt`. The server calls
`SessionRegistry.interrupt(session_id)` at
`substrate/src/substrate/session_registry.py:912`. That method walks
`kind_by_instance` and at line 953 matches on the literal string
`"model"`; nothing else can be cancelled through it. Between two
ToolCalls the model producer has already completed and a tool
producer is live. The registry returns `None`, the server returns
`{interrupted: false}`, the client prints `^C — no turn in flight`,
and the tool runs to completion.

Two capabilities exist below the registry that are not being used.
`Runtime.cancel_producer(instance, *, cause, caller)` at
`substrate/src/substrate/kernel/runtime.py:817` cancels one Producer
by instance id; it will cancel a tool given a tool instance. The
`prompt_composer` in the session topology folds every emitted
`PromptFragment` into the model's next prompt; a new fragment
producer that emits under an interrupt condition would reach the
model without any composer change.

## What the terminal will show

Every ToolCall row will name the tool and preview the first arg —
`bash pwd && ls -la` instead of `call bash`. The status glyph
carries state: `⚙` for a completed tool, `◌` for one still running
(no ToolResult yet), `⚠` for a failed one. A `▸` caret on the right
opens the row into an inline card with the full args (one line per
element, monospace), the `call_id` and `step` dimmed, the result
output in a `#1a1c20` panel with a scroll cap, the error text when
failed, and a footer reading `call_id · step N · ok=true · 1024 bytes`.

While a ToolResult has not landed, the row shows a running-seconds
counter next to the `◌` glyph. When the tool starts streaming
progress (see below), the card shows the growing output beneath the
row; when the ToolResult lands, the card holds the full output.

## How ESC will work

The first ESC on a running turn signals the model on its next turn:
"stop the tool, return a summary." The tool completes on its own,
its result reaches the model, and the model reads the interrupt
signal and returns rather than starting the next tool. No process
dies.

The second ESC while the same turn is still running kills the tool.
The tool's runtime returns a failed `ToolResult(ok=False,
error="cancelled")`. The session topology's `park-on-interrupt`
trigger — which already subscribes to `substrate.ProducerCancelled`
— fires the park.

A third ESC and beyond is inert until something changes. The
transcript row reads `^C — soft interrupt requested; the model will
stop after this tool` on the first press and `^C — hard interrupt;
tool cancelled` on the second.

The existing ESC cascade (close modal, close find, close descent,
close surface) still runs first. The interrupt tiers apply when
nothing else is on screen to close.

## The changes

Six edits. Ordered so each step is green on its own.

**1. `session_controller.ts:698` carries args + output into the
transcript row.** The row builder reads `payload.args` on ToolCall
and `payload.output` on ToolResult, stores them on the
`TranscriptRow`, and the pane header on the row keeps the tool
name preview. No substrate change.

**2. `reveal.html` renders the tool card.** `S.toolOpen[call_id]`
carries the disclosure state per row. Click the row → toggle. The
expanded card reads args + output off the row. Reuses the nine
existing dc-runtime expand bindings (`childOpen`, `fanOpen`,
`ddFor`, `wsFor`, `bundleFor`). Row-scoped fields, not row swaps —
the two-pane list-reconcile bug does not apply. No substrate change.

**3. Live running seconds counter.** For any ToolCall whose
ToolResult has not landed, the row shows `◌ <tool> <arg-preview> · Ns`.
Counter reads from `snap.rawEnvelopes`, ticks on a shell timer. No
substrate change.

**4. `SessionRegistry.interrupt(session_id, tier="soft"|"hard")`.**
The method grows a `tier` argument. `"soft"` records an
`InterruptRequested(tier="soft")` envelope on the record and cancels
a live model producer if there is one. `"hard"` walks
`kind_by_instance` for both `"model"` and `"tool"` and cancels
through `cancel_producer`. `server.py:1620` reads a `tier` query
param and passes it through. The client wires two-press ESC once
this is in.

**5. `InterruptRequested` envelope + `interrupt_fragment_producer`.**
New envelope kind added under the SDD vocabulary lock
(`signals/versions/` bump). New producer under
`topologies/session/` subscribes to `InterruptRequested` and emits
`PromptFragment(source="interrupt", text="[user requested interrupt
— stop tool, return summary]")`. The existing `prompt_composer`
folds the fragment into the next model prompt. The model reads the
signal and returns.

**6. `ToolProgress` envelope + emission from `tools/runner.py`.**
Shape: `ToolProgress { call_id, tool, step, chunk, offset, eof? }`.
Emitted from the shared tool runner at
`substrate/src/substrate/topologies/tool_loop/tools/runner.py`,
rate-limited to at most one per 250ms, size-capped at 4KB per
chunk, with `eof` set on the last emit before the ToolResult. The
client subscribes to `ToolProgress`, appends `chunk` to the live
pane in the open tool card, and seals the pane when `eof` arrives
or when the ToolResult lands. Vocabulary lock bump for the new
envelope kind.
