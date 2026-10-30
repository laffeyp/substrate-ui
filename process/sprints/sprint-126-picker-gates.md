# Sprint 126 — Gates for the model half

```yaml
---
id: 126
status: pending
phase: 1
pass_kind: functional
roadmap: substrate-ui/process/planning/ROADMAP-2026-10-10-model-picker-in-the-workspace-bar.md
asked: 2026-10-10 (Architect)
---
```

## why

`driver_chip_on_resume.ts` reads the chip through the dropdown's markup, and no gate covers a model pick starting a session.

## scope

- Update `harness/shakeout/driver_chip_on_resume.ts` for the indicator.
- Add `harness/shakeout/model_half_starts_session.ts`: unbound pane → model half greyed → per session sandbox → model half ungreyed → model pick → session on that driver; plus a session sub-row resuming on its own driver.
- Add the new gate to `gates:electron` (11 → 12).
- Run the UI suite once, build, install, run all 12 gates on `/Applications/Substrate.app`.

## checks

- 12 of 12 gates pass on the installed app.

