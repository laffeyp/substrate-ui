# Sprint 129 — Harness drivers: stream flags, the MCP endpoint, the transcript

```yaml
---
id: 129
status: closed
closed_at: 2026-10-10
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

## found before the card was built (2026-10-10)

- **cursor-agent headless MCP works.** The forum report is out of date. With `--approve-mcps`, `cursor-agent -p` ran `initialize`, `tools/list` and `tools/call` against a probe server, and the probe's tool wrote its file.
- **cursor-agent reads MCP only from the workspace.** It reads `.cursor/mcp.json` in the workspace (or the global `~/.cursor/mcp.json`). A config one folder up was not read: the probe server saw no request, and cursor said "The probe server isn't in the catalog".

## result

- **Profiles.**
  - claude: `stream_format = claude-stream-json`, `--output-format stream-json --verbose`, and `mcp_style = claude-mcp-config` (`--mcp-config '{"mcpServers":{"substrate":{"type":"http","url":…}}}'`).
  - codex: `codex-json`, `--json`, and `codex-config` (`-c mcp_servers.substrate.url="…"`).
  - cursor-agent: `cursor-stream-json`, `--output-format stream-json`, and `cursor-workspace-file`. In a per-session sandbox, `_write_mcp_config` writes `.cursor/mcp.json` and the command gains `--approve-mcps`. In a folder the operator picked it gets the stream only, and nothing is written there.
- **The daemon.**
  - `App.mcp_base` is set when the TCP server binds.
  - `_daemon_driver_resolver(session_id=)` adds the session's MCP flags; a responder carrying them is cached per session.
  - The session build passes `mcp=True` when the flags apply.
  - `POST /api/session/<id>/mcp` hands JSON-RPC to the kernel's `handle_jsonrpc`, and a notification gets 202.
- **Transcript.** `HarnessToolCall` and `HarnessToolResult` build tool-card rows. The row text names the route (`Write (harness) own.txt`, `write_file (mcp) mcp.txt`), and `toolRoute` is on the row. `isToolCallRow` and `isToolResultRow` replace six `kind === ToolCall/ToolResult` checks.
- **Live, scratch daemon, real CLIs.** One session per driver was asked to write `own.txt` with its own tool and `mcp.txt` with Substrate's `write_file`:
  - claude `s_93743f…` and codex `s_544e5c…` wrote both files. Each call was recorded once: its own tool `via=harness`, `write_file` `via=mcp`. The first runs had recorded each MCP call twice, since the stream reports the call too; the kernel now skips the stream's copy (`calls_substrate_mcp`, `9f7e270e`).
  - cursor-agent `s_7a0333…` wrote both files.
  - An earlier cursor run wrote both files to a wrong folder: cursor's model turned a `/` into a `-` in a long absolute path. With relative paths they landed in the workspace.
- **Tests.**
  - `tests/test_harness_drivers_129.py` (6): profiles, the streaming responder, MCP flags per driver, cursor MCP only in a sandbox, the endpoint (404, initialize, 202, refused call), the bound address.
  - `web/reveal/__tests__/harness_tool_rows.spec.ts` (2).
  - The `/context` live test now reads Claude's reply through the responder.
  - The fake `claude` in tests 114 and 115 prints a stream's `result` line, and three resolver stand-ins take `session_id`.
  - Every UI test naming the resolver, the profiles or slash commands: 83 passed. Live, opt-in: 5 of 5. Unit specs: 25 of 25.
- **Installed-app check.** Moved to U130, after the build.
