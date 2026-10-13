# Sprint 169 — The language lens, bars view

```yaml
---
id: 169
status: open
phase: language
pass_kind: functional
depends_on: [168]
roadmap: process/planning/ROADMAP-2026-10-13-language-in-the-app.md
design: process/planning/design-sheets/2026-10-13-language/ (23b, 22c, 22d)
---
```

## scope

A meta tab `language` after structure. Lanes for the 13 watched measures grouped length · tone · guidance, each with its generated name, unit and range under the header; rows are turns, time down, 18 px; each reply an activation bar off the lane's baseline; the trailing window a curve along the bar ends; `SessionChanged` as a full-width rule (`length normal → full · turn N`); `LanguageDrift` as ▲/▼ at its reply; a readout row with the selected turn's values; streams replies · messages · turns; ↑↓ turns, ←→ lanes, ↵ opens the turn in the stream; selection linked with stream+graph by seq; hover and focus explanations from the generated table. A short session draws each reply's own bar and says on hover when shift marks begin.

## observation contract

Gate `language_lens_bars`: a live session (deterministic driver), turns, a `/length` change, more turns; the lens shows 13 lanes in three groups, one row per turn, the change rule after the right turn, the readout equal to the route's values for the selected turn, a header's hover equal to the generated explanation; ↑ moves the selection and stream+graph follow.
