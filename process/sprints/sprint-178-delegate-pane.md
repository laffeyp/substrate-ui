# Sprint 178 — Delegate's pane

```yaml
---
id: 178
status: closed
closed_at: 2026-10-13
phase: topologies
pass_kind: functional
depends_on: [K323]
roadmap: ../substrate/process/planning/ROADMAP-2026-10-13-core-topologies-r2.md
---
```

## scope

A delegate child opens an interactive pane beside its caller while it works, bound to the child's session: a person can write to it, because a person writes a delegate child's next message (r8 § 3.6). The pane stays after the child's answer folds back into the caller.

## observation contract

Gate: a scripted session delegates; a pane opens on the child's session on its own, shows its turn, takes a typed message that reaches the child's record, and stays after the caller's tool result.

## result

- **Built.** App server: `GET /api/session/<id>/children` (the sessions whose parent it is, oldest first, with `created_at`). Controller: a `delegate` tool call made now (its `t` under a minute old) opens a watch; the session's children are read every 500 ms while a delegate call is open and once more when it returns, and each child created at or after the call's record time is announced once (`DELEGATE_CHILD_STARTED`). Reading by creation time, not by first sight, means a child created before the first read is still announced. Shell: the child's pane opens beside its caller and attaches to the child's session with `attachExisting`, so it is an ordinary interactive session: a person can type to it; it stays after the caller's call returns. Signal vocabulary 0.3 (one tag; 0.2 stays; rationale beside it). A delegate child is not a held run (its call returns only with its answer, and nothing writes its end), so it does not use `RUN_STARTED`.
- **Gate.** `harness/shakeout/delegate_pane.ts` (in `gates:electron`): a deterministic session's one turn calls `delegate`; the child's pane opens on its own, shows the delegated task as the child's first message, is not view-only, stays after the call returns, and a typed line reaches the child, which replies. Three runs pass. The gate's first version waited on an async predicate in `waitForFunction`, which once returned `null` for a child that existed; it now polls from the test process. Mutation: with the shell not opening the pane, the gate fails at "no pane opened".
