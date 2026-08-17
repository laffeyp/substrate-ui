# Sprint 027 — diff + assay

```yaml
---
id: 027
status: closed
phase: 3
pass_kind: implementation
---
```

## scope

Five emit sites:
- `DIFF_REQUESTED` at the diff selector `onchange` (carries `a`, `b`).
- `DIFF_RENDERED` at `renderDiff()` tail, on both the equivalent and diverged branches (carries the universal view payload plus `first_divergence_seq`; -1 when equivalent).
- `ASSAYS_LOADED` at `loadAssays()` tail (carries `count`).
- `ASSAY_SELECTED` at `selectAssay()` entry (carries `name`, `prior_name`).
- `ASSAY_REPORT_LOADED` after the `/api/assay/<name>` fetch resolves and passes the staleness guard (carries `name`, `arm_count`, `case_count`, optional `verdict`).

Grader extension: DIFF_REQUESTED{a, b} followed within 5 s by exactly one DIFF_RENDERED whose `subject_record` matches `a` (the a-side record is `STATE.name` at emit time). ASSAY_SELECTED followed within 5 s by exactly one ASSAY_REPORT_LOADED with matching `name` (staleness guard analogous to RECORD_SELECTED → RECORD_LOADED).

Harness extension: after RECORD_LOADED, click the second option in `#diffsel` → wait DIFF_REQUESTED + DIFF_RENDERED. If any `.assay` is present in the rail, click the first → wait ASSAY_SELECTED + ASSAY_REPORT_LOADED. If no assays exist in this environment, the ASSAY tags are vacuous; ASSAYS_LOADED still fires at boot with count=0.

## context_files

- `signals/versions/0.1.json`
- `web/app.ts` (`renderDiff`, `loadAssays`, `selectAssay`, `#diffsel` onchange)
- `tools/capture-grade.ts`
- `harness/capture_signals.js`

## artifact contract → Files created/modified

- `substrate-ui/web/app.ts` — five emit sites.
- `substrate-ui/tools/capture-grade.ts` — DIFF and ASSAY_SELECTED pairings added; DIFF_RENDERED added to the frame-monotonic pane-render set.
- `substrate-ui/harness/capture_signals.js` — diff + assay steps.
- `substrate-ui/captures/sprint-021/console.jsonl` — regenerated.

## signal contract → Emits

ASSAYS_LOADED, DIFF_REQUESTED, DIFF_RENDERED in every fixture; ASSAY_SELECTED + ASSAY_REPORT_LOADED conditional on assays existing.

## dual-contract close

Four gates.

## rubber duck pass

*Sequence narration:* ASSAYS_LOADED (count=0 in this environment — no assays deployed) fires right after boot's RECORDS_LOADED. Harness selects the second diff option → DIFF_REQUESTED{a=<current>, b=<other>} → renderDiff runs → DIFF_RENDERED (equivalent branch or divergence branch depending on the pair; first_divergence_seq set accordingly). No .assay rows exist so ASSAY_SELECTED / ASSAY_REPORT_LOADED not exercised — vacuous in this fixture. Fixture: 378 signals, 35 tags in expected order.

*Observations:* missing pair — none; order — DIFF_REQUESTED → DIFF_RENDERED within 5 s with matching a-record; vocabulary gap — none (41 distinct emits, all locked); payload anomaly — none (DIFF_RENDERED carries first_divergence_seq = the real divergence seq or -1 sentinel for the equivalent branch); timing surprise — the initial rubber-duck run failed CONTAINS_IN_ORDER because EXPECTED_ORDER placed DIFF_REQUESTED after STUDIO_OPENED while the harness fires it early (right after boot); fixed by moving DIFF_REQUESTED/DIFF_RENDERED to their actual position in the order (after HEALTH_RENDERED, before VIEW_SWITCHED); tone trace — payloads structural.

*Adversarial pass:* ASSAY_SELECTED → ASSAY_REPORT_LOADED pairing is defined but not exercised in this environment (no assays configured). The check is present and vacuous — a real assay-carrying deployment would exercise both. Noted; the `hasAssay` gate in the harness lets the fixture stay green across environments without lying about coverage. Zero halted, zero surfaced.

## follow-on

Sprint 028 — incident coverage, 3 tags (FETCH_FAILED, LAUNCH_REJECTED, POLL_TIMEOUT).

