# Sprint 109 — Hermetic UI tests

```yaml
---
id: 109
status: closed
closed_at: 2026-10-08
opened_at: 2026-10-08
pass_kind: remediation
roadmap: substrate-ui/process/planning/ROADMAP-2026-10-08-lens-audit-remediation.md
ledger_rows: 45
---
```

## why

40 test files reassign the server's registry global and never restore it; conftest isolates SUBSTRATE_HOME but not HOME; fixed sleeps stand in for conditions; several tests assert something other than their name (findings §1, §3).

## sources

- *Software Engineering at Google*, ch. 14: "Hermeticity: This is the SUT's isolation from usages and interactions from other components than the test in question."
- Meszaros, *xUnit Test Patterns*, Erratic Test: Singletons and Registries need "a mechanism to reinitialize their variables at the beginning of each test."

## scope (ledger rows)

Each row closes as named; a row the sprint cannot close halts the sprint.

| id | close | finding |
|---|---|---|
| F410 | fix | tests/conftest.py:25-26 — isolates SUBSTRATE_HOME only; HOME stays the developer's. Code that resolves the user's home instead of api.substrate_home() still reaches real state. server.py:1442 compares against the lite… |
| F411 | fix | 40 test files assign `server._SESSION_REGISTRY = SessionRegistry(...)` directly (grep: tests/test_server_session_create.py:35 and 39 others); none restore it and none use monkeypatch. The registry from one test, with … |
| F413 | fix | tests/conftest.py and 40+ test files each repeat `sys.path.insert(0, …parent.parent)` + `import server`; _serving.py:19-20 is a fifth copy. The repo has no package/pyproject entry for the test path. |
| F415 | fix | tests/test_background_tasks_daemon_103.py:34 — starts a real `sleep 30` background task; it is stopped by _shutdown_all_sessions at :38 only if the assertions before it pass. A failure at :36 leaves the process runnin… |
| F419 | fix | tests/test_server.py:8, test_ui_control_parity.py:22, test_delegate_via_standing_session.py:19, test_session_manifest_survives_daemon_restart.py:19 — run instructions say `cd substrate && uv run python -m pytest ../su… |
| F420 | fix | tests/test_server.py:565-610 — the UI→kernel import-boundary gate scans only `*.py` at the repo root (:583). scripts/gen_kinds.py:32 imports `substrate.constants`, outside the sanctioned set {api, reference, topologie… |
| F421 | fix | tests/test_server.py:243-277 — live_demo liveness tests poll with sleep(0.25)×40 and assert `live is True` straight after launch (:264); correct only while live_demo takes longer than the first GET. |
| F422 | fix | tests/test_server.py:284-321 — /api/agent is exercised only with `model=deterministic&legacy=true`. The measured defects on that endpoint (codex/cursor-agent silently mapped to the stub; `model=cli&command=` running a… |
| F423 | fix | tests/test_ui_control_parity.py:1-23 — the "UI/CLI control parity gate" sends the same payload twice from one Python client and compares the two manifests. It cannot see what the UI or the CLI send, so it tests daemon… |
| F424 | fix | test_ui_control_parity.py:84-85,101-102,118-119,143-144,160-161,182-183,258-261 — every PATCH response is discarded (status unchecked); the docstring (:15-16) claims "the daemon's response and the manifest read-back a… |
| F425 | fix | tests/test_delegate_via_standing_session.py:268-273 vs 314-320 — docstring promises "turn_index monotonic" and "no interleaved writes"; the assertions check only the count (3) and the set of texts. |
| F426 | fix | test_delegate_via_standing_session.py:68,97,145,222,281 — hard-coded workspace "/tmp/reviewer" instead of tmp_path (tools={} so nothing is written there; the literal is still a shared absolute path). |
| F427 | fix | test_delegate_via_standing_session.py:52-55 — "The daemon (substrate-ui/server.py, sprint 214) will do this": future tense about a sprint long closed. |
| F430 | fix | tests/test_session_manifest_survives_daemon_restart.py:109-137 — the "torn hot segment → interrupted" fixture writes a complete frame with a fake CRC ("00000000") ahead of the torn tail. PROBE (2026-10-08, kernel `_sc… |
| F432 | fix | test_server_piece_b_review_folds.py:155-163 — "delete during in-flight turn" sleeps 0.15 s then deletes. With the deterministic driver the turn can finish inside 0.15 s, in which case the delete never meets an in-flig… |
| F433 | fix | test_server_piece_b_review_folds.py:197-199 — `pytest.skip("segment naming has drifted")`: a drift in record segment naming turns this regression test into a skip, not a failure. |
| F434 | fix | test_server_piece_b_review_folds.py:188-210, 233-239 — appends hand-framed envelopes (via substrate.record.framing) to a live session's open segment while the daemon owns it; the test writes the record behind the writ… |
| F435 | fix | tests/test_server_session_interrupt.py:3-4 — docstring says the endpoint cancels with caller="daemon:interrupt"; the test asserts "daemon:interrupt-hard" (:206). |
| F436 | fix | tests/test_server_session_sse.py:4-5 — docstring says the stream "closes … on substrate.RunFinalised"; since 2026-09-29 it closes only on a RunFinalised past since_seq (piece_b_review_folds.py:176-183). :123-130 says … |
| F437 | fix | test_server_session_sse.py:194, test_server_piece_b_review_folds.py:229, test_end_interrupts_running_turn_107.py:90,160,218 — fixed sleeps (0.5 s) stand in for "reader is polling" / "model call is in flight". The SSE … |
| F438 | fix | tests/test_end_interrupts_running_turn_107.py:65-66,111-112 — builds its own ThreadingHTTPServer + shutdown/server_close; _serving.py:3 says it is "the one copy". |
| F439 | fix | test_session_manifest_survives_daemon_restart.py:58,151,160 — hard-coded workspace "/tmp/w". |
| F441 | fix | No test sends SIGTERM to a server process. "SIGTERM" appears in tests only in docstrings (test_server_daemon_shutdown.py:8-10 defers "a subprocess SIGTERM test" to "the piece-B integration sprint"; test_server_shutdow… |
| F442 | fix | tests/test_server_session_driver_params.py:165-180 — `_daemon_driver_resolver("kimi-k2.6:cloud")` and `_model_supports_thinking` POST to http://localhost:11434/api/show (server.py:884-895) at test time. The assertion … |
| F443 | fix | tests/test_server_session_patch.py:150-164 — "PATCH driver composes with next-turn topology build" patches driver from "deterministic" to "deterministic" and asserts only `callable(topo)`. Nothing checks that the buil… |
| F444 | fix | test_server_session_patch.py:1-21 — header says PATCH mutates "driver + name" and lists per_turn, bundle as not PATCH-able; :142-143 records that both moved to _PATCHABLE. tools/driver_params/per_turn/bundle PATCH tes… |
| F445 | fix | tests/test_server_session_queue_cap.py:58-85 — four concurrent POST /turn on a cap of 3 with the deterministic driver and no slowdown; the 429 appears only if three turns are still queued when the fourth arrives. A fa… |
| F446 | fix | tests/test_delegate_session_ended_mid_delegate.py — the file name and docstring (:1-13) describe "delegate returns a typed failure when the reviewer session has ended". Since the 2026-09-25 ruling the file asserts the… |
| F447 | fix | tests/test_server_shutdown_skips_fresh_sessions.py:19 — cites "server.py:177's isinstance check"; the check is at server.py:341. |
| F448 | fix | test_server_shutdown_skips_fresh_sessions.py:121-122,145-146 — another hand-rolled ThreadingHTTPServer (third copy alongside _serving.py and test_end_interrupts_running_turn_107.py). |
| F449 | fix | tests/test_server_session_turn.py:12-14,99-130 — "no race, no interleaving" is checked as two distinct turn_index values; an interleaved record with distinct indexes passes. |
| F450 | fix | test_session_registry_name_collision.py:39-146 — workspaces "/tmp/w", "/tmp/w{i}", hard-coded. |
| F454 | fix | tests/test_server_applications_223.py:71,83,105; test_pair_coding_composite_225c.py:34; test_server_topology_run_225a.py:37; test_server_topology_status_225d.py:33-34,110 — rebind the module globals server._APPLICATIO… |
| F455 | fix | tests/test_server_records_bundles.py:81-94 — `if prefixed:` guards the only assertion; on a fresh test home with no launch_/build_/resume_ records the test asserts nothing. :62-78 is vacuous for the same reason. Wheth… |
| F456 | fix | tests/test_server_session_patch_tools.py:71-92 — "next turn sees restricted suite" asserts only that a producer kind named "tool" is registered; the filtered tools dict is never inspected. |
| F457 | fix | tests/test_server_topology_run_225a.py:47-67 — asserts body status "finalised" and that a RunFinalised envelope exists. The measured defect that await_completion reports FINALISED whatever the run's outcome is invisib… |
| F458 | fix | Docstrings that still state the pre-2026-09-25 contract (ended session → 410): test_server_session_end.py:7-8,13; test_server_session_410_after_end.py:3-7 (path 2); test_server_session_delete.py:9-10 says a post-delet… |
| F459 | fix | tests/test_server_agent_compat.py:34-37 — helper named `_get` issues POST. |
| F460 | fix | test_server_session_by_name.py:44, test_server_session_list.py:53,82,101 — hard-coded workspace "/tmp/w". |
| F462 | fix | tests/test_session_tool_suite_composition_228.py:35-88 — the "composition contract" builds the composed tool dict inside the test (:64-73, calling make_run_topology … make_list_sessions itself) and then asserts that d… |
| F463 | fix | tests/test_session_registry_by_name.py:71-101 — "per-session lock is stable across turn_sync calls" calls `dict.setdefault` twice on the private `_turn_threading_locks` and asserts setdefault returns the same object. … |
| F464 | fix | tests/test_session_registry_boot_scan_preserves_ended.py:7 — cites session_registry.py:290-295 for the ended short-circuit; the code is at :387-388. |
| F465 | fix | tests/test_session_composite_cascade_end_225b.py:47,57,98,108 — hard-coded workspaces /tmp/pair-composite-test, /tmp/solo, /tmp/other. None of the hard-coded /tmp workspace paths (/tmp/w, /tmp/x, /tmp/reviewer, these … |
| F466 | fix | tests/test_server_uds_transport.py:60 — UDS socket under /tmp (deliberate: sun_path limit; removed in teardown, none left on 2026-10-08). Teardown (:68-75) follows a yield with no try/finally around the servers' start… |
| F467 | fix | test_server_uds_transport.py:3-5 — "The CLI (piece D) will try UDS first": future tense about a shipped piece. |

## checks

- The suite under an empty `HOME` leaves it empty.
- `grep 'server._SESSION_REGISTRY ='` in tests finds nothing; one fixture owns server state.
- Two seeded random-order runs pass.
- No `time.sleep` stands in for a condition (each remaining sleep is inside a poll loop with a deadline).
- Every test named for a property fails when that property is broken (each repaired test is shown red against a planted break).
- A subprocess SIGTERM test passes.

## result

**Checks.**
- The suite under an empty `HOME` left 0 files in it.
- The suite passes in three file orders: as listed, reversed, and shuffled with seed 109 (238 each).
- No fixed sleep stands in for a condition: each remaining sleep sits inside a poll loop with a deadline.
- A real-process SIGTERM test passes: the parked session ends with reason `daemon_shutdown`, the manifest reads "ended", and the process exits 0 within 10 s.

**State is reset, not shared (F410–F413, F454).**
- conftest sets a temp `HOME` as well as `SUBSTRATE_HOME`.
- An autouse fixture puts every private module-level name of `server` back after each test: the binding, plus the contents of tables mutated in place. This is Meszaros's "mechanism to reinitialize" Registries.
- The repo root and `scripts/` go on `sys.path` once, in conftest; 49 per-file inserts and 25 stale run instructions are gone.
- One check is met differently from the card. The card said `grep 'server._SESSION_REGISTRY ='` would find nothing; 36 files still assign it, and the fixture restores it after each test. U111's composition root replaces the global, and those assignments go with it.

**Tests that now check what they name.**
- **F462 (composition).** The test captures the `tools` the daemon hands to `session_topology`. A planted removal of `list_sessions` turned it red.
- **F443 (PATCH composition).** The next build resolves the patched driver.
- **F456 (PATCH tools).** The built suite equals the allow-list.
- **F445 (queue cap).** Admitted turns hold their slot for 1 s, and the second test polls the queue counter instead of sleeping 0.2 s.
- **F455 (records filter).** A real `launch_` record is planted, so the filter has something to drop.
- **F432 (delete race).** The model call takes 5 s, and the DELETE waits until it starts. The turn is interrupted (ProducerCancelled is on the record), parks and answers 200. Over three runs it passed three times.
- **F433, F434 (SSE past the end).** A real `/end` and a real resumed `/turn` replace the hand-framed envelopes and the skip-on-drift.
- **F430 (boot scan).** A clean pause reads "parked"; the same record with a cut frame reads "interrupted"; a bad CRC reads "interrupted".
- **F425, F449 (concurrent turns).** The record alternates UserMessage/Park, and turn_index rises by one per turn.
- **F423, F424.** "UI/CLI parity" is now `test_daemon_control_determinism.py`; it asserts every PATCH status and says what it does not observe.
- **F420 (boundary test).** The UI→kernel boundary test scans `scripts/` too, and `gen_kinds.py` reads `api.LIFECYCLE_KINDS` instead of `substrate.constants`. The generated files were unchanged.
- **F442.** The thinking probe is fixed in the test; no request reaches the developer's Ollama.
- **F437.** The in-flight sleeps became `wait_model_started(record, after_seq=tail)` (`_serving.py`).
- **F438, F448.** The hand-rolled servers use `serving()`.
- **F426 and siblings.** `/tmp/w`-style workspaces became `scratch_ws(...)` inside the run's temp `HOME`.
- **F463.** The `dict.setdefault` test is deleted.
- **F427 and the other stale docstrings** are corrected, and the misnamed delegate-ended file is renamed.

**Three defects found while repairing the tests, all fixed with tests.**
- **N001 (server).** A session's tool allow-list filtered full_suite only. The daemon then added the substrate toolkit unconditionally, so a "read-only" reviewer could still `delegate` and `run_topology`. `_allowed_tool_names` now filters the composed suite.
- **N002 (kernel `session_registry`).** The boot scan read a parked record whose last frame was cut mid-write as "parked". `read_record` skips the cut frame, so the message being written vanished and the session looked resumable.
  - The new `record.has_torn_tail` check is read-only: a hot segment not ending in a newline holds a cut frame. `api` exports it.
  - Such a segment now reads "interrupted".
- **N003 (kernel delegate).** Two parents delegating to one standing session took the reviewer's turn_index and pre-turn snapshot before the session lock. Measured, both got turn_index 1.
  - A parent could also take the other parent's FinalAnswer.
  - The fix: both values are read in `turn_sync`'s `resume_event_builder`, under the lock, and the delegate takes the first FinalAnswer past its own snapshot.

**Rows closed elsewhere.**
- F428, F429 (kernel-only tests living in the UI repo) close in K258.
- F422, F457 (`/api/agent` legacy, `await_completion`) and F421 (the `/api/launch` liveness race) close in U111 with those endpoints.
- F466 (the UDS socket under `/tmp`) is kept on purpose: macOS caps socket paths at 104 bytes and `tmp_path` is longer. The reason is in the fixture's docstring.

**Gates.**

| Gate | Result |
|---|---|
| UI suite | 238 passed, in three orders and under an empty `HOME` |
| Kernel suite | see the BLACKBOARD entry |
