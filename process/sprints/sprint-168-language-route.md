# Sprint 168 — The language route and the generated measure table

```yaml
---
id: 168
status: closed
closed_at: 2026-10-13
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

## result

- `GET /api/session/<id>/language` (`Handler._session_language`): the kernel's `app.language_view` for the session's record, cached in `App.language_cache` by the record folder's size on disk, so a grown record recomputes and an unchanged one does not; a session before its first turn answers an empty view; an unknown id is 404.
- `scripts/gen_kinds.py` writes `web/vm/language_measures.gen.ts`: `LanguageGroup`, `LANGUAGE_MEASURES` (74 entries: short, unit, family, group, low, high, explanation, count), `LANGUAGE_WATCHED`, `LANGUAGE_WARMUP`, `LANGUAGE_INTENTS`. The generated-files test checks it.
- Tests `tests/test_language_route_168.py`, 3: a deterministic session's two turns come back as user/model lines and 2-point lanes; a second call at the same record size does not recompute and a new turn does; an unopened session answers empty, an unknown one 404. Plus the stale check in `test_envelope_kinds_generated_096.py`.
