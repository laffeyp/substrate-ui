# Sprint 015 — Studio tab (placeholder — port pending)

```yaml
---
id: 015
status: closed
phase: 2
pass_kind: functional
---
```

## scope
The Studio tab shows `studio — port pending` text. Nothing else. The tab renders under the tab-switch mechanics like every other tab; nothing loads inside it. This closes the visible "empty tab" while honoring rule 8 of the standing rulings register (no iframes ever) from `../../../design/terminal-v1/postmortem-iframe.md`.

## history
An earlier version of this sprint (also closed) implemented the tab as `<iframe src="/studio.html">`. That version violated the "no iframes ever" ruling. Ripped 2026-08-14 per Architect direction. See `../../../design/terminal-v1/postmortem-iframe.md` for the post-mortem. The real Studio port is out of the current arc; a separate future sprint chain does the extraction when Studio's maturity justifies it.

Prereq: 014. Six discipline items honored trivially — placeholder text.
