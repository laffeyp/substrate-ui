---
sprint: 015
slug: agent-parameters
status: closed
pass_kind: web-frontend + backend seam
cadence: auto-within-phase
context_files:
  - web/app.js
  - web/index.html
  - server.py
  - tests/test_server.py
  - harness/e2e_console.js
---

# Sprint 015 — call parameters: visible in the dock head, settable in place

## Why

The token-cap fix (2026-07-30, board entry) proved the cost of invisible call parameters: a
top-assayed model looked broken because the seam ran a configuration nobody could see. Ruling:
the parameters a turn runs with — driver, thinking, token cap, timeout — are shown in the agent
terminal's head and settable by command, and the server echoes what it actually applied.

## Scope

`server.py` — `_agent` accepts `think`, `max_tokens` (0 = uncapped), `timeout`; applies them to the
Ollama responder (timeout also to the CLI responder); echoes the parsed values as `params` in the
response. A pure `_agent_params(q)` helper so parsing is unit-testable without Ollama.
`web/index.html` + `web/app.js` — a params strip in the dock head (`think off · tokens ∞ ·
timeout 300s`); commands `think on|off`, `tokens N` (0 = uncapped), `timeout N`, `params`; the chat
POST carries them.

## Dual contract

**Artifact:** `node --check web/app.js` exits 0; `tests/test_server.py` passes with a new
`_agent_params` test and a params-echo assertion on `/api/agent`.
**Signal:** none (the UI emits no signals; the parameters land on the seam's request).

## Observation contract (both tracks)

- **Structural (`e2e_console.js` §15b):** the params strip renders with defaults; `tokens 4096`
  updates it; the strip carries think/tokens/timeout.
- **Perceptual:** the existing §15b screenshot (`screenshots/agent-terminal.png`) now includes the
  head strip — captured and VIEWED.

## Close

Rubber Duck Pass; BLACKBOARD `## Built` + `## Sprint tail`; commit.
