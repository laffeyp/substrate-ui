# Sprint 140 — Expand or collapse all tool output

```yaml
---
id: 140
status: closed
closed_at: 2026-10-11
phase: 1
pass_kind: functional
roadmap: substrate-ui/process/planning/ROADMAP-2026-10-11-before-distribution.md (step 7)
asked: 2026-10-11 (Architect)
---
```

## scope

- Today each tool card (`web/reveal/transcript/ToolCard.tsx`; Substrate's and a harness driver's tool calls alike) opens while its tool runs, closes when it finishes, and remembers a click per card.
- One toggle sets every tool card in the transcript to expanded or collapsed. Flipping it opens or closes all existing cards at once, and cards that arrive later open in the current state. A click on one card still opens or closes that card, until the next flip.
- Before the first flip, cards behave as today.
- The toggle is **⌘E**, and a control in the top bar, `tools ▸` / `tools ▾`, whose hover names the key. The settings key list gains the line.

## checks

- A gate on two recorded sessions with one finished tool call each (`fixtures/write_session_shapes.py`): ⌘E opens the card; ⌘E closes it; the bar control opens it; with tools expanded, the other session's card arrives open.
- A unit spec on the open rule: before a flip, open while running; after a flip, the flipped state, for every card, new ones included.
- `tsc` clean; unit specs; the Electron gates.

## result

- **Built.**
  - `web/reveal/transcript/toolOutputMode.ts`: the setting (`auto`, `expanded`, `collapsed`) and a flip counter, held on one global object. `reveal_component.ts` is compiled as its own bundle, apart from the transcript's, so a module-level variable would have given each bundle its own copy and the toggle would never reach the cards. `useToolOutputMode.ts` is the cards' React hook.
  - `ToolCard.tsx`: a card opens by the setting, unless clicked since the last flip; a flip opens or closes every drawn card at once.
  - `reveal_component.ts`, `reveal.html`: ⌘E; a `tools ▸` / `tools ▾` control in the top bar beside records, with the key on hover; the settings key list gains "all tool output, open or closed ⌘E".
- **Gate** `tool_output_toggle.ts` (in `gates:electron`): ⌘E opens every card, ⌘E closes them, the bar control opens them and reads `tools ▾`, and a card that arrives afterwards opens. On the old code nothing closes the card at the second ⌘E.
- **Spec** `tool_output_mode.spec.ts`, 3 of 3: the rule before and after a flip, the flip count and its listeners, and one setting shared through the global.
- **Found, not changed.** Attached from a record, a finished tool card opens: its call row draws before its result is paired, so the card mounts as running. That was so before this sprint; the gate starts from the first flip.
- **Checks.** `tsc` clean; unit specs 37/37; Electron gates 14/14 on the source build.

## revision (same day, Architect)

- No clickable control: the `tools ▸` / `tools ▾` control leaves the top bar. The Architect's rule: no new clickable design element now.
- ⌘E stays. Two slash commands: `/fold` flips the setting (fold, unfold, fold); `/unfold` unfolds.
- **Built (revision).** The bar control and its label state are gone. The setting moved to `web/vm/tool_output_mode.ts`, beside the controller that now reads it: `/fold` flips it and `/unfold` sets it unfolded (`session_controller.ts` slash table, so `/help` lists both); the slash menu offers both. ⌘E is unchanged. The gate types `/fold`, `/fold`, `/unfold` after the two ⌘E presses, and checks that the top bar holds no tools control. It passes.
