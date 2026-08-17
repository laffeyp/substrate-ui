# Sprint 004 — tab-switch mechanics

```yaml
---
id: 004
status: closed
phase: 1
pass_kind: functional
---
```

## scope

Clicking any tab makes it the active tab; the pane body swaps to that tab's placeholder ("(tab body — to be ported)"); the anchor strip's green anchor moves to the clicked tab; the previously-active tab returns to inert state; `aria-selected` transitions match. Vanilla JS, one small `web/app.js`, listener installed on the tab bar (event delegation, one handler). Verify-the-observer per A4 — the harness waits on `aria-selected="true"` transition, never a `sleep`.

## prerequisites

- Sprint 003 closed.

## context_files

- `web/index.html` (add `<script src="app.js" defer></script>`)
- `harness/e2e_terminal_v1.js` (extend: iterate through each tab, click, assert active transitions, assert only one selected)
- `harness/capture_terminal_v1.js` (extend: iterate through each tab, click, capture strip, decode, assert the green moves)
- A4 (verify the observer — no sleeps)

## artifact contract

### Files created

- `substrate-ui/terminal-v1/web/app.js`

### Files modified

- `substrate-ui/terminal-v1/web/index.html` (add `<script>` tag)
- `substrate-ui/terminal-v1/harness/e2e_terminal_v1.js`
- `substrate-ui/terminal-v1/harness/capture_terminal_v1.js`

### Content assertions

- `web/app.js` contains a single delegated click handler on `.tabbar` that toggles `aria-selected` and updates `.anchor.active`.
- After clicking each tab, exactly one `.tab` has `aria-selected="true"` and exactly one `.anchor` has class `active`, and they match.

### Command exit codes

- `npm run e2e:terminal-v1` returns 0.
- `npm run capture:terminal-v1` returns 0 and writes 8 anchor-strip PNGs, one per tab (`02-strip-after-<tab>.png`), each decoding to that tab being the sole green.
- Parent `npm run e2e` still returns 0.

## observation contract

### UI driving steps

- Boot page.
- For each of the 8 tabs: `page.click('[data-testid="tab-<name>"]')`, `page.waitForSelector('[data-testid="tab-<name>"][aria-selected="true"]')`, `locator('[data-testid="anchor-strip"]').screenshot(...)`, decode, assert.

### Expected screenshot / visual state

- Nine screenshots total: `01-anchor-strip.png` (boot, Agent Terminal active) + `02-strip-after-<tab>.png` for each of the 8 tabs.

## done criteria

Clicking any tab transitions its aria-selected + its anchor; the harness proves this on all eight tabs mechanically.
