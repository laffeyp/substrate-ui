# ROADMAP — Packaging-arc bugs as instances of seven engineering-practice classes

*2026-10-01. Input: the bug review of Sprints 086b–092 done in this session (every claim below was measured or read from code at `72b5860` plus the uncommitted tree). Each bug since Sprint 089 was fixed where it surfaced. This roadmap names the established practice each bug violates, cites the source that defines it, and fixes at the level of the practice. A class closes when its check passes, not when its instances stop showing.*

---

## The seven classes

| # | Class (practice violated) | Source | Instances in this repo |
|---|---|---|---|
| A | Configuration resolved once at import, not at a composition root | Wiggins, *Twelve-Factor App* §III Config; Seemann, *Composition Root* (2011) | `RUNS` `server.py:1497`, `_SESSIONS_BASE` `:1513`, `_SESSIONS_BASE_DEFAULT` `session_registry.py:72` read `SUBSTRATE_HOME` at import; conftest sets it after |
| B | Tests share state with production (no fresh fixture) | Meszaros, *xUnit Test Patterns* (2007), Erratic Test: Interacting Tests, Test Run War | 30 session dirs + 1 run record written to the real home by one test run; 61 of 64 `recent-workspaces.json` rows are deleted pytest tmpdirs; no write-side rejection of test paths |
| C | Build the artifact once, test it, promote that same artifact | Humble & Farley, *Continuous Delivery* (2010): "only build your binaries once"; Apple TN2206: a change to a signed bundle breaks its seal | Sprint 092 files hand-copied into the signed `dist-electron` app (codesign now fails); `/Applications` build 1790667186 predates 090–092; drift guard `fetch-python-runtime.sh:54` counts commits, not a dirty `src/`; Sprint 091 marked done with no `shakeout:packaged` |
| D | Disposability: fast startup, graceful SIGTERM shutdown | *Twelve-Factor App* §IX Disposability; Python docs, `socketserver.BaseServer.shutdown` ("must be called while `serve_forever()` is running in a different thread otherwise it will deadlock"); Electron docs, `requestSingleInstanceLock` example | SIGTERM handler calls `srv.shutdown()` on the serving thread: server alive 31 s after SIGTERM with zero sessions, so every Cmd-Q waits the 45 s SIGKILL; boot scan walks 4,373 sessions; `main.js:341` `whenReady` outside the lock's `else` |
| E | One authoritative copy of each fact across the Python/TypeScript boundary | Hunt & Thomas, *The Pragmatic Programmer* (1999), DRY; TypeScript Handbook, Narrowing → Exhaustiveness checking (`never`) | `kinds.ts` held `RunFinalised` for `substrate.RunFinalised` from Sep 23 to Oct 1; ESLint's banned-literal list is a second copy and misses `case` labels; five raw `case "…"` kinds; `ProducerFailed`, `PredicateQuarantined`, `ProducerCancelled` unhandled |
| F | Claim Check resolved in one place; state rebuildable from the log | Hohpe & Woolf, *Enterprise Integration Patterns* (2003), Claim Check + Content Enricher; Fowler, *Event Sourcing* (2005), Complete Rebuild | Blob stub broke triggers 2026-07-01 (glob wedge, patched with a byte cap) and 2026-08-09 (`KeyError('targets')`, patched with an element cap); Sprint A resolves it for live views only, while `_as_event` (`kernel/runtime.py`) folds the stub on resume; Sprint B resolves it a fourth way in `server.py` by importing kernel internals |
| G | Keep the build green; done means verified | Fowler, *Continuous Integration* (2024 rev.): "Fix Broken Builds Immediately"; Fowler, *Eradicating Non-Determinism in Tests* (2011): quarantine, and "once you start ignoring a regression test failure, then that test is useless" | 18 substrate-ui failures carried as "pre-existing" since Sep 29 (classified below); kernel `test_assay_coding.py::test_firewall_catches_an_overfit_candidate` red; kernel suite ran past 30 min with no total; 091 and 086b marked done unverified; F-API-6 boundary test red |

### The 18 substrate-ui failures, by cause (class G triage input)

- 6 — demo fixtures `demo_failed` / `demo_paused` / `demo_diff_*` lived in gitignored `substrate-ui/runs/`; F1 moved `RUNS`, so no build serves them. Tests depend on an untracked, machine-local generated file.
- 4 — 410-after-end and `SessionEndedMidTurn` tests assert the contract 086b replaced (ended sessions resume).
- 1 — F-API-6 boundary: `server.py` and `session_registry.py` import `substrate.bundles` and `substrate.kernel.runtime`.
- 1 — expects "run console" from the retired classic shell.
- 1 — expects `claude` and `gemini` CLIs on the test machine.
- 5 — untriaged contract drift: `think` default, `daemon:interrupt` vs `daemon:interrupt-hard`, PATCH bundle default, PATCH error text, driver-params resolver.

---

## Order and checks

Ordered so each step's check can run on the step before it. Every check is a command or measurement, not a reading.

**1. A + B — composition root and hermetic tests.**
Replace module-level path constants with a config object built in `main()` (and an accessor for tests). Set `SUBSTRATE_HOME` in conftest at import time or in `pytest_configure`, before test modules import `server`. Reject temp-directory paths where `_remember_workspace` writes, by shape (`$TMPDIR`, `/private/var/folders`, `pytest-of-*`), and purge the 61 stale rows once.
*Check:* the full suite run under a throwaway `HOME` leaves `$HOME/.substrate` absent (measured today: 30 dirs + 1 record). `grep` finds no module-level `substrate_home()` call.

**2. D — disposability.**
Move `srv.shutdown()` off the serving thread. Put `whenReady` inside the lock's `else` per Electron's example. Measure boot-scan cost and make the session catalog incremental (index file or lazy scan).
*Check:* SIGTERM to exit under 2 s with zero sessions and with 50 live sessions; cold start to first paint measured and recorded.

**3. F — one Claim Check resolver in the kernel.**
One read path resolves `$blob` stubs for every consumer: live views, the resume fold, replay, and the SSE stream. Export it on `substrate.api` so `server.py` drops its `blobstore`/`types` imports. Keep the record byte-identical.
*Check:* a kernel test emits an oversized payload, parks, resumes, and asserts the resumed View value equals the live one; bundled-record currency and replay gates stay green.

**4. E — generated kinds and exhaustive switches.**
Generate `web/vm/kinds.ts` from `substrate/constants.py` and the session topology's event Structs. Add `assertNever` to the envelope switch. Retire the ESLint literal list.
*Check:* a CI step regenerates and diffs to zero; adding a kind without a handler fails `tsc`.

**5. G — green build.**
Resolve each of the 18 by its cause above (rewrite to the current contract, restore fixtures as tracked generated records, add the needed functions to `substrate.api`, quarantine machine-dependent tests behind a marker). Fix the kernel failure. Split the kernel suite into fast and slow tiers with recorded wall time.
*Check:* both suites report 0 failed; the fast tier's runtime is recorded on the BLACKBOARD.

**6. C — one release pipeline.**
One command: refuse a dirty `src/` in either repo, build, sign, run `shakeout:packaged` (the nine Axis-A flows) against the signed bundle, then install that exact bundle. No step edits a signed bundle.
*Check:* the installed app's `CFBundleVersion` maps to a commit; `shakeout:packaged` exits 0 against the installed bundle; `codesign --verify --deep --strict` passes.

After step 6, the pipeline in C is the gate for every later sprint. A sprint whose card names a check closes only when that check has run.

---

## Sources

- Wiggins, A. *The Twelve-Factor App*, §III Config, §IX Disposability. https://12factor.net/config, https://12factor.net/disposability
- Seemann, M. "Composition Root" (2011). https://blog.ploeh.dk/2011/07/28/CompositionRoot/
- Meszaros, G. *xUnit Test Patterns* (Addison-Wesley, 2007), Erratic Test. http://xunitpatterns.com/Erratic%20Test.html (site unreachable 2026-10-01; names confirmed via https://test-smell-catalog.readthedocs.io/en/latest/Dependencies/Dependencies%20among%20tests/Test%20Run%20War.html)
- Humble, J. & Farley, D. *Continuous Delivery* (Addison-Wesley, 2010), ch. 5. Farley, "The Deployment Pipeline" (2007): https://continuousdelivery.com/wp-content/uploads/2010/01/The-Deployment-Pipeline-by-Dave-Farley-2007.pdf
- Apple, TN2206 / Developer Forums on sealed resources: https://developer.apple.com/forums/thread/766491
- Python docs, `socketserver.BaseServer.shutdown`. https://docs.python.org/3/library/socketserver.html
- Electron docs, `app.requestSingleInstanceLock`. https://www.electronjs.org/docs/latest/api/app
- Hunt, A. & Thomas, D. *The Pragmatic Programmer* (1999), DRY.
- TypeScript Handbook, Narrowing → Exhaustiveness checking. https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- Hohpe, G. & Woolf, B. *Enterprise Integration Patterns* (2003), Claim Check. https://www.enterpriseintegrationpatterns.com/patterns/messaging/StoreInLibrary.html
- Fowler, M. "Event Sourcing" (2005). https://martinfowler.com/eaaDev/EventSourcing.html
- Fowler, M. "Continuous Integration". https://martinfowler.com/articles/continuousIntegration.html
- Fowler, M. "Eradicating Non-Determinism in Tests" (2011). https://martinfowler.com/articles/nonDeterminism.html
