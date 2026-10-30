---
sprint: 011
slug: content-views
status: pending
pass_kind: web-frontend
cadence: auto-within-phase
context_files:
  - web/app.js
  - web/index.html
  - process/BACKLOG.md
---

# Sprint 011 — application content views (the "see the code" cluster)

## Why

Two BACKLOG items, one theme: the GUI shows *that* an application event fired and a gist of its
payload, but the actual CODE / turn text / model output is hard to read in the GUI (the terminal
`cat <seq>` shows it; the GUI inspector should too). And clicking an output artifact in the I/O pane
should inspect it. This is "I want to see more of the application-level code in here."

## Scope

`web/app.js` — `inspectEvent` renders readable CONTENT blocks (string payload fields with newlines /
long strings, shown with real newlines in a monospace block, not buried in escaped JSON); `renderIO`
makes each output artifact clickable -> `inspectEvent(seq)`. `web/index.html` — CSS (`.insp
pre.content`, clickable `.art`). No backend change.

## Dual contract

**Artifact:** `node --check web/app.js` exits 0; eight-word grep clean; `npm run e2e` + 24 server
tests pass. **Signal:** none.

## Observation contract (both tracks)

- **Structural (`e2e_console.js`):** on pair_coding, clicking an output artifact in the I/O pane fills
  the inspector with the event; clicking a `CodeChunk` stream event shows a content block whose text
  contains the real code (`def solve`). Read the inspector DOM as the signal.
- **Perceptual (capture -> look):** the inspector renders the code legibly (real newlines, monospace),
  clean, on-vocabulary.

## Close

Rubber Duck Pass; BLACKBOARD `## Built` + `## Sprint tail`; mark the two BACKLOG items done; review.
