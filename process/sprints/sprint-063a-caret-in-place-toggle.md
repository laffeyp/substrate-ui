# Sprint 063a — caret opens the card in place

Opened 2026-09-23. Anchors on the reveal-shell hardening plan
at `process/planning/PLAN-2026-09-23-reveal-shell-hardening.md`.
Supersedes the "Caret pin — separate small win" note there; the
first attempt (rAF + `data-tool-row` + `getBoundingClientRect`
math) was reverted and replaced by this plan.

## What the user wants

Click a tool card's caret. The line the caret sits on holds
still. The card body appears below the caret line, in the
transcript flow. Content below the body slides down; if the
transcript overflows the scroller, the scrollbar grows. Click
the caret again. The body retracts. Content below rises back.
The caret line does not move at any point. No flashing. No
neighbour card toggling.

## What is wrong now

Two independent causes, only one still open.

Cause 1 — auto-open on `streamingShow` (already fixed tonight).
Every past-streamed tool kept `streamingShow = true` after the
stream's `eof`. The rule `toolCardOpen = toolRunning ||
streamingShow` held those cards open forever. Closing one made
the neighbour cards look untouched. Fix already landed:
`toolCardOpen = toolRunning` when no explicit state applies.
Auto-open holds only while the tool is executing.

Cause 2 — the scroller shifts on toggle. The transcript
container is `flex:1; overflow-y:auto`. When the card body
appears below the header, layout grows the transcript's content.
Chrome's default `overflow-anchor` picks an anchor node inside
the viewport and preserves ITS y; if the anchor sits below the
header, the whole content slides up in the scroller and the
header moves. If the anchor sits above the header, the header
still moves — the scroller's `scrollTop` shifted while the
content grew. Either way the caret line does not hold.

## The fix

Two edits. Both deterministic — no dependence on the browser's
scroll-anchoring choices, no math against
`getBoundingClientRect`, no DOM-reference chase across a
re-render.

**1. Freeze the scroller via its ref.** `reveal.ts` already
stashes each pane's transcript scroller under
`logic._scrolls.termByPane[paneId]` and `logic._scrolls.revByPane[paneId]`
for the sticky-bottom autoscroll code. `bindToggleTool` reads
whichever ref applies to the current pane and view, records
its `scrollTop` before dispatching `setState`, and on
`requestAnimationFrame` writes the same value back. If the ref
is missing (a pane that has not yet mounted its scroller), the
toggle no-ops the freeze — no DOM walk, no chance of freezing
an unrelated container.

**2. Disable engine anchoring.** The helmet stylesheet sets
`overflow-anchor: none` on the transcript scrollers. Chromium's
default anchor cannot pick a node and shift the scroller
mid-toggle. This is not a Chrome-specific reliance: it turns OFF
an implicit engine behaviour so the freeze in (1) is the only
thing acting on `scrollTop`. Same rule under Electron, Chrome,
and any Chromium fork.

Together, (1) and (2) hold the caret line still without
depending on either the header's DOM identity across renders or
any engine default. If dc-runtime's index-keyed `sc-for`
reparents a header node across a filter change, the scroller's
origin still holds — the pin is on the scroller, not on the
header.

## Contract

- `bindToggleTool(cid)` resolves the pane's scroller from
  `logic._scrolls.termByPane[focused]` (terminal view) or
  `logic._scrolls.revByPane[focused]` (reveal view), reads its
  `scrollTop`, dispatches `setState`, and on the next
  `requestAnimationFrame` restores the same `scrollTop`. Handler
  scope: caret click only. Not fired by `subscribe` callbacks or
  any background state change.
- The helmet block declares:
  `#vm-transcript, [data-scroller] { overflow-anchor: none; }`
  — the `data-scroller` attribute goes on the reveal-view
  transcript container so both scrollers are covered by one
  rule.
- Autoscroll behaviour (`reveal.ts:117-138`) is unchanged.
  Confirmed by reading: it fires only on
  `snap.transcript.length > lastLen`; a caret click never
  mutates the transcript array.
- Every other tool-card behaviour (auto-open on `toolRunning`,
  explicit `true`/`false` overrides, three-state toggle) stays.

## Observation contract

Run in Chrome with a live session that emits three streamed
bash tool calls in quick succession.

1. Wait for all three to reach `eof`. Every card auto-closed.
2. Click the caret on the middle card. Assert: its header y
   before the click equals its header y after the click, within
   one pixel. Its body renders below the header. Neighbour
   cards did not change state.
3. Click the caret again. Body retracts. Header y equals its
   pre-click y within one pixel.
4. Scroll to the top of the transcript. Click a caret in the
   first visible tool card. Same assertion.
5. Scroll near the bottom. Click a caret. Same assertion. The
   scrollbar grows if the expanded body would extend past the
   viewport; the user can scroll to see the body.

A shakeout flow `harness/shakeout/caret_pin_in_place.ts` runs
this against a live server via Playwright. Assertions per run:

- `headerElement.getBoundingClientRect().top` before === after
  within one pixel, both on open and on close.
- Neighbour cards' `toolCardOpen` state is unchanged (read via
  `window.__vm.snapshot()`).
- The clicked row's `callId` is the same before and after (guards
  against the reparent regression named in the Out-of-scope
  section).
- No unhandled console errors.

## Out of scope

- Fixing dc-runtime's index-keyed `sc-for` (`web/dist/support.js`
  `walkFor`, `key: i`). When `filteredRows` shrinks, React reuses
  DOM at index N with the row that was at N+1. The scroller
  freeze holds y; it does NOT prevent the caret's row content
  from being replaced by a different row. If a shakeout run
  observes the row's content changing across the toggle, book
  Sprint 063b for stable keys. The auto-open fix from earlier
  this session already removes the most-visible symptom of
  reparenting; freezing the scroller is orthogonal.
- Any layout-avoidance rewrite (`position: absolute` overlay,
  fixed-height card, etc.). The card body renders in the
  transcript flow. This sprint holds the scroller; it does not
  change the layout model.

## Files touched

- `web/reveal_component.ts` — rewrite `bindToggleTool`.
- `web/reveal.html` — one helmet stylesheet line.
- `harness/shakeout/caret_pin_in_place.ts` — new flow.
- `harness/shakeout/run.ts` — register the new flow.

## Rollback

If the freeze causes a regression in another surface (studio
scroll, records overlay), revert `web/reveal_component.ts` and
`web/reveal.html` at HEAD; the shakeout flow stays as a
regression witness for the next attempt.
