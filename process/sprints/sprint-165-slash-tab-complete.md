# Sprint 165 — Tab completes command names

```yaml
---
id: 165
status: closed
closed_at: 2026-10-12
phase: 1
pass_kind: functional
roadmap: process/planning/ROADMAP-2026-10-12-slash-entry.md
asked: 2026-10-12 (Architect: "additionally, tab complete command names")
context_files:
  - web/reveal_component.ts
---
```

## scope

Tab in the bar moves focus out of it. After: with the bar holding `/` and a partial name, Tab completes it: one match becomes `/<name> ` (a command with choices then opens them); several matches complete to their longest common prefix (`/l` stays `/l`: length and list share only "l"; `/un` becomes `/unfold `). Tab elsewhere is unchanged.

## observation contract

Electron gate `slash_tab_complete.ts`: "/guid" Tab → "/guidance " with the choices open; "/unf" Tab → "/unfold "; "/l" Tab → "/l", focus still in the bar; "/in" Tab → "/interrupt ".

## checks

Gate red, then green; `slash_menu`; `tsc`, `tsc -p harness`.

## result

- **Built** (`_barKey`): Tab with the bar holding `/` and a name part completes from `slashCatalog()`: one match becomes `/<name> `; several complete to their longest common prefix; Tab is always kept in the bar there.
- **Gate** `slash_tab_complete.ts`: red on the old code ("/guid" Tab left "/guid" and moved focus out), green after: /guid → "/guidance " with five choices open, /unf → "/unfold ", /l stays with focus in the bar, /in → "/interrupt ".
- Screenshots at 1512 × 945 read for the roadmap's three cards: the grey hint follows "/guid" in the input row; two ↑ from "/guidance " light medium.
