# Sprint 131 — The console for Substrate's MCP tool calls

```yaml
---
id: 131
status: closed
closed_at: 2026-10-10
phase: 1
pass_kind: functional
roadmap: substrate/process/planning/ROADMAP-2026-10-10-harness-tool-calls-r2.md
asked: 2026-10-10 (Architect)
---
```

## scope

- A `ToolCall` with `origin = mcp` shows as `<tool> (mcp) <first arg>`. A `HarnessToolCall`, now the harness's own tools only, shows as `<tool> (harness) <first arg>`.
- Unit specs, full suites, build, install, Electron gates.

## checks

- In the installed app, claude, codex and cursor-agent each write one file with their own tool, recorded as `HarnessToolCall`, and one with Substrate's `write_file`, recorded as `ToolCall` and `ToolResult` with `origin = mcp`, in one model step per turn.

## result

- **Rows.** `session_controller.ts` labels a `ToolCall` whose `origin` is `mcp` as `(mcp)` and a `HarnessToolCall` as `(harness)`. `harness_tool_rows.spec.ts` covers both, plus an ordinary `ToolCall` with no label. Unit specs: 25 of 25.
- **Full suites.** Kernel: 1,424 passed, 8 skipped. UI: 237 passed, 5 skipped.
- **Gates.** Built and installed (`182ebe5`). The 11 Electron gates pass on `/Applications/Substrate.app`. The first chain run after the install failed at `electron_smoke` (1 bug, 0 signals). It passed 5 of 5 on the rerun and in the earlier verbose run, so it is intermittent on the first launch after an install. Not fixed; see kit diary 66.
- **The installed app.** One session per driver, each asked to write `own.txt` with its own tool and `mcp.txt` with Substrate's `write_file`. Both files hold `ok` in all three, each turn has one model step, and Substrate's call lands as its own kinds:
  - claude `s_7bc0a9bf…`: `HarnessToolCall Write`; `ToolCall write_file` (origin `mcp`, producer `model`); `ToolResult write_file` (origin `mcp`, producer `tool`).
  - codex `s_baf2001f…`: `HarnessToolCall file_change`; the same `ToolCall` and `ToolResult` pair.
  - cursor-agent `s_b6384af7…`: `HarnessToolCall edit`; the same pair.
