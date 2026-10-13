# Sprint 171 — The language lens, ribbons view

```yaml
---
id: 171
status: open
phase: language
pass_kind: functional
depends_on: [169]
roadmap: process/planning/ROADMAP-2026-10-13-language-in-the-app.md
design: process/planning/design-sheets/2026-10-13-language/ (23a, 22d)
---
```

## scope

Ribbons: each lane a ribbon on a centred baseline whose width at a turn is the trailing-window value on the lane's range; each reply's own value a hairline across it.

## observation contract

Gate `language_lens_ribbons`: ribbon widths are proportional to the route's window values; hairlines sit at each reply's value.
