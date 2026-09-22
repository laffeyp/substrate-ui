# STATUS · Phase 8 · Item 7 closed · 2026-09-15

Ratified prior: `DESIGN-2026-09-14-r5-session-transparency.md`,
`PLAN-2026-09-14-phase-8.md`, `STATUS-2026-09-14-phase-8-checkpoint.md`,
`DESIGN-2026-09-15-interrupt-injection-path.md`. This status updates the
2026-09-14 checkpoint with what landed on 2026-09-15.

## Landed since the 2026-09-14 checkpoint

**7. Interrupt injection end-to-end.** The design pass in
`DESIGN-2026-09-15-interrupt-injection-path.md` resolved the three
architecture calls the 2026-09-14 status doc named. Substrate philosophy
made the answer a derivation, not a choice: option A (expose the
existing `_resume_bootstrap` primitive publicly) is the only shape that
respects the record-is-source-of-truth invariant; option B (buffer on
the registry, resume-inject) lands the frame one turn late; option C
(bypass the runtime with a direct record append) leaves the trigger
graph unable to fire. Sub-shape A.2 (inject on the ToolResult boundary)
follows the same rule — mid-tool injection wakes the model before the
tool completes, which contradicts the r5 line 101 clause.

Four commits landed the wiring:

- Substrate `9503152e` — `Runtime.inject_event(event)` public method.
  Canonicalizes the event, refuses a reserved `substrate.*` kind (same
  discipline `Runtime.resume` uses at `runtime.py:164`), enqueues
  `_Lifecycle(kind, payload)` on `st.inbox`. Cross-thread callers wrap
  in `loop.call_soon_threadsafe`. Peer to `cancel_producer` on the
  daemon-facing surface. Four tests in `tests/test_inject_event.py`:
  injection lands with `producer=null` and fires the subscribed
  trigger, reserved-kind refusal, cross-thread injection, pre-run raise.

- Substrate `e9a22734` — session topology grows the fragment path.
  Vocabulary: `PromptSource.INTERRUPT` (turn-scoped),
  `PRODUCER_KIND_INTERRUPT_FRAGMENT`, `TRIGGER_ID_EMIT_INTERRUPT_FRAGMENT`,
  `TRIGGER_ID_COMPOSE_ON_INTERRUPT_TOOL_RESULT`. New file
  `interrupt_fragment_producer.py` emits one
  `PromptFragment(source="interrupt", precedence=95,
  provenance={tier, source})`. `session_topology.__init__` registers
  the producer_kind, the `emit-interrupt-fragment` trigger (fires on
  `InterruptRequested`), and the `compose-on-interrupt-tool-result`
  trigger (fires the composer on ToolResult when the FragmentCohort
  holds a pending interrupt fragment). `TRIGGER_ID_CONTINUE` and
  `TRIGGER_ID_WRAP_UP` gained the mirror predicate `and not
  _has_pending_interrupt(ctx)` so exactly one of the three fires per
  ToolResult. The model wakes on `RESUME_ON_COMPOSED` with both the
  tool result and the interrupt directive in scope. Bundled CI records
  regenerated across all 18 topologies. Two tests in
  `tests/test_prompt_fragment_interrupt.py`.

- Substrate `3c4bb1cf` — `SessionRegistry.interrupt(tier="soft")` calls
  `runtime.inject_event(InterruptRequested(session_id, tier, source))`
  on a live tool. The synthetic signal ref still returns so the client
  renders "the model will stop after this tool"; the difference is the
  envelope now lands on the record too, and the fragment producer fires.

- Substrate-ui-working `fd93a5f` — the daemon-side shadow
  `session_registry.py` mirrors the substrate-side wiring.

**9 (first half). Delegate ToolResult carries a real descend
affordance.** Substrate-ui-working `b17960c`. Prior to this the descent
click was still bound to the scripted `CH` map at `web/reveal.html:1286`;
real delegate ToolResults rendered `[object Object]` in the tool card
and offered no descent. `_liveBindingsFor` now detects `row.toolName ===
"delegate"` on a paired ToolResult, reads `output.answer` for the card
body and `output.child_root` for the descend path, and emits a
`descendShow` + `descend` click handler that calls
`window.__vm.attachRecordRoot(child_root)` (proxied through
`PaneRegistry` to the active pane's `SessionController.attachRecordRoot`
— item 4's endpoint). The click pushes the `child_root` string onto
`S.descent` so the descent crumbs, depth ramp, and follow-up ESC-scope
routing all read the descended target off the same stack. Every other
tool with a dict output now pretty-prints via `JSON.stringify(output,
null, 2)` instead of `[object Object]`.

## Still deferred

**8. `ToolProgress` envelope + emission.** The design pass on producer-
yields vs runner-injects collapsed under item 7's answer: the tool body
runs inside `asyncio.to_thread` (Sprint 076), so it cannot yield through
the producer's `AsyncIterator`. The runner injects via
`Runtime.inject_event` from a `call_soon_threadsafe` closure — same
primitive item 7 uses. The blocker is the tool side: only `bash` has
output long enough to stream, and `_bash` today uses
`subprocess.run(capture_output=True)` which blocks until completion. A
streaming `bash` needs `subprocess.Popen(stdout=PIPE)` + a read loop
that chunks stdout, rate-limits emissions (r5 §8 names 250ms / 4KB
caps), and yields the final `ToolResult` on process exit. Sprint-sized
substrate change; not client-facing.

**9 (second half). Descent-scope ESC routing.** The client now pushes
the `child_root` onto `S.descent`; the ESC handler still posts
`/interrupt` against the parent's session_id. To route ESC to the
descended target, three pieces need to land:

- Substrate side: a child-runtime registry. Delegate at
  `topologies/tool_loop/delegate.py` spawns each child via
  `asyncio.run(Runtime(child_root).run(child_topology()))` on the tool
  producer's worker thread — the parent runtime holds no handle. The
  parent SessionRegistry cannot reach a child's `kind_by_instance` or
  its `runtime.cancel_producer`. Options: (a) add
  `Runtime.register_child(child_root, child_runtime)` called from
  delegate's spawn path; (b) a process-global
  `_ACTIVE_RUNTIMES_BY_RECORD_ROOT: dict[str, Runtime]` the child's
  own `Runtime.__init__` populates. Both add the child-registry
  primitive that r5 named as `Runtime._children`.
- Substrate side: `SessionRegistry.interrupt(target, tier)` grows the
  target-shape argument (r5 §5 line 158). When `target` is a
  `record_root` string, walk the child registry to find the runtime.
- Client + server: the client's ESC posts either `session_id=<id>` or
  `record_root=<path>` depending on `S.descent`'s top. The server's
  `/interrupt` endpoint routes accordingly.

## Phase 8 wall

Items 1–7, 9-first-half: closed. Items 8 and 9-second-half stand as
their own follow-up cards, each with a substrate architecture piece
that warrants its own design turn. The r5 design's "session transparency
+ interrupt with delegate scope" reaches session scope end-to-end today;
delegate-scope interrupt is queued.

## The wire, drawn

```
CLIENT (reveal.html)         SERVER (server.py)          REGISTRY (session_registry.py)
     │                              │                              │
     │  Shift+ESC                   │                              │
     │  ─────────────────► POST     │                              │
     │  /interrupt?tier=soft ─────► │                              │
     │                              │  interrupt(sid, tier="soft") │
     │                              │ ────────────────────────────►│
     │                              │                              │ ── call_soon_threadsafe(_do_cancel)
     │                              │                              │
     │                              │                              ▼

                                                          RUNTIME LOOP (event loop thread)
                                                              │
                                                              │ _do_cancel closure runs
                                                              │ finds live tool, no live model
                                                              │ runtime.inject_event(
                                                              │     InterruptRequested(
                                                              │         session_id, "soft", caller))
                                                              │
                                                              │ ── canonicalize + refuse-reserved
                                                              │ ── st.inbox.put_nowait(_Lifecycle(...))
                                                              │
                                                              ▼

                                                          MAIN LOOP DRAIN
                                                              │
                                                              │ inbox.get() → _Lifecycle(InterruptRequested)
                                                              │ AppendCycle.cycle(...)
                                                              │
                                                              ▼
                                                       ┌──────────────────────────────┐
                                                       │  RECORD                      │
                                                       │  seq=N   InterruptRequested  │
                                                       │          producer=null       │
                                                       └──────────────┬───────────────┘
                                                                      │
                                                                      ▼
                                                       trigger: emit-interrupt-fragment
                                                       fires → interrupt_fragment_producer
                                                       yields → PromptFragment(
                                                                    source="interrupt",
                                                                    precedence=95,
                                                                    provenance={tier, source})
                                                                      │
                                                                      ▼
                                                       FragmentCohort._turn.append(...)
                                                                      │
                                                                      │      (tool still running)
                                                                      │      ...tool completes...
                                                                      ▼
                                                       ┌──────────────────────────────┐
                                                       │  RECORD                      │
                                                       │  seq=M   ToolResult          │
                                                       └──────────────┬───────────────┘
                                                                      │
                                                                      ▼
                                                       Three triggers subscribed to ToolResult:
                                                         CONTINUE  → predicate: no interrupt? → FALSE, refuse
                                                         WRAP_UP   → same predicate            → FALSE, refuse
                                                         COMPOSE_ON_INTERRUPT_TOOL_RESULT
                                                                   → predicate: has interrupt? → TRUE, fires
                                                                      │
                                                                      ▼
                                                       prompt_composer reads FragmentCohort:
                                                         [role, tools_suite, ..., interrupt(prec 95)]
                                                       yields → PromptComposed(
                                                                    text=<...role + directive>,
                                                                    fragment_seqs=(...,seq_of_interrupt))
                                                                      │
                                                                      ▼
                                                       FragmentCohort._turn.clear()  (turn slice reset)
                                                                      │
                                                                      ▼
                                                       trigger: RESUME_ON_COMPOSED
                                                       fires → model producer
                                                       reads composed_prompt with the interrupt directive
                                                       yields → FinalAnswer (a real model would)
```

## Sources

- `substrate/src/substrate/kernel/runtime.py:817` — `cancel_producer`
  (peer of `inject_event`).
- `substrate/src/substrate/kernel/runtime.py:855` — `inject_event`
  (this phase).
- `substrate/src/substrate/topologies/session/interrupt_fragment_producer.py`
  — the fragment source.
- `substrate/src/substrate/topologies/session/__init__.py` — trigger
  wiring (search `EMIT_INTERRUPT_FRAGMENT`,
  `COMPOSE_ON_INTERRUPT_TOOL_RESULT`, `_has_pending_interrupt`).
- `substrate/src/substrate/session_registry.py:912` —
  `interrupt(tier="soft")` injection.
- `substrate-ui-working/session_registry.py:891` — the daemon-side
  shadow of the same.
- `substrate-ui-working/web/reveal.html:920` — `_liveBindingsFor`
  delegate branch.
- `substrate-ui-working/web/vm/pane_registry.ts:116` —
  `attachRecordRoot` proxy.
- `substrate-ui-working/process/planning/DESIGN-2026-09-15-interrupt-injection-path.md`
  — the design pass.
