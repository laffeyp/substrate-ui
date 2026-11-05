---
id: 311
status: closed
phase: shell-to-react D6.4
pass_kind: functional
---

# Sprint 311 — the template hosts the language lens; DCLogic's keys read the store

## scope

`web/reveal.html`: the language block gives way to `<div data-app-mount="language">`. `web/reveal_component.ts` writes the language view into the stream's view, registers `selectSeq`, drops `langStream`, `langLane`, `langView` from its state and `_lang`, `langRows`, `langStreams`, `langViews` from renderVals; its keydown builds the lens from the stream's view and the language store and takes the step `languageKey` gives.

## artifact contract

- Modified: `web/reveal.html` (no `langRows`, `lang.width`), `web/reveal_component.ts` (no `langLane`, `_langTurns`). `npm run build` 0.

## observation contract

`language_lens_bars`, `language_lens_views`, `language_bar_line`, `language_lens_turns`, `language_rule_ellipsis`, `meta_inspector_io_scene` exit 0; pixels equal `baseline-2026-11-05-d2`.

## result

Closed 2026-11-05. First run: `language_lens_bars` and `language_bar_line` exit 1, each reading the readout row's label as "t33…" and "t03": they split the row's text on whitespace, and React writes no whitespace between the spans where the template had newlines. Sprint 312 has them read the label's own hook. Then all six 0. Pixels 28/28 (run before the label's hook was added; the hook is an attribute and draws nothing).

## Rubber Duck pass

No signals.
