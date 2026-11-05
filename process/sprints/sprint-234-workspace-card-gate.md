---
id: 234
status: closed
phase: shell-to-react B3 gate
pass_kind: functional
---

# Sprint 234 — gate: the workspace card names the real folder

## scope

`harness/shakeout/workspace_card.ts`: on the unbound pane the card reads "workspace none yet — pick one in the pane shape — · branch —"; after a bind on the default folder and one turn, it reads the session's `workspacePath` (home written `~`), shape `isolated`, no branch. `gates:electron` runs it (51 scripts).

## artifact contract

- Created: `harness/shakeout/workspace_card.ts`. Modified: `package.json` (`gates:electron` contains `workspace_card.ts`).
- `npx tsc -p harness` 0.

## observation contract

The gate exits 0; with the old fallback planted in `workspaceCard` it exits 1.

## result

Closed 2026-11-05. Gate 0; planted: exit 1, "unbound pane's card reads "workspace ~/.substrate/sandbox shape sandbox · branch"". Restored and rebuilt.

## Rubber Duck pass

No signals. Observations: none.
