# Sprint 152 — ← on a session folds its workspace and lights it

```yaml
---
id: 152
status: closed
closed_at: 2026-10-12
phase: 1
pass_kind: functional
asked: 2026-10-12 (Architect: "that back arrow … should also close or collapse the workspace, fold it back up … instead of having to go up to the parent and then go back. This behavior should also behave the same way in the workspace area.")
context_files:
  - web/reveal_component.ts
---
```

## scope

In the workspace column, ← folds a row only while that row is lit. On one of an open row's sessions, ← does nothing, so the user walks ↑ to the row and then presses ←.

After: ← on a session lights its workspace row and folds it, as ← does in the model column (card 151). ← on an open row folds it (unchanged). A top-level row with nothing open is the column's start, so ← there does nothing.

## signal contract

No controller tags change.

## observation contract

Electron gate `left_folds_workspace.ts`: five sessions opened in a repo-local folder over the API; in the picker, ↓ to the folder's row, ⇧↵ opens it, ↓ lights its first session; ← lights the folder's row and folds it (no session rows left).

## checks

- The gate red on the current code, green after; `tsc`; `ws_column_opens_down`, `left_folds_parent`.

## result

- **Built** (`reveal_component.ts` `_wsKey`, workspace branch): each session in the key list carries its row's index; ← on a session lights that row and folds it.
- **Gate** `left_folds_workspace.ts` (in `gates:electron`): red on the old code (← on fixture-4 left it lit with five sessions open), green after (← lit the folder's row and folded it).
- `ws_column_opens_down`, `left_folds_parent` pass; `tsc` clean.
- **Rubber Duck Pass.** No controller tag moved; the gate reads the lit `data-ws-lit` row and the count of session rows.
