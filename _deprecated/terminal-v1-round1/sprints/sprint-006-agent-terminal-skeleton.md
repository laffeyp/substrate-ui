# Sprint 006 — agent terminal (skeleton with input echo)

```yaml
---
id: 006
status: closed
phase: 2
pass_kind: functional
---
```

## scope

Extract the terminal DOM from parent `substrate-ui/web/index.html` (the `.term-body`, `.term-prompt`, `.term-input`, `.term-input-row` structure at lines 175–181) into the Agent Terminal pane in terminal-v1. Port `renderTerm()` + `termPush()` + the input Enter handler from parent `app.js` (lines 776–800, 970–995) into terminal-v1's `app.js`, stripped of the dock toggle (no `Ctrl+\`` needed — the tab IS the terminal). Typing text into `#terminput` and pressing Enter appends `substrate$ <text>` to `#termbody`; the body preserves state across tab switches. No `/api/agent` yet, no model picker, no params strip, no streaming — those come in sprints 007–011.

## prerequisites

- Sprint 005 closed.

## context_files

- `../web/index.html` (parent — the `.term-*` HTML at lines 258–275 and CSS at lines 161–181)
- `../web/app.js` (parent — `renderTerm()`, `termPush()`, input handler; STATE.term shape at line 40)
- `web/index.html`, `web/app.js` (extend)
- `harness/e2e_terminal_v1.js` (extend: type into input, assert echo, switch tab and back, assert state preserved)
- `harness/capture_terminal_v1.js` (extend: shot the terminal pane after input)

## artifact contract

### Files modified

- `substrate-ui/terminal-v1/web/index.html` (Agent Terminal pane holds the terminal DOM; add `.term-*` CSS matching parent visuals)
- `substrate-ui/terminal-v1/web/app.js` (extend with STATE.term slice + renderTerm + termPush + input handler)
- `substrate-ui/terminal-v1/harness/e2e_terminal_v1.js`
- `substrate-ui/terminal-v1/harness/capture_terminal_v1.js`

### Content assertions

- Agent Terminal pane contains `#termbody`, `#termprompt`, `#terminput`.
- `#termprompt` reads `substrate$`.
- Typing `hello` + Enter appends a line to `#termbody` containing `substrate$ hello`.
- After switching to another tab and back, `#termbody` still contains that line.

### Command exit codes

- `npm run e2e:terminal-v1` returns 0.
- `npm run capture:terminal-v1` returns 0 (adds `03-terminal-after-input.png`).
- Parent `npm run e2e` still returns 0.

## observation contract

### UI driving steps

- Boot; Agent Terminal is initial active tab.
- `page.waitForSelector('#terminput')`.
- `page.focus('#terminput')`; `page.type('#terminput', 'hello')`; `page.press('#terminput', 'Enter')`.
- `page.waitForFunction(() => document.querySelector('#termbody')?.textContent?.includes('hello'))`.
- `page.click('[data-testid="tab-records"]')`; `page.click('[data-testid="tab-agent-terminal"]')`.
- Assert `#termbody` still contains `hello`.

### Expected screenshot / visual state

- Terminal pane with green `substrate$` prompt on top-left of input row; one echoed line above.

## done criteria

The Agent Terminal pane is a working local terminal with prompt + input + body + echo, state preserved across tab switches.
