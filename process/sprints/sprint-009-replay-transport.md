---
sprint: 009
slug: replay-transport
status: pending
pass_kind: web-frontend
cadence: auto-within-phase
context_files:
  - web/app.js
  - web/index.html
  - ../handoff/console-v2/app.jsx
  - WORKING_AGREEMENT.md
---

# Sprint 009 — the replay Transport (play / pause / speed / rewind)

## Why (the design note)

The shipped console scrubs a static seq-cursor (slider + start/end + arrow keys). The original
design (`handoff/console-v2/app.jsx`) had a **Transport** that *plays the run back* — a play/pause
toggle, a speed control, and a play-loop that advances the cursor over time — so a viewer watches
the run happen again, again and again, sped up. That is the surface the Architect asked for ("there
needs to be a rewind/replay … so people can see it happen live, of course, again and again … or you
could speed up time"). It is the single change that makes every demo land: run the game of life or a
conversation, then hit play and watch it unfold.

This ports that play-loop onto the existing one-cursor architecture — no new time axis, the play
loop just advances the same seq-cursor the graph, stream, and scene already read in lock-step.

## Scope

`web/index.html` (a ▶/⏸ play button + a speed selector in the cursor bar + CSS) and `web/app.js`
(the play loop, `STATE.playing`/`STATE.speed`, the wiring, and stop-on-record-switch / stop-on-grab).
No backend change.

## Behaviour

- **▶ / ⏸** toggles replay. Playing advances the cursor one seq per tick at the chosen speed; the
  graph/stream/scene update each tick (the existing cursor path). Reaching the end **stops**.
- **Rewind/replay:** pressing ▶ at the end resets the cursor to 0 and plays from the start.
- **Speed** selector (seq/sec) changes the tick rate live.
- Grabbing the slider, or switching records, **pauses** (no fighting the user; no loop leaking across
  records). (Original-timing replay via the events' `t` is a later add — meaningful for real-model
  runs, near-instant on the deterministic CI records, so fixed-rate is the right default now.)

## Dual contract

**Artifact:** `web/app.js` + `web/index.html`. Assertions: `node --check web/app.js` exits 0; the
eight-word grep stays clean (play/replay/speed are not primitive names); `npm run e2e` + the 24
server tests still pass.

**Signal:** none — substrate-ui emits no signals.

## Observation contract (REQUIRED — both tracks)

- **Track 1 — STRUCTURAL (`e2e_console.js`), reading the cursor STATE as the signal:** play advances
  `#seqnow` (cursor increases over time); pause holds it; reaching max **stops** at max (not past);
  pressing play at the end resets near 0 (replay); the speed selector is present and changes the rate.
  The cursor value IS the run's replay position — assert on it, not on animation.
- **Track 2 — PERCEPTUAL (capture → look):** the cursor bar renders the ▶/⏸ + speed cleanly,
  on-vocabulary, no overflow; the scene/graph visibly advance under replay (the scene's per-seq
  rendering is already pixel-decoded in `capture:scene`, which the play loop drives frame by frame).

## Close

Rubber Duck Pass; BLACKBOARD `## Built` + `## Sprint tail`; KIT_DIARY; then the duplex-pipe review.
