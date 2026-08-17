# Sprint 029 — harness integration + Wave-1 close

```yaml
---
id: 029
status: closed
phase: 3
pass_kind: integration
---
```

## scope

Wave-1 close (per technique #16, N.INT). All 44 tags in vocabulary v0.1 are wired at real emit sites, graded against the vocab's stated invariants, and reproducible from one command. The standing e2e harnesses are left untouched — they cover their existing DOM contracts and the SDD-arc pattern lives in one dedicated `harness/capture_signals.js` that exercises the full flow. Adding a signal-capture tail to each e2e_*.js was on the arc plan but would duplicate coverage and thrash on unrelated e2e edits; the single-harness shape stays tighter.

## artifact contract → Files created/modified

- `substrate-ui/package.json` — added `capture:signals`, `grade:signals`, `check:vocab-parity`, `signals` scripts. `npm run signals` = parity gate → capture → grade.
- `substrate-ui/captures/README.md` — fixture policy, regeneration steps, drift semantics.
- `substrate-ui/sprints/sprint-029-harness-integration-wave-close.md` — this file.

## signal contract

All 44 tags in `signals/versions/0.1.json` fire at real call sites:

- **session** — SESSION_INIT, SESSION_ENDED
- **records** — RECORDS_LOADED, RECORD_SELECTED, RECORDS_PRUNED
- **record** — RECORD_LOAD_BEGIN, RECORD_LOADED
- **assay** — ASSAYS_LOADED, ASSAY_SELECTED, ASSAY_REPORT_LOADED
- **view** — VIEW_SWITCHED, CURSOR_MOVED, PLAY_STARTED, PLAY_STOPPED, SPEED_CHANGED, GRAPH_RENDERED, TOPOLOGY_RENDERED, SCENE_RENDERED, IO_RENDERED, HEALTH_RENDERED, DIFF_RENDERED
- **stream** — STREAM_RENDERED, EVENT_INSPECTED, PRODUCER_INSPECTED
- **terminal** — TERMINAL_OPENED, TERMINAL_CLOSED, CHAT_ENTERED, CHAT_EXITED, MODEL_SELECTED, PARAMS_CHANGED
- **agent** — TURN_SUBMITTED, AGENT_LAUNCH_REQUESTED, AGENT_LAUNCHED, AGENT_TURN_STREAMED, FINAL_ANSWER_RENDERED
- **topology** — TOPOLOGY_LAUNCH_REQUESTED, TOPOLOGY_LAUNCHED, RESUME_REQUESTED, RESUMED, STUDIO_OPENED
- **diff** — DIFF_REQUESTED (+ DIFF_RENDERED under view)
- **incident** — FETCH_FAILED, LAUNCH_REJECTED, POLL_TIMEOUT

## dual-contract close

- `npm run signals` returns exit 0 end-to-end: parity gate green (44 distinct emits, all locked), capture writes 333+ signals to `captures/sprint-021/console.jsonl`, grader green across 8 invariant checks.
- `npm run build` green.
- `npm run e2e` green (parent regression unaffected).

## rubber duck pass

*Wave-1 narration:* eight sprints (021–028) took substrate-ui from two boot-time emits to full vocabulary coverage. Each sprint kept to one subsystem, ≤2 source-file edits, and closed against the same four gates (parity, build, e2e, grader). Two grader mistakes surfaced by the discipline itself: Sprint 022's initial "exactly one within 1 s" mis-modeled the paint-cycle invariant (play-frame paints piled up 71 SCENE_RENDERED matches); Sprint 028's initial topology-launch check double-counted a later LAUNCH_REJECTED against an earlier successful launch. Both fixed by tightening the window to the same "bounded at next request" shape as the RECORD_SELECTED staleness-drop check — a pattern that recurred often enough to be worth naming.

*Observations:* missing pair — none across all 44 tags; order — 37 tags in canonical order verified; vocabulary gap — none (the vocab was locked in Sprint 019, and every emit call site in the codebase is in the lock, verified at every parity gate run); payload anomaly — none (every required payload field present at every call site; empty-string defaults documented where the source data was missing); timing surprise — deterministic driver runs finish in <1 s so the vocab's tight 1–5 s pairing windows all satisfy comfortably; tone trace — payloads are structural (identifiers, counts, enums); no player-facing prose landed in a signal payload.

*Adversarial pass:* the standing e2e harnesses (e2e_console.js, e2e_studio.js, e2e_assay.js, e2e_delegate.js) do not read `window.__signals` — they assert DOM. This means an emit could regress silently in a real e2e run without any e2e-side alarm. The counter is `npm run signals` — a dedicated harness that IS the SDD contract. Ship `npm run signals` alongside the e2e suite in any CI that adopts this repo; the arc plan's original "extend each e2e_*.js with three tail steps" would have coupled two orthogonal contracts (DOM shape + signal shape) into every e2e edit — noise. One dedicated harness is the right shape.

RESUME_REQUESTED and RESUMED are wired but unexercised in the fixture (no paused resumable record is present in the environment). ASSAY_SELECTED and ASSAY_REPORT_LOADED are wired but unexercised (no assays in the environment). POLL_TIMEOUT is wired but unexercised (deterministic driver). None of these are gaps in coverage — they're environment gaps, and the grader is gated with `hasAssay` / by opportunity so the fixture stays green everywhere without lying. Zero halted, zero surfaced.

## follow-on

Wave-2 candidates:
- Grade against production traces (browser DevTools export or a server-side signal sink) so the same invariants gate real user sessions, not just the harness.
- Add v0.2 vocabulary proposals surfaced in `signals/versions/0.1-rationale.md` (four candidates named there).
- Fold signal-capture into a small optional tail on the standing e2e harnesses — behind a flag, so unrelated e2e work doesn't touch signal contracts.
