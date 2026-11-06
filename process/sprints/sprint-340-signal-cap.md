---
id: 340
status: closed
phase: shell-to-react F5
pass_kind: functional
---

# Sprint 340 — the signal buffer is bounded (F347)

## scope

A fix. `web/vm/instrumentation/sdd.ts` pushed every signal onto `window.__vmSignals` and never trimmed it; one signal fires per streamed envelope. The buffer keeps the latest 10,000 (`SIGNAL_CAP`, a setting). The gates read it by position from a session's start, far under the cap.

## artifact contract

- Modified: `web/vm/instrumentation/sdd.ts`. Created: `web/reveal/__tests__/signal_cap.spec.ts`. `npm run test:unit` 0.

## result

Closed 2026-11-05.

## Rubber Duck pass

No tag, payload or order changes.
