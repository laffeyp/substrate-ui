# Sprint 177 — The core topologies on a real model

```yaml
---
id: 177
status: closed
closed_at: 2026-10-13
phase: topologies
pass_kind: observation
depends_on: [K320, K321, 176]
roadmap: ../substrate/process/planning/ROADMAP-2026-10-13-core-topologies.md
---
```

## scope

A session on a real model calls Review on a real branch and Build on a real card in a real repository, in the installed app.

## observation contract

Each returns its report to the session; the build's branch passes its card's checks; the panes showed both runs as they went.

## result

- **Observed.** `harness/shakeout/topologies_live.ts`, run against the installed app (`SHAKEOUT_APP=/Applications/Substrate.app`, its own state folder) on `glm-5.2:cloud`. In a fresh repository whose `feature` branch adds `mean(xs)`, one message asked the session to review `feature` (defects) and to build a card (add `slugify` to `text.py` with a test; two `python3` commands must pass). The session called `review` and `build`; two view-only panes opened as the runs started and showed them working; both ended `done`. The review: "[confirmed] major — `mean([])` raises `ZeroDivisionError`", with the guard as the fix. The build's branch `build/<run id>` holds one commit and passes both commands, run again by the harness in its own worktree. A second message drew each run's end into the caller's record once, and the model's reply reported both.
- **Found on the first run, fixed.** The packaged app starts its server with `PYTHONHOME` set to the bundled 3.14 Python (`electron/main.js:254`, since 2026-10-01). Every process the server started inherited it, so any user `python3` there died with "Failed to import encodings module" (reproduced: `PYTHONHOME=<bundle> /usr/local/bin/python3 -c …` fails, without it runs). Source mode never sets it, which is why no gate saw it. On that first run the build's model worked around it by writing `~/.local/bin/python3`, a wrapper around the bundled interpreter; it was moved to the Trash. Fix: `substrate/interpreter.py`, `release_python_home()` (the server's first call: `PYTHONHOME` moves to `SUBSTRATE_PYTHONHOME`) and `own_interpreter_env()` (restores it for the two children that run the app's own interpreter: the coding gate and the SWE-bench harness). `tests/test_interpreter_home_177.py`, 5; without the release, 3 fail. The second live run, on the rebuilt app with no wrapper, passed, and left no file outside the run's worktree.
- **Also fixed from the screenshots.** A review's report named its branch `HEAD` (a detached worktree): it now names none. A card with no commands read "0 of 0 commands": it now reads "no commands".
