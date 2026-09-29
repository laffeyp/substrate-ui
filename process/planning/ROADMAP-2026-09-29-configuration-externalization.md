# ROADMAP — Configuration externalization, as of 2026-09-29

*New file per no-in-place-edits. The prior roadmap (`ROADMAP-2026-08-16.md`) covers the SDD-instrumentation arc and the UI-NEXT evolution queue. This roadmap covers the configuration externalization work diagnosed in `REVIEW-2026-09-29-configuration-externalization-the-missing-packaging-step.md` and scoped in its response file.*

---

## What this work is

Sprint 089 rebuilt the packaging pipeline and produced a signed, notarized `.app`. The packaged build works — chat, turns, sessions, record persistence all function. But nine environment-dependent values were patched at their individual use sites across `main.js`, `server.py`, and `fetch-python-runtime.sh`, with no module owning the question "where am I running." The diagnosis (grounded in Twelve-Factor III, Google SRE hermetic builds, and three 2025 papers) names the skipped step: configuration externalization — extracting every environment-varying value into a resolution layer the deployment can inject.

Sprint 089 resolved seven of the nine dependencies. Two remain open:

1. The 22 hard-coded `~/.substrate` paths across both repos have no single resolver, making dev/prod separation impossible. A dev build and the installed app share `daemon.sock`, sessions, and run records — the socket `unlink` at server start means only one can run at a time.
2. `BENCH_RESULTS` at `server.py:1739-1748` resolves relative to a sibling `substrate/` checkout that does not exist in the packaged build. The assay rail returns empty. No crash, but an invisible surface.

The fix is `substrate_home()` — one function in the kernel returning `$SUBSTRATE_HOME` if set, else `~/.substrate`. The pattern is VS Code / VS Code Insiders (`~/.vscode-insiders` beside `~/.vscode`). The response file maps the 22 sites: 11 in the kernel, 11 in substrate-ui.

---

## Status snapshot (2026-09-29)

- **Kernel version:** 1.1.0 on PyPI and in `pyproject.toml`. The fetch script pins `substrate-kernel==1.1.0`.
- **Drift guard:** `fetch-python-runtime.sh:54` counts `git rev-list v1.1.0..HEAD -- src/`. Any kernel-side commit to `src/` blocks bundling until a new tag and PyPI release.
- **Packaged build:** signed + notarized `.dmg` on disk. `spctl accepted`. `packaged_app_smoke` green against a deterministic driver.
- **Source build:** `npm run electron` green. All shakeout flows pass in source mode.
- **Parity gate:** does not exist. The nine Axis-A shakeout flows run against source mode only. The packaged `.app` has the deterministic-driver smoke and nothing else.

---

## Sprint chain

Six sprints, four in the kernel (substrate repo, 246-249) and two in substrate-ui (090-091). The chain is linear — each sprint depends on the one before it, except 091 which depends on 090 and is independent of the kernel work after 090 consumes the released package.

### substrate sprint 246 — `substrate_home()` resolver

Add `substrate_home() -> Path` to `substrate/src/substrate/api.py`. Returns `Path(os.environ["SUBSTRATE_HOME"])` if the variable is set, else `Path.home() / ".substrate"`. One function, one env var, one file touched in `api.py`. No path-rewriting yet — this sprint only introduces the resolver.

Export through `substrate.api` so substrate-ui can import it.

Test: `SUBSTRATE_HOME=/tmp/test-home python -c "from substrate.api import substrate_home; assert str(substrate_home()) == '/tmp/test-home'"` returns 0. Unset: returns `~/.substrate`.

### substrate sprint 247 — route kernel paths through `substrate_home()`

Replace the 10 hard-coded `Path.home() / ".substrate"` sites in the kernel with `substrate_home()` (the response file's 11th, `adapters/models.py`, reads config.toml through `transcript.py` and has no direct `Path.home()` call):

- `_daemon.py:61` — daemon socket path
- `bundles.py:55` — default bundles root
- `cli.py:880` — config.toml path
- `cli.py:1590` — bundles root (second site)
- `cli.py:1785` — studio.html path
- `session_registry.py:90` — sessions base
- `topologies/session/roles.py:32` — user prompts dir
- `topologies/session/transcript.py:112` — config.toml (second reader)
- `topologies/bundled.py:79` — ci-fixtures path
- `topologies/swebench_solver/bundled.py:33` — swebench fixture path
- ~~`adapters/models.py:59`~~ — reads config.toml through `transcript.py`; no direct `Path.home()` call. Covered by the `transcript.py` conversion.

Each site changes from `Path.home() / ".substrate" / "..."` to `substrate_home() / "..."`. Behavior unchanged when `SUBSTRATE_HOME` is unset.

Test: existing pytest suite passes (unset env means same paths). One new test: set `SUBSTRATE_HOME`, verify each module's path root changed.

### substrate sprint 248 — tag v1.1.1, release to PyPI

Bump `pyproject.toml` version to `1.1.1`. Tag `v1.1.1`. Build and publish wheel to PyPI. The drift guard in `fetch-python-runtime.sh` will unblock once the tag exists and no commits sit past it.

No code changes — version bump and release mechanics only.

### substrate sprint 249 — kernel-side `BENCH_RESULTS` resolver

This sprint is optional and can be deferred. `BENCH_RESULTS` in `server.py` points at `../substrate/process/bench_results`. In the packaged build, that path does not exist. Two options:

- A. Accept the graceful degradation (assay rail returns empty in the packaged app — bench results are a developer artifact).
- B. Add a `BENCH_RESULTS` env var override, already partially present at `server.py:1740-1741`, and document it.

Option A requires no sprint. Option B is a one-line documentation clarification — the env var override already exists in the code. This sprint is here as a placeholder for an Architect ruling.

### substrate-ui sprint 090 — route substrate-ui paths through `substrate_home()`

Depends on: substrate sprint 248 (the 1.1.1 release).

Update `fetch-python-runtime.sh` line 41: `SUBSTRATE_VERSION="1.1.1"`.

Replace the 11 hard-coded `Path.home() / ".substrate"` sites in substrate-ui with `substrate_home()` imported from `substrate.api`:

- `server.py:248` — config.toml
- `server.py:1299` — sessions base (helper function)
- `server.py:1331` — sandbox path
- `server.py:1353` — recent-workspaces.json
- `server.py:1412` — recent-workspaces.json (second reader)
- `server.py:1450` — sandbox (second site)
- `server.py:1471` — RUNS
- `server.py:1487` — _SESSIONS_BASE
- `server.py:2720` — sessions path in security check
- `server.py:4015` — daemon.sock
- `session_registry.py` (if it has its own references — verify at execution time)

Each site changes from `Path.home() / ".substrate" / "..."` to `substrate_home() / "..."`.

Set `SUBSTRATE_HOME=~/.substrate-dev` in the `npm run electron` script in `package.json`, so the dev build uses a separate state root by default. The installed `.app` sets nothing and keeps `~/.substrate`.

Test: `npm run electron` starts the dev server writing to `~/.substrate-dev/`. The packaged `.app` continues writing to `~/.substrate/`. Both can run simultaneously without socket collision.

### substrate-ui sprint 091 — parity gate

Depends on: sprint 090.

Run the nine Axis-A shakeout flows against the packaged `.app` binary, not just source mode. The `harness/shakeout/run.ts` runner already exists; the gap is that it targets source mode exclusively.

Add `npm run shakeout:packaged` that launches the shakeout against the `.app` at `dist-electron/mac-arm64/Substrate.app/Contents/MacOS/Substrate`. Same flows, same grading. A flow that passes in source mode but fails in packaged mode is a finding.

The parity gate is the observation contract for the configuration externalization work. Without it, the claim "the packaged build behaves identically to source mode" is untested.

---

## Dependency graph

```
substrate 246 (resolver)
    → substrate 247 (route kernel paths)
        → substrate 248 (tag + release 1.1.1)
            → substrate-ui 090 (route ui paths + dev separation)
                → substrate-ui 091 (parity gate)

substrate 249 (BENCH_RESULTS) — independent, Architect ruling needed
```

---

## What this work does not cover

- Moving `~/.substrate` itself to `~/Library/Application Support/Substrate/` (the macOS-conventional location). That is a larger migration with existing-user implications.
- Auto-update, hosting, or distribution beyond the local `.dmg`.
- Any UI or feature work — this is pure plumbing.

---

## Where things are tracked

- `BLACKBOARD.md § Surfaced for review` — the Sprint 089 reopened entry names the configuration externalization diagnosis.
- `REVIEW-2026-09-29-configuration-externalization-the-missing-packaging-step.md` — the review grounding this work.
- `REVIEW-2026-09-29-...-RESPONSE.md` — the response that mapped the 22 sites and proposed `substrate_home()`.
- `KIT_DIARY.md` — the Sprint 089 lessons.
- Sprint cards at `process/sprints/sprint-{090,091}-*.md` (substrate-ui) and `substrate/process/sprints/sprint-{246,247,248,249}-*.md` (kernel).
