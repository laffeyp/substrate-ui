# DESIGN r3 — Session transparency + interrupt parity · 2026-09-14

Supersedes r2. r2 quarantined the facts in a "contact with reality"
section and appended a "non-goals" list. Both were affectations.
Facts live in the argument they support.

## The gap

The grep-on-home-directory incident surfaced two failures at once.

The terminal transcript prints `⚙ call bash` / `⚙ bash → ok`. Two
glyphs. No args. No output. No indication of whether the tool is
running, waiting, or done. `ToolCall.payload.args` is on every
recorded ToolCall envelope and `ToolResult.payload.output` is on
every ToolResult, but `web/vm/session_controller.ts:698` discards
both when folding to a transcript row. The user opens the reveal
stream and reads raw envelopes to see what actually happened.

ESC in the terminal habit stops whatever is running. In our code ESC
reaches only the model producer.
`SessionRegistry.interrupt(session_id)` at
`substrate/src/substrate/session_registry.py:912` walks
`kind_by_instance` and calls `cancel_producer` at line 953 only when
`kind == "model"` — the string is hardcoded. When the model has just
emitted a ToolCall and the tool producer is running, no verb hits it.
A ten-second grep of `~` blocks the session for ten seconds and the
user has no verb. The kernel primitive `Runtime.cancel_producer(inst,
*, cause, caller)` at `substrate/src/substrate/kernel/runtime.py:817`
is instance-scoped — it will cancel a tool given a tool instance —
so the gap sits at the registry, one level up, on that one hardcoded
string.

Tools also produce output only at completion. `ToolResult.output`
carries the final blob. No intermediate stdout, no partial progress.
A tool with a five-minute runtime shows nothing until minute five.

## Tool cards

Every ToolCall renders as a row that names the tool (`bash`, `grep`,
`read_file`) and previews the first arg (`bash pwd && ls -la`,
`grep "Choose folder" /Users/peterlaffey`). The left glyph carries
status: `⚙` for done, `◌` for running (no ToolResult yet), `⚠` for
failed. A right-side caret `▸` / `▾` opens the row.

The open card holds the full `args` list one line per element in
monospace, the `call_id` and `step` dimmed, the result output in a
`#1a1c20` panel with monospace and a scroll cap, the `error` when
failed, and a footer `call_id · step N · ok=true · 1024 bytes`.

The dc-runtime idiom is already in `reveal.html` nine times.
`childOpen`, `fanOpen`, `ddFor`, `wsFor`, `bundleFor` all carry
row-scoped state and gate an inline expansion with `<sc-if>`.
`S.toolOpen = { <call_id>: true }` slots into the same pattern.
The two-pane transcript reconcile bug from earlier this session
was about swapping items in the same list; row-scoped expand adds
fields to each row and does not swap.

Wiring: `session_controller.ts:698` grows `args` and `output` on
the `TranscriptRow`; the template reads them under `toolOpen`.

## Live tool output

Tools emit a `ToolProgress` envelope once per burst of stdout,
rate-limited to at most one per 250ms and size-capped at 4KB per
burst. The client renders the growing chunks under the row while
the ToolResult is still pending. When the ToolResult lands, the
card holds the full output and drops the progress lines.

Emission site: the tool producers under
`substrate/src/substrate/topologies/tool_loop/tools/` funnel through
a common runner in `tools/runner.py`. That runner is where the
`ToolProgress` emit goes; one place, every tool inherits.

Envelope shape:
```
ToolProgress { call_id, tool, step, chunk, offset, eof? }
```

`chunk` is UTF-8; `offset` is the byte offset in the tool's total
output stream; `eof` marks the last emit before ToolResult so the
client seals the streaming pane. `ToolProgress` is a new envelope
kind and gets a `signals/versions/` bump under the SDD vocabulary
lock.

## Interrupt — two tiers

ESC on a running turn fires soft first. A second ESC while the same
turn is still running escalates to hard. A third ESC and beyond is
inert until something changes.

Soft signals the model on its next turn: "stop the tool, return a
summary." The tool completes on its own; its result reaches the
model; the model reads the interrupt signal and returns rather than
starting the next tool. No process dies.

The wire path for soft:

- Client posts `/api/session/<id>/interrupt?tier=soft`.
- `SessionRegistry.interrupt(session_id, tier="soft")` records an
  `InterruptRequested(tier="soft")` envelope on the record. If a
  model producer is live it also cancels that.
- A new `interrupt_fragment_producer` subscribes to
  `InterruptRequested`, emits a
  `PromptFragment(source="interrupt", text="[user requested interrupt
  — stop tool, return summary]")`. It slots into the same chain as
  `user_message_fragment_producer` at
  `substrate/src/substrate/topologies/session/user_message_fragment_producer.py:35`,
  and `prompt_composer` folds every fragment into the model prompt
  on the next composition — the fragment reaches the model without
  any composer change.
- The model's next turn produces a FinalAnswer describing what it
  stopped and why.

Hard kills the tool. Only for tools that will not return.

- Client posts `/api/session/<id>/interrupt?tier=hard`.
- `SessionRegistry.interrupt(session_id, tier="hard")` walks
  `kind_by_instance` for both `model` and `tool` and calls
  `runtime.cancel_producer(inst, cause="external",
  caller="daemon:interrupt-hard")`. The primitive is already
  instance-scoped; the only change at the registry is the second
  match arm.
- The tool's runtime returns a failed `ToolResult(ok=False,
  error="cancelled")`.
- The session topology's `park-on-interrupt` trigger fires the park
  — it already subscribes to `substrate.ProducerCancelled`.

Transcript rows:
- Soft: `^C — soft interrupt requested; the model will stop after this tool`.
- Hard: `^C — hard interrupt; tool cancelled`.

`InterruptRequested` is a new envelope kind and gets its own
`signals/versions/` bump.

## The plan

Six items across the codebase. Ordered so each step stays green.

1. **`session_controller.ts:698` grows args + output on the
   TranscriptRow.** `reveal.html` reads `S.toolOpen[call_id]`, renders
   the row, expands to the args + output card. Nine existing
   dc-runtime expand bindings as reference. No substrate change.
2. **Client live tool state.** `◌` glyph and seconds counter for a
   ToolCall whose ToolResult has not landed. Reads from
   `snap.rawEnvelopes`. No substrate change.
3. **`SessionRegistry.interrupt(session_id, tier)`.** Grow the tier
   argument. `tier="soft"` records `InterruptRequested(tier="soft")`
   and cancels a live model producer if there is one. `tier="hard"`
   walks `kind_by_instance` for both `model` and `tool` and cancels
   through `cancel_producer`. `server.py:1620` reads a `tier` query
   param and passes it through. Client wires two-press ESC once this
   is in.
4. **`InterruptRequested` envelope kind.** New envelope,
   `signals/versions/` bump, schema, kernel vocab entry.
5. **`interrupt_fragment_producer`.** New producer under
   `topologies/session/`, one trigger on `InterruptRequested`,
   fragment output folded by the existing `prompt_composer`. Ships
   with 4.
6. **`ToolProgress` envelope + emission.** New envelope, another
   `signals/versions/` bump. Emission from the shared runner under
   `tools/runner.py`. Client renders it into the tool card row's live
   pane.
