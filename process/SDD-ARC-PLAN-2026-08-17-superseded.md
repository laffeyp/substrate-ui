# SDD-ARC-PLAN.md — superseded by Wave-1 close + v0.3 lock (2026-08-17)

*New file per no-in-place-edits. `SDD-ARC-PLAN.md` (2026-08-14, v2 revised 2026-08-15) stays on disk as audit trail; this file names what actually landed and what a reader should consult instead.*

---

## Status

Superseded. The plan scoped sprints 021–029 for a nine-sprint SDD arc across the console (`web/app.ts`). All nine closed 2026-08-14 → 2026-08-15 (Wave-1). Sprints 030 (substrate_kind FK enforcement), 031 (optional e2e tail), and 032 (studio surface instrumentation, vocab v0.3) landed after. The arc plan's sprint chain and cadence gates no longer describe what is on disk.

## Consult instead

- `process/ROADMAP-2026-08-16.md` — current roadmap, Wave-1 status, held UI-NEXT queue.
- `sprints/sprint-018-typescript-conversion.md` through `sprint-032-studio-instrumentation.md` — every landed sprint card.
- `signals/versions/current.json` (symlink → 0.3.json) — the locked vocabulary.
- `signals/versions/0.3-rationale.md` — the current rationale, with the per-change ledger back through 0.1.
- `process/BLACKBOARD.md ## Built` — chronological ledger of every sprint close, 2026-08-14 through 2026-08-17.

## Where the prior plan reads wrong

- **Sprint chain 021–029.** Landed. Two later sprints (030, 031) landed as Wave-2 candidates the plan did not name; a third (032) landed after a mid-plan review found the arc scope-limited the studio.
- **"UI EMITS no signals ... previous framing" clause in WORKING_AGREEMENT.** The plan cited a WORKING_AGREEMENT § that was already rewritten 2026-08-15 as part of the Wave-1 close.
- **Sprint 029 wave-close.** Landed with a different shape than the plan's "extend each e2e_*.js with three tail steps" — Sprint 029's own card documents the deliberate decline; Sprint 031's optional-flag tail is the reversible middle.
- **Studio surface not in scope.** The plan scoped `web/app.ts` only. Sprint 032 closed that gap after Architect intervention 2026-08-16.

## What Wave-2+ delivered on top of the arc

- Sprint 030 — `substrate_kind` foreign-key runtime enforcement; mirror at `signals/mirror/substrate-0.2.json` (sha256 pinned); namespace-split closed-set membership.
- Sprint 031 — optional `CAPTURE_SIGNALS=1` tail on the four standing e2e harnesses; four un-graded fixture files land when the flag is set.
- Sprint 032 — studio surface instrumentation; vocab v0.3 (53 tags, category `studio`, two new pairing invariants, one new entity_merge).

## Reason for supersession

The plan was accurate at 2026-08-14 dispatch. Wave-1 close, three Wave-2 sprints, and a v0.3 vocab bump moved the tree past it. The `-superseded` filename matches the pattern used for `SDD-HARNESS-PORT-PLAN-2026-08-16-superseded.md`.
