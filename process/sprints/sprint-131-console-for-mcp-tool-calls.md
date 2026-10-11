# Sprint 131 — The console for Substrate's MCP tool calls

```yaml
---
id: 131
status: open
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
