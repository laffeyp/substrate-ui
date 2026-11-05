---
id: 233
status: closed
phase: shell-to-react B3 F328
pass_kind: functional
---

# Sprint 233 — DCLogic builds the workspace card with `workspaceCard`

## scope

`reveal_component.ts`'s `focusedWorkspace`, `focusedShape` and `focusedBranch` come from `workspaceCard`, with the focused pane's snapshot `workspacePath`.

## artifact contract

- Modified: `web/reveal_component.ts` (contains `workspaceCard(`; no `'~/.substrate/sandbox'` fallback for `focusedWorkspace`). `npm run build` 0.

## result

Closed 2026-11-05 with sprint 234's gate.

## Rubber Duck pass

No signals.
