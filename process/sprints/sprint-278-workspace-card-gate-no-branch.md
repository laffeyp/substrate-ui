---
id: 278
status: closed
phase: shell-to-react C4 gate
pass_kind: functional
---

# Sprint 278 — the workspace card gate reads no branch line

## scope

`harness/shakeout/workspace_card.ts` expects "workspace none yet — pick one in the pane shape —" unbound and "workspace <folder> shape isolated" bound.

## artifact contract

- Modified: `harness/shakeout/workspace_card.ts`. `npx tsc -p harness` 0.

## result

Closed 2026-11-05. Gate 0; `one_top_bar` 0.

## Rubber Duck pass

No signals.
