---
id: 336
status: closed
phase: shell-to-react F1
pass_kind: functional
---

# Sprint 336 — the client reads the server's error shape (F331, F349, F360)

## scope

A fix. The server refuses with `{"error": "<message>"}` (server.py `_error`); `web/vm/client.ts` looked only for `failure_class` and `detail`, so every refusal's detail was the raw JSON text, and `web/reveal/activity.ts` stripped `{"error":` back off it. The client now reads `error` as the detail when `detail` is absent; the activity line's strip goes; `turn_state.spec.ts` uses the server's shape. Visible effect: a refusal's text shown in the transcript ("interrupt failed: …", "session_end: …") is the server's message, not `{"error":"…"}`.

## artifact contract

- Modified: `web/vm/client.ts`, `web/reveal/activity.ts`, `web/reveal/__tests__/turn_state.spec.ts`. Created: `web/reveal/__tests__/client_error.spec.ts`. `npm run test:unit` 0.

## result

Closed 2026-11-05. With the client's change removed the new spec fails: `detail: '{"error":"session is not running"}'`.

## Rubber Duck pass

No signals.
