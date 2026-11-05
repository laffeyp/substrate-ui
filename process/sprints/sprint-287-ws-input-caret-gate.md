---
id: 287
status: closed
phase: shell-to-react C5 gate
pass_kind: functional
---

# Sprint 287 — gate: the typed path keeps its caret

## scope

`harness/shakeout/ws_input_caret.ts`: type "abc" in the unbound pane's box, ← once, type "X": the box reads "abXc" with the caret at 3, and the column's typed row names it. `gates:electron` runs it (54 scripts).

## artifact contract

- Created: `harness/shakeout/ws_input_caret.ts`. Modified: `package.json`. `npx tsc -p harness` 0.

## observation contract

The gate exits 0; with the box showing DCLogic's value directly (no copy) it exits 1.

## result

Closed 2026-11-05. Gate 0; planted: exit 1, "the box reads {"value":"abXc","caret":4}". Restored and rebuilt; gate 0.

## Rubber Duck pass

No signals.
