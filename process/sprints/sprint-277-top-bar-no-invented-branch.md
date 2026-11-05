---
id: 277
status: closed
phase: shell-to-react C4 F339
pass_kind: functional
---

# Sprint 277 — the top bar names a git folder, not an invented branch

## scope

`reveal_component.ts`'s workspace label reads `⌥ <folder>` for every shape, where a `worktree` read `⌥ substrate/<pane name>`; the session's start line loses its dead `worktree` branch (no bind sets that shape); the card's branch field goes from `TopBar.tsx` and `top_bar.ts`. Three files, over the two-file rule (see BLACKBOARD).

## artifact contract

- Modified: `web/reveal_component.ts` (no `'worktree'`), `web/app/TopBar.tsx`, `web/app/state/top_bar.ts` (no `branch`). `npm run build` 0.

## result

Closed 2026-11-05 with sprint 278.

## Rubber Duck pass

No signals.
