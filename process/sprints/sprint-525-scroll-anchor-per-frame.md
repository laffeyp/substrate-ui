# Sprint 525 — Scroll anchor runs once per frame

```yaml
---
id: 525
status: closed
phase: window productionized (roadmap 2026-11-18-window-productionizing r1, W3)
pass_kind: functional
depends_on: [524]
plan: process/planning/2026-11-18-window-productionizing/ROADMAP-2026-11-19-window-productionizing-r1.md
---
```

## scope

The bare `useLayoutEffect` at `useScrollAnchor.ts` line 260 that calls `settle` → `place` → `getBoundingClientRect` after every React commit is replaced with a rAF-throttled variant. The `useLayoutEffect` marks that a settle is needed; a single `requestAnimationFrame` callback runs `place()` once per frame, coalescing all commits in that frame into one layout read and one scroll write. Follow, pin and anchor modes behave as before — the rAF runs before the next paint, so the visual result is the same frame, one layout pass instead of N. The ResizeObserver's `settle` calls also go through the same rAF gate. One verifiable property: a CPU profile of W1's gate shows `place` under 5 % of the page's script time, down from the measured 94.7 %.

## prerequisites

- 524 (W2: batched fold; W3's throttle has less to do when fewer React commits arrive per frame)

## context_files

- `../sdd-kit-3/AGENTS.md`
- `web/vm/signals/versions/current.json` (v0.73)
- `BLACKBOARD.md` (decision entries, tail)
- `WORKING_AGREEMENT.md`
- `web/reveal/transcript/useScrollAnchor.ts` — the file this sprint modifies; read in full; focus on `place()` (line 157), the bare `useLayoutEffect` (line 260), `settle()` (line 187), the ResizeObserver (line 238), `attachTo` (line 199)
- `web/reveal/transcript/Transcript.tsx` — the component that calls `useScrollAnchor`; read to understand what triggers re-renders
- `process/planning/2026-11-18-window-productionizing/RESEARCH-2026-11-20-window-productionizing-r5.md` (§ "Why", the 94.7 % in `place`)

## signal contract

### Emits

No new tags. `TRANSCRIPT_SCROLLED` (existing, fired by `report`) continues to fire on each cause.

### Consumes

- As listed in `context_files`.

### Invariants

- The vocabulary file is not modified.
- Follow mode: when `following` is true, the transcript is scrolled to the bottom after the next paint; a user scroll up still exits follow; a new row while following still scrolls to the bottom.
- Pin mode: a card header click pins the scroll anchor to that header; `place` holds the header's position through layout changes.
- Anchor mode: reading position is preserved when content above or below changes.
- The ResizeObserver's settle still fires, through the same rAF gate.
- `TRANSCRIPT_SCROLLED` fires with the correct cause for each settle.

## artifact contract

### Files created

None.

### Files modified

- `web/reveal/transcript/useScrollAnchor.ts` — the `useLayoutEffect` schedules a rAF instead of calling `settle` synchronously; `place` runs in the rAF callback; a ref tracks whether a rAF is pending.

### Content assertions

- `useScrollAnchor.ts` contains `requestAnimationFrame`.
- `useScrollAnchor.ts` does not contain a bare `useLayoutEffect(() => { settle(` call (the synchronous path is gone).
- The `useLayoutEffect` body sets a pending flag and calls `requestAnimationFrame` only when the flag is not already set.

### Command exit codes

- `npx tsc -p harness --noEmit` returns 0.
- `npm run test:unit` returns 0.
- `npm run gates:electron` — `transcript_follow`, `transcript_caret` pass.

## observation contract

### UI driving steps

- Run the `transcript_follow` gate: a session takes a turn, the transcript scrolls to the bottom; the user scrolls up, following stops; a new row arrives, following does not resume.
- Run the `transcript_caret` gate (if it exists) or the scroll-pin test: click a card header, the view holds.
- Run the W1 gate on the modified tree.

### Expected runtime signals

- `TRANSCRIPT_SCROLLED` with `cause` `row_arrived` after the turn's last row.
- No `RENDERER_GONE` in W1's trace.

### Expected screenshot / visual state

- The `transcript_follow` gate's screenshot shows the last row visible at the bottom.

## done criteria

`place()` runs once per animation frame, not per React commit; the follow, pin and anchor gates pass unchanged; W1's gate shows `place` as a minor cost, not the dominant one.

## notes

- `useLayoutEffect` still fires synchronously after every commit — that is React's guarantee and what makes scroll anchoring visually seamless. The change is that it no longer calls `place()` directly; it schedules a rAF. The rAF runs before the browser paints (rAF fires after layout, before paint), so the visual contract is preserved: the scroll position is set before the user sees the frame.
- If React batches multiple state updates into one commit (which W2 enables), the `useLayoutEffect` fires once per commit, not per state update. With W2 and W3 together: one commit per frame → one rAF → one `place()`.
- The cleanup in `attachTo`'s returned function should cancel any pending rAF (`cancelAnimationFrame`).

## self-review checklist

- [ ] Scope is concrete and bounded (one paragraph; one verifiable property of the artifact).
- [ ] `context_files` covers everything the Agent needs to read.
- [ ] Signal contract's `Emits` list references only tags in `signals/0.73.json`.
- [ ] Artifact contract is gradable: content assertions are concrete, command exit codes are runnable.
- [ ] If `pass_kind: functional`: observation contract is present.
- [ ] Sprint sweet spot honored: ≤2 files modified, one concept.
