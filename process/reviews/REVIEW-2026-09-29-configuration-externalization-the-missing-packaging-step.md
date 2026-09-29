# Review — Configuration externalization: the missing step between working app and distributable artifact

*2026-09-29. Scope: `substrate-ui` at commit `4413dd4` (Sprint 089), the review at `REVIEW-2026-09-28-packaging-vs-electron-standard.md`, and the postmortem at `POSTMORTEM-2026-09-28-sdd-failure-modes-sprint-089-packaging.md`. This review does not repeat those documents' findings. It names the engineering discipline the project skipped, grounds that name in the academic and professional literature, and maps the discipline's requirements onto what substrate-ui has, lacks, and needs.*

---

## 0. The one-sentence diagnosis

substrate-ui jumped from "it works on my machine" to "package it as a `.app`" without the intermediate engineering step that professional practice calls **configuration externalization** — the extraction of every environment-varying value from code into a surface the deployment can inject.

---

## 1. What the literature calls this step

Three bodies of work converge on the same discipline. Each names a different face of it; together they describe the full step substrate-ui skipped.

### 1a. The Twelve-Factor App (Wiggins, 2011)

Four of the twelve factors apply directly.

**Factor II — Dependencies.** "A twelve-factor app never relies on implicit existence of system-wide packages." Every dependency is declared in a manifest and isolated at runtime. Declaration and isolation must both be present; either alone is insufficient. System tools like `curl` or `imagemagick`, if needed, are vendored into the app.

**Factor III — Config.** "Config varies substantially across deploys, code does not." Every value that changes between environments — paths, credentials, ports, backing-service locations — lives outside the codebase, in environment variables or an injected configuration surface. The litmus test: could the codebase be open-sourced right now without compromising any credential or breaking any assumption about where it runs?

**Factor V — Build, Release, Run.** Three stages, strictly separated. The **build** converts a code repo into an executable bundle at a specific commit. The **release** combines that build with the deploy's current config. The **run** launches processes against a selected release. "It is impossible to make changes to the code at runtime." Each release has a unique identifier and is append-only.

**Factor X — Dev/Prod Parity.** Three gaps to close: time (deploy hours after writing, not weeks), personnel (authors deploy their own code), tools (dev and production use the same backing services, the same dependency versions, the same OS-level assumptions). "The twelve-factor developer resists the urge to use different backing services between development and production."

### 1b. Google SRE — Release Engineering (Beyer et al., 2016)

Google's release engineering defines **hermetic builds**: "If two people attempt to build the same product at the same revision number on different machines, we expect identical results." A hermetic build is "insensitive to the libraries and other software installed on the build machine." The build process is "self-contained and must not rely on services that are external to the build environment." Build tools themselves are versioned alongside source code.

Configuration management separates binary releases from configuration changes. Configuration files are packaged independently from binaries, read from external storage, and updated without rebuilds. The binary is one artifact; the configuration that makes it run in a specific environment is another.

### 1c. Recent academic work (2025)

**Nazario, Bonifacio, and Pinto** — "Mitigating Configuration Differences Between Development and Production Environments: A Catalog of Strategies" (EASE 2025, arXiv:2505.09392). Semi-structured interviews with 17 industry professionals produced a catalog of eight mitigation strategies. The finding that matters here: 88% of configuration failures trace to **consistency of data and settings across environments**. Only 29% of teams considered their strategies sufficient. The strategy with the highest adoption rate (35%) was **Manual Configuration** — ad-hoc, per-site, per-deploy edits — and it was also the strategy most associated with inconsistency and scalability failures. The alternatives that work — Automated Deployment Pipelines (24%), Build Profiles Management (12%), Configuration Management Plans (12%) — all share one property: the environment-varying values are factored out of the code and injected from outside.

**Zhang et al.** — "Implicit, Yet Impactful: Understanding Hidden Dependencies in Java Projects" (arXiv:2608.16262, 2025). Defines **implicit dependencies** (also called "ghost dependencies"): a direct usage relationship in the project's code satisfied by a transitively resolved artifact rather than by a declared dependency. Across 19,812 Maven versions, 34% contained implicit dependencies. 48% of those underwent breaking changes through uncontrolled version drift. The concept generalizes beyond Java: any program that uses a capability it never declared — a system PATH entry, a sibling directory, a shell environment variable, a Python package resolved through a parent venv — carries an implicit dependency on whatever makes that capability present.

**Ardito et al.** — "Build Code Needs Maintenance Too: A Study on Refactoring and Technical Debt in Build Systems" (arXiv:2504.01907, 2025). Names a specific refactoring pattern: **Externalize Properties** (37.5% of the "Synchronizing Shared Build Properties" category). Definition: "focuses on the centralized and harmonized handling of build configurations by extracting environment-specific configurations, credentials, and settings from the build script." The pattern moves hardcoded values into an external properties file, enabling configuration updates without modifying code or build logic. The paper classifies it under Extensibility & Maintainability (30.66% of all build-system refactorings).

---

## 2. What substrate-ui assumes about its environment

`server.py` and `electron/main.js` between them carry at least nine implicit dependencies on the developer's machine. Each one is a value that changes between source mode and packaged mode, and each one was computed inline in code rather than resolved from a configuration surface.

| Implicit dependency | Where in source mode | Where in packaged mode | Code site |
|---|---|---|---|
| Writable run-record directory | `substrate-ui/runs/` (gitignored, writable) | `Contents/Resources/app.asar.unpacked/runs` (signed, read-only) | `server.py:1432` — `Path(__file__).resolve().parent / "runs"` |
| Shell PATH | Developer's dotfile PATH (~40 entries) | `/usr/bin:/bin:/usr/sbin:/sbin` (launchd default) | `electron/main.js:106` — `process.env` passed unmodified |
| Python interpreter + venv | `uv run python` inside `substrate/`'s locked venv (113 packages, Python 3.14.4) | `build/python/bin/python3` (python-build-standalone, pip-installed, initially 16 packages, Python 3.13.7) | `electron/main.js:91–93` vs `:164–173` |
| Working directory | `substrate/` repo root | `Contents/Resources` | `electron/main.js:93` vs `:174` |
| Role-prompt lookup | `Path.cwd() / "src/substrate/topologies/session/prompts/"` | `Contents/Resources/` (no such subtree) | `server.py:2063` |
| Bench-results path | `Path(__file__).parent.parent / "substrate/process/bench_results"` | `Contents/Resources/substrate/process/bench_results` (does not exist) | `server.py:1690–1699` |
| Dev run records | 84 `.record/` dirs under `substrate-ui/runs/` | 0 (only bundled demos) | `server.py:1516, :1532` |
| URL protocol registration | `app.setAsDefaultProtocolClient` at runtime (sufficient in dev) | Requires `CFBundleURLTypes` in `Info.plist` | `electron/main.js:318` |
| Backend lifetime | Killed when terminal sends Ctrl-C | Must survive window close, die on Cmd-Q, respawn on Dock-click activate | `electron/main.js:276–279` |

Sprint 089 patched five of these: RUNS moved to `~/.substrate/runs`, PATH restored via login-shell probe, Python version matched and lockfile used for deps, `Info.plist` protocols declared via `electron-builder.config.js`, and backend lifetime corrected. The patches are scattered across `main.js`, `server.py`, and `fetch-python-runtime.sh`. No single module owns the question "where am I running and what do I have access to?"

---

## 3. The step that was skipped, stated precisely

The step between "the app works in dev mode" and "package it" is:

**Extract every environment-varying value into a configuration resolution layer. Make that layer the single source of truth for paths, dependency sets, environment variables, and lifecycle semantics. Then build a packaged artifact that injects the packaged-mode values into that same layer. Then run the same test suite against both configurations and require parity.**

In the Twelve-Factor framing: Factor III (externalize config) + Factor II (declare every dependency) + Factor X (enforce parity). In Google's framing: hermetic build + configuration packaged separately from binary. In Ardito et al.'s taxonomy: the Externalize Properties refactoring.

substrate-ui did the reverse. It built the packaged artifact first (Sprint 088), discovered it did not work, reverted (commit `c13b6c1`), rebuilt it (Sprint 089), and applied targeted patches to individual failure sites as each one surfaced. The postmortem names this honestly: "a plausible diff between two configurations is not a root cause." Each patch fixed a symptom. The disease — inline environment assumptions with no abstraction — remains.

---

## 4. What the resolution layer looks like

This is not a redesign. It is a refactoring that moves existing inline computations behind a single interface. The interface answers six questions:

| Question | Source-mode answer | Packaged-mode answer |
|---|---|---|
| Where do run records go? | `<substrate-ui>/runs/` | `~/.substrate/runs/` |
| Where is `web/dist/`? | `<substrate-ui>/web/dist/` | `<app>/Contents/Resources/app.asar.unpacked/web/dist/` |
| Where are role prompts? | `<substrate>/src/substrate/topologies/session/prompts/` | `<app>/Contents/Resources/python/.../substrate/topologies/session/prompts/` |
| What Python runs the backend? | `uv run python` (cwd `<substrate>/`) | `<app>/Contents/Resources/python/bin/python3` |
| What PATH does the backend inherit? | Developer's shell PATH | Developer's shell PATH, restored by login-shell probe |
| Where do logs go? | stderr (terminal) | `~/Library/Logs/Substrate/substrate.log` AND stderr |

`electron/main.js` already answers two of these (Python executable, cwd) via its `app.isPackaged` branch. `server.py` answers one (RUNS) via the Sprint 089 patch. The other three are still computed inline or not computed at all. The refactoring collects all six behind one module — called at server startup, before any path is resolved — so that adding a new environment (a container, a test harness, a CI runner) means adding one configuration profile, not hunting through 145KB of `server.py` for every `Path(__file__)` call.

---

## 5. What the parity gate looks like

The observation contract for a packaging sprint must include a **source-vs-packaged parity clause**: the same test suite runs against both configurations, and any flow that passes in source mode but fails in packaged mode gates the sprint. The postmortem names this as the central process failure. The KIT_DIARY's H(new)-1 names it as a hypothesis. The nine Axis-A shakeout flows already exist and run against source mode. Running them against the packaged binary is the gate.

The parity gate is the **release** in the Twelve-Factor sense: the build (the signed `.app`) combined with the deploy's current config (the six answers above), producing a thing that runs identically to the source-mode app. Without the gate, the release is untested. Sprint 089 closed on an untested release.

---

## 6. Sources

- Wiggins, A. (2011). *The Twelve-Factor App.* https://12factor.net — Factors II, III, V, X.
- Beyer, B., Jones, C., Petoff, J., Murphy, N. R. (2016). *Site Reliability Engineering.* O'Reilly. Chapter 8: Release Engineering. https://sre.google/sre-book/release-engineering/
- Nazario, M., Bonifacio, R., Pinto, G. (2025). "Mitigating Configuration Differences Between Development and Production Environments: A Catalog of Strategies." *EASE 2025.* arXiv:2505.09392. https://arxiv.org/abs/2505.09392
- Nazario, M. et al. (2024). "Strategies to Mitigate Configuration Differences in Software Development: A Rapid Review of Grey Literature." *Journal of Software Engineering Research and Development.* https://journals-sol.sbc.org.br/index.php/jserd/article/view/4378
- Zhang, Y. et al. (2025). "Implicit, Yet Impactful: Understanding Hidden Dependencies in Java Projects." arXiv:2608.16262. https://arxiv.org/abs/2608.16262
- Ardito, L. et al. (2025). "Build Code Needs Maintenance Too: A Study on Refactoring and Technical Debt in Build Systems." arXiv:2504.01907. https://arxiv.org/abs/2504.01907
- REVIEW-2026-09-28-packaging-vs-electron-standard.md — the applied review that cataloged 11 findings.
- POSTMORTEM-2026-09-28-sdd-failure-modes-sprint-089-packaging.md — the agent's own failure analysis naming 10 discipline breaks.
