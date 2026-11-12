# Sprint 495 — This session continues in Substrate Next

```yaml
---
id: 495
status: pending
phase: continuing a session (roadmap 2026-11-12-continue-a-session r1, E6)
pass_kind: observation
---
```

## scope

Substrate Next built and installed from the kernel and app of sprints 345–348 and 494, by runbook round 9's "Build and install the test install". Then a session created through Substrate Next's server with `continue_from` naming this Claude Code session's file (`~/.claude/projects/-Users-peterlaffey-Documents-Claude-Projects-Agent-Orchestration/0b05989a-b078-455d-9197-c810508085fa.jsonl`), driver `claude`, workspace this repository; the session shown in a Substrate Next window, and one message sent there by the Architect. One verifiable property: the first reply answers from this conversation (it names the last sprint closed and the roadmap in work) without being told.

## prerequisites

- Sprint 494.

## context_files

- `RUNBOOK-2026-11-11-project-r9.md` (the test-install chapter)
- `process/sprints/sprint-494-continue-from-claude-code.md`

## signal contract

### Emits

- `SESSION_CREATED` `continued_from` `claude_code`, in Substrate Next's server trace.

## artifact contract

### Command exit codes

- The test-install chapter's steps, each its listed code.

## observation contract

### Driving steps

The session created through the route; opened in a Substrate Next window, which the Architect sees; the Architect's first message.

### Expected runtime signals

- The session's record: one `PromptFragment` of source `continued_session` with provenance naming the file and its last summary's line.

### Expected screenshot / visual state

- The Substrate Next window showing the session and its first reply.

## done criteria

The work continues in Substrate Next, and this terminal session can close.

## self-review checklist

- [x] Scope is concrete and bounded.
- [x] The session is opened in a window the Architect sees.
- [x] Observation contract present.
