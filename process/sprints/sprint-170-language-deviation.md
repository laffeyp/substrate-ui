# Sprint 170 — The language lens, deviation view

```yaml
---
id: 170
status: closed
closed_at: 2026-10-13
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

## result

- **Built.** A toggle on the lens row (bars · deviation · ribbons, `LanguageViewMode`). Deviation draws each value in the detector's warm-up SDs (`language_view`'s `deviation`) from the lane's centre, ±4 SD filling the lane, guides at 0 and ±2 SD, full colour past ±2; before a lane's warm-up ends the bar is empty and its hover says "No deviation until the warm-up ends"; the readout shows signed SDs. The turns stream has no detector series and says so.
- **Found and fixed.** The component started with `sel: 240`, a value left from the design prototype: in a live session the lens (and the graph's detail panel) opened on whatever turn seq 240 fell in. The selection now starts empty; the lens shows the last turn and the arrow keys start there.
- **Tests.** Unit: bars from the centre, the empty pre-warm-up bar and its hover, emphasis past +2 SD, guides, the signed readout, no curve; the turns stream refused. Gate `harness/shakeout/language_lens_views.ts` (in `gates:electron`): 23 messages of 3–13 words on the deterministic driver (its replies never vary, so the user's lane carries the check; the gate fails if that lane's warm-up never ends), the messages stream: every turn's drawn width equals the route's deviation, and the readout its last value.
