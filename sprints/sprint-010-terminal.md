---
sprint: 010
slug: terminal
status: pending
pass_kind: web-frontend
cadence: auto-within-phase
context_files:
  - web/app.js
  - web/index.html
  - ../handoff/console-v2/ui_terminal.jsx
  - server.py
  - WORKING_AGREEMENT.md
---

# Sprint 010 — the integrated terminal (read commands)

## Why (the design note)

The original design (`handoff/console-v2/ui_terminal.jsx`) shipped an integrated terminal dock the
console never ported. It is the surface that closes the Architect's biggest gap: **"I can't see the
output / the code pair-coding wrote / the conversation."** The console's panels show that an event
fired and its metadata; the terminal lets you READ the content — `cat <seq>` prints an event's full
payload (the code chunk, the turn text, the LLM output); `narrate` tells the legible story; `tail`
filters the stream; `inspect` traces provenance. "The UI is the same data, made visual — and
typeable." It is also the on-ramp to the interactive model agent (a later sprint adds `run`/`chat`
that launch a model-backed run and stream it here).

This sprint is the READ half only — no control, no model. A lens you can type at, reading the same
record the GUI shows (the eight words; lens-not-controller).

## Scope

`web/index.html` (a collapsible terminal dock + a toggle + CSS) and `web/app.js` (the command
interpreter + the dock render + input/history handling). Reads `STATE.events` and the existing
`/api/records/<name>/io` + `/explain/<instance>` endpoints. No backend change.

## Commands (read-only)

- `help` / `?` — the command list.
- `tail [--kind K] [--producer P] [--all]` — events up to the cursor (or `--all`), seq-cited.
- `cat <seq>` — the FULL payload of the event at `<seq>` (the content: code / turn text / output).
- `ls` — the application (output) events with their seqs (the "file folder").
- `input` — the run's resolved seed (from `/io`).
- `narrate` — the legible plot beats (the substrate.* causal beats + application events).
- `inspect <producer-kind|instance>` — provenance: cause + Trigger + ancestry (from `/explain`).
- `clear` — clear the dock.

Toggle: a header/footer button + `Ctrl+\`` (VS-Code style). Up/Down = command history.

## Dual contract

**Artifact:** `web/index.html` + `web/app.js`. `node --check web/app.js` exits 0; eight-word grep
clean (terminal/tail/narrate/inspect are not primitive renames); `npm run e2e` + 24 server tests pass.

**Signal:** none.

## Observation contract (REQUIRED — both tracks)

- **Track 1 — STRUCTURAL (`e2e_console.js`):** open the terminal; `cat <seq>` on a game_of_life
  `Generation` event prints the grid payload (assert the dock body contains the grid / the kind);
  `narrate` prints causal beats (assert it contains a Trigger/RunFinalised line); `tail --kind
  CellNext` filters; `inspect` on a producer shows its cause; reading the DOCK TEXT as the signal.
- **Track 2 — PERCEPTUAL (capture → look):** the dock renders legibly (prompt, lines, input row),
  on-vocabulary, no overflow; `cat` of a content event shows readable content.

## Close

Rubber Duck Pass; BLACKBOARD `## Built` + `## Sprint tail`; KIT_DIARY; duplex-pipe review.
