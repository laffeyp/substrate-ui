# DESIGN r2 — Session transparency + interrupt parity · 2026-09-14

Supersedes `DESIGN-2026-09-14-session-transparency.md`. That version
framed substrate as an outside dependency to defer work to. Substrate
is ours. This revision writes one plan across the whole codebase.

## The gap

Two adjacent problems surfaced from the grep-on-home-directory
incident.

**Interrupt.** ESC in the terminal habit stops whatever is running —
the model, the current tool, anything mid-flight. In substrate today
ESC reaches only the model producer through
`SessionRegistry.interrupt`. When the model has just emitted a
ToolCall and the tool producer is running, no interrupt verb hits it
and the tool runs to completion or timeout. A ten-second grep of `~`
blocks the session for ten seconds and the user has no verb.

**Tool visibility.** The terminal transcript prints `⚙ call bash` /
`⚙ bash → ok`. Two glyphs. No args. No output. No indication of
whether the tool is running, waiting, or done. The user opens the
reveal stream and reads raw envelopes to see what actually happened.

The runtime treats a tool as "emit ToolCall, wait, emit ToolResult",
and the UI reads only those two envelopes. The args live in the
ToolCall payload; the output lives in the ToolResult payload; the
client discards both when folding to a transcript row. Intermediate
stdout is not emitted at all.

## The design

### Tool cards

Every ToolCall renders as a row that carries:

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

The template already has per-row expand nine times in `reveal.html`:
`childOpen`, `fanOpen`, `ddFor`, `wsFor`, `bundleFor`. Reuse the
idiom at row scope: `S.toolOpen = { <call_id>: true }`, click
toggles.

### Live tool output

Tools emit a `ToolProgress` envelope once per burst of stdout, rate-
limited (default: at most one per 250ms) and size-capped (default:
first 4KB per burst). The client renders progress lines beneath the
row while the ToolResult is still pending. When the ToolResult
lands, the card holds the full output and drops the progress lines.

Producer sites: the tool producers under
`substrate/src/substrate/topologies/tool_loop/tools/` all funnel
output through a common runner in `tools/runner.py`. That runner is
where the `ToolProgress` emission goes — one place, every tool
inherits.

Envelope shape:
```
ToolProgress { call_id, tool, step, chunk, offset, eof? }
```

`chunk` is UTF-8 text; `offset` is the byte offset in the tool's
total output stream; `eof` is set on the last emit before ToolResult
so the client knows to seal the streaming pane.

### Interrupt — two tiers

ESC is a two-tier verb. First ESC on a running turn fires soft;
second ESC while the same turn is still running escalates to hard.

**Soft.** Signal the model on its next turn: "stop the tool, return
a summary." The tool completes; its result reaches the model; the
model reads the interrupt signal and returns rather than starting
the next tool. No process is killed.

- Client posts `/api/session/<id>/interrupt?tier=soft`.
- `SessionRegistry.interrupt(session_id, tier="soft")` records an
  `InterruptRequested(tier="soft")` envelope on the record. If a
  model producer is live it also cancels that (same as today's
  single-tier behavior).
- A new `interrupt_fragment_producer` subscribes to
  `InterruptRequested`, emits a `PromptFragment(source="interrupt",
  text="[user requested interrupt — stop tool, return summary]")`.
- The existing `prompt_composer` folds this fragment into the model
  prompt on the next composition.
- Model's next turn produces a FinalAnswer describing what it
  stopped and why.

**Hard.** Kill the tool. Route only for tools that will not return.

- Client posts `/api/session/<id>/interrupt?tier=hard`.
- `SessionRegistry.interrupt(session_id, tier="hard")` walks
  `kind_by_instance` for `kind == "tool"` and calls
  `runtime.cancel_producer(inst, cause="external",
  caller="daemon:interrupt-hard")`.
- The tool's runtime returns a failed `ToolResult(ok=False,
  error="cancelled")`.
- The session topology's `park-on-interrupt` trigger fires the park
  (it already subscribes to `substrate.ProducerCancelled`).

**UX cascade.**
- First ESC on a running turn → soft.
- Second ESC while the same turn is still running → hard.
- Third ESC and beyond while the turn stays alive → inert until
  something changes.
- Transcript row for soft: `^C — soft interrupt requested; the model
  will stop after this tool`.
- Transcript row for hard: `^C — hard interrupt; tool cancelled`.

### ESC semantics inside the UI

- Nothing open, no turn running: ESC is inert.
- Any modal / find / descent / surface open: ESC closes the nearest
  one (today's cascade).
- Model turn running: ESC fires soft first, then hard on second
  press.

## Contact with reality

Facts read from the code:

- `Runtime.cancel_producer(instance, *, cause, caller)` at
  `substrate/src/substrate/kernel/runtime.py:817` cancels one
  Producer by instance id. Instance-scoped. Will cancel a tool
  given a tool instance.
- `SessionRegistry.interrupt(session_id)` at
  `substrate/src/substrate/session_registry.py:912` walks
  `kind_by_instance` and calls `cancel_producer` only when
  `kind == "model"`. Line 953. Hardcoded:
  ```
  for inst, kind in list(st.kind_by_instance.items()):
      if kind == "model":
          ref = runtime.cancel_producer(inst, cause="external", caller="daemon:interrupt")
  ```
- `InterruptRequested` envelope kind does not exist in the kernel
  vocab or session topology envelope catalog today. New kind. It
  needs a `signals/versions/` bump under the SDD vocabulary lock.
- `user_message_fragment_producer` at
  `substrate/src/substrate/topologies/session/user_message_fragment_producer.py:35`
  emits a `PromptFragment` on cohort completion.
  `prompt_composer` folds every fragment into the model prompt.
  A new `interrupt_fragment_producer` slots into the same chain.
- `reveal.html` uses per-row expand nine times (`childOpen`,
  `fanOpen`, `ddFor`, `wsFor`, `bundleFor`). The earlier two-pane
  transcript reconcile bug involved swapping rows in the same list.
  Row-scoped expand adds fields to each row, does not swap rows.
- `ToolCall.payload.args` is on every recorded ToolCall envelope.
  `ToolResult.payload.output` is on every ToolResult.
  `session_controller.ts:698` discards both today.

## The plan

Six work items across the codebase. Owners named because we own all
sides.

1. **Client: tool card row.** `session_controller.ts` carries `args`
   and `output` through to the transcript row. `reveal.html` reads
   `S.toolOpen[call_id]`, renders `▸`/`▾`, expands to the args +
   output panel. Nine existing dc-runtime expand patterns as
   reference. Zero substrate change.
2. **Client: live tool state.** `◌` glyph and seconds counter for
   a ToolCall whose ToolResult has not landed. Read from
   `snap.rawEnvelopes`. Zero substrate change.
3. **Substrate: `SessionRegistry.interrupt(session_id, tier)`.**
   Grow the tier argument. `tier="soft"` records
   `InterruptRequested(tier="soft")` and cancels a live model
   producer if there is one. `tier="hard"` walks `kind_by_instance`
   for both `model` and `tool` and cancels the live producer through
   `cancel_producer`. The server endpoint at `server.py:1620`
   reads a `tier` query param and passes it through.
4. **Substrate: `InterruptRequested` envelope kind.** New envelope,
   `signals/versions/` bump, schema, kernel vocab entry.
5. **Substrate: `interrupt_fragment_producer`.** New producer under
   `topologies/session/`, one trigger, fragment output folded by
   the existing `prompt_composer`. Ships alongside 4.
6. **Substrate: `ToolProgress` envelope + emission.** New envelope,
   another `signals/versions/` bump. Emission from the shared
   runner under `tools/runner.py`. Client renders it into the tool
   card row's live pane.

Landing order that keeps each step green:

- Land 1 and 2 first; the UI carries what the wire already has.
- Land 3 next (tier=soft records only the envelope; tier=hard
  cancels tools). The client wires two-press ESC once 3 is in.
- Land 4 and 5 together — envelope and its subscriber. The soft
  interrupt now has behavior.
- Land 6 last. The tool card grows a live output pane.

## Non-goals

- Rewinding a tool call to a previous state or replaying it.
- Multi-tool concurrency in a single row. When substrate emits two
  ToolCalls in parallel they render as two rows.

## Sources

- `handoff_latest/sheets/Substrate Shell Directions v3.dc.html` —
  the design language sets the accent hues and terminal look.
- `GAP-2026-09-14-interrupt-during-tool-call.md` — the incident this
  design responds to.
- `web/vm/session_controller.ts` line 698 — where ToolCall /
  ToolResult get folded into a transcript row today.
- `substrate/src/substrate/session_registry.py:912` — the interrupt
  entry point.
- `substrate/src/substrate/kernel/runtime.py:817` — the
  instance-scoped cancel primitive.
- `substrate/src/substrate/topologies/session/user_message_fragment_producer.py:35`
  — the fragment producer pattern the interrupt fragment will follow.
