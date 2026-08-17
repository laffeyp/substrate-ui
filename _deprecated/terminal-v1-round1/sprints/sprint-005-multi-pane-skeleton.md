# Sprint 005 — multi-pane skeleton

```yaml
---
id: 005
status: closed
phase: 2
pass_kind: functional
---
```

## scope

Before any pane can be ported, the tab shell needs a pane per tab, not one placeholder shared across all tabs. Sprint 005 adds eight pane divs (one per tab, each hidden except the active one), refactors the swap logic in `web/app.js` to toggle a `.pane-active` class per pane on tab click, and moves the placeholder text ("(tab body — to be ported)") into each pane so all seven inactive panes carry it and the ninth (root marker) stays visible for the harness.

## prerequisites

- Sprint 004 closed.

## context_files

- `web/index.html`, `web/app.js`
- `harness/e2e_terminal_v1.js` (extend: click each tab and assert only that tab's pane is visible; state preserved across a switch and back)
- `harness/capture_terminal_v1.js` (no change)

## artifact contract

### Files modified

- `substrate-ui/terminal-v1/web/index.html` (replace one `<main>` with eight `<section class="pane" data-pane-for="tab-...">` blocks; add CSS `.pane { display: none } .pane.pane-active { display: block }`)
- `substrate-ui/terminal-v1/web/app.js` (extend `activate()` to also toggle `pane-active`)
- `substrate-ui/terminal-v1/harness/e2e_terminal_v1.js`

### Content assertions

- Eight `<section>` elements with `data-pane-for` values matching each tab's testid.
- On load, only `[data-pane-for="tab-agent-terminal"]` has class `pane-active`; the other seven do not.
- Clicking any tab moves `pane-active` to the matching pane; exactly one pane is active at any time.

### Command exit codes

- `npm run e2e:terminal-v1` returns 0.
- `npm run capture:terminal-v1` returns 0.
- Parent `npm run e2e` still returns 0.

## observation contract

### UI driving steps

- Boot, assert one pane active + it is agent-terminal.
- For each of the other seven tabs: click, assert only its pane has `pane-active`.
- Click back to Agent Terminal, assert only its pane is active.

### Expected screenshot / visual state

- Boot screenshot shows Agent Terminal pane visible; others hidden (CSS `display:none`).

## done criteria

Eight panes exist, exactly one is visible at any time, and it is the one matching the active tab.
