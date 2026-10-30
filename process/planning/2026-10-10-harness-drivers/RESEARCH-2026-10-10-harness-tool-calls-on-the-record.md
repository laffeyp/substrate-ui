# RESEARCH: getting a harness driver's tool calls onto Substrate's record

*2026-10-10.*

**Question.** Since `a6374e1` the three harness drivers (claude, codex, cursor-agent) run with their own tools and full permission. They write files, run commands and open apps inside their own process. Substrate sees only the final text, so the record has the prompt and the reply and nothing between (Codex session `s_4702dc9978f24b4081c74c20`: a test file written, `unittest` run and Chrome opened, no event for any of it). Two ways to close the gap were researched for all three: **case 1**, record the harness's own tool calls from its event stream; **case 2**, switch its own tools off and give it Substrate's tools as registered tools.

**Evidence.** One real run per CLI, with the flags Substrate uses since `a6374e1`, on "Create a file named a.txt containing ok, then run the shell command: ls". The streams are in `evidence-2026-10-10-harness-streams/` beside this note. All three wrote `a.txt`.

## Case 1: each harness streams every tool call

| CLI | Flag | Tool call in the stream | Result in the stream |
|---|---|---|---|
| Claude Code 2.1.296 | `--output-format stream-json --verbose` | `assistant` message, content `tool_use` {id, name `Bash`, input {command}} | `user` message, content `tool_result` {tool_use_id, content, is_error}, plus `tool_use_result` {stdout, stderr} |
| Codex 0.157.0 | `exec --json` | `item.started` {id, type `command_execution`, command} | `item.completed` {aggregated_output, exit_code, status}; file edits arrive as `file_change` {changes: [{path, kind}]}; other documented types: `mcp_tool_call`, `web_search`, `todo_list`, `reasoning` |
| cursor-agent 2026.09.23 | `--output-format stream-json` | `tool_call` subtype `started`, {call_id, `editToolCall` or `shellToolCall` {args}} | `tool_call` subtype `completed` with `result` |

Every call carries a name, its arguments, its result and an id that pairs start with end. Each stream also ends with the final text (`result` for Claude and cursor-agent, the last `agent_message` for Codex), which is what Substrate reads today. Claude's stream also carries a dollar estimate and a rate-limit event. Claude Code computes the estimate "locally from token counts at list price", and for Pro and Max plans its docs say the figure "isn't relevant for billing purposes" ([costs](https://code.claude.com/docs/en/costs.md)). Neither describes the session's work, and the recorder reads neither; both were removed from the saved evidence.

**What case 1 needs in Substrate.** `CliResponder` reads stdout as one string at exit. It would read the stream line by line, write each tool call and result as record events in the session (kinds in the session vocabulary, distinct from Substrate's own `ToolCall` because Substrate did not run them), and take the final text as today's reply. The parsing differs per CLI, so each driver profile names its stream format.

## Case 2: switch the harness's tools off, give it Substrate's

| CLI | Switch its own tools off | Take Substrate's tools as registered tools (MCP) |
|---|---|---|
| Claude Code | Yes: `--tools ""` (verified; U120 used it). | Yes: `--mcp-config <file>` with `--strict-mcp-config` loads only the named servers. |
| Codex | Not fully. With `--disable shell_tool --disable unified_exec` it still wrote `a.txt` through `file_change`, and listed `functions.exec`, `collaboration.spawn_agent` and others as callable (`codex-tools-off.jsonl`). | Yes: `codex mcp` manages servers; `mcp_tool_call` is a stream item type. |
| cursor-agent | No switch found in `cursor-agent --help`. | Configured in `.cursor/mcp.json`; `--approve-mcps` approves them headless. A forum report says `-p` mode does not hand MCP tools to the model ([forum](https://forum.cursor.com/t/cursor-agent-p-mode-does-not-inject-mcp-server-tools-into-agent-context/155275)); not tested here. |

**What case 2 needs in Substrate.** Substrate has no MCP server; `adapters/__init__.py` names "an MCP tool bridge" only as a future adapter. Case 2 needs one that exposes the session's tools and runs each call through the session, so it lands on the record as Substrate's own `ToolCall`.

## Findings

1. **Case 1 works for all three today.** Every harness reports every tool call in a stream Substrate can read. Nothing on the harness side needs changing.
2. **Case 2 alone cannot close the gap.** Only Claude's own tools can be switched off. Codex keeps file edits and more with its shell disabled, and cursor-agent has no switch. Whatever stays on still acts off the record.
3. **MCP fits as an addition, not a replacement.** An MCP server would let a harness call Substrate's tools as real tools, ending the confusion a Codex session showed ("supplied as text … does not make them callable"), with each call recorded as Substrate's own. The harness's own tools stay on, as the Architect directed, and case 1 records them.

## Direction (Architect, 2026-10-10)

- **Both, together.** Substrate serves an MCP server of its tools, and records each harness's own tool calls from its stream.
- **The MCP server is for harness drivers only:** models that run their own agent loop and work through MCP (claude, codex, cursor-agent). Ollama models keep Substrate's native tool calls (`OllamaResponder.achat_tools`), which already put every call on the record.
- **Harness tools stay on.** A mode that switches a harness's own tools off is later work; that not every harness can switch all of them off today is acceptable.

Sources: the streams in `evidence-2026-10-10-harness-streams/`; [Codex exec JSON events](https://littlebearapps.com/help/untether/exec-json-cheatsheet) and the item types in Codex's `exec_events.rs` ([source mirror](https://forge.lthn.ai/core/core-agent-ide/blame/commit/d363a0968e17a0f794b5cd9dd021c46738201f21/codex-rs/exec/src/exec_events.rs)); [Cursor CLI MCP](https://cursor.com/docs/cli/mcp); `claude --help`, `codex --help`, `codex features list`, `cursor-agent --help` on this machine.
