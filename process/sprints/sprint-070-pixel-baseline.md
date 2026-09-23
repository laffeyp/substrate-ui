# Sprint 070 — pixel baseline

```yaml
---
id: 070
status: pending
phase: 8
pass_kind: observation
---
```

## scope

Author a Playwright script that captures a fixed set of reveal-shell screenshots and stores them under `captures/pixel-baseline-2026-09-23/`. Author a companion diff script that compares the current build against that baseline at a 0.1% pixel tolerance. No shell code changes; this sprint captures ground truth before any Phase 8 code moves. Twelve baseline PNGs total (six states × two viewports).

## prerequisites

- 062 (ESLint wired into `npm run build`).

## context_files

- `sdd-kit-2/AGENTS.md`
- `process/planning/PLAN-2026-09-23-phase-8-transcript-atom-migration.md` (§4.1, §7 Sprint 070, §9 R1).
- `web/vm/signals/versions/0.1.json` (locked; no new tags).
- `WORKING_AGREEMENT.md` (if present).
- `harness/vm_smoke.ts` and `harness/shakeout/lib/server.ts` (pattern for starting the server, driving a session).
- `harness/shakeout/lib/driver.ts` (real-driver picker).

## signal contract

### Emits

None from the harness itself. The baseline capture drives real sessions through `SessionController`; every signal already declared in `signals/0.1.json` fires normally during those sessions. No new tags.

### Consumes

- Every context file above.

### Invariants

- `signals/0.1.json` unmodified.
- No changes under `web/`, `electron/`, or `substrate/`.
- Captures are reproducible: rerunning `npm run pixel:baseline` on a fresh clone yields byte-identical PNGs (same fonts, same DPR, same Chromium version).

## artifact contract

### Files created

- `harness/pixel_baseline.ts`
- `harness/pixel_diff.ts`
- `captures/pixel-baseline-2026-09-23/` (directory containing 12 PNGs).

### Files modified

- `package.json` — add `pixel:baseline` and `pixel:diff` scripts.

### Content assertions

- `harness/pixel_baseline.ts` calls `chromium.launch({ channel: "chrome", headless: true })` and `newContext({ deviceScaleFactor: 2, viewport: {…} })`.
- `harness/pixel_baseline.ts` writes 12 PNGs; each PNG file ≥ 2 KB.
- `harness/pixel_diff.ts` imports `pixelmatch` and reports one line per state × viewport pair, mismatched-pixel-fraction included.
- `package.json` contains `"pixel:baseline": "npx tsx harness/pixel_baseline.ts"` and `"pixel:diff": "npx tsx harness/pixel_diff.ts"`.

### Command exit codes

- `npm run pixel:baseline` returns 0 on first run (produces the baseline).
- `npm run pixel:diff` returns 0 (reports "0/12 deltas" against the just-captured baseline).
- `npm run typecheck` returns 0.
- `npm run lint` returns 0.
- `npm run smoke:vm` returns 0.

## observation contract

### UI driving steps

Six states drive per viewport:

1. `empty` — shell booted, no session.
2. `one_turn` — deterministic driver, one turn parked.
3. `multi_tool` — real driver, three bash calls; scroll at top.
4. `mid_scroll` — same session as `multi_tool`, `_termScrollEl.scrollTop = scrollHeight / 2`.
5. `descended` — one delegate turn, descent into the child record.
6. `error` — session ended with a parked model error.

Two viewports per state: `{ width: 1440, height: 900 }` and `{ width: 900, height: 380 }`.

### Expected log substrings

- `[pixel-baseline] captured N=12 screenshots` in the script's stdout.
- No `page error` lines in the script's stdout.

### Expected runtime signals

- Every signal the driven sessions emit (`SESSION_OPEN_REQUESTED`, `SESSION_OPEN_ACKED`, `TURN_SUBMITTED`, `TURN_ACK`, `STREAM_ENVELOPE_APPENDED`, `TURN_PARKED`, `SESSION_END_REQUESTED`, `SESSION_ENDED_LOCAL`) appears in the buffer. All 30 lock tags remain valid.

### Expected screenshot / visual state

- Each PNG's dimensions match its declared viewport × DPR (e.g., 2880 × 1800 for 1440 × 900 @ DPR 2).
- Baseline PNGs land under `captures/pixel-baseline-2026-09-23/<state>-<viewport>.png`.

## done criteria

Twelve baseline PNGs sit on disk under a dated directory. `npm run pixel:diff` reports zero deltas against them. The shell code is untouched.

## notes

Pinning `deviceScaleFactor: 2` matches the shipping display class; running the baseline at DPR 1 and a downstream diff at DPR 2 would flag every anti-aliased edge (§9 R1). CI must use the same Playwright-pinned Chromium version this sprint captures against.
