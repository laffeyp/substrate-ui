# Sprint 003 — tab-bar shell

---

## Frontmatter

```yaml
---
id: 003
status: closed
phase: 1
pass_kind: functional
---
```

## scope

Land the eight-tab shell. Replace the placeholder body with a top tab strip carrying the eight named tabs (Agent Terminal, Run Records, Assays, Run-as-graph, Topology structure, Bus event stream + Inspector, I/O, Studio) and an empty pane region below. The Agent Terminal tab is marked active on load; the other seven show a placeholder message ("(tab body — to be ported)"). No swap logic yet (that's sprint 004). Add the pixel-anchor strip: one 4×4 colored div per tab in a fixed strip, green (`#3fb950`) when its tab is active, dark (`#0c0f14`) otherwise. The capture harness decodes the strip and asserts exactly one anchor reads green.

## prerequisites

- Sprint 002 closed.

## context_files

- `../../sdd-kit-2/ADDENDUMS.md` (A2 pixel-anchor decode; A7 assertions-in-CI-gated-harness)
- `../../design/terminal-v1/visual-redesign.md` (the eight tab names, in order)
- `WORKING_AGREEMENT.md` (tone canon — lowercase, no emoji)
- `web/index.html` (current placeholder)
- `harness/e2e_terminal_v1.js` (extend structural assertions)
- `harness/capture_terminal_v1.js` (extend to decode the anchor strip)

## signal contract

None (A9).

### Invariants

- Tab labels are lowercase per tone canon.
- Each tab element has a unique `data-testid` on its leaf clickable element (not the container — accessibility-identifier propagation hazard).
- Placeholder text in inactive panes reads consistently ("(tab body — to be ported)").
- Anchor strip is at a fixed pixel location the capture script can rely on.

## artifact contract

### Files modified

- `substrate-ui/terminal-v1/web/index.html` — the tab bar structure, eight tab buttons, one pane area, anchor strip.
- `substrate-ui/terminal-v1/harness/e2e_terminal_v1.js` — assert eight tab buttons with the right testids, assert Agent Terminal is the initial active tab.
- `substrate-ui/terminal-v1/harness/capture_terminal_v1.js` — capture the anchor strip, decode 8 pixels, assert exactly the Agent Terminal anchor is green.

### Content assertions

- `web/index.html` contains eight `<button>` elements with `data-testid` values `tab-agent-terminal`, `tab-records`, `tab-assays`, `tab-run-as-graph`, `tab-topology-structure`, `tab-event-stream-inspector`, `tab-io`, `tab-studio`.
- `web/index.html` contains an element with `data-testid="anchor-strip"` holding eight 4×4 div children with `data-anchor` set to each tab's testid.
- The Agent Terminal tab has an `aria-selected="true"` attribute; the other seven have `aria-selected="false"`.

### Command exit codes

- `npm run e2e:terminal-v1` returns 0 with the extended assertions.
- `npm run capture:terminal-v1` returns 0 and writes an updated `screenshots/00-boot.png`.
- Parent `npm run e2e` still returns 0.

## observation contract

### UI driving steps

- `page.goto("/terminal-v1/")`, `page.waitForSelector('[data-testid="tab-agent-terminal"][aria-selected="true"]')`, screenshot the anchor strip.

### Expected screenshot / visual state

- Tab bar visible with eight labels.
- Agent Terminal tab visually distinct as active (green underline or similar; the exact styling is minimal per the reorganize step's constraint of "no reskin").
- Anchor strip: first div green, other seven dark.

## done criteria

The page renders eight tabs in a top bar; Agent Terminal is the active tab; the anchor strip encodes tab state readably in pixels; both harnesses pass with the extended assertions.
