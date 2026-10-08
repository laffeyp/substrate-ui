# Sprint 108 — Gates that can fail

```yaml
---
id: 108
status: closed
closed_at: 2026-10-08
opened_at: 2026-10-08
pass_kind: remediation
roadmap: substrate-ui/process/planning/ROADMAP-2026-10-08-lens-audit-remediation.md
ledger_rows: 39
---
```

## why

Every later sprint is verified by these gates. Today `exitCodeFor` ignores defects, six flows report tags they never observed, and teardown is skipped on failure (findings §1, §6). The user retired the browser path on 2026-10-08.

## sources

- Fowler, *Eradicating Non-Determinism in Tests*: "Never use bare sleeps to wait for asynchonous responses: use a callback or polling."
- SDD observation contract: a check counts only if a broken system makes it fail.

## scope (ledger rows)

Each row closes as named; a row the sprint cannot close halts the sprint.

| id | close | finding |
|---|---|---|
| F365 | deprecate | harness/shakeout/lib/report.ts:147-149 — `exitCodeFor` returns 1 only for tag-coverage gaps (4/5, below, dead); `total_bugs` and `runOks` do not affect the exit code. Every behavioural check in the flows is a `Defect`… |
| F366 | deprecate | 11 of 20 Axis A/C flows append their own declared tags to `emitted` at the end of the run, regardless of what the app emitted: caret_pin.ts:210-214, pane_split.ts:170-174, pane_header_clip, pane_prompt_isolation, reve… |
| F367 | fix | harness/shakeout/lib/tool_flow.ts:27-33 — the 22 Axis B tool flows declare only SESSION_OPEN_REQUESTED/ACKED, TURN_SUBMITTED, STREAM_ENVELOPE_APPENDED, TURN_PARKED; whether the named tool was called is a Defect only. … |
| F368 | fix | harness/shakeout/slash_router.ts:12-23,46-60 — drives "/tools bash", "/workspace .", "/isolate", none of which exist in session_controller.ts:797-849 (exit/model/name/list/interrupt/clear/help). `submitLine` emits SLA… |
| F369 | deprecate | lib/driver.ts:5-18 — Axis A/B flows run against the server's default real model (cloud tags such as kimi-k2.7-code:cloud); outcome depends on provider availability and model behaviour (tool flows: "reproduces: false")… |
| F370 | fix | lib/server.ts:16 — fixed default port 8765 (SHAKEOUT_PORT overrides) — the same default as server.py standalone and `_daemon` TCP fallback; `requirePortFree` refuses to run beside a dev server on 8765. |
| F371 | fix | lib/report.ts:108-111 — default SHAKEOUT_OUT_DIR is `captures/shakeout-<date>` inside the repo; only release.sh redirects it. |
| F372 | deprecate | caret_pin.ts:21-27 — a second `pickRealDriver` (lib/driver.ts:5 is the shared one); pane_split.ts:65-89 re-implements reveal.ts's React-fiber walk to reach the component's private `_split`/`_bindPane` methods. |
| F373 | fix | chat_one_turn/tool_flow/stream_reconnect end sessions with reasons ("shakeout_done", …) that the server never records (endSession body key mismatch above). |
| F376 | fix | harness/shakeout/cli_discovery.ts:6-7,45-48 — comment: a box with no CLI "reports zero and passes". Returning no emits makes all 12 declared tags "dead" in gradeFlow (report.ts:76) -> exit 1. l.60 pushes a fabricated … |
| F377 | fix | harness/shakeout/tool_delegate_many.ts:37-41 — the prompt tells the model to give each child "the deterministic driver": the fan-out flow verifies delegate with canned children (ties to the kernel "fan-out children de… |
| F378 | fix | harness/shakeout/tasks_gate.ts:19 — hard-codes DRIVER "kimi-k2.7-code:cloud"; l.35-36 counts `pgrep -f "^sleep 301$"` machine-wide. |
| F379 | deprecate | harness/shakeout/pane_header_clip.ts:88 — finds the header by the inline style substring `background:#26292e`; any colour change breaks the check silently (`continue`, no defect). |
| F380 | fix | harness/shakeout/electron_menu.ts:3-5,50-58 — header: "asserts … state.revealed flips for toggle-reveal"; the code clicks menu-toggle-reveal, sleeps 300 ms, asserts nothing. |
| F381 | deprecate | the React fiber walk to reach `_split`/`_bindPane`/`state` is written five times: reveal.ts:31-54, pane_split.ts:65-89, pane_header_clip.ts:47-70, pane_prompt_isolation.ts:40-65, reveal_mode_direction.ts:46-67 + 78-98… |
| F383 | fix | harness/shakeout/resume_ended_session.ts:54-57,107,113,127,145,147-150 — die() calls process.exit(1) inside the try; the finally at :156-157 (app.close) never runs on any assertion failure, so the Electron app and its… |
| F384 | fix | resume_ended_session.ts:92 — binds pane 1 to the literal "~/.substrate/sandbox", the same unexpanded-tilde string that produced the measured substrate/~/ and substrate-ui/~ directories; HOME is a temp dir here, but th… |
| F385 | fix | resume_ended_session.ts:62 — UV_CACHE_DIR and UV_PYTHON_INSTALL_DIR point at the real $HOME; the run shares the developer's uv cache. HOME itself is isolated. |
| F386 | fix | resume_ended_session.ts:100-104 — drives the app's default driver from /api/models (a live model, 180 s waits); the gate depends on Ollama/model availability and is not deterministic. Assertions themselves (same sessi… |
| F387 | fix | harness/shakeout/transcript_follow.ts:51,88,95 — settle by fixed sleeps (250/300/400 ms) rather than a condition; layout-timing dependent. |
| F388 | fix | transcript_follow.ts:99 — launch() is outside the try; a launch rejection is an unhandled rejection with no exit code set by the flow. |
| F389 | fix | harness/vm_smoke.ts:1 — header names "harness/vm_smoke.js"; the file is .ts. |
| F390 | fix | vm_smoke.ts:5,14 — requires a live server at 127.0.0.1:8765 and writes sessions into whatever store that server uses; no isolation of its own. |
| F391 | fix | vm_smoke.ts:57 — step named "SessionStarted, UserMessage, Park all seen" checks only ["UserMessage","Park"]; and seenKinds (:34) collects transcript row kinds, not envelope kinds. |
| F392 | fix | vm_smoke.ts:81-88 — "session ends cleanly" asserts the client-local sessionId===null; nothing checks the server's session status. endSession passes "smoke_test_done" as reason (server reads `source`, recorded earlier). |
| F393 | fix | harness/startup_timing.ts:105-111 — a measurement script: prints JSON, exits 0 whatever the single-instance or quit-to-no-backend numbers are; not a gate. Fine as a measurement; it is listed nowhere as a pass/fail che… |
| F394 | fix | startup_timing.ts:80 — on timeout SIGKILLs only the spawned second electron pid; a server.py it spawned would be orphaned (SIGKILL gives electron no chance to stop its child). Counting is by SUBSTRATE_HOME in env, not… |
| F395 | fix | packaged_app_smoke.ts:396 — `pkill -9 -f BUNDLED_PY`, a pattern kill. BUNDLED_PY derives from APP_ROOT, and :70-72 documents SMOKE_APP=/Applications/Substrate.app as a supported target; under that setting the pattern … |
| F396 | fix | packaged_app_smoke.ts:104-107 with :209,210,212,294,295,298,319,351 — die() calls process.exit(1) inside the try; the finally (:360-404: app.close, backend wait, ModuleNotFoundError scan, orphan sweep, userDataDir rem… |
| F397 | fix | packaged_app_smoke.ts:39-41 — header lists as an asserted precondition that the "spawning server" log names the bundled python3, not uv. No code checks it; the only stderr assertion is the ModuleNotFoundError scan (:3… |
| F398 | fix | packaged_app_smoke.ts:143-159 — staleness is inferred from mtimes over a hand-kept input list. The kernel reaches the bundle through build/python site-packages (scripts/fetch-python-runtime.sh:10,44,52-59 build the wh… |
| F399 | fix | packaged_app_smoke.ts:33 — "server.py and its four siblings"; the list at :147-150 has three (session_errors.py, builder.py, demo_topologies.py). |
| F400 | fix | packaged_app_smoke.ts:273,301,315,324 — step numbers 9 and 10 each used twice. |
| F401 | fix | packaged_app_smoke.ts:95-98,341 — default driver is the app's real model; the gate needs a model online and waits up to 180 s. |
| F403 | fix | packaged_app_smoke.ts:263 — binds the literal "~/.substrate/sandbox" (unexpanded tilde; the fourth copy of this literal across the harness). |
| F404 | deprecate | harness/_deprecated/*.ts — 10 retired scripts (944 lines) plus electron_spike/ kept in the source tree "for the audit trail; not run" (README.md:3). Git already holds that trail. Their imports (`./shakeout/...`, `./pi… |
| F405 | deprecate | package.json:30,38,40 — devDependencies pixelmatch, pngjs, @types/pngjs are used only by harness/_deprecated/pixel_diff.ts (grep, excluding node_modules). Dead dependencies of a retired script. |
| F407 | fix | package.json:7-26 — no npm script runs the Python test suite (tests/*.py) and no script aggregates the gates (gates:lifecycle, gates:scroll, gates:tasks, shakeout, smoke:packaged, test:unit) into one pass/fail; `build… |
| F409 | deprecate | harness/*.png (shot-*.png, anchor-bridge.png) and tests/harness/*.png — screenshot output committed alongside source. |

## checks

- A planted defect in each in-scope flow, one at a time, makes `npm run shakeout` exit 1.
- No flow pushes a tag it did not observe (grep for pushes of declared tags).
- `die()` paths run `app.close` and the backend wait; a failing run leaves no backend (checked by SUBSTRATE_HOME in process env).
- packaged_app_smoke contains no `pkill`.
- The browser flows, `harness/_deprecated`, `tests/walkthrough.js` and `tests/harness/**` are gone; `npm run build` passes.
- `npm test` runs the Python suite, the unit specs and the in-scope gates.
- Baseline recorded: each in-scope gate's result on this tree, for U112.

## result

**The gate can fail now, and two planted breaks proved it.**
- `exitCodeFor` returns 1 on any defect or failed run, as well as on a coverage gap.
- Plant 1 made `/clear` a no-op in session_controller.ts. slash_router recorded 1 defect and the run exited 1.
- Plant 2 made the toggle-reveal menu item do nothing. electron_menu recorded 1 defect and the run exited 1.
- Under the old exit code both runs exit 0: every tag green, defects ignored. Both plants were reverted; `git diff` is clean on both files.

**A vacuous check turned up in transcript_follow.**
- Its two "switch" checks passed without ever switching views. The gate never bound its pane, and ctrl+` is a no-op on an unbound pane (reveal_component.ts:732).
- The new switch wait failed, which exposed this.
- The gate now binds the pane as a user does. Both checks switch for real and pass (scroll position 558 → 558).

**electron_menu learned what the app actually does.**
- The new-session menu item opens a pane already bound to the literal `~/.substrate/sandbox`.
- That literal is F375; U111 fixes the server side.

**What changed.**
- `lib/electron.ts` holds the shared launch code and binds panes the way a user does: Enter in the path input. This replaces both the per-flow launch code and the fiber walks.
- The Electron flows report the tags in `window.__vmSignals`, not tags they push themselves. electron_menu and electron_deeplink declare no tags and check outcomes.
- slash_router checks what each real command does. It also checks that `/tools`, `/workspace` and `/isolate` fire SLASH_UNKNOWN.
- cli_discovery and cli_version_picker declare no tags (a box with no authenticated CLI passes honestly) and fabricate no markers. cli_version_picker no longer sends the literal `~` workspace, and its end body now carries `source`.
- `lib/procs.ts` finds this run's backends by `SUBSTRATE_HOME` and their children by parent chain.
  - tasks_gate counts only its own `sleep 301` processes and takes the app's default driver.
  - packaged_app_smoke has no `pkill`; it kills survivors by pid, and a survivor fails the run. It now checks that the backend was spawned on the bundled python.
- Teardown runs on failure: `die()` throws in packaged_app_smoke and resume_ended_session, and transcript_follow launches inside `try`.
- Fixed sleeps became conditions in transcript_follow (layout settled for three frames; the view mount toggled), stream_reconnect (park, then a second STREAM_ATTACHED) and electron_deeplink.
- The shakeout server takes an ephemeral port, kept across restarts, and reports go to the OS temp dir.
- Axis A runs on the deterministic driver unless `SHAKEOUT_DRIVER` is set. release.sh sets `SHAKEOUT_DRIVER=default`, so a release still drives a real model through Axis A.
- vm_smoke starts its own isolated server, checks envelope kinds, and checks that the session ended on the server.
- The fan-out flow gives its children the session's real driver.
- Deleted:
  - the six browser flows;
  - `harness/_deprecated` (10 scripts and electron_spike);
  - `tests/walkthrough.js` and `tests/harness/**` (20 files);
  - pixelmatch, pngjs and @types/pngjs.
- New npm scripts:
  - `npm test` runs the Python suite, the unit specs, vm_smoke, shakeout Axis A and the Electron gates;
  - `test:py` and `gates:electron` are also new.

**Rows closed elsewhere.**
- **F373** closes in U112. The flows pass end reasons, but the client sends them under the key `reason`, which the server does not read.
- **F398** closes in U113, when the bundle records its kernel commit and an input hash.
- **F384/F403:** the gates now bind through the path input, which picks the per-session sandbox, not the literal tilde.
- **Kept on purpose:**
  - F385: resume_ended_session keeps uv's cache on the real home in source mode. That cache holds content-addressed build inputs, not app state; the reason is written in the file.
  - F386/F401: the resume and packaged-smoke gates stay on a real model, as the real-model tier. `SMOKE_DRIVER=deterministic` runs them offline.

**Baseline for U112 (current shell, 2026-10-08)**

| Gate | Result |
|---|---|
| Python | 225 passed |
| Unit specs | 23/23 |
| vm_smoke | 12/12 |
| shakeout Axis A (deterministic) | 11 flows, 34 tags green, 0 defects |
| Axis C (electron_smoke, electron_menu, electron_deeplink) | 0 defects |
| lifecycle_gates | all passed |
| transcript_follow | 7/7 |
| resume_ended_session (source) | ok on kimi-k2.7-code:cloud, and on deterministic |
| tasks_gate | 5/5 |
| packaged_app_smoke (source) | ok; Structure populated; no backend left |
| `npm run build` | passes |

The packaged target needs a fresh bundle; it runs in U113.
