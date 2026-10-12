# Sprint 163 — Once one command matches, its hint sits in the input row

```yaml
---
id: 163
status: closed
closed_at: 2026-10-12
phase: 1
pass_kind: functional
roadmap: process/planning/ROADMAP-2026-10-12-slash-entry.md
asked: 2026-10-12 (Architect: "I should never see slash guidance already completed … The auto harness, low, medium, high, how much of the working standard the model gets, that text should appear in the same row as where I am entering the text")
context_files:
  - web/reveal_component.ts
  - web/partials/input-bar.html
---
```

## scope

Today the menu lists every command whose name starts with the typed text, so `/guid` shows a row `/guidance <auto|…> · …` above the bar. After: with one match and no space, the menu closes and a grey hint follows the typed text inside the input row: for a command with choices or an argument, its argument part and description (`<auto|harness|low|medium|high> · how much of the working standard the model gets`); for one without, its description. The hint is drawn by a mirror layer behind the textarea (the typed text transparent, the hint in `--tx-hint`), so it starts where the text ends. Two or more matches keep the menu as now.

## observation contract

Electron gate `slash_inline_hint.ts`: "/l" lists /length and /list in the menu and no hint; "/guid" shows no menu and the input row's hint reads the guidance usage and description, starting at the right edge of the typed text (within 2px); "/fold" shows its description; "/guidance " opens the choices and the hint goes.

## checks

Gate red, then green; `slash_menu`, `input_bar`; `tsc`, `tsc -p harness`.

## result

- **Built.** `_slashHint` (one match, no space: the argument part and description, never the name); `_slashMenu` returns no rows on one match. `input-bar.html` wraps the textarea with a mirror layer: the typed text transparent, the hint (`data-slash-hint`) in `--tx-hint`.
- **Gate** `slash_inline_hint.ts`: red on the old code ("/guid" still listed /guidance above the bar), green after: "/l" lists /length and /list with no hint; "/guid" shows no menu and the hint `<auto|harness|low|medium|high> · how much of the working standard the model gets` starting at 39.1px, where the typed text ends (39.1px); "/fold" hints its description; "/guidance " lists five choices and no hint. `slash_menu` updated for the rule ("/to" now hints /tone instead of listing it); it and `input_bar` pass.
