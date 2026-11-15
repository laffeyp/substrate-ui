# Sprint 501 — Esc interrupts as Ctrl-C does

```yaml
---
id: 501
status: closed
phase: editor features (roadmap 2026-11-14 r4, E3)
pass_kind: functional
---
```

## scope

The Architect, 2026-11-14: "the escape button doesn't interrupt it fast enough. It should immediately interrupt it … ctrl c works - but esc should do the same thing." Both keys send a hard interrupt (`web/app/keymap.ts` lines 128 and 130), but Esc does so only when `ctx.running` is true and no find bar, dialog, open tool card or surface claims it first; Ctrl-C has neither condition. The trace of a missed Esc (`KEY_ROUTED` and its target) names which check took it. Esc then interrupts whenever Ctrl-C would, ahead of a tool card's close. One verifiable property: during a live `claude` turn with a tool card open, Esc ends the turn as fast as Ctrl-C does, measured from the key to `TURN_INTERRUPTED`.

## observation contract

Gate on the bundle with a capable live model on a long turn: Esc and Ctrl-C each, with a tool card open and with none; time from key to `TURN_INTERRUPTED`. Mutant: the old condition back fails.

## close

The cause, read from Substrate Next's trace of 2026-11-15 (boot `20261115-000226-24c6c1`): every Esc that took no action came after a `TURN_PARKED` "replied" that was followed at once by a `UserMessage` on the stream and the server's `TURN_ACCEPTED` (turns 11 and 16): messages queued during a turn, started by the server with no `sendTurn` in the window. The window's `parkReason` stayed "replied", so `running` was false and Esc routed nowhere (`KEY_ROUTED` action none). Ctrl-C in the input box routes to interrupt without asking (`keymap.ts` line 130), so the server interrupted the turn it was running. The card's guesses (open tool cards, find, dialogs) were not the cause.

Fix: `web/vm/session_controller.ts`, the `UserMessage` case clears `parkReason`: a message on the record after a park is a running turn, whoever sent it. Gate `harness/shakeout/escape_interrupts_queued.ts` (new; in `gates:electron`): a scripted deterministic session whose turns run `bash sleep 8`, both turns posted over the API; Esc with the caret in the input box. The card named a live model; none is needed, as no reply is read, only the window's state and the record.

- From source and on bundle 1794706163: `KEY_ROUTED` Escape action interrupt; `TURN_INTERRUPTED`; parked interrupted 163 ms (source) and 151 ms (bundle) after the key; the record's `Returned` reasons replied, interrupted.
- Mutant (the clear removed): fails as the Architect saw it: Esc action none, `parkReason` "replied", turn 2 ran its whole sleep.
- Build 0, 231 unit specs 0, `vm_smoke` 0; on the bundle `escape_order`, `editor_escape_interrupt`, `editor_context_menu_escape`, `session_action_signals`, `transcript_follow`, `resume_ended_session` 0.
- Installed into Substrate: 1794706163 replaced 1794705263, launched with launchd's environment; `APP_BOOTED` app_name Substrate, home_kind default. Substrate Next ran throughout (pid 89496).

Rubber Duck Pass: one observation, recorded: the window's `TURN_SUBMITTED` counts only the turns it sent (turn_index 7) while the server accepted turn 11; a turn started on the server has no window tag of its own. The backlog item on whether a sent message has reached the model covers it.
