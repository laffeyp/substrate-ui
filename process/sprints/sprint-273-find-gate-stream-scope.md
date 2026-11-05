---
id: 273
status: closed
phase: shell-to-react C3 gate
pass_kind: functional
---

# Sprint 273 — find's gate covers the stream scope

## scope

`harness/shakeout/find_counts_transcript.ts` goes on to meta, clicks the stream, finds "usermessage", and requires the bar's count of matching events to equal the stream rows left undimmed (at least one).

## artifact contract

- Modified: `harness/shakeout/find_counts_transcript.ts`. `npx tsc -p harness` 0.

## observation contract

The gate exits 0; with the component's write of the stream count removed it exits 1.

## result

Closed 2026-11-05. Gate 0 (""1 matching events · scope: stream", 1 rows undimmed"); planted: exit 1, "stream scope reads "0 matching events · scope: stream"; 1 rows are not dimmed". Restored and rebuilt; gate 0.

## Rubber Duck pass

No signals.
