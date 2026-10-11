# Sprint 124 — The model half of the workspace bar

```yaml
---
id: 124
status: open
phase: 1
pass_kind: functional
roadmap: substrate-ui/process/planning/ROADMAP-2026-10-10-model-picker-in-the-workspace-bar.md
asked: 2026-10-10 (Architect)
---
```

## why

The model picker floats under a header chip and freezes once a session exists, so it only works before the workspace is picked. The Architect asked for it to fold into the workspace bar at the bottom of the pane: workspace on the left, model on the right, a divider between, left to right.

## scope

- The unbound pane's picker box (`web/reveal.html:116-141`) splits in two. The left half is today's workspace picker, unchanged. The right half is the model picker in the same form: a MODEL label, `_buildDriverOpts` rows with group headers, three levels, the right chevron (◂/▾), every row a pick, and the current model in bright text.
- The right half is greyed until a folder row (per session sandbox, sandbox, a recent folder, a typed path, choose folder…) is picked. That pick arms the folder and highlights it. A session sub-row attaches as today and leaves the right half alone.
- A model pick calls `openSession` with the armed workspace and the picked driver, family or pin.
- Keys: ↵ on a folder arms it and moves the selection to the current model. ↑↓ move within a half. ↵ in the model half starts the session; esc returns to the left half and disarms.
- Below the 480 px header step, the model half sits under the workspace half, with a horizontal divider.

## checks

- In the installed app: a new pane shows the model half greyed; per session sandbox ungreys it; a model pick starts a session whose manifest names that driver.
- A session sub-row resumes on its own driver.
- Keyboard only: ↵, ↓, ↵ starts a session.

