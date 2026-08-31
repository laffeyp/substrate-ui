# SDD-HARNESS-PORT-PLAN.md — superseded by the Wave-1 close (2026-08-16)

*New file per the no-in-place-edits rule. The prior `SDD-HARNESS-PORT-PLAN.md` (2026-08-14) stays on disk as audit trail; this file names what actually landed and where the plan's descriptions no longer match disk.*

---

## Status

Superseded by Wave-1 close at `sprints/sprint-029-harness-integration-wave-close.md` (2026-08-15).
Consult that card and `captures/README.md` for the current fixture policy. The 2026-08-14 port plan directed a JS-only port that never happened; the actual port kept TypeScript.

## What actually landed

- **`web/instrumentation/sdd.ts`** — emitter. TypeScript, not the plan's `.js`.
- **`web/instrumentation/vocabulary.ts`** — vocabulary loader. TypeScript.
- **`tools/check-vocabulary-parity.ts`** — parity gate. Walks `web/` + `harness/`, exit 0/1/2.
- **`tools/capture-grade.ts`** — invariant grader. Reads one JSONL, runs contains-in-order + pairing + payload-content checks, exit 0/1/2.
- **`harness/capture_signals.js`** — the one signal-capture harness that exercises the full flow. Written vanilla-JS so it runs alongside the ten existing e2e/capture scripts under `harness/` without a TS build for that directory.
- **`captures/sprint-021/console.jsonl`** — the canonical fixture. 333 signals after Wave-1 close.
- **`captures/README.md`** — the fixture policy. Grader-enforced invariants, not byte-identical diff; regeneration is `npm run signals`.
- **`package.json`** — added `capture:signals`, `grade:signals`, `check:vocab-parity`, `signals` scripts.

## Where the prior plan reads wrong on disk

- **Port plan § "Vanilla JS, no TypeScript build. Port drops type annotations."** Wrong direction. TS was preserved; every artifact above is `.ts` except the harness driver.
- **Port plan § "What Katybird ships" (line counts).** Katybird's file line counts (85, 23, 191, 398) are not verifiable from this workspace and were not verified. The ported files' real sizes on disk today: `sdd.ts` 66 lines, `vocabulary.ts` 27, `check-vocabulary-parity.ts` 169, `capture-grade.ts` 494 (grew across sprints 021–028 as new invariants landed).
- **Port plan § "harness ships nine scripts."** Actual inventory on disk today is thirteen scripts under `harness/`: capture_assay.js, capture_console.js, capture_delegate.js, capture_scene.js, capture_signals.js, capture_states.js, capture_studio.js, capture_toolchain.js, e2e_assay.js, e2e_console.js, e2e_delegate.js, e2e_studio.js, open_assay.js.
- **Port plan § "harnesses gain a signal-capture step."** Not what landed. Sprint 029 chose one dedicated harness (`capture_signals.js`) rather than extend each e2e_*.js — the rationale is in the Sprint 029 card (coupling DOM contracts to signal contracts on every e2e edit was noise).
- **Port plan § "port doesn't dispatch until these three are ruled" (vocabulary path, emit-buffer location, Vocabulary Session partner).** The three landed as: nested path (`signals/versions/0.1.json`); `window.__signals` (matches Katybird's shape); solo-drafted by the Agent at Architect direction (Sprint 019 close entry names this). The gate is closed; a v0.2 dispatch would re-open the third of these.
- **Port plan § "view_payload_universal is `frame / visible / scene_id / layer`."** Substrate-ui deviated to `{frame, visible, pane_id, subject_record}` — a deviation the vocab rationale doc names and defends, and the emitter enforces. The port plan text is a Katybird-shape description that never applied here.

## What remains

Wave-2 candidates sit at `BLACKBOARD.md ## Surfaced for review` (2026-08-15, revised 2026-08-16): eight vocabulary-change proposals plus a `## Decisions` post-hoc ratification for v0.1. Nothing on the Wave-2 queue involves reviving this superseded plan.
