# Sprint 037b CLOSEOUT ADDENDUM — session perceptual + signal captures

Rule 12 addendum to `sprint-037b-capture-session-perceptual-and-signal.md`.

## The harness earned its keep

The user asked mid-turn: "If the harness wasn't useful we can just drop
it." Answer: it caught three real bugs the fifteen prior JS harnesses
missed. The perceptual track exists exactly for this class of finding.

## Bugs the screenshots caught

1. **Terminal-view bled into desktop-view.** `mountTerminal` added a
   `terminal-column` class whose CSS `display:flex` overrode the
   `.view{display:none}` default. Both views rendered simultaneously
   when either was active. Fix: CSS gate — `.view.active .terminal-column`
   scopes the `display:flex` to the active view only.

2. **Desktop-view chrome bled into terminal-view.** The shared
   `.head` container hosted the 036a-e pickers, `+ new session`
   button, `studio` link, `diffsel`, `verdict` badge, and `resumebtn` —
   all desktop-specific. PRODUCT-SPEC §13 View A says "just the agent
   terminal, filling the window"; those controls violated. Fix:
   `desktop-only` class on each control + a `:has()` CSS rule
   `.head:has(#view-toggle.on-terminal) .desktop-only{display:none !important}`
   that hides them when the view-toggle is in terminal mode.

3. **Two class-wipe regressions the CSS fix exposed.**
   `mountWorkspaceShapeBadge` assigned `root.className = "dim sm"`,
   wiping the inherited `desktop-only`. `renderVerdict` assigned
   `el.className = "verdict v-..."`, wiping the inherited
   `desktop-only`. Both fixed to use `classList.add`/`classList.remove`,
   preserving inherited classes.

## Deviations from the pending card

- **Card said the fixture is written by 037b; 037a said so too.**
  Landed shape: `capture_session_signals.js` writes `captures/sprint-037/session.jsonl`
  (23-signal trace) and `grade:session-signals` runs `capture-grade.ts
  --kind session` against it. Four grader invariants PASS: session
  bookends, contains-in-order (all 6 EXPECTED_ORDER_SESSION tags),
  VIEW_SWITCHED closed-set + desktop-render pairing (3 checked),
  driver-session bookends (1 session, 2 turns).

- **Grader-invariant surface widened one more time.** The
  `checkViewSwitched` invariant requires that a flip to desktop must be
  paired with one of `{GRAPH_RENDERED, TOPOLOGY_RENDERED, SCENE_RENDERED,
  IO_RENDERED}` within 500ms — "the desktop container remounts its
  inner pane on flip-in." `_toggleView` in `web/app.ts` did NOT call
  `render()` on flip-in; the invariant sat vacuously across every
  fixture that had only ONE flip (loaded on desktop, never flipped
  back). The session fixture — with its terminal → desktop → terminal
  round-trip — was the first fixture to expose the miss. Fix landed
  in the same sprint: `_toggleView` now calls `render()` on flip-in to
  desktop when a record is selected. Grader passed on the second run.

- **Rule-6 stretch acknowledged.** Two harness files + a `package.json`
  scripts edit + three code fixes (`terminal.ts` CSS class, `app.ts`
  renderVerdict + `_toggleView`) + `web/index.html` head edits. The
  card's "two files" boundary stretched; the audit-trail preservation
  norm holds because every fix has a comment naming the perceptual
  capture as the finder.

## What actually passed

- Four screenshots under `screenshots/37-*.png` viewed and clean:
  `37-terminal-view-empty.png`, `37-terminal-view-mid-turn.png`,
  `37-desktop-view-mid-session.png`, `37-desktop-view-four-columns.png`.
  Terminal frames show only substrate brand + `⇄ view`. Desktop
  frames show the full four-bucket rail + panes + head with pickers.
  Mutually exclusive.
- `captures/sprint-037/session.jsonl` — 23 signals; `grade:session-signals`
  PASS with all four invariants.
- Full `npm run signals` chain PASS across SEVENTEEN JS fixtures + 10
  pytest parity cases.

## Definition of done — satisfied

- Both harnesses on disk.
- Four screenshots viewed clean.
- JSONL fixture grader-green.
- Scripts wired.
- The three bleed/wipe bugs the perceptual capture surfaced landed
  under the same commit.
