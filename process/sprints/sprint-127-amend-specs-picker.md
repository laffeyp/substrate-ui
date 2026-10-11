# Sprint 127 — Amend the specs for the picker move

```yaml
---
id: 127
status: open
phase: 1
pass_kind: functional
roadmap: substrate-ui/process/planning/ROADMAP-2026-10-10-model-picker-in-the-workspace-bar.md
asked: 2026-10-10 (Architect)
---
```

## why

Three specs place the model picker in the session header.

## scope

- Product spec round 14: supersedes round 13 line 704.
- Tech spec round 8: supersedes round 7 line 1257 ("Session-header dropdown"). The wire stays `POST /api/session {driver}` on create; mid-session changes go through `PATCH` via `/model`.
- Design spec round 3: §3's header line carries a model indicator, the workspace bar carries the picker, and `/model` is the mid-session swap (replacing "Driver ▾ swaps mid-session").
- Earlier rounds stay untouched.

## checks

- Each new round names the line it supersedes.

