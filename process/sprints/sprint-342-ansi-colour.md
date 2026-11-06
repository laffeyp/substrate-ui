---
id: 342
status: closed
phase: shell-to-react F7
pass_kind: functional
---

# Sprint 342 — 256-colour and truecolor SGR in the login card (F357)

## scope

A fix. `web/reveal/transcript/ansi.ts` mapped a 256-colour index of 16 or more to nothing (the previous colour stayed), and read truecolor's `2` as "dim" and its three values as colours of their own. `color256` follows xterm's palette (the theme's 16, the 6×6×6 cube, the grey ramp 8–238); `38;2;r;g;b` and `48;2;r;g;b` set the colour.

## artifact contract

- Modified: `web/reveal/transcript/ansi.ts`. Created: `web/reveal/__tests__/ansi_color.spec.ts`. `npm run test:unit` 0; lint 0.

## result

Closed 2026-11-05. Lint caught two one-letter names in the first draft.

## Rubber Duck pass

No signals.
