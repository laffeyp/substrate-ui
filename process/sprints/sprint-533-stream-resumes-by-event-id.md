# Sprint 533 — The stream resumes by event id

```yaml
---
id: 533
status: pending
phase: window productionized (roadmap 2026-11-18-window-productionizing r1, W11)
pass_kind: functional
depends_on: [532]
plan: process/planning/2026-11-18-window-productionizing/ROADMAP-2026-11-19-window-productionizing-r1.md
---
```

## scope

The server writes `id: <seq>` on each SSE frame. When the browser reconnects (EventSource's automatic retry, or the controller's reconnect timer), it sends `Last-Event-ID` and the server starts from the envelope after that seq. The controller's `seenSeqs` dedup still runs as a safety net but no longer carries the full replay's cost. One verifiable property: a gate that drops the SSE connection mid-backlog (after N envelopes) sees the stream resume past the last seq with no duplicate rows in the transcript.

## prerequisites

- 532 (W10: signal path batches; the client and server are both batched, now the reconnection is efficient)

## context_files

- `../sdd-kit-3/AGENTS.md`
- `web/vm/signals/versions/current.json`
- `BLACKBOARD.md` (decision entries, tail)
- `WORKING_AGREEMENT.md`
- `server.py` — the SSE endpoint that streams envelopes; how frames are written
- `web/vm/client.ts` — `BrowserSubstrateClient._openSse`, the EventSource wrapper
- `web/vm/session_controller.ts` — the reconnect path (`reconnectTimer`, `attachStream`)

## signal contract

### Emits

No new tags.

### Consumes

- As listed in `context_files`.

### Invariants

- The vocabulary file is not modified.
- The `id` field is the envelope's `seq` as a string.
- The server respects `Last-Event-ID` from the HTTP header (the SSE spec).
- If `Last-Event-ID` names a seq the server does not have, the server sends the full stream (graceful fallback).
- The controller's existing dedup (`seenSeqs`) still runs and skips duplicates, so a stale `Last-Event-ID` does not corrupt state.

## artifact contract

### Files created

- `harness/shakeout/stream_resume.ts` — the gate.

### Files modified

- `server.py` — the SSE writer adds `id: <seq>\n` before each `data:` line; the endpoint reads `Last-Event-ID` from the request and starts from the envelope after it.
- `web/vm/client.ts` — no change needed if the browser's EventSource handles `Last-Event-ID` automatically; verify and document.

### Content assertions

- `server.py`'s SSE writer contains `id:` in its frame output.
- `server.py` reads `Last-Event-ID` from the request headers.
- The gate asserts: after a forced disconnect, the reconnected stream's first envelope has a seq greater than the last received.

### Command exit codes

- `npx tsc -p harness --noEmit` returns 0.
- `npm run test:py` returns 0.
- `npm run test:unit` returns 0.
- `npm run gates:electron` — the new `stream_resume` gate passes; existing gates pass.

## observation contract

### UI driving steps

- The gate opens a session, starts a turn that streams, kills the SSE connection (close the EventSource or drop the network), waits for the reconnect, and checks:
  - The transcript has no duplicate rows.
  - The stream resumes from where it left off.
  - `TRANSCRIPT_ROW_SKIPPED` with reason `DUPLICATE_SEQ` does not fire (or fires very few times — the resume skipped past already-seen seqs).

### Expected runtime signals

- `STREAM_ATTACHED` after the reconnect (the second attachment).
- `STREAM_BATCH_FOLDED` tags after the resume, with `first_seq` greater than the pre-disconnect `last_seq`.

## done criteria

The server writes SSE event ids; a reconnect resumes from the last received seq; a gate proves no duplicates cross the resume; the existing gates pass.

## notes

- SSE spec: the browser sets `Last-Event-ID` automatically on reconnect when the server sends `id:` fields. No client-side code is needed to send it. The EventSource constructor does not accept an initial `Last-Event-ID`; the first connection always starts from the beginning.
- The server currently writes `data: <json>\n\n` per envelope. The change is `id: <seq>\ndata: <json>\n\n`.
- For the resume, the server reads the record and skips envelopes with seq ≤ the requested id. This is a linear scan of the record file; for a 28,513-envelope record it takes under a second.

## self-review checklist

- [ ] Scope is concrete and bounded (one paragraph; one verifiable property of the artifact).
- [ ] `context_files` covers everything the Agent needs to read.
- [ ] Signal contract's `Emits` list references only tags in the vocabulary.
- [ ] Artifact contract is gradable: content assertions are concrete, command exit codes are runnable.
- [ ] If `pass_kind: functional`: observation contract is present.
- [ ] Sprint sweet spot honored: 1–2 files modified, one concept.
