# Research — continuing an agent's session in Substrate (round 2)

*2026-11-12. Supersedes `superseded/RESEARCH-2026-11-12-continue-a-session.md`; round 2 settles what round 1 left open (the Architect, 2026-11-12: "Anything that's still open probably shouldn't still be open"). Asked for by the Architect, 2026-11-12: a session started in Claude Code, or another tool Substrate drives, continues as a Substrate session; built first for Claude Code, researched for every model type Substrate supports. No roadmap or sprint cards yet. Existing Substrate behaviour does not change; the feature adds to it.*

## Decided

- **How the conversation enters: as opening context.** A new source for the session's opening prompt text, the way a delegate receives its parent's conversation (`parent_context`). The Architect, 2026-11-12: "substrate has a way to get context in let's just do that."
- **What enters: the last compaction summary and every message after it.** "Eventually we'll have more options, but we bring just the last compacted summary plus the messages after."
- **Scope of the research: every model type Substrate supports** (the CLI agents and Ollama), though only Claude Code is built now.
- **The window's part waits.** Choosing a session from the workspace picker is later work; until then a session is continued by naming it when the session is created.

## Options considered

1. **Resume the tool's own session (`claude -p --resume <id>`) under a new Substrate session.** Not taken. Substrate builds every prompt from its own record (`compose_model_prompt`, `../substrate/src/substrate/topologies/session/transcript.py` line 520), so from the second turn the resumed tool would read each Substrate turn twice: once in its own session, once in the prompt.
2. **Rewrite the conversation as Substrate history** (`UserMessage`, `ModelReply`, `HarnessToolCall`, `HarnessToolResult`) in the new session's record. Not taken now: nothing writes turn events into a record before its first turn; every such event today comes from a real turn.
3. **Opening context.** Taken. The path exists end to end: at session open the `session_prompt` producer reads each source the session names and records it as a `PromptFragment`; every prompt carries those fragments (`head_block`, `transcript.py` line 475). Precedents: `parent_context` (a slice of another record, capped at 64 KiB) and `memory` (a memory index), both in `../substrate/src/substrate/topologies/session/session_prompt_producer.py`.

## Substrate's side

- Sources and their order: `session_prompt_sources` (`session_prompt_producer.py` line 285). A new source needs a `PromptSource` member (session vocabulary, `../substrate/src/substrate/topologies/session/vocabulary.py` line 271), a precedence, and a session-create parameter naming what to load.
- The history the session keeps is sized to the driver's window less the opening text: budget = driver context x 0.6 - head tokens (`plan_window`, `transcript.py` line 384; `driver_headroom_frac` 0.6, `session/__init__.py` line 1015). For `claude-opus-5-5` the window is 1,000,000 tokens (`context_windows.py`).
- The CLI drivers hand the prompt over as a command-line argument (`CliResponder`, `../substrate/src/substrate/adapters/models.py` line 589). macOS refuses one past about 1 MB (`getconf ARG_MAX` 1,048,576; a 0.9 MB argument starts, a 1.1 MB one fails with errno 7). A large opening text goes through standard input instead (`claude -p` reads its prompt from stdin).
- Fragments reach every driver: CLI agents through their prompt (or `--system-prompt` for the system part), Ollama through its messages.

## The sources, per tool

| Tool | Where its sessions are | Form | Compaction marked |
|---|---|---|---|
| Claude Code | `~/.claude/projects/<folder>/<session id>.jsonl` | JSONL; `user` and `assistant` entries carry text, `thinking`, `tool_use`, `tool_result`; `attachment` entries carry the loaded `CLAUDE.md` (`instructions`), memory (`nested_memory`) and output style | Yes: a `system` entry, subtype `compact_boundary`, then a `user` entry with `isCompactSummary` |
| Codex | `~/.codex/sessions/<yyyy>/<mm>/<dd>/rollout-*.jsonl` (402 files here); also `~/.codex/thread_history_1.sqlite` | JSONL; `response_item` entries (`message`, `reasoning`), `event_msg`, `session_meta`, `turn_context` | Not seen: 0 of 402 files hold a `compacted` entry |
| Cursor agent | `~/.cursor/chats/<project hash>/<chat id>/store.db` and `meta.json` | SQLite, tables `blobs` (id, data) and `meta` (key, value) | Unknown |
| Ollama (desktop app) | `~/Library/Application Support/Ollama/db.sqlite` | SQLite, tables `chats`, `messages`, `tool_calls`, `attachments` (empty on this machine) | Unknown |
| Ollama through Substrate | Substrate's own records | Substrate events | Substrate's `TranscriptCompacted` |

This session as a worked case: `~/.claude/projects/-Users-peterlaffey-Documents-Claude-Projects-Agent-Orchestration/0b05989a-b078-455d-9197-c810508085fa.jsonl`, 146 MB, seven compactions; the last `compact_boundary` at line 26137, its summary at line 26141 (21,296 characters); after it, 547 assistant and 304 user entries, about 2.0 million characters of message content, most of it tool output.

## Settled

- **What of the conversation enters.** Every message after the last compaction summary, as Substrate's own history renders a conversation (`_render_turns`, `transcript.py`): the person's messages, the replies' text, each tool call and its result. `thinking` blocks stay out, as Substrate's history leaves them out.
- **Size.** No cap of the source's own. The opening text already counts against the history budget (`plan_window`), and an opening text past the driver's headroom already raises `SessionWarning(kind=seed_alone_exceeds)`.
- **Attachments.** The loaded `CLAUDE.md`, memory and output style are `attachment` entries, not messages, so they stay out. The `claude` driver's isolation flags are unchanged.
- **Other tools.** Codex, Cursor agent and Ollama are not built now; the table above is where that work starts.
- **Name.** `PromptSource.CONTINUED_SESSION`, `"continued_session"`, precedence 30 (with `parent_context`); provenance names the tool, the file, the summary's line and the message count. Session vocabulary v0.19 (`../substrate/process/signals/session-vocabulary.md`, at v0.18).
- **The prompt's size on the command line.** A CLI driver's prompt past the argument limit goes to the CLI on standard input; a prompt under it goes as now, so no session that works today changes.
