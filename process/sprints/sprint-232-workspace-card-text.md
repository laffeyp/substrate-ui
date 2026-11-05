---
id: 232
status: closed
phase: shell-to-react B3 F328
pass_kind: functional
---

# Sprint 232 — the workspace card's text from the pane and the session

## scope

F328's top-bar text. The template's card fell back to `~/.substrate/sandbox` and `sandbox` for an unbound pane and for a pane on the default per-session sandbox (whose bound folder is empty), and its branch line showed the folder's path for every shape but a worktree. `web/app/derive/workspace_card.ts` names the folder the server reports for the session (home written `~`), else the bound folder, else "fresh per-session sandbox" for the default; an unbound pane reads "none yet — pick one in the pane"; only a worktree has a branch.

## artifact contract

- Created: `web/app/derive/workspace_card.ts` (contains `export function workspaceCard`), `web/app/__tests__/workspace_card.spec.ts`.
- `npm run test:unit` 0.

## result

Closed 2026-11-05. Spec 4/4.

## Rubber Duck pass

No signals.
