---
id: 195
status: closed
phase: shell-to-react A2
pass_kind: observation
---

# Sprint 195 — the baseline the move is held to

## scope

Run every check on today's tree and record each result in this card: `npm run build`, `npm run test:unit`, `npm run test:py`, `npx tsx harness/vm_smoke.ts`, `npm run shakeout` (Axis A), the Axis C Electron flows, and `npm run gates:electron` (45 scripts). Capture the pixel baseline as `captures/pixel/baseline-2026-11-04/` with `npm run pixel:capture`. Add `captures/pixel/*` to `.gitignore` with `!captures/pixel/baseline-*/` so the baseline is kept and check runs are not. Record the Electron and Chromium versions the baseline was drawn with. A check that fails today is recorded with its output, not fixed here.

## prerequisites

- 194 closed

## context_files

- `../sdd-kit-3/AGENTS.md`
- `process/planning/2026-11-04-shell-to-react/PLAN-2026-11-04-shell-to-react-r4.md` (Tests already in place; Gates)
- `RUNBOOK-2026-10-29-project-r6.md` (Tests only; Known failures on the current tree)
- `package.json` scripts

## signal contract

### Emits

- None new. The gates and flows assert their own signals; their results are what this card records.

### Invariants

- No file under `web/`, `server.py` or `electron/` changes.

## artifact contract

### Files created

- `captures/pixel/baseline-2026-11-04/` (28 PNGs)

### Files modified

- `.gitignore`

### Command exit codes

- Each command above is run and its exit code recorded; the baseline is what they return today.
- `npm run pixel:diff -- baseline-2026-11-04 <a second capture>` returns 0.

## observation contract

### Driving steps

- The commands above, in that order; a second pixel capture compared with the baseline.

### Expected results

- `vm_smoke` fails at its `/help` step, as the runbook records; every other result is recorded as it comes.
- The baseline and a second capture differ by 0 pixels.

## done criteria

Every check's result on today's tree is written down, and the pixel baseline is captured, kept in git, and reproducible.

## self-review checklist

- [x] Scope is concrete and bounded.
- [x] `context_files` covered.
- [x] No new tags.
- [x] Artifact contract gradable.
- [x] Observation contract present.
- [x] Files: `.gitignore` and the capture folder; one concept.

## result

Closed 2026-11-04. Today's tree, before any move:

| Check | Exit | Result |
|---|---|---|
| `npm run build` | 0 | `reveal-*.js` 79.99 kB (24.64 kB gzip) |
| `npm run test:unit` | 0 | 62 of 62 |
| `npm run test:py` | 1 | 253 passed, 5 skipped, 4 failed: `test_envelope_kinds_generated_096.py`, all four "is stale" checks |
| `uv run … scripts/gen_kinds.py --check` (CI runs it) | 1 | the four `web/vm/*.gen.ts` files read as stale |
| `npx tsx harness/vm_smoke.ts` | 1 | "12 steps, FAILED at /help renders a slash-command listing: (no help row)" (runbook, known) |
| `npm run shakeout` (Axis A, 10 flows × 5) | 1 | every flow ok 5/5, tags 29 green; 12 defects: `help_no_listing` ×5 (known), `name_not_persisted` ×4, `cli_empty_reply` ×3 (`cursor-agent` returned no reply text) |
| `gates:electron`, each of its 45 commands run alone | 0 for all 45 | Axis C flows 0 defects; 2–12 s each; each log ends on its own ok line |
| Pixel baseline | 0 | `captures/pixel/baseline-2026-11-04/`, 28 PNGs; a second capture differs by 0 pixels in all 28 |

Drawn with Electron 44.4.5, Chromium 152.0.7977.130, on this machine (macOS, Apple silicon, device scale 2). `.gitignore` now ignores `captures/pixel/*` except `baseline-*/`.

**Not in the runbook's known failures.** (1) The four generated files are stale because sprint 191 (commit `d4322e1`, 2026-10-27) put the SPDX header on them and `scripts/gen_kinds.py` writes them without it; CI's `gen_kinds --check` has failed since. (2) `name_not_persisted`: the shakeout's slash router reads a session's name back as null after naming it. (3) `cli_empty_reply`: `cursor-agent` on this machine returns no reply text. None is in the window's template, so none blocks the move; each is recorded as surfaced.

**What later sprints are held to.** The move keeps every result in this table as it is: the 45 gates and the unit specs green, the pixel captures at 0 differing pixels, and the failing checks failing the same way, no worse.

## Rubber Duck pass

*Sequence.* The gates' and flows' own signal checks passed: shakeout Axis A "tags 5/5: 29", Axis C "tags 5/5: 5".

*Observations.*
- Timing surprise: most gates take 2–4 s; each log was read for its own pass line.
- Payload anomaly: `name_not_persisted`, a name sent and read back null.
- The gate runner chains its 45 scripts with `&&`, so a run stops at the first failure and records nothing after it; this baseline ran each alone.

*Dispositions.* The three new failures: `recorded` (surfaced below; outside the move). The `&&` chain: `deferred` — later sprints run their area's gates alone; G1 runs all 45 alone.
