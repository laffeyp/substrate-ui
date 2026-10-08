# Sprint 109 — Hermetic UI tests

```yaml
---
id: 109
status: open
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

(filled at close)
