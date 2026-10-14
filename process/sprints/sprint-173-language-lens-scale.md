# Sprint 173 — The language lens's lanes take the session's range

```yaml
---
id: 173
status: closed
closed_at: 2026-10-13
phase: language
pass_kind: functional
depends_on: [169, 170, 171]
roadmap: process/planning/ROADMAP-2026-10-13-language-in-the-app.md
---
```

## scope

From the Architect's first look at the installed lens on a live session. The lens scaled every lane to a fixed catalog range and clamped values above it, so a lane whose replies run above the range sat at full width and could not show a fall: on glm-5.2 the Kobak style rate ran 24–44 per 1,000 words against a 0–10 range; boosters, positive emotion and em dashes also passed theirs.

- **Range.** Each lane scales to its own data: zero to the highest value or window the stream has shown, rounded up to 1, 2, 2.5 or 5 times a power of ten, so it grows with the session and nothing is clipped. Every measure the lens draws is zero or above, so bars start at zero and a small change stays small. The catalog's fixed ranges leave the display. Bars, window curves and ribbons use the lane's scale.
- **Units.** The header's second line names the unit in words ("per 1,000 words", "words"), replacing "/1k 0–10"; its hover gives what a full bar stands for now.
- **Lane lines.** A fine vertical line between lanes through the rows and the readout, a little stronger at a group boundary, so a bar or a centred ribbon reads as being in its column.
- **Deviation before the warm-up.** The deviation view says, above its rows, that deviation starts when a lane's warm-up ends (20 values that vary) and how many the stream has so far.

## observation contract

Unit: a lane above its old catalog range scales to its own values and no bar or ribbon sits at full width; an all-zero lane says so; separators sit at each lane's edge; the warm-up note counts the stream's values. Gates `language_lens_bars` and `language_lens_views` compare drawn widths against the route's values on the lane's scale; the unit's hover names that scale.

## result

- **Built.** `language_lens.ts`: `niceCeil`, a lane `top` from its highest value or window, `scaled(top, v)`; `unit` and `scaleTitle` on each lane (the header's second line and its hover); `dividers` at each lane's edge, stronger at a group's first lane, drawn through the rows and the readout; `note` in the deviation view until a lane's warm-up ends ("Deviation starts when a lane's warm-up ends: 20 replies whose values vary. This session has N so far.").
- **Tests.** Unit (`language_lens.spec.ts`, 17): round tops; a Kobak lane at 44, 42 and 24 per 1,000 words scales to 50 and narrows (fails 2 tests with the catalog top restored); an all-zero lane; dividers; the note. Gate `language_lens_views`: ribbon and hairline widths equal the route's windows and values on the lane's scale, and the words unit's hover names it.
- **Found.** The ribbon gate and unit test asserted that a hairline is never wider than its ribbon. A message's own value can exceed its window's, and the claim held only while the 0–800 range squeezed every width to a pixel or two. Both now check the hairline against the route's value.
- **Seen.** Style match on the turns stream reads "—": it needs 1,600 words from each side (`docs/language/windows-r2.md`); the Architect kept the threshold.
