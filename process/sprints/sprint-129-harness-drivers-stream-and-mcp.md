# Sprint 129 — Harness drivers: stream flags, the MCP endpoint, the transcript

```yaml
---
id: 129
status: open
phase: 1
pass_kind: functional
roadmap: substrate/process/planning/ROADMAP-2026-10-10-harness-tool-calls.md
asked: 2026-10-10 (Architect)
---
```

## why

The kernel can read a harness stream (K283) and serve Substrate's tools over MCP (K284); the daemon has to switch both on per driver and show the calls.

## scope

- Profiles gain `stream_flags`, `stream_format` and an MCP injection: claude `--mcp-config '{"mcpServers":{"substrate":{"type":"http","url":…}}}'`; codex `-c mcp_servers.substrate.url=…`; cursor-agent `.cursor/mcp.json` in the workspace with `--approve-mcps`.
- `POST /api/session/<id>/mcp` hands JSON-RPC to `handle_jsonrpc`.
- A harness driver with MCP runs in the `mcp` tool mode.
- The transcript shows each `HarnessToolCall`/`HarnessToolResult` as a tool card marked with its route.
- First, test whether cursor-agent `-p` passes MCP tools to its model (a forum report says no). If not, cursor-agent gets the stream only and keeps the text list.

## checks

- In the installed app, one session per driver: a file written with the driver's own tool and one with Substrate's `write_file`; both on the record and in the transcript.
