# Response to REVIEW-2026-09-29-configuration-externalization-the-missing-packaging-step.md

*2026-09-29. Every source the review cites was fetched and checked against the passage it is quoted for. Every code claim was checked at `ee53899` (before the Sprint 089 fixes) and at `4413dd4` (after). Nothing was changed while checking.*

## Verdict on the diagnosis

**Correct for the divergence between source and packaged builds.** F1 (the run-record directory), F2 (PATH), F3 (interpreter and dependency set) and F4 (working-directory and checkout paths) from `REVIEW-2026-09-28-packaging-vs-electron-standard.md` are each an environment-varying value computed inline where it is used. Twelve-Factor III (config), II (dependencies) and X (dev/prod parity), and Google's hermetic builds, name that class correctly. The review is also right that Sprint 089's fixes are spread across `server.py`, `electron/main.js` and `scripts/fetch-python-runtime.sh`, with no module owning the question.

**Not the cause of four other failures from the same week.** Each of these was measured in both builds, or reads identically in both from the code. No configuration layer would have prevented any of them.

- **Structure empty on a new session.** `session_controller.ts` fetched `topology_graph` only at session open, before the first turn creates the record, and the server answers 404 until then. Measured `null` in source and packaged alike.
- **Resuming an ended session.**
  - The session topology finalises on `threshold_count(SessionEnded, 1)`, which the runtime counts over the whole record on resume.
  - The client's `SessionEnded` handler cleared `sessionId`.
  - The event stream closed at the old `RunFinalised`.

  Source and packaged returned the identical `"status":"ended"`, `final_seq` 45 → 50, with no model run.
- **Orphaned backend.** The parent-death watchdog in `server.py` `print`s to a pipe whose reader is the dead Electron process. The `BrokenPipeError` kills the watchdog thread before shutdown. Found as pid 38409, parent `launchd`, still listening on port 62149.
- **F6, window close kills the backend on macOS.** This is lifecycle semantics, not configuration. The review's §2 table lists it as an implicit dependency.

## Claims verified as stated

- **Twelve-Factor:** "Config varies substantially across deploys, code does not"; "never relies on implicit existence of system-wide packages", with vendored system tools; the build, release and run definitions, unique release IDs, and "impossible to make changes to the code at runtime"; the three parity gaps and "resists the urge to use different backing services".
- **Google SRE, chapter 8:** the hermetic-build sentences ("identical results", "insensitive to the libraries… installed on the build machine", "self-contained and must not rely on services… external"), and configuration packaged separately from binaries in MPM configuration packages.
- **Zhang et al., arXiv:2608.16262:** implicit dependencies, 19,812 versions, 34.12%, 48% breaking through version drift.
- **Nazario et al., arXiv:2505.09392:** 17 participants, eight strategies, Manual Configuration 35%, Automated Deployment Pipeline 24%, Build Profiles Management 12%, Configuration Management Plans 12%, 29% "sufficient".
- **Code, at `ee53899`:** `server.py:1432` (`RUNS`), `:1516` and `:1532` (dev records), `:1690-1699` (`BENCH_RESULTS`), `:2063` (`Path.cwd()`); `main.js:91`, `:93` and `:106` (the source spawn, and `process.env` passed unmodified); `main.js:276` (`window-all-closed`). The 84 dev records.

## Errors

1. **The role-prompt row is wrong.** `resolve_role_prompt(role, repo_root=Path.cwd())` feeds only layer 1, `<repo_root>/.substrate/prompts/`. That directory does not exist in `../substrate`. The prompts that ship (`default.md`, `explainer.md`, `planner.md`, `reviewer.md`, `tester.md`) resolve through `_shipped_prompts_dir() = Path(__file__).parent / "prompts"`, relative to the installed package (`substrate/topologies/session/roles.py:27-28`). They resolve the same way in both builds. The review's "`Path.cwd() / src/substrate/topologies/session/prompts/`" appears nowhere in the code.
2. **§4's run-records row is out of date.** Since `4413dd4`, `RUNS = Path.home() / ".substrate" / "runs"` in both builds (`server.py:1471`). The source answer `<substrate-ui>/runs/` describes code the review's own scope line has already moved past.
3. **Web assets and role prompts need no new layer.** Both already resolve relative to the code's own location, which is correct in both builds. Of the six §4 questions, four already have one owner (interpreter, working directory and PATH in `main.js`; logs in `main.js`). The paths that still depend on the dev checkout are `BENCH_RESULTS` (`server.py:1740-1746`) and the layer-1 role root (`:2112`).
4. **Wrong size, and fewer sites to find.** "145KB of `server.py`": the file is 189,401 bytes at `ee53899` and 190,568 at `4413dd4`. And it isn't a hunt through the whole file. The environment-dependent sites are three `Path(__file__)` anchors (`_WEB_SRC`, `TERMINAL_V1`, `BENCH_RESULTS`), one `Path.cwd()`, and four `os.environ.get` reads (`SUBSTRATE_UI_HOST`, `SUBSTRATE_UI_PORT`, `BENCH_RESULTS`, `SUBSTRATE_DAEMON_SOCK`).
5. **Mixed line numbers.** The scope line names `4413dd4`, but `main.js:91`, `:93`, `:106`, `:276` and every `server.py` line match `ee53899`. `main.js:164-174` and `:318` match `4413dd4`.
6. **Nazario's 88% is misread.** "88% of configuration failures trace to consistency of data and settings" misreads Table 2. The 88% is the share of *participants* (P1–P5, P8–P17) who raised that theme; it is not a share of failures. The paper's text does not say Manual Configuration was "most associated with inconsistency and scalability failures".
7. **"Ardito et al." is the wrong author.** arXiv:2504.01907 is Ghammam, Rzig, Almukhtar, Khalsi, Hassan and Kessentini. The definition is quoted without its last words, "…from the build script *and application code*". The 30.66% belongs to Extensibility & Maintainability debt repaid mainly by Extract Variable, Extract And Move Variable, Extract Method, Extract Task and Move Task. The paper does not put Externalize Properties there.
8. **"Zhang, Y." should be "Zhang, L."** The first author is Lyuye Zhang.
9. **The Twelve-Factor litmus test is embellished.** The source reads "…made open source at any moment, without compromising any credentials." The review adds "or breaking any assumption about where it runs".
10. **The postmortem quote is not verbatim.** The postmortem (§2) says "A diff between two configurations is not an external check surface". The review quotes it as "a plausible diff between two configurations is not a root cause".

## What the review misses

- **The clearest configuration value is absent from its table: the state root.** Source and packaged builds share `~/.substrate/`, meaning `sessions/`, `runs/`, `config.toml`, `recent-workspaces.json` and `daemon.sock`. Each server start unlinks and rebinds the socket (`server.py:4012-4020`), and each boot scan rewrites manifest status. That is F8 in the earlier review. It is the one place where running a dev build beside the installed app corrupts shared state.
- **An injection surface already exists, scattered.** `SUBSTRATE_UI_HOST`, `SUBSTRATE_UI_PORT`, `BENCH_RESULTS`, `SUBSTRATE_DAEMON_SOCK` and `OLLAMA_BASE_URL` (in the kernel's `OllamaResponder`) are environment variables read at their point of use. The resolution layer §4 proposes starts by collecting these, plus a state-root variable, into one module read once at startup.

## Correction

The first bullet under "What the review misses" is withdrawn. Substrate runs as one app per machine, and `~/.substrate/` is its single store by design. The socket and boot-scan collision appears only when a dev build and the installed app run at once. That is a temporary overlap of development and packaging, not a configuration value the review failed to name. The second bullet stands: the five scattered environment-variable reads are the natural first contents of the resolution layer.

## To do: a separate data folder for the development build

Not started. Recorded here as the next step for the development/packaging overlap.

- **What.**
  1. Add one resolver, `substrate_home()`, to the kernel and export it through `substrate.api`. It returns `$SUBSTRATE_HOME` if set, else `~/.substrate`.
  2. Route the 22 hard-coded `".substrate"` paths through it: 11 in `substrate-ui` (`server.py`, `session_registry.py`) and 11 in the kernel (`_daemon.py`, `bundles.py`, `cli.py` ×3, `session_registry.py`, `topologies/bundled.py`, `topologies/session/roles.py` ×2, `topologies/session/transcript.py`, `topologies/swebench_solver/bundled.py`).
  3. Have `npm run electron` set `SUBSTRATE_HOME=~/.substrate-dev` unless the shell already sets it. The installed app sets nothing and keeps `~/.substrate`.
- **Why.** This is the release-channel pattern, as in VS Code Insiders' `~/.vscode-insiders` beside `~/.vscode`. A dev build and the installed app then never share sessions, runs or `daemon.sock` while development and packaging overlap. Running the dev build against the real history is then an explicit choice: `SUBSTRATE_HOME=~/.substrate`. The state root also becomes the first value in the resolution layer this review proposes.
- **Cost.** The resolver lives in the kernel, so it needs a `substrate-kernel` 1.1.1 release. Until then, `scripts/fetch-python-runtime.sh`'s drift check refuses to bundle. The dev build starts with no sessions until it is pointed at the real folder.
