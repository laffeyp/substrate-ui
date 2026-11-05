---
id: 276
status: closed
phase: shell-to-react C4 F339
pass_kind: functional
---

# Sprint 276 — the workspace card has no branch line (F339)

## scope

The server reports `worktree` for any folder with a `.git` (`_classify_workspace_shape`); no session gets a worktree of its own (UI sprint 154). The UI read `worktree` as "a session worktree" and wrote a branch `substrate/<pane name>` that does not exist, on the top bar's label and in the workspace card, for any git folder's session opened from the records page or the picker. `workspaceCard` drops the branch and writes a git folder's shape as "git", as the records page does.

## artifact contract

- Modified: `web/app/derive/workspace_card.ts` (no `branch`), `web/app/__tests__/workspace_card.spec.ts`. `npm run test:unit` 0.

## result

Closed 2026-11-05. Spec 4/4.

## Rubber Duck pass

No signals.
