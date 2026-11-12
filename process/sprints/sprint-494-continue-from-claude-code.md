# Sprint 494 — The server continues a Claude Code session (vocabulary v0.69)

```yaml
---
id: 494
status: pending
phase: continuing a session (roadmap 2026-11-12-continue-a-session r1, E5)
pass_kind: functional
---
```

## scope

`POST /api/session` takes an optional `continue_from: {"tool": "claude_code", "path": <a Claude Code session file>}`. The server reads the file (JSONL), finds its last `system` entry of subtype `compact_boundary` and the `isCompactSummary` user entry after it, and turns the summary and every `user` and `assistant` entry after it into event dicts: the summary and each typed message as `UserMessage`, each assistant `text` block as `ModelReply`, each `tool_use` as `HarnessToolCall`, each `tool_result` as `HarnessToolResult`; `thinking` blocks and `attachment` entries are left out. It writes `{"turns", "provenance"}` to `continued_session.json` in the session's folder and creates the session with that path (kernel sprint 347). A file with no compaction is read from its start. `SESSION_CREATED` gains `continued_from` (`claude_code`, or `none`): `PAYLOAD_FIELD_PROPOSED` P-0.69-CONTINUED-FROM, app vocabulary 0.69. A bad `continue_from` is a 400 and no session is created: an unknown tool, a missing or unreadable file, a file with no messages. One verifiable property: a session created from a session file opens with a `continued_session` fragment holding that file's last summary and the messages after it.

## prerequisites

- Kernel sprints 345–348.

## context_files

- `server.py` (`POST /api/session`, around line 4430; `SESSION_CREATED`)
- `../substrate/src/substrate/topologies/session_registry.py` (`create`, `continued_session`)
- `process/planning/2026-11-12-continue-a-session/RESEARCH-2026-11-12-continue-a-session-r2.md` (the Claude Code file's form)
- `web/vm/signals/versions/current.json` (`SESSION_CREATED`), `web/vm/signals/proposals.json`

## signal contract

### Emits

- `SESSION_CREATED` with `continued_from`.
- `API_REFUSED`, area `session`, status 400, for a bad `continue_from`.

### Invariants

- A create without `continue_from` behaves as today, and its `SESSION_CREATED` reads `continued_from` `none`.

## artifact contract

### Files modified

- `server.py`; the vocabulary (0.69 and its rationale, the proposal, the link, the generated files)

### Files created

- `tests/test_continue_from_494.py`, with a hand-written Claude Code session file in its fixtures (two compactions, a summary, messages, tool calls, thinking and attachments), written from the form recorded in the research; no file from this machine.

### Command exit codes

- `npm run signals`, `npm run build`, `npm run test:unit`, `uv run --project ../substrate python -m pytest tests/test_continue_from_494.py` return 0.

## observation contract

### Driving steps

The test creates a session through the route with the fixture, runs one turn on the deterministic driver, and reads the record.

### Expected runtime signals

- `SESSION_CREATED` `continued_from` `claude_code`.
- The record's `PromptFragment` of source `continued_session`: the second summary and the messages after it, no thinking, no attachment text; the first `PromptComposed` holds it.

## done criteria

A Claude Code session can be continued in Substrate by naming its file when the session is created.

## notes

The production consumer of kernel sprint 347's manifest field. Readers for Codex, Cursor agent and Ollama are later work (research r2's table).

## self-review checklist

- [x] Scope is concrete and bounded.
- [x] context_files cover the route, the kernel field and the file's form.
- [x] Tag change by proposal and version bump.
- [x] Artifact contract is gradable; fixture hand-written.
- [x] Observation contract present.
- [x] Two hand-edited files (`server.py`, the proposal).
