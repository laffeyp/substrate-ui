# ROADMAP: remediation of the 2026-10-08 lens audit

*2026-10-08.*

**Input.**
- `REVIEW-2026-10-08-whole-project-findings.md` (workspace root): ten patterns, the primary source quoted for each.
- Its raw notes: 444 findings plus 27 resolution and OK rows, 471 in all.
- The ledger `ROADMAP-2026-10-08-lens-audit-remediation-LEDGER.md` gives every row an ID (F001–F471), a sprint and a close.

**Closes.** Each finding closes one of four ways: fix, delete, deprecate, or (for an OK row) no change. A finding that its sprint cannot close stops that sprint and is raised, never carried silently.

## Decisions taken for this roadmap

| Decision | Source | What it decides |
|---|---|---|
| Browser path retired | User, 2026-10-08 | The six Chrome shakeout flows, `tests/walkthrough.js` with `tests/harness/**`, and `harness/_deprecated/` are deprecated: removed from the tree, git keeps them. |
| dc-runtime retired | User, 2026-10-08: "only if you don't break anything" | U112 ports the shell to typed React. Its acceptance gate is the in-scope Electron and controller gates, run green against the pre-port tree (a recorded baseline) and green after. U108 makes those gates able to fail before the port starts. |
| Coding bank grows to ≥ 160 problems | Default; the question went unanswered | Equivalence becomes reachable at δ = 0.15. The 8 verbatim canonical inputs are replaced. Reversible: the extra problems are additive. |
| Studio backend and legacy endpoints deleted | Default | Deleted: `/api/validate`, `/api/build`, builder.py, `/api/launch`, the demo `/api/resume`, and `/api/agent?legacy=true` (which includes the arbitrary-argv `model=cli&command=`). Git keeps them; Studio returns as a real feature when one is planned. |
| Heavy SWE-bench topology deleted | Default | Deleted together with its six satellite modules, `scripts/solve_instance.py`, `scripts/flask_solve.py` and their tests. |
| One failure policy for model calls | Engineering, from oracle.py:47-50 (H-1) | A Producer never converts an error into data. A model or infrastructure failure is recorded as a typed `ProducerFailed`; oracles map a mechanism failure to NO_VERDICT and only a model answer to PASS/FAIL. This retires the "death-resilience" swallow (F189). |
| A created session is PARKED | Engineering | It awaits its first message. That is the boot scan's own classification of a session with no record (session_registry `_scan_record_status`), so create() and the boot scan agree. Closes F043/F452. |
| Local server boundary | Jackson et al., DNS rebinding | Host allowlist {127.0.0.1, localhost, [::1]} with the bound port. Origin required on every mutating method. No state change on GET. |

## Order and checks

The order follows the 2026-10-01 roadmap's rule: each step's check runs on the steps before it.

**1. U108: gates that can fail.** 39 rows.
- *Work:*
  - `exitCodeFor` counts defects;
  - no flow reports a tag it did not observe;
  - `die()` runs teardown;
  - packaged_app_smoke stops only its own pids;
  - electron_menu, slash_router, vm_smoke and the tool flows assert what they name;
  - the browser flows, `harness/_deprecated`, `tests/walkthrough.js` with `tests/harness/**`, and the pixel dev dependencies are removed;
  - `npm test` runs the Python suite, the unit specs and the gates.
- *Check:* a planted defect in each flow (one at a time) makes `npm run shakeout` exit 1. Then record the baseline: every in-scope gate's result on the current tree (the pre-port reference for U112).

**2. U110: server security boundary.** 8 rows.
- *Check:* the DNS-rebinding probe (Host `evil.test`) returns 403; `GET /api/worktree_diff` leaves the index untouched; a bundle or role name containing `..` returns 400; the PTY stream refuses a foreign Origin; a body over the cap returns 413.

**3. U109: hermetic UI tests.** 45 rows.
- *Check:*
  - the suite run under an empty `HOME` leaves `HOME` empty;
  - `grep` finds no `server._SESSION_REGISTRY =` in tests and no fixed sleep standing in for a condition;
  - the suite passes in random order (`-p random_order`, seeded twice);
  - a SIGTERM subprocess test exists and passes.

**4. K258: kernel layering, packaging and gates.** 16 rows.
- *Check:*
  - the sdist is under 5 MB;
  - an import-linter layers contract passes, and cli.py is under an allowlist with no `importlib` bypass;
  - ruff selects BLE and S, and every `noqa` names a rule that runs;
  - the status gate catches single-quoted literals and .ts files and runs in the UI repo's hook too;
  - the kernel-only UI tests live in substrate/tests.

**5. K250: record integrity and Claim Check.** 18 rows.
- *Check (probes become tests):*
  - a 2 MB `resume_event` is offloaded and the record stays readable;
  - every manifest on disk carries `run_id` and the real ceiling;
  - narrate, inspect and replay resolve blobs through one reader;
  - `run_graph` reports a live session mid-turn as running.

**6. K251: runtime liveness.** 15 rows.
- *Check:*
  - a producer that raises `TimeoutError` without a wall budget is recorded as `ProducerFailed`;
  - `quiescence_with_watchdog` either fires after its seconds or is renamed;
  - `Budget.event_counts` is enforced or removed;
  - one subscription matcher and one failure-reason enum remain.

**7. K252: sessions, tools, delegate.** 46 rows.
- *Check:*
  - created sessions are PARKED;
  - fan-out children are linked and cascade;
  - `WorkspaceShape` is the only shape vocabulary, validated at the server.

**8. K253: adapters.** 19 rows.
- *Check:* a 400 is not retried; one retry layer remains; `Responder` declares `arespond`; one Ollama address and one default model, both set at a composition root.

**9. K254: topologies.** 82 rows.
- *Check:*
  - parser tests for every measured misread pass;
  - instruments and pair_coding use the model's reply (a probe reply changes the output);
  - one best_of_n loop remains;
  - one truncation helper remains;
  - every application has a failure guard under the single policy.

**10. K256: SWE-bench solver and oracles.** 54 rows.
- *Check:*
  - mechanism failures grade NO_VERDICT;
  - a missing report is NO_VERDICT;
  - typed errors are raised;
  - the gate kills its process group on timeout (the probe becomes a test);
  - the container is stopped on timeout;
  - the citations match the fetched paper;
  - the heavy topology is gone.

**11. K257: assay statistics.** 28 rows.
- *Check:*
  - score-TOST issues the equivalence verdict;
  - one definition of "graded" exists (the 2-of-4 probe reports 0.5);
  - pass^k is checked against trials;
  - salvage usage is read from the record;
  - the pre-registration timestamp is verified;
  - the bank holds ≥ 160 problems with no verbatim canonical inputs;
  - the conformance checks exercise their properties.

**12. U111: server correctness and composition root.** 26 rows.
- *Check:*
  - `Handler` reads its dependencies from an `App` built in `main()`;
  - tildes expand;
  - `await_completion` reports the real status;
  - topology runs are `.record`, listed and pruned;
  - the legacy and Studio endpoints are gone;
  - the 410 codes name their condition;
  - no test output lands in the real `~/.substrate` (it is cleaned of the 389 `s_topo` and 5 shakeout records once).

**13. U112: retire dc-runtime.** 37 rows.
- *Work:*
  - the shell becomes typed TSX with no `@ts-nocheck`;
  - React is bundled locally;
  - a CSP without `unsafe-eval` is added;
  - no fiber walks remain;
  - fabricated data is removed, and controls are wired where an endpoint exists (assays, rename, new session) and removed where none exists.
- *Check:* the U108 baseline gates are green again, the DOM structure checks of the in-scope flows pass, and `npm run smoke:packaged` passes on a fresh bundle.

**14. U113: packaging and vocabulary.** 7 rows.
- *Check:*
  - the package is named for the app;
  - the bundle records its kernel commit and input hash, and the packaged smoke compares them;
  - vocabulary 0.2 is issued as a new file, with 0.1 left as locked.

**15. Release.** Kernel card 249 resumes: CI green, `twine check`, a clean-venv install, the tag.

## Sprint cards

| Sprint | Repo | Card |
|---|---|---|
| UI 108–113 | substrate-ui | `substrate-ui/process/sprints/sprint-108…113-*.md` |
| K250–258 | substrate | `substrate/process/sprints/sprint-250…258-*.md` (K255 unused) |
