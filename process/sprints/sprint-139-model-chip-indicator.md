# Sprint 139 — The model chip becomes an indicator (U125)

```yaml
---
id: 139
status: closed
closed_at: 2026-10-11
phase: 1
pass_kind: functional
roadmap: substrate-ui/process/planning/ROADMAP-2026-10-11-before-distribution.md (step 6)
asked: 2026-10-10 (Architect; OPEN-ITEMS item 7)
---
```

## scope

- The top bar's model chip (`web/reveal.html`, `data-dropdown-region="driver"`) opens a three-level model dropdown. Since sprint 085 that dropdown refuses to open once the pane has a session, so it only ever changed the model of a pane that had not started; since 2026-10-11 the chip shows only after a model is picked. The model is picked in the workspace bar's model step, and changed in a session with `/model`.
- After this sprint the chip is an indicator, like the workspace chip beside it: no caret, no dropdown. A click opens a card with the pane's **model** (the driver), its **version** (a CLI's family and pin, or `default`), and its **guidance** (the bundle, or `auto` when the daemon picks at open). A second click, or a click elsewhere, closes it.

## checks

- A gate on the live roster: pick a model through the workspace bar; the chip names it with no caret; a click opens the card naming that model and no model rows; the card closes on a second click.
- `driver_chip_on_resume.ts` still reads `deterministic` on the resumed pane.
- `tsc` clean; unit specs; the Electron gates.

## result

- **Built.** The chip (`data-model-chip`) shows the model's resolved label with no caret. A click opens `data-model-card`: model, version (a CLI's family and pin, or `default`), guidance (the bundle, or `auto`), and "change it with /model". The bar's dropdown and `fpDriverOpts` are gone; the picker's model step still builds its rows with `_buildDriverOpts`.
- **Gate** `model_chip_indicator.ts` (in `gates:electron`): no caret; the card names the pane's driver and holds nothing clickable; a second click closes it. On the old code it fails at the caret.
- **Checks.** `tsc` clean; unit specs 34/34; Electron gates 13/13 on the source build.
- **Found.** With cursor-agent on its default, the chip and card read "cursor-agent auto". Cursor's CLI names no other model: the stream's init line says `"model": "Auto"`, `cursor-agent about` says `Model Auto`, and the result line carries tokens but no model. Raised with the Architect, who chose to label it truthfully: on Auto the chip reads the CLI's name alone (`cursor-agent`), and the card's version line reads "Auto — chosen by cursor-agent, which does not report the model". Checked in the app on the live roster.
