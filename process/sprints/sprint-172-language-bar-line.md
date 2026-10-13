# Sprint 172 — The bar line names its settings and carries shifts

```yaml
---
id: 172
status: open
phase: language
pass_kind: functional
depends_on: [168]
roadmap: process/planning/ROADMAP-2026-10-13-language-in-the-app.md
design: process/planning/design-sheets/2026-10-13-language/ (22b; D76, D79)
---
```

## scope

The bar line's settings tail reads `guidance <level> · length <position> · tone <position>`. A `LanguageDrift` since the last setting change shows as its measure's short name and ↑/↓ right after the setting its group belongs to, in the group's colour, dotted underline; hover and focus open that shift (measure, direction, the turn it was flagged, the setting in force). More than two in a group collapse to a count after that setting. In a narrow pane the tail wraps under the turn recap. `/language` opens the lens at the latest shift's turn; `/language clear` hides the shifts until the next one; `/language off` and `on` hide and show them for the session. The commands join the one slash table.

## observation contract

Gate `language_bar_line`: after a drift the line shows the shift after its setting; the hover text matches the record; each command does what it says; `controls_mid_session` reads the named form.
