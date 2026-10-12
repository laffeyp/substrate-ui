# Sprint 151 — ← inside an open group folds it and lights the group

```yaml
---
id: 151
status: closed
closed_at: 2026-10-12
phase: 1
pass_kind: functional
asked: 2026-10-12 (Architect: "I open [cli agents] up, I click down to Claude, and then I hit the back button. That back button kicks me back to the workspace. No, that back button should probably collapse the row and take me back to [cli agents] … And then if it's the model, then it goes back to workspace.")
context_files:
  - web/reveal_component.ts
---
```

## scope

Card 150 made ← on any model-column row with nothing open under it go back to the workspace column. A model inside an open group (claude under cli agents) has nothing open under it, so ← there leaves the column.

After, ← in the model column, in order:

1. On an open row: fold it (unchanged).
2. On a row inside an open row (its parent is the nearest row above with a smaller indent): fold the parent and light it.
3. On a top-level row with nothing open: back to the workspace column (card 150).

## signal contract

No controller tags change.

## observation contract

Electron gate `left_folds_parent.ts`, live roster: ↵ arms the first workspace; → opens cli agents; ↓ lights its first agent; ← lights cli agents, folded, the workspace still armed; ← again goes back to the workspace column (nothing armed).

## checks

- The gate red on the current code, green after; `tsc`; `ws_column_opens_down`, `model_down_drills`.

## result

- **Built** (`reveal_component.ts` `_wsKey`, model branch): ← walks up to the nearest row with a smaller indent; if that row is open, it is lit and folded; otherwise the workspace is disarmed. The same walk serves a family under a CLI and a pin under a family.
- **Gate** `left_folds_parent.ts` (in `gates:electron`): red on card 150's code ("← on claude gave {armed: 0}"), green after (← on claude folded cli agents and lit it; ← again went back to the workspace column).
- `ws_column_opens_down`, `model_down_drills` pass; `tsc` clean.
- **Rubber Duck Pass.** No controller tag moved; the gate reads the lit `data-model-row`, its chevron, and `data-armed`.
