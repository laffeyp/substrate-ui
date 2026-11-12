# Roadmap — continuing an agent's session in Substrate (round 1)

*2026-11-12. From `RESEARCH-2026-11-12-continue-a-session-r2.md`. The Architect, 2026-11-12: a Claude Code session continues as a Substrate session, through Substrate's existing way of loading context at session open; the last compaction summary and the messages after it; built for Claude Code now. Existing Substrate behaviour does not change. Items are numbered in build order; one card each.*

## Why

So a person can carry a session from Claude Code into Substrate and keep working, with the conversation so far as the new session's opening context. The first use is this session itself, continued in Substrate Next.

## Scope

- **In:** a session-open prompt source, `continued_session`, carrying another tool's conversation as rendered turns; the session manifest naming it; the server reading a Claude Code session file into it at session create; a CLI prompt past the argument limit passed on standard input; this session continued in Substrate Next.
- **Later:** readers for Codex, Cursor agent and Ollama (their stores are in the research); choosing a session in the workspace picker.

## Items

**E1 — The kernel's lint skips `process/` (kernel sprint 345).** As substrate-ui's `ruff.toml` does since sprint 459. The kernel's pre-commit hook fails today on untracked scripts under `process/planning/`; kernel commits for E2–E4 need it to pass.

**E2 — The `continued_session` source (kernel sprint 346).** Session vocabulary v0.19, § AD: `PromptSource.CONTINUED_SESSION`, precedence 30. At session open the `session_prompt` producer renders the given turns with the history's own renderer and records one `PromptFragment`, provenance naming the tool, the file, the summary's line and the counts.

**E3 — A session names what it continues (kernel sprint 347).** The session manifest gains `continued_session`, the path of a JSON file of turns; `create` takes it; the session topology passes it to the source. The production consumer of E2.

**E4 — A long prompt goes on standard input (kernel sprint 348).** `CliResponder` passes a prompt past the argument limit on standard input; a shorter one as now.

**E5 — The server continues a Claude Code session (app sprint 494).** `POST /api/session` takes `continue_from: {tool: "claude_code", path}`; the server reads the file from its last compaction summary, writes the turns file into the session's folder, and creates the session with it. `SESSION_CREATED` gains `continued_from` (app vocabulary 0.69). The production consumer of E3.

**E6 — This session continues in Substrate Next (app sprint 495).** Substrate Next built and installed from the kernel and app of E1–E5; a session created through its server continuing this Claude Code session; its first turn answers from the conversation.

## Order

E1, E2, E3, E4, E5, E6. E2 names E3 as its consumer and E3 names E5 (the kernel's primitive-plus-consumer rule, `../substrate/process/WORKING_AGREEMENT.md`); all six cards are on disk before E2 starts.
