# Sprint 536 — the reading position survives a view switch (W7 regression)

```yaml
---
id: 536
status: pending
phase: window productionized (roadmap 2026-11-18-window-productionizing r1; fixes a W7 regression)
pass_kind: functional
depends_on: [529]
plan: process/planning/2026-11-18-window-productionizing/ROADMAP-2026-11-19-window-productionizing-r1.md
---
```

## scope

`transcript_follow`'s switch check fails: the user scrolls up (reading mode), switches terminal → reveal → terminal, and the reading position drifts (`harness/shakeout/transcript_follow.ts` line ~190: `switch: scrolled-up position survived terminal → reveal → terminal`, measured 533 → 543, tolerance ≤2 px). Confirmed pre-existing to sprint 531 (W9) by a clean build with `App.tsx` reverted; sprint 525 (W3) recorded `transcript_follow` passing, so the regression entered between 525 and now, and the windowed transcript (sprint 529, W7) is the prime suspect — it replaced the full row list with a windowed list whose off-screen rows are spacer divs sized from an estimate cache (`web/reveal/transcript/Transcript.tsx`: `EST_TEXT_HEIGHT` 48, `EST_TOOL_HEIGHT` 200, `heightCache`, `computeVisibleRange`). Diagnose the exact cause, then fix it so the reading row returns to the same pixel. One verifiable property: `transcript_follow` passes every check, the switch check within 2 px, with no regression to following, reading, or resume.

## prerequisites

- 529 (W7, the windowed transcript that introduced the estimate-sized spacers).

## context_files

- `../sdd-kit-3/AGENTS.md`
- `web/vm/signals/versions/current.json`
- `BLACKBOARD.md` (the 2026-11-20 and 2026-11-21 entries on the switch drift at the tail)
- `WORKING_AGREEMENT.md`
- `web/reveal/transcript/Transcript.tsx` — the windowed list: `heightCache` (a `React.useRef`, so it is lost if the component unmounts), `computeVisibleRange`, `estimateHeight`, `measureRowHeight`, the top/bottom spacer divs, the `ResizeObserver` that remeasures, the follow/`endIndex` extension.
- `web/reveal/transcript/useScrollAnchor.ts` — the scroll owner. Read: `attachTo` (restores `savedByKey.get(key).scrollTop` on remount), the `ResizeObserver` `wasHidden` branch (restores on a hidden→shown transition), `place()` (reading mode re-anchors to `anchorSeqRef`'s row), `savedByKey`/`reportedByKey` (module-level, survive a view switch). Note whether the transcript stays mounted-but-hidden across the switch (so `heightCache` survives) or unmounts (so it is lost) — that decides the fix.
- `harness/shakeout/transcript_follow.ts` — the gate; read the four modes (following, reading, resume, switch) and the switch step (lines ~184–190).

## signal contract

### Emits

No new tags. `TRANSCRIPT_SCROLLED` already carries the `VIEW_SWITCH` cause.

### Invariants

- The vocabulary file is not modified.
- Following, reading, and resume behave exactly as before — the fix touches only the view-switch restore accuracy.
- No scroll write reads as the user's own (the `ownWritesRef` discipline in `useScrollAnchor` is preserved).

## artifact contract

### Files modified

- `web/reveal/transcript/Transcript.tsx` and/or `web/reveal/transcript/useScrollAnchor.ts` — whichever the diagnosis names. State in the Signal Report which, and why.

### Content assertions

- The Signal Report's `rubber_duck_observations` states the confirmed root cause (e.g. "the `heightCache` ref is lost on the view-switch unmount, so remount lays out off-screen rows at estimated heights and the restored `scrollTop` maps to a different content position" — or whatever the diagnosis actually finds), with the file and line that proves it.
- The fix makes the view-switch restore independent of the estimate error (e.g. the height cache persists across the switch keyed per pane+view as `savedByKey` is; or the reading-mode restore re-anchors after measured heights settle rather than before).

### Command exit codes

- `npm run build` returns 0.
- `npx tsc -p harness --noEmit` returns 0.
- `npx tsx harness/shakeout/transcript_follow.ts` returns 0 — every check passes, the switch check within 2 px.

## observation contract

### UI driving steps

- The gate drives it: scroll up (reading), a turn arrives, switch terminal → reveal → terminal, read the position.

### Expected log substrings

- `transcript_follow` prints `switch: scrolled-up position survived terminal → reveal → terminal` with a delta ≤ 2 px, and `1 FAILED` does not appear.

### Expected runtime signals

- `TRANSCRIPT_SCROLLED` with cause `view_switch` on the switch, as before.

## done criteria

The reading position returns to the same pixel across a view switch; `transcript_follow` passes entirely; following, reading, and resume are unchanged.

## notes

- Diagnose before fixing — do not assume the cause. The two candidates: (1) `heightCache` is a component ref lost on unmount, so remount uses estimates; fix by persisting it across the switch. (2) The transcript stays mounted and the cache survives, but `place()` re-anchors on the `VIEW_SWITCH`/remount before the windowed rows have measured, landing on an estimate; fix by re-anchoring after the measured heights settle (the row ResizeObserver's first pass), or by seeding the visible range from the saved anchor row rather than the saved `scrollTop`. Confirm which with a measurement (log `scrollHeight` and the anchor row's position before the switch and on return) before changing code.
- Run `transcript_follow` on an idle machine; it has been timing-sensitive under concurrent load.

## self-review checklist

- [ ] Scope names one verifiable property (switch check ≤2 px, all checks pass).
- [ ] context_files covers the windowed transcript, the scroll owner, and the gate.
- [ ] No vocabulary change.
- [ ] Artifact contract requires the confirmed root cause in the report, not a guess.
- [ ] Observation contract present.
- [ ] ≤2 files; one concept (view-switch restore accuracy).
```
