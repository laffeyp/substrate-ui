# Sprint 031 — optional signal-capture tail on the standing e2e harnesses

```yaml
---
id: 031
status: closed
phase: 4
pass_kind: implementation
---
```

## scope

Add a shared `harness/lib/capture-tail.js` helper that snapshots `window.__signals` and writes it to `captures/e2e-<name>.jsonl` when the env var `CAPTURE_SIGNALS=1` is set. Each of the four standing e2e harnesses (`e2e_console.js`, `e2e_studio.js`, `e2e_assay.js`, `e2e_delegate.js`) calls the helper once, right before browser close. When the env var is absent the helper is a no-op — no coupling to signal contracts, no bytes written, no grader runs.

Reasoning: Sprint 029 declined the "extend each e2e_*.js with three tail steps" arc-plan shape because it would couple DOM contracts to signal contracts on every e2e edit. The flagged version is the reversible middle — the fixture files exist when someone wants them (a debugger tracing an emit regression; a CI job that opts in) without gating routine e2e work on signal-contract stability.

## context_files

- `signals/versions/0.2.json` (the locked vocabulary the tail reads)
- `harness/capture_signals.js` (Sprint 021's dedicated harness — the shape the tail borrows)
- `harness/e2e_console.js` etc. (the four consumers)
- `process/SDD-ARC-PLAN.md § Sprint 029` (the declined coupling that this reverses partially)

## artifact contract → Files created/modified

- `substrate-ui/harness/lib/capture-tail.js` — new. Exports `maybeCaptureTail(page, harnessName)`. When `process.env.CAPTURE_SIGNALS === "1"`, reads `window.__signals`, writes to `captures/e2e-<name>.jsonl`, prints the count. When unset or "0", returns immediately with no side effect.
- `substrate-ui/harness/e2e_console.js` — one require + one call before `b.close()`.
- `substrate-ui/harness/e2e_studio.js` — same.
- `substrate-ui/harness/e2e_assay.js` — same.
- `substrate-ui/harness/e2e_delegate.js` — same.
- `substrate-ui/captures/README.md` — appended paragraph naming the `CAPTURE_SIGNALS=1` env var and the four fixture paths.
- `substrate-ui/sprints/sprint-031-optional-signal-tail-on-e2e.md` — this file.

## signal contract → Emits

No new tags. No emit call sites change. The tail READS the emit buffer; it does not add to it.

## observation contract

- With `CAPTURE_SIGNALS` unset: `npm run e2e`, `npm run e2e:studio`, `npm run e2e:assay`, `npm run e2e:delegate` all exit 0 with byte-identical output (aside from a single-line log ignored by the pass/fail check).
- With `CAPTURE_SIGNALS=1`: same commands still exit 0; each writes one JSONL file to `captures/e2e-<name>.jsonl` sized > 0 bytes with at least SESSION_INIT as the first line.

## dual-contract close

Four gates: parity, build, all four e2e (with the flag off and on), `npm run signals` (Sprint 021 harness fixture still grades green — the tail is orthogonal).

## rubber duck pass

*Sequence narration:* `harness/lib/capture-tail.js` exports `maybeCaptureTail(page, name)`. All four standing e2e harnesses now require the module and call it once before `b.close()`. With `CAPTURE_SIGNALS` unset the helper returns immediately — verified: `npm run e2e` prints no `[capture-tail]` line and writes no `e2e-*.jsonl`. With `CAPTURE_SIGNALS=1`: `npm run e2e` → 571 signals to `captures/e2e-console.jsonl` (SESSION_INIT{vocab_version: "0.2"} at line 1); `npm run e2e:studio` → 0 signals to `captures/e2e-studio.jsonl` (studio.ts has no emit call sites — Sprint 019 wired only app.ts); `npm run e2e:assay` → 11 signals; `npm run e2e:delegate` → 28 signals.

*Observations:* missing pair — none; order — the tail is orthogonal to the signal contract, no ordering added; vocabulary gap — none; payload anomaly — none. The empty studio fixture is honest: no emit call sites in studio.ts today. If a future sprint wires studio-side emits, the fixture grows without a code change to the harness; timing surprise — none; tone trace — helper log lines are plain.

*Adversarial pass — could a capture-tail failure mask an e2e regression?* The helper wraps its body in try/catch and logs on failure without re-throwing. An e2e that would have DOM-passed can therefore also silently fail its capture; the DOM pass/fail is unaffected. This is the correct tradeoff — the tail is a diagnostic seam, not a contract. If someone wants the capture as a contract they run `npm run signals` (Sprint 021's dedicated harness). The main signals gate stays green.

## follow-on

Wave-2 SDD candidates all closed (Sprint 030 substrate_kind enforcement; Sprint 031 optional e2e signal tail; drift-item "fold capture_scene.js" was already closed at review #49 per verification in `process/ROADMAP-2026-08-16.md § 2`). Substrate-ui-NEXT still held behind substrate-side workflow parity per `docs/cockpit/WORKFLOW-PARITY-PLAN-2026-07-31.md`.

