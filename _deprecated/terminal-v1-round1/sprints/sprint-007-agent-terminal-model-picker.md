# Sprint 007 — agent terminal: model picker

```yaml
---
id: 007
status: closed
phase: 2
pass_kind: functional
---
```

## scope

Add the model picker to the Agent Terminal tab. A small strip above the termbody holds a `<select id="modelpicker">` populated on load from `GET /api/models` (the parent's existing endpoint returning available Ollama tags + CLI presets). Per the Architect ruling, the picker shows on every launch — no default model, no calculator fallback. The user picks one; the selection stores in `STATE.term.model` AND `localStorage['terminal-v1.lastModel']`. On next launch the picker still shows, with the last-selected model pre-highlighted (`<option selected>`). The `#terminput` is `disabled` until a model is selected; the placeholder reads `pick a model above`. Typing echoes the picked model in the prompt (`<model> ›`, per parent's convention at `web/app.js:781`). No `/api/agent` call yet — that lands Sprint 008.

## prerequisites

- Sprint 006 closed.

## context_files

- `../web/app.js` (parent — `loadModels()` at line 320, `.term-model` styling, `STATE.term.model` shape, `#termprompt` update at line 781)
- `../web/index.html` (parent — `.term-head` + `.term-model` CSS + HTML at lines 165–174, 260)
- `web/index.html`, `web/app.js`
- `WORKING_AGREEMENT.md § The six discipline items` (this card honors all six)
- `harness/e2e_terminal_v1.js`, `harness/capture_terminal_v1.js`

## artifact contract

### Files modified

- `substrate-ui/terminal-v1/web/index.html` (Agent Terminal pane gains `<div class="term-head">` with `<select id="modelpicker">`; `.term-head` + `.term-model` CSS block adapted from parent to terminal-v1 palette; `#terminput` gains `disabled` initial state + placeholder)
- `substrate-ui/terminal-v1/web/app.js` (`loadModels()` async, populates picker; picker `change` handler updates `STATE.term.model`, writes localStorage, updates prompt text, enables input; on init read localStorage last-model and pre-select if present)
- `substrate-ui/terminal-v1/harness/e2e_terminal_v1.js` (extended assertions)
- `substrate-ui/terminal-v1/harness/capture_terminal_v1.js` (extended captures)

### Content assertions

- `web/index.html` contains `<select id="modelpicker" data-testid="modelpicker">`.
- `web/app.js` contains a `loadModels()` async function that fetches `/api/models` and populates the picker.
- `web/app.js` writes `localStorage['terminal-v1.lastModel']` on picker change.
- `web/app.js` reads `localStorage['terminal-v1.lastModel']` on init and applies it as the pre-selected option if the value is in the fetched list.
- `#terminput` has `disabled` on load; loses `disabled` after a model is picked.
- `#termprompt` reads `substrate$` when no model picked; reads `<model> ›` (with a `›` glyph per parent convention) after picking.

### Command exit codes

- `npm run e2e:terminal-v1` returns 0 with the extended assertions.
- `npm run capture:terminal-v1` returns 0. New fixtures: `05-picker-populated.png`, `06-picker-after-select.png`.
- Parent `npm run e2e` still returns 0.

## observation contract

### The six discipline items

1. **Diary (#34).** KIT_DIARY gets a Sprint 007 entry at close with the four-part shape; H2 status updated if the picker moves the "did the user pick a model" question forward.
2. **Three lenses (A1).** Structural: harness asserts picker DOM, options populated from `/api/models`, disabled-input state, localStorage write, prompt-text transition. Perceptual: capture the picker element + the input-row before and after selection, decode pixel anchors. Adversarial-review: paragraph at close.
3. **Pixel anchor + asymmetric fixture (A2 + A3).** Add an anchor at the terminput's leading edge: green when input is enabled, muted when disabled. Asymmetric: input state is directional (enabled != disabled), not L-R symmetric.
4. **Canonical home registry (rule 7 + #22).** Add rows for `loadModels()`, `#modelpicker` DOM, `STATE.term.model`, `localStorage['terminal-v1.lastModel']`.
5. **NAME + VALUE + PATH (B3).** Every assertion carries all three. E.g. after picking a model: NAME = `#modelpicker` exists; VALUE = its `.value` equals the picked id AND `#termprompt.textContent` matches the expected format; PATH = `STATE.term.model === picked` AND `localStorage.getItem('terminal-v1.lastModel') === picked`.
6. **Fixture screenshots (#38).** Two new fixtures land with SHA-256 hashes.

### UI driving steps

- Boot; Agent Terminal is initial active tab; `waitForSelector('[data-testid="modelpicker"]')`.
- Wait on `page.evaluate(() => document.querySelectorAll('#modelpicker option').length > 1)` (real condition per A4 — the fetch resolved).
- Capture the picker element (fixture `05`).
- Pick the first non-placeholder option: `page.selectOption('#modelpicker', { index: 1 })`.
- Wait on `page.evaluate(() => window.__TERMINAL_V1_STATE?.term?.model)` becoming truthy.
- Assert NAME + VALUE + PATH per the picker's state (see below).
- Assert `#terminput` is no longer `disabled`.
- Assert `#termprompt.textContent` is `<model> ›`.
- Type + Enter — echo goes through as before, now with model-flavored prompt.
- Capture the input row after pick (fixture `06`).
- Reload the page (`page.reload()`); assert the picker's selected option is the last-picked one (from localStorage).

### Expected screenshot / visual state

- Picker as a select element at the top of the Agent Terminal pane.
- Terminput visually disabled (muted color, placeholder text "pick a model above") on boot; enabled and focus-ready after pick.
- Prompt transitions from `substrate$` to `<model> ›`.

## done criteria

The Agent Terminal shows a populated model picker on every launch. Picking a model enables the input, updates the prompt, and remembers the choice across reloads. All six discipline items honored. Structural + perceptual + adversarial passes green.
