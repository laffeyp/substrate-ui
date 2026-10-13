# Sprint 168 — The language route and the generated measure table

```yaml
---
id: 168
status: open
phase: language
pass_kind: functional
depends_on: [K312, K313]
roadmap: process/planning/ROADMAP-2026-10-13-language-in-the-app.md
---
```

## scope

`GET /api/session/<id>/language` returns `app.language_view` for the session's record, cached by the record's last seq. `scripts/gen_kinds.py` also writes `web/vm/language_measures.gen.ts` (names, units, groups, ranges, explanations, intents) from the kernel's catalog.

## observation contract

A test calls the route on a recorded session with language events and on one without; a second call at the same seq does not recompute; `gen_kinds.py --check` fails on a stale generated file.
