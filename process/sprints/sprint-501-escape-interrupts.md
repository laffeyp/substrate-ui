# Sprint 501 — Esc interrupts as Ctrl-C does

```yaml
---
id: 501
status: pending
phase: editor features (roadmap 2026-11-14 r3, E3)
pass_kind: functional
---
```

## scope

The Architect, 2026-11-14: "the escape button doesn't interrupt it fast enough. It should immediately interrupt it … ctrl c works - but esc should do the same thing." Both keys send a hard interrupt (`web/app/keymap.ts` lines 128 and 130), but Esc does so only when `ctx.running` is true and no find bar, dialog, open tool card or surface claims it first; Ctrl-C has neither condition. The trace of a missed Esc (`KEY_ROUTED` and its target) names which check took it. Esc then interrupts whenever Ctrl-C would, ahead of a tool card's close. One verifiable property: during a live `claude` turn with a tool card open, Esc ends the turn as fast as Ctrl-C does, measured from the key to `TURN_INTERRUPTED`.

## observation contract

Gate on the bundle with a capable live model on a long turn: Esc and Ctrl-C each, with a tool card open and with none; time from key to `TURN_INTERRUPTED`. Mutant: the old condition back fails.
