---
id: 106
status: closed
class: B (Meszaros, Fresh Fixture) and G (Fowler, "Fix Broken Builds Immediately"), plus hermeticity and explicit dependencies.
---

# Sprint 106 — the checks no gate ran

## why

2026-10-03, the Architect asked about checks that exist but run in no gate. An audit on 2026-10-07 read, traced and ran each one. Nothing traced to a product bug; the failures were stale assumptions, an unpinned tool, an expired token, and tests that reach outside their own repo.

## sources (read 2026-10-07)

- **Hermeticity.** Winters, Manshreck and Wright, *Software Engineering at Google*, ch. 14: "the SUT's isolation from usages and interactions from other components than the test in question"; "An SUT with high hermeticity will have the least exposure to sources of concurrency and infrastructure flakiness."
- **Skipping on a missing dependency.** pytest docs, "How to use skip and xfail": "You can skip tests on a missing import by using pytest.importorskip at module level." Skips cover "tests that depend on an external resource which is not available at the moment".
- **Explicit dependencies.** Twelve-Factor II: an app "declares all dependencies, completely and exactly". A CI step that calls `uvx ruff` with no version takes whatever release exists that day.
- **Broken builds.** Fowler, "Continuous Integration": fix broken builds immediately. Both repos' CI had been red for weeks.
- **Retirement.** No outside source covers retiring tests. A test is retired, not deleted, when the audit shows its purpose done and its coverage held elsewhere (the project's rule: retired files move to `_deprecated/`).

## scope

| check | verdict | action |
|---|---|---|
| `test_container_solve_and_grade_arm_e2e.py` | broken: crashes collection without `docker` | its image check catches a missing `docker` like its daemon check does |
| 21 kernel CLI tests importing `substrate-ui/server.py` | not hermetic: need the app's repo | skip, with the reason, when the sibling `server.py` is absent |
| 2 confirmatory-runner tests | need `datasets`, not a dev dependency | `pytest.importorskip("datasets")` |
| server crash on a long `SUBSTRATE_HOME` | real defect (`AF_UNIX path too long`) | skip the Unix socket with a warning when the path exceeds the platform limit; TCP still serves |
| Axis C (`electron_smoke`, `electron_menu`, `electron_deeplink`) | needs update: waits for a mount before a session exists; uses the real `~/.substrate` | open the session first; isolated `SUBSTRATE_HOME`; run against the bundle via `SHAKEOUT_APP` |
| Axis B | current, incomplete | flows for `bash_output`, `bash_stop` and `bash_tasks` |
| `smoke:vm`, Axis B, Axis C, `resume_ended_session` | current, ungated | run in `release.sh` |
| UI CI | needs update | pin ruff to the project's version; replace the four deleted `e2e` scripts with the checks that exist (`npm run build`, `test:unit`, vocabulary parity, the full UI pytest) |
| UI CI checkout of the kernel | `Bad credentials` | the repo secret holding the kernel-checkout token must be renewed (Architect: an account credential) |
| `mount_seam_check.ts`, `_electron_spike.ts`, `_electron_sprint078..081_exit.ts`, `_run_caret_pin.ts`, `pixel_baseline*.ts`, `pixel_diff.ts` | out of date; purpose done; coverage held by Axis A `pane_split_transcript`, the lifecycle gates, Axis C and `caret_pin` | move to `harness/_deprecated/`; drop the `pixel:*` npm scripts |
| `test_delegate_schema_six_fields` | fixed locally in sprint 097, unpushed | none until a push |

## result (2026-10-07)

- **Broken, fixed.**
  - The Docker e2e test now skips without `docker` instead of crashing collection.
  - The 21 kernel CLI tests load substrate-ui through `tests/_ui_daemon.py`, which skips with the reason when the checkout is absent.
  - Three tests importing a `datasets`-loading script use `pytest.importorskip`; the third surfaced only in an isolated dev-extras environment.
  - The daemon serves TCP when the socket path is too long. `test_server_long_state_path_106` fails on the old code, which never reports a port.
- **Updated.**
  - Axis C launches with its own `SUBSTRATE_HOME`, waits for the app instead of a mount, and runs against the bundle via `SHAKEOUT_APP`: 3/3 in source mode, 3/3 against the installed app.
  - Axis B gained `tool_bash_output`, `tool_bash_stop` and `tool_bash_tasks`: 2/2 each.
  - UI CI rewritten:
    - ruff pinned to 0.15.17 over the whole repo;
    - the full UI pytest on Python 3.14;
    - a `web` job running generated kinds, the build, the client specs and vocabulary parity, replacing the four deleted `e2e` scripts.

    Every step passes locally.
- **Gated.** `release.sh` runs the VM smoke (stage 2), Axes A, B and C, and `resume_ended_session` (stage 6).
- **Retired.** 11 entries moved to `harness/_deprecated/` with a README naming what covers each; the `pixel:*` scripts dropped.
- **Checked under other Pythons.** The kernel fast tier in an isolated Python 3.12 environment with dev extras only (as CI builds it): 1,220 passed, 1 failed (the third `datasets` test above), then clean after the fix.

Tiers: kernel 1,224 passed, 3 skipped (3.14); UI 221; client specs 23/23; lint, format, types clean.

## open (Architect)

- ~~`CROSS_REPO_TOKEN` expired~~ Closed 2026-10-07: laffeyp/substrate is public, so the checkout needs no token; the workflow no longer reads the secret. GitHub Actions is free for public repositories on standard runners (docs.github.com, "GitHub Actions billing").
- ~~Nothing pushed since 2026-09-30~~ Pushed 2026-10-07 on the Architect's word.

## found at release

The install step asked the running app to quit, waited 60 s, and copied the new bundle in whether or not it had quit. This time the app could not quit: during the long-path test I had run `pkill -f "server.py --port 0"`, which also matched the installed app's own backend. The app then showed its backend-stopped dialog (sprint 102), and that modal refused AppleScript's quit ("User canceled", -128). The old build stayed running over the new bundle. It was stopped by pid and the new build opened.
- `release.sh` now stops with an error when the app has not quit, instead of installing under it.
- The broad `pkill` was the agent's mistake; processes on this machine are stopped by pid only.

