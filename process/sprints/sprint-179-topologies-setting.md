# Sprint 179 — The topologies setting in the app

```yaml
---
id: 179
status: open
phase: topologies
pass_kind: functional
depends_on: [K324]
roadmap: ../substrate/process/planning/ROADMAP-2026-10-13-core-topologies-r2.md
---
```

## scope

The setting of K324 in the app: a row in the picker after tone, `/topologies <position>`, its name on the bar line, its explanation on hover.

## observation contract

Gate: the picker and `/topologies` set it and the bar line names it. Live: one real model on the same task under two positions; the records show the topology calls per turn for each.

## result (open: the live half is not met)

- **Built.** `/handoff rare|normal|eager` (from the one slash table, with its description and current value); the bar line names it last, with a hover that says what it does; the controller carries `handoff` on the snapshot, sends it at open and reads it back on attach and change; `controls.gen.ts` generates `HandoffPosition` and its default. The picker row is not built: the opening picker's sequence is the Architect's moved item (after distribution), and every Electron gate's session start clicks through it; a session opens at `normal`, which writes no text.
- **Gate.** `controls_mid_session.ts` gains a `/handoff eager` step: the bar line and manifest read eager; the next turn records `SessionChanged {handoff: normal→eager}` and that message's prompt carries the eager text and not the old one. The bar-line unit tests include the handoff segment.
- **Live, not met.** `harness/shakeout/handoff_live.ts`: two sessions on one model, `rare` and `eager`, the same task: add `slugify` to `text.py` with a test, done when `python3 -m unittest -q test_text` passes. Each prompt carried its position's text; each session was offered `build`, `delegate` and `review` (confirmed in the native tool list sent to Ollama). Results: `glm-5.2:cloud` with the first eager text, 0 and 0 topology calls; with a firmer eager text (now the v0.13 text), 0 and 0; `kimi-k2.7-code:cloud`, 0 and 0. Every session edited the files itself. The likely cause is in `build`, not the wording: `build` works on a new branch and never merges, while the user asked for `text.py` here, so a model that hands off leaves the change somewhere the user did not ask for it. The setting's mechanics are proven; its effect is not, and depends on what `build` hands back.
