# GAP — interrupt during a tool call is silently a no-op · 2026-09-14

## What happened

Session `s_991dab49ece54eb49effd564`, driver `kimi-k2.7-code:cloud`,
tools_suite enabled. The user typed a long prompt, the model started
calling tools: `list_dir`, `bash pwd && ls -la`, `bash find …`,
`read_file manifest.json`, `bash`, `grep`, `grep`. The last `grep`
searched `/Users/peterlaffey` for `Choose folder|choose folder|Choose
Folder` — a full-home-directory scan that would not return in bounded
time.

The user pressed ESC repeatedly. The client-side ESC-to-interrupt
POSTed `/api/session/<id>/interrupt`. Each time the server returned
`{"interrupted": false, "landed": false}`. The client printed
`^C — no turn in flight`. But the session was clearly not idle — the
grep was chewing on the home directory.

## Root cause

`SessionRegistry.interrupt(session_id)` cancels the **model** producer
via `Runtime.cancel_producer`. Between two ToolCalls the model
producer has already emitted `ProducerCompleted`; the session
topology has fired the `continue`/`run-tool` triggers and the TOOL
producer is running. From the registry's view there IS no live
producer to cancel — the model finished, and cancelling a tool is
not a verb the registry exposes.

Server response is honest to that reading. But the user's mental
model is "ESC stops what the session is doing", not "ESC only
cancels the model." A long tool call has no user-side stop.

## Fix shape

A real fix is substrate-side. Two options, in order of scope:

1. **Registry-level tool cancellation.** Extend
   `SessionRegistry.interrupt` to also `Runtime.cancel_producer` any
   currently-live tool producer. The session topology already has
   `park-on-interrupt` subscribed to `substrate.ProducerCancelled` —
   the park fires either way. Server-side signature and response
   stay the same. The change is scoped to the registry's producer
   tracking.
2. **Tool-side deadline.** Every tool producer accepts a wall-clock
   deadline; when the deadline arrives, the tool emits a failed
   ToolResult with `error="deadline exceeded"` and its runtime
   returns. This is a broader change (every tool touches it) and
   solves a wider class of hangs but does not address the ESC
   verb specifically.

Client-side stopgap already landed: `interruptTurn` walks the recent
raw envelopes for an unpaired ToolCall; when found, the transcript
row reads `^C — a <tool> tool call is running; substrate's interrupt
only reaches the MODEL producer today. The tool will return on its
own or timeout.` instead of `^C — no turn in flight`. That names
what happened without lying about it.

## Reproduction

1. Open a session with `tools_suite_fragment` enabled and a real
   model driver.
2. Send a prompt that provokes a `grep` or `bash find` over a large
   tree.
3. Wait until the model has emitted the ToolCall (visible on the
   stream).
4. Press ESC before the ToolResult arrives.
5. Observe: `^C — no turn in flight` (with the client-side stopgap:
   the corrected message names the running tool).
6. The tool continues to run to completion or timeout.

## Owner

Substrate. The ui-server response is correct given the current
registry contract; this is a substrate feature request, not a
ui-server bug.

## Related

- `web/vm/session_controller.ts` — the client-side stopgap message.
- `server.py:1620` — the interrupt handler; documents the exact
  contract.
- Substrate `SessionRegistry.interrupt` — the site of the fix.
