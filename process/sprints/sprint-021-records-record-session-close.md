# Sprint 021 — session close + records + record subsystem

```yaml
---
id: 021
status: closed
phase: 3
pass_kind: implementation
---
```

## scope

Wire five emit sites in `web/app.ts`: `SESSION_ENDED` on `beforeunload`; `RECORD_SELECTED` on the rail click handler; `RECORDS_PRUNED` on the your-runs clear affordance; `RECORD_LOAD_BEGIN` at `selectRecord()` entry; `RECORD_LOADED` at `selectRecord()` post-fetch. Extend `tools/capture-grade.ts` so the `RECORD_SELECTED → RECORD_LOADED` pairing enforces the vocab invariant verbatim: exactly one matching-name `RECORD_LOADED` per `RECORD_SELECTED`, staleness-drop honored (a superseding `RECORD_SELECTED` before the load returns silences the first). Bootstrap `captures/sprint-021/` with a JSONL fixture captured by a new `harness/capture_signals.js` script that boots the console, clicks a record, prunes, and dumps `window.__signals`.

## context_files

- `signals/versions/0.1.json` (records + record + session categories; invariants #4 and staleness clause on `RECORD_LOADED`)
- `web/app.ts` (`loadRecords`, `selectRecord`, `.rail-clear` handler)
- `web/instrumentation/sdd.ts` (emit contract)
- `tools/capture-grade.ts` (current pairing check)
- `harness/e2e_console.js` (Playwright driving pattern)
- `process/SDD-ARC-PLAN.md` § Sprint 021

## artifact contract → Files created/modified

- `substrate-ui/web/app.ts` — five `emit(...)` calls at the sites above.
- `substrate-ui/tools/capture-grade.ts` — pairing check for `RECORD_SELECTED` rewritten to enforce exactly-one + matching-name + staleness-drop, per the vocab invariant.
- `substrate-ui/harness/capture_signals.js` — new Playwright script; boots console, selects a record, clicks the your-runs clear affordance, exits; writes `captures/sprint-021/console.jsonl`.
- `substrate-ui/captures/sprint-021/console.jsonl` — first committed signal fixture.
- `substrate-ui/sprints/sprint-021-records-record-session-close.md` — this file, closed with rubber duck pass.

## signal contract → Emits

`SESSION_ENDED`, `RECORD_SELECTED`, `RECORDS_PRUNED`, `RECORD_LOAD_BEGIN`, `RECORD_LOADED` — every tag must appear in `captures/sprint-021/console.jsonl` at least once; `SESSION_INIT` and `RECORDS_LOADED` (from Sprint 020) remain present.

## observation contract

- Driving steps (in `harness/capture_signals.js`): open `/`, wait for records, click the top record in the rail, wait for `RECORD_LOADED` to appear in `window.__signals`, click the your-runs `.rail-clear` affordance (auto-accepting the confirm dialog), close the page.
- Expected `window.__signals` contains-in-order: `SESSION_INIT`, `RECORDS_LOADED`, `RECORD_SELECTED`, `RECORD_LOAD_BEGIN`, `RECORD_LOADED`, `RECORDS_PRUNED`, `SESSION_ENDED`.
- Expected pairing (vocab invariant verbatim): every `RECORD_SELECTED` is followed within 5 s by exactly one `RECORD_LOADED` with matching `name`; if a second `RECORD_SELECTED` fires first, no `RECORD_LOADED` for the first name may appear afterward (staleness guard).

## dual-contract close

Four gates:
1. `npx tsx tools/check-vocabulary-parity.ts` → exit 0 (all emitted tags in the lock; the sprint's five new tags all locked).
2. `npm run build` → exit 0.
3. `npm run e2e` → exit 0 (parent regression clean; no emit throws in the boot path).
4. `npx tsx tools/capture-grade.ts captures/sprint-021/console.jsonl` → exit 0 (contains-in-order + pairing invariants all green).

## rubber duck pass

*Sequence narration (from `captures/sprint-021/console.jsonl`, 11 signals):* SESSION_INIT (vocab 0.1) → RECORDS_LOADED (115 total, 90 runs, 25 demos) → the auto-select fires RECORD_SELECTED (launch_agent_calc_e1ada03842d4, prior null) → RECORD_LOAD_BEGIN (same name) → RECORD_LOADED (event_count 22, status finalised). Harness launches game_of_life, calls loadRecords → RECORDS_LOADED (116, 91, 25). Harness clicks the top rec → RECORD_SELECTED (launch_game_of_life_fd2f3b661944, prior launch_agent_calc_e1ada03842d4) → RECORD_LOAD_BEGIN → RECORD_LOADED (event_count 264, status finalised). Harness clicks .rail-clear → RECORDS_PRUNED (cleared_count 91). Harness dispatches beforeunload → SESSION_ENDED.

*Observations (six):* missing pair — none; order violation — none (SESSION_INIT is first, SESSION_ENDED is last, RECORD_LOAD_BEGIN precedes RECORD_LOADED both times, RECORDS_LOADED precedes each RECORD_SELECTED); vocabulary gap — none (all seven tags in v0.1 lock; parity gate green); payload anomaly — none (event_count matches server state; prior_name correctly threads null → the first name → the second name; cleared_count 91 matches the run_count seen in the second RECORDS_LOADED); timing surprise — the auto-select at ts=128.9 fires before any user click, expected per `loadRecords()`'s deep-link fallback branch; tone trace — payloads carry structural identifiers (`name`, `status`, `event_count`), no player-facing prose to grade.

*Dispositions:* clean. Two adversarial checks pass by construction: (a) RECORD_SELECTED does NOT fire from the rail click handler — it fires only from selectRecord() entry, so the deep-link and delegate paths emit it too; (b) the grader enforces exactly-one + staleness-drop verbatim, so a duplicate RECORD_LOADED or a stale-load after supersede would FAIL. Zero halted. Zero surfaced.

## follow-on

Sprint 022 — view subsystem, 10 tags. Trigger sites: `$("gvRun").onclick`, the seq input handler, transport buttons, each `render*()` tail.

