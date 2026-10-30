# Sprint 022 — view subsystem

```yaml
---
id: 022
status: closed
phase: 3
pass_kind: implementation
---
```

## scope

Wire ten emit sites in `web/app.ts` covering the view subsystem: `VIEW_SWITCHED` on each pane toggle (gvRun, gvTopo, gvScene, modeToggle), `CURSOR_MOVED` at the seq input handler (source tagged by caller: drag, button, play_frame), `PLAY_STARTED`, `PLAY_STOPPED`, `SPEED_CHANGED`, and the five pane-repaint tags (`GRAPH_RENDERED`, `TOPOLOGY_RENDERED`, `SCENE_RENDERED`, `IO_RENDERED`, `HEALTH_RENDERED`) at the tail of the matching `render*()` functions. A monotonic `frame` counter feeds `view_payload_universal = {frame, visible, pane_id, subject_record}` on every pane-repaint. Extend `tools/capture-grade.ts` with the vocab invariant: every `VIEW_SWITCHED{to_view: V}` is followed within one repaint cycle (≤1 s) by exactly one pane-render tag whose `pane_id` matches V and whose `subject_record` matches. Extend `harness/capture_signals.js` (or a new capture) to exercise view toggles, seq drag, and play so the fixture carries the ten new tags.

## context_files

- `signals/versions/0.1.json` (view category; `view_payload_universal`; invariants #3, #8)
- `web/app.ts` (`render`, `renderGraph`, `renderTopology`, `renderScene`, `renderIO`, `renderHealth`, transport handlers)
- `tools/capture-grade.ts`
- `harness/capture_signals.js` (Sprint 021 shape)
- `process/SDD-ARC-PLAN.md` § Sprint 022

## artifact contract → Files created/modified

- `substrate-ui/web/app.ts` — ten `emit(...)` calls plus a `frame` counter and a `pane_id` mapper.
- `substrate-ui/tools/capture-grade.ts` — `VIEW_SWITCHED → pane-render` pairing invariant.
- `substrate-ui/harness/capture_signals.js` — extended: click gvTopo, drag seq slider, tap play/pause, change speed, then continue the existing round-trip.
- `substrate-ui/captures/sprint-021/console.jsonl` — regenerated to carry the new tags (same fixture path; the sprint-NNN capture is single-source).
- `substrate-ui/sprints/sprint-022-view-subsystem.md` — this file, closed with rubber duck pass.

## signal contract → Emits

`VIEW_SWITCHED`, `CURSOR_MOVED`, `PLAY_STARTED`, `PLAY_STOPPED`, `SPEED_CHANGED`, `GRAPH_RENDERED`, `TOPOLOGY_RENDERED`, `SCENE_RENDERED`, `IO_RENDERED`, `HEALTH_RENDERED` — every tag present at least once in the fixture; every Sprint 021 tag still present.

## observation contract

- Harness driving steps: after the Sprint 021 sequence, click `#gvTopo` (VIEW_SWITCHED to topology), wait for `TOPOLOGY_RENDERED`; click `#gvRun` back (VIEW_SWITCHED to run), wait for `GRAPH_RENDERED`; change `#speedsel` to a non-default (SPEED_CHANGED); click `#play` (PLAY_STARTED), wait ~500 ms, click again (PLAY_STOPPED); drag `#seq` via `.fill()` on a new value (CURSOR_MOVED source=drag); dispatch `beforeunload`.
- Expected pairing: `VIEW_SWITCHED{to_view: run|topology|scene|io}` followed within 1 s by exactly one `GRAPH_RENDERED|TOPOLOGY_RENDERED|SCENE_RENDERED|IO_RENDERED` whose `pane_id` matches and whose `subject_record` matches.
- Every pane-render tag carries `frame` monotonic across the capture.

## dual-contract close

Four gates:
1. `npx tsx tools/check-vocabulary-parity.ts` → exit 0 (17 distinct emits, all locked).
2. `npm run build` → exit 0.
3. `npm run e2e` → exit 0.
4. `npx tsx tools/capture-grade.ts captures/sprint-021/console.jsonl` → exit 0.

## rubber duck pass

*Sequence narration (fixture 237 signals, first cycle):* the boot pair fires (SESSION_INIT, RECORDS_LOADED) → the auto-select fires the record pair (RECORD_SELECTED, RECORD_LOAD_BEGIN, RECORD_LOADED) → the first render() pass paints GRAPH_RENDERED (frame 1, 6 lanes) then HEALTH_RENDERED (frame 2, verdict FINALISED). The harness launches game_of_life and picks it → the second record pair fires and the graph repaints (53 lanes, 2 cohorts). The harness toggles topology → VIEW_SWITCHED(to_view=topology) → TOPOLOGY_RENDERED (producers 4, triggers 2). Toggles back to run → VIEW_SWITCHED(to_view=run) → GRAPH_RENDERED. Scene → SCENE_RENDERED(generation_seq=261, the terminal frame). ModeToggle to io → IO_RENDERED(input_kind=seed, artifact_count=103). ModeToggle back → VIEW_SWITCHED(to_view=scene) — correctly names the underlying graphView, not "run". SPEED_CHANGED (30→120). PLAY_STARTED (from_seq=263, speed=120), which immediately rewinds to 0 and streams ~70 SCENE_RENDERED/HEALTH_RENDERED paints as the cursor advances via play_frame CURSOR_MOVED emits. PLAY_STOPPED (at_seq=263, reason=end_reached — the rewind reached the end before the harness clicked pause; a scrub_interrupt fires on the subsequent seq-input event). CURSOR_MOVED(seq=3, source=play_frame). RECORDS_PRUNED(cleared_count=1). SESSION_ENDED.

*Observations (six):* missing pair — none; order — the VIEW_SWITCHED → pane-render invariant holds for all 5 switches (each within ~0.5 ms); vocabulary gap — none (10 new tags all locked; parity gate green at 17 distinct emits); payload anomaly — SCENE_RENDERED with generation_seq=-1 fires when no frame has landed yet at the current cursor, chosen sentinel over omit-required-field (`generation_seq` is a required payload field per the vocab); timing surprise — first PLAY_STOPPED reason resolves to end_reached, not user_pause, because the rewind reaches max before the user click. Contract shape holds — the vocab's PLAY_STOPPED enum explicitly names end_reached. Correct behavior, not a defect; tone trace — payloads are structural (`frame`, `pane_id`, `verdict`, `speed`), no player-facing prose.

*Adversarial pass — could this close green while broken?* Two near-miss bugs the check surfaced:
1. **modeToggle emitted to_view: "run" while graphView was scene.** The next render then correctly ran renderScene → SCENE_RENDERED, which contradicted the "to_view=run" claim. The grader caught it as VIEW_SWITCHED → GRAPH_RENDERED FAIL (0 matches). Fixed at source: modeToggle now computes to_view from the underlying graphView when leaving io.
2. **Grader window mis-sized.** Original "exactly one within 1000 ms" flagged 71 SCENE_RENDERED matches (play frames at 120 fps) as a failure. Corrected to "the FIRST pane-render with matching subject_record after the switch must be the expected pane, within 500 ms." Play-frame paints are subsequent unrelated repaints; the invariant is a paint-cycle-scoped ordering claim, not a within-window count.

*Dispositions:* both bugs resolved-here; the grader now enforces the exact invariant the vocab names. Zero halted, zero surfaced.

## follow-on

Sprint 023 — stream + inspector, 3 tags (STREAM_RENDERED, EVENT_INSPECTED, PRODUCER_INSPECTED). Trigger sites: `renderStream()` tail, `.ev` click handler, `.lane` click handler.

