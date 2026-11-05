---
id: 225
status: closed
phase: shell-to-react B2.3c
pass_kind: functional
---

# Sprint 225 — first run swaps in; the tweak props go

## scope

`reveal.html`'s first-run block becomes `<div data-app-mount="first-run">`, and the page script loses its `data-props` attribute, the design tool's tweak editor metadata (`transcriptFontSize`, `columns`, `rows`, `view`, `firstRun`, `simulateRateLimit`; F356). `reveal_component.ts` drops `showFirstRun`, `frRows`, `frDone`, the `componentDidUpdate` that synced `columns`, `rows` and `view` from those props, and reads 13px where it read `transcriptFontSize ?? 13`; it subscribes to the first-run store to give pane 1 the picked driver.

## artifact contract

- Modified: `web/reveal.html` (no `data-props`, no `showFirstRun`; contains `data-app-mount="first-run"`), `web/reveal_component.ts` (no `this.props`, no `frRows`).
- `npm run build` 0, `npm run test:unit` 0.

## observation contract

With sprint 226: `first_run_footer.ts` 0; first run's pixels differ only in the removed fixture texts.

## result

Closed 2026-11-05 with sprint 226's run.

## Rubber Duck pass

See sprint 226.
