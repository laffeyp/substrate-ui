# Sprint 171 — The language lens, ribbons view

```yaml
---
id: 171
status: closed
closed_at: 2026-10-13
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

## result

- **Built.** Ribbons: each lane's ribbon, centred, as wide as the trailing-window value on the lane's catalog range, rows touching so the ribbon reads as one shape; the reply's (or message's) own value a bright hairline across it, centred on the same axis.
- **Tests.** Unit: ribbon widths grow with the window, every hairline centred on its ribbon and no wider. The same gate as sprint 170: every drawn ribbon width equals the route's window value on the words range, and no hairline is wider than its ribbon.
- **Seen.** On the messages stream the words ribbon is thin: messages run 3–13 words against the catalog's 0–800 range, which is set for replies. The fixed range is the design (no rescaling under the reader).
