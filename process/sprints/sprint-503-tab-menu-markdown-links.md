# Sprint 503 — A tab's menu; Markdown rendered; ⌘-click opens a link

```yaml
---
id: 503
status: pending
phase: editor features (roadmap 2026-11-14 r4, E5)
pass_kind: functional
---
```

## scope

Right-click on a tab opens its menu: add to message (as now), close, close others, split right, split down (sprint 504), and for a Markdown file "show rendered" / "show source". The rendered view draws the file with the transcript's renderer (`web/reveal/markdown.ts`). ⌘-click on a link, in the source or the rendered view: an `http(s)` link opens in the browser (`shell.openExternal` through main, as external links do now), a relative path opens that file in the editor, a `#heading` scrolls to it. One verifiable property: a fixture README's link ⌘-clicked opens the file it names.

## signal contract

Vocabulary proposal at build time: the menu's items through the existing `CONTEXT_MENU_OPENED` (source `tab`); a tag or field for the rendered/source switch and for a link followed (kind only: external, file, heading; E1, no address).

## observation contract

Gate on the bundle with a real Markdown fixture: the menu's items; rendered view screenshot read; each link kind followed. Mutants per path.
