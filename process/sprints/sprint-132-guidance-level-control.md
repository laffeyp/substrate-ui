# Sprint 132 — The guidance-level control

```yaml
---
id: 132
status: closed
closed_at: 2026-10-10
phase: 1
pass_kind: functional
roadmap: substrate/process/planning/ROADMAP-2026-10-10-guidance-levels.md
asked: 2026-10-10 (Architect)
---
```

## result

- **The daemon.**
  - With no bundle named, `POST /api/session` resolves the model's default level once (`guidance_bundle(guidance_level(_model_class(driver)))`) and stores that bundle on the manifest.
  - A named bundle is kept as given, and `null` still opts out.
  - The per-turn remap of `standard` by model class (`server.py`, K278) is gone, so a level the operator chose for a small model stays. Sessions created before this on `standard` with a small model now read high.
- **The controller** starts with no bundle picked ("auto") instead of `standard`.
- **The bar.** One GUIDANCE line sits under the workspace and model columns: `auto`, `harness`, `low`, `medium`, `high`, with the chosen level's description at the right. It is greyed until a folder is armed. A pick calls `pickBundle` and starts nothing; picking a model starts the session.
  - A first version was a third column. Its six lines were taller than the bar and scrolled, hiding the heading and `high`. It became one line so the bar keeps its height.
- **Checked in a running build.** Armed per session sandbox, picked `medium`, picked `glm-5.2:cloud`, sent a message: the session opened on `standard-medium`.
- **Tests.** `test_model_class_278_daemon.py` covers small, medium and large with no bundle named (manifest, `SessionStarted`, role variant), a named high level winning over a small model, and the old low name opening. Every UI test naming bundles or classes: 129 passed. Unit specs: 28 of 28.
