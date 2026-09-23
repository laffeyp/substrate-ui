# Sprint 075 — scroll anchor

```yaml
---
id: 075
status: pending
phase: 8
pass_kind: functional
---
```

## scope

Wire the atom-level scroll anchor. `<Transcript>` tracks `anchorSeq` (the topmost visible envelope's `seq`) and `anchorOffsetPx` (offset from the anchor's top to the scroller's viewport top). On every commit, `useLayoutEffect` restores `scrollTop` so the anchor's viewport offset is preserved. An `IntersectionObserver` watches every mounted row and updates the anchor when the user scrolls. Auto-follow-bottom (sticky) applies when `anchorSeq === null`. Land a Playwright caret-pin flow that asserts zero-drift.

## prerequisites

- 074 (tool cards, with `data-tool-card-body` marker).

## context_files

- `sdd-kit-2/AGENTS.md`
- `process/planning/PLAN-2026-09-23-phase-8-transcript-atom-migration.md` (§5.2, §7 Sprint 075, §9 R4, R7).
- `web/reveal.ts` (current sticky-bottom autoscroll at lines 117-138).
- `web/reveal_component.ts` (current `termScrollRef` / `revScrollRef` at lines 1670-1729, still live for the flag-off path).
- `web/reveal/transcript/Transcript.tsx` and `ToolCard.tsx` (from prior sprints).
- `harness/shakeout/lib/*` (for server + client patterns).

## signal contract

### Emits

None new. The controller's existing tags still fire.

### Consumes

- Every context file above.

### Invariants

- `signals/0.1.json` unmodified.
- With `anchorSeq !== null`, no envelope arrival, no card toggle, and no streaming tick shifts the anchor row's viewport y by more than one pixel across the commit.
- With `anchorSeq === null`, the transcript auto-scrolls to bottom on new envelopes as it did in `reveal.ts:117-138`.
- The observer's callback stores its result in a `useRef` and commits via one trailing `requestAnimationFrame` per tick (R7 mitigation).
- No changes to `signals/0.1.json`.

## artifact contract

### Files created

- `web/reveal/transcript/useScrollAnchor.ts` — hook exposing `registerRow(seq, element)`, `onScroll(event)`, and a `useLayoutEffect` runner that reads/writes `scrollTop`.
- `harness/shakeout/caret_pin.ts` — Playwright flow that drives a real bash-tool session, scrolls to the middle, clicks a caret, and asserts the header row's `getBoundingClientRect().top` at settled equals its pre-click top within one pixel across five runs.

### Files modified

- `web/reveal/transcript/Transcript.tsx` — mount the hook, plumb `registerRow` and `onScroll`, add `overflow-anchor: none` to the mount div's inline style (so Chromium's default anchoring cannot fight the manual restore).
- `harness/shakeout/run.ts` — register the new `caret_pin` flow alongside the others.
- `harness/shakeout/tools_index.ts` — no change (this flow is not tool-family; it lives at the top level).

### Content assertions

- `useScrollAnchor.ts` exports `useScrollAnchor()` and does not import `document` directly — the scroller element is passed in via a ref.
- `useScrollAnchor.ts` uses `IntersectionObserver`, `React.useLayoutEffect`, `React.useRef`, and `window.requestAnimationFrame`.
- `caret_pin.ts` exports a `Flow` matching the shape at `harness/shakeout/lib/flow.ts` (it may use Playwright inside `run(ctx)`; see the pattern from tonight's reverted `harness/caret_probe.ts` — the shape survives in git history).
- `caret_pin.ts` asserts `|top_before - top_after| ≤ 1` for open, close, and roundtrip, across 5 runs.

### Command exit codes

- `npm run typecheck` returns 0.
- `npm run lint` returns 0.
- `npm run build` returns 0.
- `npm run smoke:vm` returns 0.
- `npx tsx web/vm/tools/check-vocabulary-parity.ts` returns 0.
- `npm run shakeout` returns 0 (28 existing flows plus `caret_pin` all pass).
- `npm run pixel:diff` returns 0 for the `multi_tool` and `mid_scroll` states, both viewports, with the flag ON.

## observation contract

### UI driving steps

Handled inside `caret_pin.ts`:

1. Start server via `ServerHandle`; launch Chromium headless at 900 × 380 DPR 2.
2. Open a real-driver session; send: "Call bash three times, echo one/two/three."
3. Wait until the transcript has three tool cards.
4. `_termScrollEl.scrollTop = scrollHeight / 2`.
5. Locate the first bash card header. Read its `getBoundingClientRect().top`.
6. Dispatch a `click` MouseEvent on it. Wait 500 ms. Read the header's top again.
7. Assert: `|top_before - top_after| ≤ 1`.
8. Click again to close. Read top. Assert: `|top_before - top_after| ≤ 1`.
9. Repeat five times per Playwright run.

### Expected log substrings

- `[caret_pin] PASS` in the flow's stdout on each of five runs.
- No `[reveal] scroll anchor` warnings.

### Expected runtime signals

- Every existing lock tag continues firing. No new tag.

### Expected screenshot / visual state

- `mid_scroll` state (Sprint 070 baseline): matches after the flag-ON boot.
- Caret-pin flow: no visual assertion beyond the position math (screenshot compare stays owned by the pixel-diff harness).

## done criteria

Clicking a tool card's caret in mid-scroll pins the header row's y within one pixel across five runs. The atom anchor holds through streaming updates without visible drift. Sticky-bottom behaviour survives when the user has not scrolled up.

## notes

The atom anchor idiom is standard in terminal scrollback (xterm.js, iTerm2 per Plan refs 13, 14) and in windowed React lists (react-virtuoso per Plan ref 23). This sprint adopts the pattern without adopting virtualisation — transcript row counts stay small enough that every atom stays mounted.

`overflow-anchor: none` on the mount div is engine-agnostic: it turns off Chromium's implicit anchor so the explicit anchor here is the only actor writing `scrollTop`. Electron's Chromium honours the same property.
