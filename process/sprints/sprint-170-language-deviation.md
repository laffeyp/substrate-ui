# Sprint 170 — The language lens, deviation view

```yaml
---
id: 170
status: open
phase: language
pass_kind: functional
depends_on: [169]
roadmap: process/planning/ROADMAP-2026-10-13-language-in-the-app.md
design: process/planning/design-sheets/2026-10-13-language/ (23c)
---
```

## scope

A toggle on the lens row (bars · deviation · ribbons). Deviation draws every lane in warm-up SDs from the route, guides at ±2 SD, the stream emphasised beyond them; before a lane's warm-up ends it draws nothing and says so on hover; the readout shows signed SDs.

## observation contract

Gate `language_lens_deviation`: the drawn deviation and the readout equal the route's per-turn SDs on a session past the warm-up.
