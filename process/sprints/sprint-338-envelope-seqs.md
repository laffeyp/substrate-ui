---
id: 338
status: closed
phase: shell-to-react F3
pass_kind: functional
---

# Sprint 338 — a replayed envelope is found without a scan (F335)

## scope

A fix. `handleEnvelope` scanned every held envelope for the new one's seq (O(n) per envelope, O(n²) per session). A set of seqs, cleared wherever `rawEnvelopes` is, gives the same skips. The arrays are still copied per envelope: the snapshot is immutable and its consumers detect change by identity, so a constant-time append would change when snapshots publish, which a fix does not do.

## artifact contract

- Modified: `web/vm/session_controller.ts`. Created: `web/reveal/__tests__/envelope_append.spec.ts`. `npm run test:unit` 0.

## result

Closed 2026-11-05. 20,000 envelopes: 1013 ms before, 280 ms after (this machine, tsx, no DOM). The spec holds the replay skip: seqs 1, 2, 3, 2, 1, 4 append as 1, 2, 3, 4.

## Rubber Duck pass

STREAM_ENVELOPE_APPENDED fires once per new seq, as before.
