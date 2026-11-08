# Sprint 359 — where a pane's transcript sits after each move (plan item 4, transcript scroll)

```yaml
---
id: 359
status: closed
phase: SDD re-centre
pass_kind: functional
---
```

## scope

Plan item 4, the transcript area, second part: `TRANSCRIPT_SCROLLED`, written by the one scroll owner, so a trace shows whether a pane follows the bottom. That is the question the 2026-10-02 postmortem (`process/planning/POSTMORTEM-2026-10-02-transcript-follow-bottom-regression.md`) said no gate could answer.

Files:
- `web/reveal/transcript/useScrollAnchor.ts`: a `report` after each move. The old `settle` body is now `place`, unchanged, and `settle(cause)` runs `place` and then `report`;
- `web/reveal/transcript/Transcript.tsx`: passes the pane id to the hook.

Design context (hard rule 8): no drawn output changes. Writes go to the trace only; the hook's scroll writes, reads and branches are as before.

## context_files

- `../sdd-kit-3/AGENTS.md`, `templates/SPRINT_CARD.md`, `grammar/PRINCIPLES.md` (proposal kinds)
- `web/vm/signals/versions/0.12.json`, `0.7-rationale.md` (view tags, dual-contract table), `proposals.json`, `unemitted.json`
- `web/reveal/transcript/useScrollAnchor.ts`, `Transcript.tsx`, `web/reveal/scroll_stick.ts`
- `harness/shakeout/transcript_follow.ts`, `harness/shakeout/lib/electron.ts`

## signal contract

### Emits

`TRANSCRIPT_SCROLLED` (pane_id, at_bottom, following, pinned, cause).

### Invariants

- E8 (new): following and not pinned implies at_bottom.
- `view_switch` is written each time the transcript is shown again. The other causes are written only when the place changed. The first draw writes nothing.

## artifact contract

### Files created

- `web/vm/signals/versions/0.13.json`, `0.13-rationale.md`; this card.

### Files modified

- `web/reveal/transcript/useScrollAnchor.ts`, `web/reveal/transcript/Transcript.tsx`; `harness/shakeout/transcript_follow.ts`
- `web/vm/signals/proposals.json` (three proposals), `unemitted.json` (22 → 21), `versions/current.json` → `0.13.json`; `WORKING_AGREEMENT.md` (prior copy `process/archive/WORKING_AGREEMENT-2026-11-07-v0.12.md`)

### Command exit codes

`npx tsc --noEmit` 0; `npm run lint` 0; `npm run build` 0; `npm run test:unit` 0; `uv run python -m pytest tests/ -q` 0; `npm run signals` 0.

## observation contract

`harness/shakeout/transcript_follow.ts`, from source and against the packaged app. The steps are unchanged: follow, read, resume, then switch views scrolled up and at the bottom. Then it reads `window-1.jsonl` and checks:
- E8 on every record;
- pane 1 in each record's context;
- in order: user (up), user (bottom), user (up), view_switch (up), user (bottom), view_switch (following).

Plants:
- following written without the bottom → E8 names the records;
- `following` reported as always true → step 1 named;
- the restore's report removed → step 4 named.

## done criteria

A follow-bottom regression fails the gate from the trace by name, as well as from the geometry.

## result

- **Built** as scoped. Vocabulary v0.13, with three proposals:
  - `P-0.13-SCROLL-CAUSE`: `resized`, for a ResizeObserver settle;
  - `P-0.13-SCROLL-PINNED`: a held card header, which overrides following;
  - `P-0.13-E8-FOLLOW`.
- **Commands.**
  - `npx tsc --noEmit` 0; `npm run lint` 0; `npm run build` 0;
  - `npm run test:unit` 194 passed;
  - `uv run python -m pytest tests/ -q` 321 passed, 5 skipped;
  - `npm run signals` 0: v0.13, 67 tags emitted, 21 pending.
- **Gates from source**, each launched with the rejection check, all exit 0:
  - `transcript_follow`, `stream_follows_bottom`, `side_graph_scroll`, `trace_files`;
  - `transcript_root_kept`, `resume_ended_session`, `both_session_shapes`, `tool_output_toggle`, `run_panes`;
  - `delegate_pane`, `find_counts_transcript`, `app_view_delegate_lane`, `records_keys`.
- **Packaged** (`npm run pack:dev`): `transcript_follow` and `trace_files` exit 0.
- **Plants**, each built with exit code 0 read, then the gate run:
  - Bottom not written while following: gate exit 1, E8 broken at proc_seq 169, 456 and 674, alongside three geometry failures.
  - `following` always true: gate exit 1, E8 broken and no user record with following false at step 1.
  - The restore's report removed: gate exit 1, no view_switch record at step 4.
  - Restored, rebuilt, gate 0.
- **Rubber Duck Pass** (`TRACE_PRINT=1`, source run, window-1.jsonl, pane 1). In order:
  - 412: user, at_bottom false, following false. The user scrolled up; reading.
  - 453: user, at_bottom true, following true. Back at the bottom; following again.
  - 494: user, not at the bottom, not following. Scrolled up before the switch.
  - 538: view_switch, not at the bottom, not following. Terminal shown again, scrolled-up place restored.
  - 582: user, at the bottom, following.
  - 583: view_switch, at the bottom, following. The reveal view shown a second time. Its first showing, during the switch scrolled up, wrote nothing, as a first draw.
  - 627: view_switch, at the bottom, following. Terminal again.

  No `row_arrived` record: nine turns arrived while following and the place never changed. No `pinned`: the gate clicks no card header.

  Observations:
  - Missing pair: none; the tag is its own view pair.
  - Order violation: none; E8 holds in all 7 records.
  - Vocabulary gap: two, resolved here in v0.13. The ResizeObserver settle had no cause value, and a pinned header could not be told from the regression.
  - Payload anomaly: none.
  - Timing surprise: none.
  - Tone trace: n/a; there are no strings.

  Recorded, not changed (instrumentation changes no behaviour): `savedByKey`, and now `reportedByKey`, are keyed by view and pane id. A closed pane's id reused by a new pane restores the old place and is written as a view_switch.
