# Sprint 507 — The editor features' close

```yaml
---
id: 507
status: active
phase: editor features (roadmap 2026-11-14 r5, E13)
pass_kind: observation
---
```

## scope

Runs after cards 509–512 (roadmap r5).

The editor read again against the research's list and the frames: what is still missing goes to a new research round or the backlog. The full suites once, then the roadmap's work rolled up to Substrate Next by runbook r10 5A: steps 1–16 from here, steps 17–20 from a terminal or from Substrate, since step 17 quits Substrate Next.

## progress

**The read.** The research list's six items each have a closed card: links, rendered Markdown and the tab menu (503), splits (504), tool output (505), summary lines (506). Cards 509–512 cover what card 505 left out. The backlog line that still listed code colours in replies was corrected in place. Of `App.tsx`'s 19 `setState` updaters, only the split's acted, and sprint 503 fixed it. Streaming (reply text on every driver, Claude Code's `Bash` output) went to the backlog on 2026-11-15.

**The full suites, first run** (`runs/packaged/sprint-507-20261115-175646/`, from a Substrate Next session's shell):
- 77 kernel tests failed. The shell inherited Substrate Next's `SUBSTRATE_PYTHONHOME`, and `own_interpreter_env` handed it to `uv`'s Python. Cleared, the four files pass 99 tests. The cause is open on the BLACKBOARD, with the `SUBSTRATE_HOME` leak.
- The chained gates stopped at `session_prompt_once_across_restart` on S8. A reattached window counted turns from 0, and the replay of an old turn 0 acknowledged a new turn sent before the replay landed. Fixed (`6945ef8`): `GET /api/session/<id>` gives `next_turn_index`, `attachExisting` counts from it, and each `UserMessage` on the record moves the count. Gate `turn_ack_after_attach` sends in the attach's tick: the old code fails all five rounds, the fix passes them; it is in the chained suite.

**Second run** (`run2/`, launch variables cleared): build, 254 unit specs, 437 server tests and all 139 chained gates pass. Kernel: 1,724 passed and 1 failed: `test_realmodel_background_bash_103`, whose cloud model skipped `bash_stop` twice in seven runs (BLACKBOARD).

**The roll-up, steps 1–16** (`runs/packaged/sprint-507-next-20261115-184647/`): all 0. Bundle `Substrate Next.app` 1794797759, kernel releasable, app `ced7a35`. Its "+dirty" is one uncommitted line in `process/BACKLOG.md`, committed after as `5d5b03b`; no file in the bundle differs. Steps 17–20 run from a launchd job (`steps17-20.sh`), outside this session, which step 17 ends; the job reopens session `s_52bd6e73d1224d5cb6d04830` by its link. The card closes on the job's log.
