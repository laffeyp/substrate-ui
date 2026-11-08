# Sprint 380 — every gate reads the trace: a launch that breaks a vocabulary rule fails its gate

```yaml
---
id: 380
status: active
phase: SDD re-centre
pass_kind: observation
---
```

## scope

Plan r3 item 7. Most gates already assert their own tags, payloads and order on the trace files after the app closes (Addendum B3; the item 4 gates). This sprint makes every gate also read the app's own rule checks. At cleanup, `harness/shakeout/lib/electron.ts` reads every `main.jsonl` of the launch, and a launch with any INVARIANT_BROKEN fails its gate with exit 1, naming each broken rule and its state. A gate that plants breaks says so with `launchArgs({ plantsBreaks: true })`; only `invariant_signals.ts` does.

So a change that makes the app break its vocabulary fails every gate that drives that path, not only a gate written for it. Before this sprint, a temporary copy step collected these breaks across the full gate runs of 2026-11-08. It found the S5 rule that contradicted the records page (v0.21), the S8 checker error, the deep-link fault (sprint 374), pane 1's open order (sprint 377) and the stale rows on a switch (sprint 379).

The Rubber Duck Pass narrates the packaged trace with `scripts/read_trace.py` (sprint 378).

## artifact contract

### Files modified

- `harness/shakeout/lib/electron.ts` (`brokenRules`, `plantsBreaks`); `harness/shakeout/invariant_signals.ts`

## observation contract

All source and packaged gates pass on the final check, each launch emitting no INVARIANT_BROKEN.

Plant: sprint 379's fault restored fails `view_signals` (exit 1) through this check alone.
