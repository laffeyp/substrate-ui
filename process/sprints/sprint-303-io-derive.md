---
id: 303
status: closed
phase: shell-to-react D5.1
pass_kind: functional
---

# Sprint 303 — the i/o lens's documents as a pure function

## scope

Plan row D5. `web/app/derive/io.ts`: `ioDocs`, each UserMessage, ModelReply, FinalAnswer and ToolResult with a payload, titled, in seq order; a tool's output reads as itself when a string, else its stdout or text, else its JSON. `web/app/__tests__/io_scene.spec.ts` holds it and the scene lens's function.

## artifact contract

- Created: `web/app/derive/io.ts`, `web/app/__tests__/io_scene.spec.ts`. `npm run test:unit` 0.

## result

Closed 2026-11-05. Unit 130/130.

## Rubber Duck pass

No signals.
