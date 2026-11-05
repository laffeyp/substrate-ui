---
id: 241
status: closed
phase: shell-to-react B4 gate
pass_kind: functional
---

# Sprint 241 — records_keys reads the session's name from its span

## scope

`harness/shakeout/records_keys.ts` read the lit session's name as the first space-separated word of the row's text, which depended on whitespace the page does not draw. It reads the row's second span, the name.

## artifact contract

- Modified: `harness/shakeout/records_keys.ts`. `npx tsc -p harness` 0.

## observation contract

`records_keys.ts` exits 0 and names the session it opened.

## result

Closed 2026-11-05. Gate 0 ("↵ opened fixture-4 in pane 1 (fixture-4)").

## Rubber Duck pass

No signals.
