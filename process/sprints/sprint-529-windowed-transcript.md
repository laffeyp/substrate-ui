# Sprint 529 — The transcript draws only what is near the view

```yaml
---
id: 529
status: closed
phase: window productionized (roadmap 2026-11-18-window-productionizing r1, W7)
pass_kind: functional
depends_on: [528]
plan: process/planning/2026-11-18-window-productionizing/ROADMAP-2026-11-19-window-productionizing-r1.md
---
```

## scope

The transcript is windowed: rows near the viewport have DOM nodes, the rest are replaced by a spacer whose height is the sum of their measured heights. The scroll anchor's three modes (follow, pin, anchor) work through the windowed list. When the user scrolls, the visible window shifts and new rows mount while distant rows unmount. One verifiable property: in the W1 gate's session (thousands of rows), the DOM node count stays bounded regardless of transcript length — a count at load and after scrolling stays within a constant factor of the viewport's row count.

The dependency choice: build it from the existing scroll anchor and a height cache, not an external library. The transcript's rows have variable height (cards open and close, streaming output grows), the scroll anchor already tracks follow/pin/anchor state, and the existing `registerRow` callback already refs each row. A library (react-window, react-virtuoso) would need to be adapted to these three scroll modes and the height variability; the scroll anchor already handles both. Record this as an agent-resolved decision.

## prerequisites

- 528 (W6: dead page recovery; survivability first, then cost reduction)

## context_files

- `../sdd-kit-3/AGENTS.md`
- `web/vm/signals/versions/current.json`
- `BLACKBOARD.md` (decision entries, tail)
- `WORKING_AGREEMENT.md`
- `web/reveal/transcript/Transcript.tsx` — the file this sprint modifies; the `rows.map()` that mounts every row
- `web/reveal/transcript/useScrollAnchor.ts` — the scroll anchor; `place`, `attachTo`, `registerRow`, the ResizeObserver
- `web/reveal/transcript/Row.tsx` — a row's render; needed to understand what mounts per row
- `web/reveal/transcript/ToolCard.tsx` — a card's render; cards have variable height

## signal contract

### Emits

No new tags. `TRANSCRIPT_ROW_DRAWN` fires for each row that mounts (as before — it fires on mount, not on every re-render).

### Consumes

- As listed in `context_files`.

### Invariants

- The vocabulary file is not modified.
- Every row in `snapshot.transcript` can be scrolled to and viewed; the windowed list makes distant rows available on scroll.
- `TRANSCRIPT_ROW_DRAWN` fires for every row that enters the viewport (the gate checks the last row is drawn).
- Rows that have never been in the viewport have no DOM node.
- The scroll anchor's follow, pin and anchor modes produce the same visible result as before: following sticks to the bottom, a pinned header holds its position, an anchored row holds its offset.

## artifact contract

### Files created

None (or a `useWindowedList.ts` hook if the windowing logic is complex enough to separate from `Transcript.tsx`).

### Files modified

- `web/reveal/transcript/Transcript.tsx` — `rows.map()` renders only the visible window; a height cache and a spacer element replace the unmounted rows.
- `web/reveal/transcript/useScrollAnchor.ts` — if the windowed list changes how rows register or how the scroller's scroll height is computed, adapt `place` and `registerRow`.

### Content assertions

- `Transcript.tsx` contains a range calculation that selects which rows to render (e.g., `startIndex` and `endIndex` or equivalent).
- `Transcript.tsx` renders a spacer element (a `div` with a computed height) for the rows above and/or below the viewport.
- The height cache stores each row's last measured height, keyed by the row's key.

### Command exit codes

- `npx tsc -p harness --noEmit` returns 0.
- `npm run test:unit` returns 0.
- `npm run gates:electron` — `transcript_follow`, `transcript_caret`, `tool_output_text` pass.

## observation contract

### UI driving steps

- Run `transcript_follow` gate: a turn streams, the transcript follows to the bottom; the user scrolls up, following stops; a new message arrives, following resumes when scrolled to the bottom.
- Run the W1 gate: the long session opens and the last row is visible.
- After W1 loads, count DOM nodes: the count should be proportional to the viewport, not to the transcript length.

### Expected runtime signals

- `TRANSCRIPT_ROW_DRAWN` for the last row in the session.
- `TRANSCRIPT_SCROLLED` with the correct cause on each interaction.
- No `RENDERER_GONE`.

### Expected screenshot / visual state

- The transcript looks identical to the un-windowed version: same rows, same spacing, same styling.

## done criteria

The transcript renders only rows near the viewport; distant rows are spacers; the scroll anchor's three modes work; the DOM node count is bounded; the scroll and tool-output gates pass.

## notes

- Initial row heights before measurement: use a constant estimate (e.g., 48 px for a text row, 200 px for a tool card). After a row mounts and the ResizeObserver fires, the height cache updates and the spacer adjusts. A small visual jump on first scroll is acceptable; a large one is not.
- The overscan (extra rows rendered above and below the viewport) keeps scroll smooth. 5–10 rows of overscan is typical.
- `buildResultByCallId` currently scans the entire transcript on every render. With windowing, it should scan once and cache (or the scan is cheap if it runs on the full `snapshot.transcript` array, which is in memory regardless of windowing — the windowing affects DOM, not data).
- This sprint modifies 2 files. If `useScrollAnchor.ts` changes are substantial, the sprint stays within the sweet spot because the two files are one concept (windowed scrolling).

## self-review checklist

- [ ] Scope is concrete and bounded (one paragraph; one verifiable property of the artifact).
- [ ] `context_files` covers everything the Agent needs to read.
- [ ] Signal contract's `Emits` list references only tags in the vocabulary.
- [ ] Artifact contract is gradable: content assertions are concrete, command exit codes are runnable.
- [ ] If `pass_kind: functional`: observation contract is present.
- [ ] Sprint sweet spot honored: ≤2 files modified, one concept.
