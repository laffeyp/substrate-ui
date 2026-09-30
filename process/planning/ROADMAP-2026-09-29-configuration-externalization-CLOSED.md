# ROADMAP — Configuration externalization, CLOSED 2026-09-29

*Closing snapshot. The prior version is `ROADMAP-2026-09-29-configuration-externalization.md`.*

---

## Result

All 22 hard-coded `~/.substrate` paths across both repos now route through `substrate_home()`, which returns `$SUBSTRATE_HOME` if set, else `~/.substrate`. The dev build (`npm run electron`) sets `SUBSTRATE_HOME=$HOME/.substrate-dev`; the packaged `.app` inherits nothing and falls back to `~/.substrate`. Both can run simultaneously — no socket collision, no shared sessions.

`BENCH_RESULTS` resolved to a sibling-checkout path that doesn't exist in the packaged build. It now resolves to `substrate_home() / "bench_results"`, consistent with every other path. The `BENCH_RESULTS` env var still overrides.

`substrate-kernel==1.1.1` is on PyPI. The drift guard passes. The shakeout runner accepts `SHAKEOUT_PORT` so it runs alongside other services.

---

## Sprint chain — final status

| Sprint | Repo | Status | Commit |
|--------|------|--------|--------|
| 246 — `substrate_home()` resolver | substrate | done | `b3874acf` |
| 247 — route 10 kernel paths | substrate | done | `b3874acf` |
| 248 — tag v1.1.1, PyPI release | substrate | done | `b3874acf`, tag `v1.1.1` |
| 090 — route 11 UI paths + dev separation | substrate-ui | done | `7b8fa7b` |
| 091 — parity gate | substrate-ui | done | `3fe4223` |
| 249 — `BENCH_RESULTS` resolver | substrate-ui | done | (this commit) |

---

## Verified assertions

- `grep -rn "Path.home().*\.substrate" server.py session_registry.py` → 0 lines (substrate-ui)
- `grep -rn "Path.home().*\.substrate" src/` → only inside `substrate_home()` itself (substrate)
- `git rev-list --count v1.1.1..HEAD -- src/` → 0 (drift guard)
- Source-mode Axis-A shakeout: 16/17 green (the `cli_version_picker` timeout is model latency)
- Packaged `.app` bundled `api.py` contains `substrate_home()`; bundled `server.py` has 0 residual hard-coded paths
