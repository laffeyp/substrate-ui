# Sprint 026 — topology + launch

```yaml
---
id: 026
status: closed
phase: 3
pass_kind: implementation
---
```

## scope

Five emit sites:
- `TOPOLOGY_LAUNCH_REQUESTED` at `$("launchbtn").onclick` entry (carries `topology_name`).
- `TOPOLOGY_LAUNCHED` after `POST /api/launch` returns (carries `topology_name`, `run_name`).
- `RESUME_REQUESTED` at `$("resumebtn").onclick` entry (carries `record_name`).
- `RESUMED` after `POST /api/resume` returns (carries `record_name`).
- `STUDIO_OPENED` from a new header studio link's click handler (carries `via: header_link`); a tiny setTimeout defers the actual navigation so the emit buffers before the page unloads.

Grader extension: TOPOLOGY_LAUNCH_REQUESTED{topology_name: T} is followed within 5 s by exactly one TOPOLOGY_LAUNCHED{topology_name: T} OR one LAUNCH_REJECTED{kind: topology} (vocab invariant #10; LAUNCH_REJECTED branch stays vacuous until Sprint 028).

Harness extension: click launchsel → pick a topology → click launchbtn → wait TOPOLOGY_LAUNCHED; click studiolink (harness snapshots signals before nav lands).

Resume path is exercised opportunistically — if a paused record exists, click resume. Otherwise the RESUME_REQUESTED/RESUMED tags fire live in a resume scenario but not in this fixture; the signal contract accepts that (they're in the vocab but not required in every capture).

## context_files

- `signals/versions/0.1.json`
- `web/app.ts` (`launchbtn`, `resumebtn`)
- `web/index.html` (header link)
- `tools/capture-grade.ts`
- `harness/capture_signals.js`

## artifact contract → Files created/modified

- `substrate-ui/web/app.ts` — five emit sites; studio link handler wired.
- `substrate-ui/web/index.html` — `#studiolink` added to the header.
- `substrate-ui/tools/capture-grade.ts` — TOPOLOGY_LAUNCH_REQUESTED → TOPOLOGY_LAUNCHED|LAUNCH_REJECTED pairing.
- `substrate-ui/harness/capture_signals.js` — launch + studio click.
- `substrate-ui/captures/sprint-021/console.jsonl` — regenerated.
- `substrate-ui/sprints/sprint-026-topology-launch.md` — this file.

## signal contract → Emits

TOPOLOGY_LAUNCH_REQUESTED, TOPOLOGY_LAUNCHED, STUDIO_OPENED in every fixture; RESUME_REQUESTED, RESUMED conditional on a paused record being present.

## observation contract

- Harness picks the first non-empty `#launchsel` option, clicks `#launchbtn`, waits TOPOLOGY_LAUNCHED. Then clicks `#studiolink` (preventDefault; STUDIO_OPENED fires; navigation deferred).

## dual-contract close

Four gates.

## rubber duck pass

*Sequence narration:* the harness picks the first bundled topology, clicks launch → TOPOLOGY_LAUNCH_REQUESTED{topology_name=adversarial_pair} → POST returns → TOPOLOGY_LAUNCHED{run_name=launch_adversarial_pair_<hash>} → selectRecord fires RECORD_SELECTED + RECORD_LOAD_BEGIN, awaits 4 projections → RECORD_LOADED lands with the new run's stats. Click studio → STUDIO_OPENED{via=header_link}. Fixture 343 signals, 32 tags in expected order.

*Observations:* missing pair — none; order — TOPOLOGY_LAUNCH_REQUESTED → TOPOLOGY_LAUNCHED exactly-one within 5 s; the RECORD_SELECTED implicit in the launch flow paired inside the fixture window (the harness explicitly waits for the RECORD_LOADED matching the new run before pruning); vocabulary gap — none (36 distinct emits, all locked); payload anomaly — none; timing surprise — the initial rubber-duck run failed with "no matching RECORD_LOADED within 5000 ms" for the launched run; root cause was the harness racing past selectRecord's async fetch chain to prune before RECORD_LOADED landed. Fix: waitForFunction on RECORD_LOADED matching the new run_name. Grader caught the real bug — the earlier "prune immediately" ordering would ship a fixture with a stale unpaired RECORD_SELECTED. Anti-brittleness: the fix is at the harness (test-side), not at the app.

*Adversarial pass:* the STUDIO_OPENED emit sits on a click handler with target="_blank" — the emit lands in the buffer BEFORE the browser opens the new tab, and the current page (with its signals buffer) survives. A future refactor that removes target="_blank" would race navigation vs snapshot. Noted; the handler is one line and the intent is documented inline.

RESUME_REQUESTED / RESUMED not exercised in this fixture — no paused resumable record was launched into the session. The vocab contract doesn't require them per capture; the tags fire live when a resume click happens. Zero halted, zero surfaced.

## follow-on

Sprint 027 — diff + assay, 5 tags (DIFF_REQUESTED, DIFF_RENDERED, ASSAYS_LOADED, ASSAY_SELECTED, ASSAY_REPORT_LOADED).

