# Sprint 439 — a read that lands after a newer save

```yaml
---
id: 439
status: closed
phase: code editor (roadmap r10), a fault in E4's saving (sprint 425)
pass_kind: functional
---
```

*Card written after the work, which was committed in c4205e7 without one.*

## scope

A full gate run failed `editor_history` at "the disk after saving C": save C was refused as stale (409). The run's traces gave the order: save A's FileWritten reached the page at 37.774 and set off a read of the file (text 37.778, hunks 37.849); save B was written at 37.819, its reply at the page at 37.822; the read, answered before B, landed at 37.849 and put back A's text and hash; C, typed at 37.894, was saved against A's hash and refused at 37.903; B's FileWritten reached the page at 37.979. The read's `live` guard drops a read only once the next FileWritten has arrived. Fix: each file's writes are counted as they start and end (`WRITES` in `editor/Centre.tsx`, in the save and in `writeBuffer`), and a read applies only if none overlapped it; the write's own FileWritten brings a new read.

Files: `editor/Centre.tsx`; `harness/shakeout/editor_history.ts` (the order reproduced: each save's FileWritten awaited on the page, the server's answers to the reads held until 10 ms after the next save's reply).

## signal contract

No vocabulary change in the fix. The same commit added FILES_FOUND.name_length (v0.45).

## artifact contract

Unit specs 204; build 0.

## observation contract

`editor_history` with the reproduction: 3 of 3 failed before the fix (the disk after a step forward), 3 of 3 passed after, from source and on the bundle; all 19 editor gates from source and on the bundle at c4205e7.
