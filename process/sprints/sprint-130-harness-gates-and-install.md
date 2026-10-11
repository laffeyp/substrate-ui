# Sprint 130 — Harness tool calls: gates, suites, install

```yaml
---
id: 130
status: open
phase: 1
pass_kind: functional
roadmap: substrate/process/planning/ROADMAP-2026-10-10-harness-tool-calls.md
asked: 2026-10-10 (Architect)
---
```

## scope

- Opt-in live tests (`SUBSTRATE_LIVE_DRIVER_TESTS=1`) per driver for both routes.
- Full kernel and UI suites once.
- Build, install, all Electron gates on `/Applications/Substrate.app`.

## checks

- The live tests pass for every driver that takes each route; the suites and gates pass.
