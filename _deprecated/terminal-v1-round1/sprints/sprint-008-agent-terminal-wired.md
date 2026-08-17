# Sprint 008 — agent terminal: wire /api/agent (single turn)

```yaml
---
id: 008
status: closed
phase: 2
pass_kind: functional
---
```

## scope

Wire the agent-terminal input to actually talk to a model. On Enter (with a model picked and non-empty input), POST `/api/agent?model=<...>&name=<...>&task=<...>` per the parent's endpoint shape at `web/app.js:281–319`, then poll `/api/records/<returned_name>` at 500 ms until a `FinalAnswer` event lands or `substrate.RunFinalised` fires. Each new agent event (`ToolCall`, `ToolResult`, `FinalAnswer`) is rendered to `#termbody` with the same `_agentLine()` shape the parent uses. STATE gains `runName`, `agentSeq`, `polling`. During a live turn, `#terminput` is `disabled` (visually says "…"); returns to enabled + focus after the turn finishes. Single turn only — multi-turn conversation state is Sprint 009.

## prerequisites

- Sprint 007 closed.

## context_files

- `../web/app.js` (parent — `_agentLine()` at 246, `streamAgentTurns()` at 254, `sendChatMessage()` at 281, the `/api/agent` query shape, and the followLive polling pattern)
- `web/app.js`, `web/index.html`
- `WORKING_AGREEMENT.md § The six discipline items`
- `harness/e2e_terminal_v1.js`, `harness/capture_terminal_v1.js`

## artifact contract

### Files modified

- `substrate-ui/terminal-v1/web/app.js` (add `sendChat(text)` that POSTs `/api/agent`, `pollRun(name)` that fetches the record on interval and calls `_agentLine()` on new events; extend the Enter handler to call `sendChat()` when `STATE.term.model` is set instead of local-echo; add `_agentLine()` copied from parent lines 246–252)
- `substrate-ui/terminal-v1/harness/e2e_terminal_v1.js` (extended)
- `substrate-ui/terminal-v1/harness/capture_terminal_v1.js` (extended: capture the terminal after a real deterministic agent turn)

### Content assertions

- `web/app.js` contains `async function sendChat(text)` that calls `fetch("/api/agent?...", { method: "POST" })`.
- `web/app.js` contains a polling function that reads `/api/records/<name>` and filters for `ToolCall | ToolResult | FinalAnswer`.
- The Enter handler branches: `STATE.term.model === null` → previous local-echo path (won't fire since input is disabled); `STATE.term.model` set → `sendChat()`.
- `STATE.term.runName` is set to the returned record name after a successful POST.
- Terminput is `disabled` during a live turn (`STATE.term.polling === true`) and re-enabled after `FinalAnswer` or `substrate.RunFinalised`.

### Command exit codes

- `npm run e2e:terminal-v1` returns 0. The harness picks the `deterministic` model (which runs the calculator agent — pure, no network, deterministic result).
- `npm run capture:terminal-v1` returns 0. New fixture: `07-terminal-after-agent-turn.png`.
- Parent `npm run e2e` still returns 0.

## observation contract

### The six discipline items

1. **Diary (#34).** KIT_DIARY gets a Sprint 008 entry.
2. **Three lenses (A1).** Structural: harness picks deterministic, types "compute (2+3)*4", waits on FinalAnswer landing in termbody, asserts the string "20" appears. Perceptual: capture the terminal after the turn completes; the termbody shows multiple `.term-line` rows with `tl-accent` (ToolCall) and `tl-out` (ToolResult) classes. Adversarial: paragraph at close.
3. **Pixel anchor + asymmetric fixture (A2 + A3).** The termbody's non-empty state (multiple lines with distinct color classes) is A3-asymmetric — a bug that rendered every line the same color, or dropped every line but one, would fail the "count green pixels" and "count grey pixels" checks the capture will run.
4. **Canonical home (rule 7).** Register `sendChat`, `pollRun`, `_agentLine`, `STATE.term.runName`, `STATE.term.agentSeq`, `STATE.term.polling`.
5. **N+V+P (B3).** Assertions carry all three: NAME = elements exist; VALUE = exact final answer text "20" present; PATH = `STATE.term.runName` is set to a string starting with `launch_agent_calc_`, `STATE.term.polling` is true during the turn then false after FinalAnswer.
6. **Fixtures (#38).** New fixture 07 committed.

### UI driving steps

- Boot, clear localStorage, reload, wait picker populated.
- Select `deterministic` model.
- Type `compute (2+3)*4` + Enter.
- Wait on `page.evaluate(() => window.__TERMINAL_V1_STATE?.term?.polling === false && window.__TERMINAL_V1_STATE?.term?.runName)` — a real terminal condition (post-polling), not a sleep.
- Assert `#termbody.textContent` contains `20` (the calculator's final answer).
- Assert `STATE.term.runName` starts with `launch_agent_calc_`.
- Assert terminput is re-enabled.
- Capture 07.

### Expected screenshot / visual state

- Termbody shows a user echo line + several ToolCall/ToolResult lines + a green `✓ 20` line.

## done criteria

Typing a task into the terminal with the deterministic model picked runs a real agent, streams the tool-loop turns into the terminal, and lands the final answer. All six discipline items honored.
