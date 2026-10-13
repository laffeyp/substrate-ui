# Sprint 169 — The language lens, bars view

```yaml
---
id: 169
status: closed
closed_at: 2026-10-13
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

## result

- **Built.** `web/reveal/language_lens.ts` lays the kernel's language view out as lanes (pure; the component adds the handlers): the 13 watched measures in length · tone · guidance (the turns stream: the six relation lanes), each with its generated short name, range and explanation; rows by turn, 18 px; bars off each lane's baseline on the catalog's range (zero draws nothing); the trailing window as an SVG curve per lane; `SessionChanged` as a labelled rule above the turn it applies to; `LanguageDrift` as ▲/▼ at its reply, its hover naming the turn and, where the length or tone text states one, the direction it asks for; a readout row for the selected turn. `GraphMode.Language` is the fifth meta tab, after structure. The selected turn is the one the shared selection seq falls in, so a pick in the lens moves stream+graph and the reverse; ↑↓ turns, ←→ lanes, ↵ opens the stream. The controller fetches `/api/session/<id>/language` (debounced 200 ms) when the lens opens, after each `Returned`, and on attach; the snapshot carries it as `language`.
- **Kernel.** The catalog gained the relation measures and `RELATION_LANES` (K312 follow-up); the generator writes them as `LANGUAGE_RELATION_LANES`, and no longer writes an unused `eslint-disable` line into three generated files.
- **Tests.** `web/reveal/__tests__/language_lens.spec.ts`, 8: lanes and groups; rows and the rule above turn 2; the mark and its intent text; bar scaling and zero; the readout's default and selected turn; one curve per lane; empty states; number formatting. Gate `harness/shakeout/language_lens_bars.ts` (in `gates:electron`): two turns, `/length full`, two turns; 13 lanes whose hover equals the generated explanation, rows t0–t3, the rule between t1 and t2, every readout value equal to the route's for turn 3, ↑ to t2, ↵ to the stream. A first screenshot showed the window curves crossing the rule's label; the label now sits above them.
