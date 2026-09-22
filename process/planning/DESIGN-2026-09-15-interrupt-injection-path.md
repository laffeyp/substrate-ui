# DESIGN — Interrupt injection path (Phase 8 item 7) · 2026-09-15

Ratified prior: `DESIGN-2026-09-14-r5-session-transparency.md` (§7 names
`interrupt_fragment_producer`), `PLAN-2026-09-14-phase-8.md` (item 7),
`STATUS-2026-09-14-phase-8-checkpoint.md` (§"Deferred, with cause"
line 77 names three architecture calls). This design pass answers the
first: **where the daemon writes the `InterruptRequested` envelope
onto a live record while a tool is running.**

## The concrete case

A session runs a bash tool. The user presses ESC (Shift+ESC in the
current binding). Client posts `/api/session/<id>/interrupt?tier=soft`.
Server calls `SessionRegistry.interrupt(session_id, tier="soft")` at
`substrate/src/substrate/session_registry.py:912`. The registry finds
the live producer via `kind_by_instance` and (per Sprint 076 wiring)
returns a synthetic signal ref rather than cancelling the tool.

What does not yet happen: the model receives no directive to stop
after this tool. The `InterruptRequested` Struct exists as a
vocabulary entry (Sprint 076) but nothing writes it to the record and
no trigger consumes it. The r5 design (§7) says the shape is
`interrupt_fragment_producer → PromptFragment(source="interrupt", …)`
folded by the existing `prompt_composer`. The gap is between the
registry's `tier="soft"` decision and the fragment producer's firing.

## The injection primitive already exists

`Runtime._resume_bootstrap` at `runtime.py:466` injects an external
event onto a live record:

```
self._cyc.cycle(_Lifecycle(kind, payload))
```

`_Lifecycle` is defined at `sequencer.py:64` and is the same envelope
shape every lifecycle emission uses. `AppendCycle.cycle` at
`sequencer.py:106` appends the frame with `producer=null` (external
supply) and fires every trigger whose subscription matches. Seq
continues the same sequence.

Every lifecycle emitter inside a live producer body also uses this
path — `_Lifecycle(PRODUCER_STARTED, …)` at `runtime.py:572`,
`_Lifecycle(PRODUCER_COMPLETED, …)` at 594, `PRODUCER_CANCELLED` at
609, `PRODUCER_FAILED` at 622 and 630. Each is enqueued via
`st.inbox.put_nowait(_Lifecycle(...))`; the main loop drains the inbox
at `runtime.py:699` and cycles each item.

The primitive is not new. It is unexposed to callers outside the
runtime.

## Three options

**Option A — expose the primitive.** `Runtime.inject_event(event, *,
source: str)` that packages the event as a canonicalized `_Lifecycle`
and enqueues it on `st.inbox` via `loop.call_soon_threadsafe`
(same shape `SessionRegistry.interrupt`'s `_do_cancel` closure already
uses at `session_registry.py:960`). While the tool body runs on a
worker thread (Sprint 076 `asyncio.to_thread` fix), the runtime's main
loop is idle blocking on `st.inbox.get()`; the enqueued Lifecycle wakes
it on the next iteration. The InterruptRequested frame lands with
`producer=null`, seq continues normally, any trigger subscribed to
`InterruptRequested` fires.

- **Pros.** The daemon writes the envelope on the record when the user
  pressed ESC, not when the tool completes. The frame's `t` is
  accurate. Item 8 (`ToolProgress` emission) reuses the same
  primitive; the design pass on item 8 collapses.
- **Cons.** New public kernel API. Reserved-kind refusal already lives
  in `Runtime.resume` at `runtime.py:164`; the new method inherits
  that check. Canonicalization already runs in `_resume_bootstrap` at
  `runtime.py:462`; the new method inherits it. No new
  substrate-kernel machinery — a public wrapper around the existing
  private path.
- **Reader question.** The chain trigger design (Sprint 064) fires
  the composer only on `user_message_fragment_producer`'s completion,
  which fires only on `UserMessage`. A mid-tool
  `InterruptRequested`-fired fragment producer lands its
  `PromptFragment` in the cohort buffer, but the composer does not
  re-fire, so no fresh `PromptComposed` lands, and the session's model
  (which subscribes to `resume-on-composed`, Sprint 067) does not
  wake. The interrupt fragment sits unused until the next
  `UserMessage`. See "The chain-firing question" below.

**Option B — buffer on the registry, inject on next park via
`resume_event`.** `SessionRegistry.interrupt(tier="soft")` records the
tier on a per-session slot and defers the write. When the tool
completes and the runtime paths through park, the registry catches the
`substrate.RunFinalised(reason="paused")` (or the session topology's
`park-on-interrupt` shape) and calls `Runtime.resume(topology,
resume_event=InterruptRequested(...))`. Resume path already writes
the envelope through `_resume_bootstrap`.

- **Pros.** Uses `Runtime.resume` as it is. No new kernel API.
- **Cons.** The tool must complete for the interrupt to land. During
  a five-minute bash the frame is not on disk; a replay of that
  window shows nothing. The model reads the interrupt at park, which
  is one turn later than the r5 design's "signals the model on its
  next turn" clause reads at (r5 line 100 says "signals the model on
  its next turn"; ambiguous whether "next turn" means "the next
  firing after this tool" or "the next Park→UserMessage cycle").
- **Reader question.** Every current path that could park (the
  `park-on-interrupt` trigger subscribed to
  `substrate.ProducerCancelled`) fires on cancel, not on soft signal.
  For tier="soft", the current implementation returns a synthetic ref
  and takes no runtime action — nothing parks. Option B either
  wires a new "signal-and-let-the-tool-finish" park trigger, or it
  wires the registry to poll for the tool's ProducerCompleted and
  call resume then. Both are new machinery.

**Option C — direct record append, bypass the runtime.** Daemon opens
the record's append lock and writes the `InterruptRequested` envelope
with `producer=null`. Substrate's record layer allows external
appends (the ChildRoot delegate machinery uses this shape).

- **Pros.** No runtime API change. Envelope lands on disk when ESC
  fires.
- **Cons.** The runtime's inbox does not see the frame. Triggers
  registered on the runtime never fire. The record shows the frame
  but no fragment producer, no composer refire, no model directive.
  Purely a record-side write, not a runtime-side signal. Fails the
  functional requirement.

Recommendation: **A**, with the chain-firing question resolved below.

## The chain-firing question

Option A places `InterruptRequested` on `st.inbox`. A trigger
`emit-interrupt-fragment` subscribed to `InterruptRequested` fires an
`interrupt_fragment_producer` that emits a `PromptFragment`. The
composer's chain (Sprint 064) fires on `user_message_fragment`'s
completion; it does not fire on the interrupt fragment. Without a
composer refire, `prompt_composer` does not emit `PromptComposed`, the
model does not wake, and the interrupt fragment sits in the cohort
buffer unused until the next UserMessage.

Three ways to close this.

**A.1 — extend the composer chain to fire on interrupt.** Add
`compose-on-interrupt` trigger subscribed to
`interrupt_fragment_producer`'s completion. Fires the composer, which
re-composes the cohort (with the interrupt fragment now in it) and
emits a fresh `PromptComposed`. The session's model wakes on
`resume-on-composed` and receives the new prompt with the interrupt
directive at high precedence. This matches r5 line 100 read
strictly.

- **Cost.** One new trigger. Composer re-runs on every interrupt
  (rare; ESC is user-driven, not high-frequency).
- **Question.** The session's model producer is currently in one of
  three states when the interrupt lands:
  - (a) Idle waiting for `PromptComposed` (no active turn). Fresh
    `PromptComposed` wakes it. Fine.
  - (b) Currently emitting a `ToolCall` and hasn't spawned the tool
    yet. Undefined — the model's producer body has not consumed the
    prior `PromptComposed`. Investigate.
  - (c) The tool is running (this is the ESC-during-bash case). The
    model producer completed its ToolCall emission and is waiting on
    `resume-on-composed` for its next firing. Fresh `PromptComposed`
    lands during the tool's execution; the model fires immediately,
    reading its transcript view which does not yet include the
    ToolResult. This is the wrong ordering — the model should read
    the interrupt directive AFTER the tool completes, so its
    transcript is coherent.

**A.2 — inject the interrupt AFTER the tool completes.** Registry
sets a per-session flag on ESC. The tool_loop's `continue` trigger
(fires on `ToolResult`) checks the flag; if set, spawns the
`interrupt_fragment_producer` via the runtime injection path and
clears the flag. Composer chain then fires
`compose-on-interrupt` (A.1) or plain
`user_message_fragment_producer`'s completion (fold interrupt into
the existing chain shape).

- **Cost.** State on the registry side keyed by session_id. One
  trigger consult. The chain runs naturally.
- **Merit.** The interrupt directive reaches the model with the
  ToolResult already in its transcript. Matches "the tool completes
  on its own, its result reaches the model, and the model returns"
  from r5 line 101 literally.

**A.3 — inject the interrupt as a first-class UserMessage variant.**
Daemon writes a `UserMessage(text="[user requested interrupt — stop
after this tool]", source="interrupt")` via Option A's primitive.
The existing chain fires: per_turn → user_message → composer →
PromptComposed → model. No new triggers.

- **Cost.** A user-facing envelope carries a synthetic "message"
  the user did not type. The transcript row for it needs a distinct
  render (`^C — soft interrupt requested` vs a plain user prompt).
- **Merit.** Zero new topology machinery. The composer chain runs as
  designed. The interrupt is an ordinary turn on the record.
- **Question.** A `UserMessage` mid-tool triggers the same
  wrong-ordering issue as A.1(c) — the model wakes before the tool
  completes. This would need A.2's "inject after tool completes"
  gating regardless.

Recommendation: **A.2 with a fresh envelope kind (not a synthetic
UserMessage).** The registry holds the tier flag; the tool_loop's
`continue` trigger consumes it on ToolResult; the runtime injection
primitive writes `InterruptRequested` at that moment;
`interrupt_fragment_producer` fires; the existing composer chain
runs (per_turn already fired on the ORIGINAL UserMessage of the turn,
but user_message_fragment fires on `latest_user_message`, which is
still the current turn's UserMessage). PromptComposed lands with the
interrupt fragment folded in at high precedence. Model wakes.

## The three architecture calls resolved

Reading the STATUS doc §"Deferred, with cause" line 77:

- **Where the daemon writes the envelope.** Option A's
  `Runtime.inject_event` (public wrapper over `_cyc.cycle(_Lifecycle)`).
- **How the fragment producer sees the payload.** `InterruptRequested`
  has its own `producer_kind`-registered trigger `emit-interrupt-fragment`;
  the trigger's `input_builder` reads the envelope directly (kernel
  passes it through — same shape `emit-per-turn-fragment` uses reading
  `UserMessage` fields).
- **How the composer folds it.** `PromptFragment(source="interrupt",
  precedence=95)` — high precedence, folded above tool-suite (20) and
  per_turn (10), below role (0) which is the header. The fragment
  text: `"[user requested interrupt — the previous tool's result is
  in your transcript; do not start another tool this turn; return a
  concise final answer summarising where the task stands.]"`.

## Item 8 falls out of the same primitive

`ToolProgress` needs a mid-run emission from inside a running tool.
The tool producer runs on a worker thread (Sprint 076
`asyncio.to_thread`). The worker thread posts progress chunks via
`Runtime.inject_event(ToolProgress(...))` from a `call_soon_threadsafe`
closure. Same primitive as item 7. The producer-yields-vs-runner-injects
question from the status doc line 122 collapses: the runner injects,
because the tool body is opaque Python code that cannot yield through
`asyncio.to_thread`.

## What lands

1. `Runtime.inject_event(event, *, source: str) -> None` in
   `substrate/src/substrate/kernel/runtime.py`. Canonicalizes,
   reserved-kind-refuses, enqueues `_Lifecycle` on `st.inbox` via
   `call_soon_threadsafe`. Returns `None`; caller cannot wait for
   effect (the injection is fire-and-forget by design).
2. A new `producer_kind` `interrupt_fragment` and trigger
   `emit-interrupt-fragment` in
   `substrate/src/substrate/topologies/session/`. The producer emits
   one `PromptFragment(source="interrupt", precedence=95, …)`.
3. Session registry holds an `_interrupt_pending: dict[str, str]`
   (session_id → tier). `interrupt(tier="soft")` sets it; consumed
   by the runtime injection on the next `ToolResult` boundary via a
   small helper trigger registered on the tool_loop's ToolResult path,
   or (simpler) by a check inside `session_registry.interrupt` that
   defers to a follow-up call from the tool completion callback.
   Second design pass needed on the trigger-vs-callback choice.
4. `SessionRegistry.interrupt(tier="soft")` no longer returns the
   synthetic signal ref alone; it sets `_interrupt_pending` and
   returns a real ref describing what was queued.
5. A small test in `substrate/tests/` that runs a scripted tool_loop
   with a mid-tool `inject_event(InterruptRequested)`, asserts the
   frame lands with `producer=null`, asserts the fragment producer
   fires, asserts the model's next `PromptComposed.text` contains
   the interrupt fragment.

## What this does not do

- Cancel a running tool. That is `tier="hard"`, already wired via
  `cancel_producer`.
- Change the composer's precedence for anything other than the new
  interrupt fragment.
- Descent-scope routing (item 9). That reads the top of the descent
  stack on the client and posts to the correct `(session_id | record_root,
  tier)`. Item 4 already carries `record_root` end-to-end.

## Sources

- `substrate/src/substrate/kernel/runtime.py:129` — `Runtime.resume` docstring.
- `substrate/src/substrate/kernel/runtime.py:425` — `_resume_bootstrap`.
- `substrate/src/substrate/kernel/runtime.py:466` — `self._cyc.cycle(_Lifecycle(kind, payload))`.
- `substrate/src/substrate/kernel/runtime.py:572,594,609,622,630` — lifecycle-emit sites inside a live producer.
- `substrate/src/substrate/kernel/runtime.py:699` — inbox drain / cycle.
- `substrate/src/substrate/kernel/sequencer.py:64` — `_Lifecycle`.
- `substrate/src/substrate/kernel/sequencer.py:106` — `AppendCycle.cycle`.
- `substrate/src/substrate/session_registry.py:912` — `SessionRegistry.interrupt`.
- `substrate/src/substrate/topologies/session/__init__.py` — chain trigger design (Sprint 064).
- `DESIGN-2026-09-14-r5-session-transparency.md` §7.
- `PLAN-2026-09-14-phase-8.md` items 7 + 8.
- `STATUS-2026-09-14-phase-8-checkpoint.md` §"Deferred, with cause".
