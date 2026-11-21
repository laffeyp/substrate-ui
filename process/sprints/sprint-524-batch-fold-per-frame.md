# Sprint 524 — Envelopes folded in batches, once per frame

```yaml
---
id: 524
status: closed
phase: window productionized (roadmap 2026-11-18-window-productionizing r1, W2)
pass_kind: functional
depends_on: [523]
plan: process/planning/2026-11-18-window-productionizing/ROADMAP-2026-11-19-window-productionizing-r1.md
---
```

## scope

`SessionController.handleEnvelope` stops patching and notifying listeners on every envelope. Instead it queues each envelope and schedules a `requestAnimationFrame` callback. The callback drains the queue in one pass: appends all queued envelopes to `rawEnvelopes` once, runs each envelope's kind-specific handler (the `envelopeToRows` switch), accumulates every `progressByCallId` update, and publishes one snapshot with one listener notification for the whole batch. During the drain, `patch()` writes to `this.snap` but does not fire listeners; the listeners fire once after the last envelope in the batch. `noteSkipped` replaces its `transcript.some()` scan with a `Set<number>` of seqs that produced rows, maintained in `appendTranscript`. When a backlog exceeds a frame's budget (a session opened from a link replays thousands of envelopes at once), the drain yields after a time slice and resumes in the next frame, so the page stays responsive during catchup. One verifiable property: a client spec feeds 30,000 envelopes and counts fewer listener calls than envelopes, each call carrying a valid snapshot.

## prerequisites

- 523 (the gate that measures the fix)

## context_files

- `../sdd-kit-3/AGENTS.md`
- `web/vm/signals/versions/current.json` (v0.73)
- `BLACKBOARD.md` (decision entries, tail)
- `WORKING_AGREEMENT.md`
- `web/vm/session_controller.ts` — the file this sprint modifies; read in full, especially `handleEnvelope` (line 1472), `envelopeToRows` and its switch, the `ToolProgress` handler (line 1651), `appendTranscript` (line 1918), `patch` (line 1922), `noteSkipped` (line 1502)
- `web/vm/types.ts` — the `Snapshot` type
- `web/vm/pane_registry.ts` — the subscriber that relays snapshots; must still receive one per batch
- `web/vm/client.ts` — `BrowserSubstrateClient._openSse`, the EventSource that calls `handleEnvelope`
- `process/planning/2026-11-18-window-productionizing/RESEARCH-2026-11-20-window-productionizing-r5.md` (§ "Why" and § "What is wrong in the design", item 1)

## signal contract

### Emits

No new tags. The existing per-envelope tags (`STREAM_ENVELOPE_APPENDED`, `TRANSCRIPT_ROW_SKIPPED`, `TRANSCRIPT_ROW_DRAWN`) continue to fire per envelope inside the batch loop — their batching into summaries is W10's scope, not this sprint's.

### Consumes

- As listed in `context_files`.

### Invariants

- The vocabulary file is not modified.
- After a batch, `this.snap.rawEnvelopes` holds every envelope in arrival order, with no duplicates and no losses.
- `this.snap.transcript` holds every row `envelopeToRows` produced, in order.
- `this.snap.progressByCallId` reflects every `ToolProgress` chunk, concatenated in order.
- Every existing path through `envelopeToRows` (the per-kind switch: `UserMessage`, `AssistantMessage`, `ToolCall`, `ToolProgress`, `ToolResult`, etc.) still runs; no case is dropped.
- `noteSkipped` still fires `TRANSCRIPT_ROW_SKIPPED` for every envelope that produced no row.
- Listeners receive a snapshot that is internally consistent: transcript, rawEnvelopes, and progressByCallId all reflect the same set of envelopes.

## artifact contract

### Files created

- `web/reveal/__tests__/batch_fold.spec.ts` — a client spec that constructs a `SessionController`, feeds it 30,000 envelopes (a mix of `UserMessage`, `AssistantMessage`, `ToolCall`, `ToolProgress` and `ToolResult` including one call with 20,000 progress chunks), and asserts:
  - Listener was called fewer than 30,000 times (the batching signal).
  - Final snapshot's `rawEnvelopes.length` equals 30,000.
  - Final `progressByCallId[key].text` equals the concatenation of all 20,000 chunks.
  - Final `transcript` holds the correct rows in order.

### Files modified

- `web/vm/session_controller.ts` — `handleEnvelope` queues and schedules rAF; a drain method folds the queue in batches; `patch()` suppresses listeners during a drain; `noteSkipped` reads from a `Set<number>`; `appendTranscript` maintains the set.

### Content assertions

- `session_controller.ts` contains `requestAnimationFrame`.
- Inside the drain path (`if (this.draining)`), `processEnvelope` pushes to `rawEnvelopes` in place; the spread `[...this.snap.rawEnvelopes, env]` exists only in the non-drain `else` branch for single-envelope fallback.
- `noteSkipped` does not contain `.some((row)`.
- Inside `drainBatch` and `processEnvelope`, `patch()` is not called with `rawEnvelopes`, `transcript`, or `progressByCallId` as keys; these collections are mutated in place during the drain and given fresh references once at the end.
- `batch_fold.spec.ts` asserts listener call count is strictly less than envelope count.

### Command exit codes

- `npx tsc -p harness --noEmit` returns 0.
- `npm run test:unit` returns 0.
- `npm run gates:electron` — `transcript_follow`, `tool_output_text`, `tool_output_formatted` pass.

## observation contract

### UI driving steps

- Run the W1 gate (`npx tsx harness/shakeout/long_session_open.ts`) on the modified tree.
- Run `transcript_follow` and `tool_output_text` gates.

### Expected log substrings

- The W1 gate's verdict line names `working_set` as `pass` (or under the provisional 1.5 GB budget).

### Expected runtime signals

- The W1 gate's trace holds `STREAM_ENVELOPE_APPENDED` tags (still per envelope), `TRANSCRIPT_ROW_DRAWN` for the last row, no `RENDERER_GONE`.

### Expected screenshot / visual state

- The W1 gate's window draws the session's last transcript row (checked by the gate itself).

## done criteria

The session controller folds envelopes once per animation frame and publishes one snapshot per batch; the client spec proves the batching by counting listener calls against 30,000 envelopes; the W1 gate's working-set check improves or passes.

## notes

- The rAF callback is not available in a jsdom spec; the spec either stubs `requestAnimationFrame` or calls the drain method directly. The spec's concern is that batching produces correct state, not the scheduling mechanism.
- The time-sliced yield for backlogs uses a constant (e.g., 8 ms) chosen to leave headroom in a 16 ms frame. The constant is in one place and named.
- During a drain, `rawEnvelopes`, `transcript`, and `progressByCallId` are mutated in place (push to the array, write the key). Handlers that read `this.snap` within the same batch see the accumulated state because they read the same mutable objects. At the end of each drain (or when the drain yields for the next frame), one `flushBatch` creates fresh object/array references so React detects the change, then listeners fire once. `patch()` is still called during the drain for scalar fields (e.g., `turnIndex`), but never for the three bulk collections.
- The `seenSeqs` Set already exists on the controller; `noteSkipped`'s new `rowSeqs` Set is the same pattern.

## self-review checklist

- [ ] Scope is concrete and bounded (one paragraph; one verifiable property of the artifact).
- [ ] `context_files` covers everything the Agent needs to read.
- [ ] Signal contract's `Emits` list references only tags in `signals/0.73.json`.
- [ ] Artifact contract is gradable: content assertions are concrete, command exit codes are runnable.
- [ ] If `pass_kind: functional`: observation contract is present.
- [ ] Sprint sweet spot honored: ≤2 files modified, one concept.
