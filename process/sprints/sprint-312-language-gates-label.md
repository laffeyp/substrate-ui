---
id: 312
status: closed
phase: shell-to-react D6.5
pass_kind: functional
---

# Sprint 312 — the language gates read the readout's label by its hook

## scope

`harness/shakeout/language_lens_bars.ts` and `language_bar_line.ts` read the readout's label from `[data-lang-readout-label]` instead of the first word of the row's text, which held only while the template put whitespace between the spans.

## artifact contract

- Modified: `harness/shakeout/language_lens_bars.ts`, `harness/shakeout/language_bar_line.ts`.

## observation contract

Both exit 0 on the lens; each failed on the lens with the old read (sprint 311's first run), so each still tells a wrong label from a right one: `language_lens_bars` requires "t3", then "t2" after ↑; `language_bar_line` requires the shift's turn, "t0".

## result

Closed 2026-11-05. Both 0.

## Rubber Duck pass

No signals.
