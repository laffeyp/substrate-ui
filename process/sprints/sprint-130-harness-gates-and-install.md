# Sprint 130 — Harness tool calls: gates, suites, install

```yaml
---
id: 130
status: closed
closed_at: 2026-10-10
phase: 1
pass_kind: functional
roadmap: substrate/process/planning/ROADMAP-2026-10-10-harness-tool-calls.md
asked: 2026-10-10 (Architect)
---
```

## scope

- Opt-in live tests (`SUBSTRATE_LIVE_DRIVER_TESTS=1`) per driver for both routes.
- Full kernel and UI suites once.
- Build, install, all Electron gates on `/Applications/Substrate.app`.

## checks

- The live tests pass for every driver that takes each route; the suites and gates pass.

## result

- **Live tests (opt-in).**
  - Kernel `test_harness_stream_283.py`: claude, codex and cursor-agent each wrote `a.txt`, read from the stream, 3 of 3.
  - UI `test_driver_profile_120.py`: each driver wrote `probe.txt`, codex answered in a plain folder, and `/context` through the profile showed only built-in tools and skills, 5 of 5.
- **Full suites, once.** Kernel: 1,423 passed, 8 skipped, all opt-in tiers with named reasons. UI: 237 passed, 5 skipped (the live driver tests).
- **Build and install.** `npm run dist`, installed in `/Applications`; the previous build is in the scratchpad.
- **Electron gates on the installed app, 11 of 11.** The first run stopped at `electron_smoke` with 0 signals. Since U124, the bind helper's second ↵ lands on the folded `cli agents` group and opens it, so no session opened. Earlier runs against the repo build had passed only because the roster had not loaded, and the fallback list held only `deterministic`. The fix:
  - `bindPaneAsUser(win, model?)` opens the model groups and clicks a model: the given one, or the roster default.
  - `electron_smoke` sets `deterministic` after binding, as `transcript_follow` does, so it stays offline.
- **The installed app, one real session per driver**, each asked to write `own.txt` with its own tool and `mcp.txt` with Substrate's `write_file`. Both files hold `ok` in all three, and each MCP call is recorded once.
  - claude `s_cf44a3f9…`: `Write` (harness), `write_file` (mcp).
  - codex `s_bcf394c7…`: `command_execution` (harness), `write_file` (mcp).
  - cursor-agent `s_d660206a…`: `edit` (harness), `write_file` (mcp).
