---
id: 337
status: closed
phase: shell-to-react F2
pass_kind: functional
---

# Sprint 337 — `endSession` sends what the server reads (F330)

## scope

A fix. `SessionController.endSession` posted `{reason}`; the server's /end route reads `source` onto the record's SessionEndRequested, so every end was recorded as "user_end". It posts `{source: reason}`. `harness/shakeout/menu_commands.ts` reads the closed session's record from its state folder and requires `source: "user_close"` after Close Pane.

## artifact contract

- Modified: `web/vm/session_controller.ts`, `harness/shakeout/menu_commands.ts`.

## observation contract

`menu_commands` exits 0; with the old body it exits 1.

## result

Closed 2026-11-05. 0. Planted `{ reason }`: exit 1, `the record's SessionEndRequested for s_96a3… has source "user_end"; want user_close`.

## Rubber Duck pass

SESSION_END_REQUESTED's payload (`session_id`, `reason`) is unchanged.
