# Sprint 011 — I/O tab port

```yaml
---
id: 011
status: closed
phase: 2
pass_kind: functional
---
```

## scope

I/O tab reads the selected record and shows two sections: **Input** (the `resolved_input` payload from `substrate.RunStarted`, if present, else the initial producers' inputs) and **Output artifacts** (any `SelectedPatch`, `FinalAnswer`, `RepairSummary`, `Verdict`, `Synthesis` — the terminal-artifact kinds — listed with kind + seq + gist). Reads STATE.events; renders on tab-open and on `_currentRecord` change.

## prerequisites — Sprint 010 closed.

## context_files
- `../web/app.js` (parent `renderIO()` at 480)
- `web/index.html`, `web/app.js`, both harnesses

## artifact contract

### Files modified
- `web/index.html` (I/O pane holds `#iopane` with `.io-section` blocks)
- `web/app.js` (add `renderIO()`, artifact-kind list, wire to `selectRecord`)

### Content assertions
- I/O pane contains `[data-testid="io-input"]` and `[data-testid="io-artifacts"]`.
- After selecting a record, io-input shows the RunStarted payload OR "no input" text.
- io-artifacts lists all `SelectedPatch`, `FinalAnswer`, etc. or "no artifacts" text.

### Command exit codes
- `npm run e2e:terminal-v1` returns 0.
- `npm run capture:terminal-v1` returns 0. Fixture 12 (capture-only).
- Parent regression clean.

## observation contract

### Six discipline items
1. Diary entry.
2. Three lenses (structural + perceptual + adversarial paragraph).
3. A2 + A3 — artifact list is asymmetric per record; a bug that dropped all artifacts would render "no artifacts" instead of the real list.
4. Canonical home update.
5. N+V+P: NAME = `#iopane` elements; VALUE = expected text content matching STATE.events counts; PATH = tab shows io-input/io-artifacts blocks whose contents mirror `STATE.events`.
6. Fixture 12 capture-only.

### UI driving steps
- Boot; select first record via Records tab; click I/O tab; wait for `#iopane` to update.
- Assert `#io-input` visible; assert `#io-artifacts` visible with count matching `STATE.events.filter(k in terminals).length`.
- Capture.
