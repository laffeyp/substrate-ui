---
id: 107
status: closed
class: the roadmap's seven practice lenses (A–G) plus class H, read across both repos
---

# Sprint 107 — the whole-project pass

## why

The Architect's decision of 2026-10-01: after the bug-fix era, one pass that reads the project through the practice lenses of `process/planning/ROADMAP-2026-10-01-engineering-practice-classes.md` and their primary sources, and finds where it falls short. On 2026-10-08 the Architect added the order: delete the test folders that leaked into the real home and make sure tests write somewhere else; then the pass ("tests should be totally separate" is a large part of it); then the kernel release.

## sources (read 2026-10-07/08)

- **Hermetic tests.** Winters, Manshreck and Wright, *Software Engineering at Google*, ch. 14: a hermetic test has no exposure to interactions outside the test. Meszaros, *xUnit Test Patterns*: Fresh Fixture, Fixture Teardown.
- **Lock splitting.** Goetz et al., *Java Concurrency in Practice*, §11.4: narrow lock scope ("get in, get out"); give independent invariants separate locks. Secondary confirmations: IBM Health Center docs, "Resolving lock contention"; Intel Advisor docs, "Reduce lock contention".
- **Releasing resources.** Python docs: `socketserver.BaseServer.shutdown()` stops `serve_forever`, `server_close()` releases the socket; asyncio subprocesses are reaped with `Process.wait()`.
- **pytest.** "Sharing fixtures across multiple files" (a helper module, since conftest is not imported directly); pytest-asyncio 1.4's own warning that `asyncio_default_fixture_loop_scope` must be set, with "function" its announced default.
- **One copy of each fact.** Hunt and Thomas, *The Pragmatic Programmer*, DRY; mypy's `--strict-equality` (on under `--strict`), which treats a `Literal[...]` and an enum member as non-overlapping.
- **Private names.** PEP 8: a single leading underscore is a "weak internal use indicator".
- **Electron 44.** `app.setAppLogsPath(path)`; `app.setPath()` needs an existing directory, and `sessionData` must be set before `ready` (`node_modules/electron/electron.d.ts`).
- **Format-only commits.** GitHub docs, "Ignore commits in the blame view" (`.git-blame-ignore-revs`).

## what the real home held, and where it went

| what | count | done |
|---|---|---|
| test sessions in `~/.substrate/sessions` (first message matches a committed harness or test prompt, or a scripted probe) | 3,094 | deleted through the running app's `DELETE /api/session/<id>` (3,094 × 204), then the folder |
| empty `s_*/workspace` folders without a manifest, empty `adhoc-*` / `sess-*` folders | 1,380 | removed |
| kept: sessions with a human first message or a name; 4 old folders holding files | 47 | untouched |
| gate temp dirs in `$TMPDIR` (`shakeout-home-*`, `resume-*`, `tasks-*`, …) | 218 | removed |
| model-written demo files in the real `/tmp/shakeout`; `/tmp/shakeout-server.log` (4.6 MB) | 8 files + 1 | removed |
| `~/Library/Logs/Substrate Dev`, `~/Library/Application Support/{Substrate Dev, substrate-ui-e2e, substrate-ui}`, `~/Library/Logs/substrate-ui` | 5 dirs, 79 MB | removed |

The Python suites already wrote nothing to `~/.substrate` (Sprint 093's conftest): a before/after count over a kernel and a UI run changed nothing. The leaks were the gates, the app's Electron paths, and the host tools one test ran.

## findings and fixes

**B — tests are separate from the machine they run on.**
- `electron/main.js`: a run that names `SUBSTRATE_HOME` keeps its logs and Chromium profile under it (Electron puts macOS logs in `~/Library/Logs/<name>` whatever the profile dir). An unusable home falls back to a temp root removed at quit; the first version threw at load and the lifecycle gate's F7 caught it.
- `harness/shakeout/lib/scratch.ts`: one fixture creates every gate temp dir and removes it on exit (16 of 18 call sites leaked). The shakeout server log moves next to the run's report.
- The tool-flow prompts keep the model in its workspace. "Any file you can reach" sent a model to `glob("**/*", "/")`; edit/write wrote into the real `/tmp/shakeout`.
- `test_models_endpoint_lists_drivers_with_a_default` ran every installed CLI's model listing on the host; `cursor-agent` rewrote `~/.cursor/cli-config.json` each run. It now fixes the machine (one CLI, two Ollama tags, a canned version tree) and checks the default rule.
- Gates: `release.sh` runs the UI suite under an empty `HOME` and refuses the release if anything appears there, and kernel CI does the same with the kernel suite; after stage 6 it refuses if a gate wrote to the real `Substrate Dev`, `substrate-ui-e2e` or `/tmp/shakeout`. Both suites under an empty `HOME`: nothing written (kernel 1,227, UI 224).

**H — work stops when the user stops it.**
- `POST /api/session/<id>/end` and its child cascade waited behind a running turn for as long as the model ran (Sprint 101 fixed quit, not these). They now interrupt first through one function shared with quit. Test: `/end` returned in under 10 s against a 60 s model call; the old code timed out at 45 s.
- `SessionRegistry.delete` waited 30 s for the turn's lock and then failed. It interrupts first. Old code: failed at 30.7 s.
- `set_name`, `set_driver`, `set_tools`, `set_per_turn`, `set_bundle`, `set_driver_params` took the turn lock, which a turn holds for its whole run. A rename mid-turn waited 59.4 s behind a 60 s model call. They now take a short manifest-write lock (lock splitting); the turn keeps running on its old driver, as their docstrings always said.
- `glob` sorted every match and `grep` sorted `rglob("*")` before capping, so `glob("**/*", "/")` walked the whole disk, in a thread no interrupt reached; a SIGTERM'd server with that call in flight stayed alive past 10 s and needed SIGKILL. Both now walk lazily, stop at their caps, and stop at the interrupt (a cancel hook checked per directory). `glob` from `/` returns 200 files in under 10 s.

**E — one copy of each fact.**
- Status vocabularies: `TaskStatus` (new) and `RunStatus` (new; types both `run_graph` and `RunResult`), with `SessionStatus`, replace bare status strings on 39 code lines (25 kernel, 10 server, 4 client). `scripts/gen_kinds.py` generates `web/vm/statuses.gen.ts` from the kernel enums. The attach check compared a manifest status against `"live"`, a value no `SessionStatus` has.
- Kind names: `tool_loop/kinds.py` and `session/vocabulary.py` constants replace retyped kind literals on 16 kernel lines; a test pins each constant to its struct's `__name__`.
- The harness had two copies of its Node client (one missing `streamRecordByPath`), the slash commands two copies (dispatch and `/help`), and the UI tests 32 copies of one server fixture and 39 copies of five HTTP helpers in nine variants. Each is now one.

**F — the console uses public surfaces only.** The boundary test passed `from substrate import _daemon` and private names under sanctioned modules. It now catches both; `substrate.api.daemon_client` and `delegate.prefix_context_slice` are public.

**G — green means what it says.**
- No gate type-checked `harness/`. `npm run build` now runs `tsc -p harness`: 34 errors, among them `bundle_picked` picking `undefined` (a field `BundleRow` lacks) and passing on the tag alone. It now checks the pick.
- `test_launch_records_are_durable_never_clobbered` failed on CI at `b1cf067` ("incomplete"): three tests read a launch's status straight after `POST /api/launch`, which returns once `RunStarted` is recorded. They now poll to a terminal. This was also the one unexplained local failure earlier in the day (1 in 19 runs).
- Warnings: kernel 60 → 6 under `-W default` (an unreaped CLI child, an unclosed file in the applier, warnings the documented `record_root` exception printed every run); UI 48 → 0 (unclosed test sockets and error responses).
- The status-literal pre-commit gate scanned only substrate-ui and only `==`, and said the kernel had no such literals; the kernel had 7. It now scans both repos, `!=`, and all three vocabularies, and CI runs the hook's gates.
- substrate-ui had no format check (53 of 58 files drifted) and linted at a different line length from the kernel. Its ruff settings now match the kernel's; one format-only commit, listed in `.git-blame-ignore-revs`; CI and `release.sh` check formatting.

**Also:** the `topology_graph` request that 404'd on every session open; a favicon 404 on every page load; an SVG `d="{{ ed.d }}"` parse error before the template rendered; untracked release logs now ignored.

**Checked and found sound:** A (no module-level config reads besides a deliberate clone cache); D (SIGTERM to exit 0.51 s with a parked session, target under 2 s); C (pipeline from Sprint 100, unchanged).

## gates (2026-10-08)

- Kernel fast tier 1,229 passed, 3 skipped; lint, format, mypy strict over 133 files, import contract kept.
- UI 225 passed, 0 warnings under `-W default`; build (with the harness type-check), client specs 23/23, vocabulary parity.
- Source-mode gates on `96edea8`: `vm_smoke` 11/11; shakeout Axes A, B and C, 206 tags green, 0 bugs; `transcript_follow`, `tasks_gate`, `resume_ended_session` pass; lifecycle F5–F8 13/13 after the F7 fix. Gate temp dirs before and after: 0 and 0; real-`HOME` writes: none.
- CI green on kernel `a7977974` and UI `7021381`.

## commits

Kernel `3086f30c`, `b9db5ae1`, `d619efa6`, `a7977974`, `b04f8b2a`. substrate-ui `96edea8`, `6cc4477` (format only), `b1cf067`, `60feb7c`, `7021381`, `94eedfd`.
