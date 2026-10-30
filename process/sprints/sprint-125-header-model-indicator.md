# Sprint 125 — The header model chip becomes an indicator

```yaml
---
id: 125
status: superseded
status_note: superseded by sprint 139 (OPEN-ITEMS-2026-10-10.md)
phase: 1
pass_kind: functional
roadmap: substrate-ui/process/planning/ROADMAP-2026-10-10-model-picker-in-the-workspace-bar.md
asked: 2026-10-10 (Architect)
---
```

## why

With the picker in the workspace bar, the header chip only needs to show what was picked. The Architect asked for it to stay populated and to open a little more detail on click, as the workspace chip does.

## scope

- Pane header (`web/reveal.html:53-54`) and window header (`:28-29`): the chip keeps `driverLabel` and loses the ▾ and the dropdown.
- A click opens a card styled like the workspace card (`:56`): driver, version (`driverVersion`), bundle (`bundleSlug`).
- On a pane with no session, the chip shows the model the bar holds.
- Remove `ddFor`, `toggleDd`, `fpToggleDd`, `fpDdOpen`, `fpDriverOpts` and the header `driverOpts` binding.

## checks

- The chip has no ▾; a click shows the card with the three fields.
- On a pane with no session, picking a model in the bar changes the chip.

