---
id: 200
status: closed
phase: shell-to-react A4
pass_kind: functional
---

# Sprint 200 — the parity gate scans the React trees

## scope

`web/vm/tools/check-vocabulary-parity.ts` scans `web/vm`, `web/reveal.ts` and `web/reveal_component.ts` for `emit("TAG")` and skips `web/reveal/**`, the `.tsx` transcript tree (F359). It adds `web/reveal/` and `web/app/` to `SCAN_PATHS`, so every component the move writes is scanned from its first sprint. Its header comment, which cites the classic shell's gate (gone), says what the gate scans today.

## prerequisites

- 199 closed

## context_files

- `web/vm/tools/check-vocabulary-parity.ts`
- `process/planning/2026-11-04-shell-to-react/PLAN-2026-11-04-shell-to-react-r4.md` (Order of work, A4)
- Lens finding F359 (`process/planning/2026-10-08-lens-audit/ROADMAP-2026-10-08-lens-audit-remediation-LEDGER.md:366`)

## signal contract

None changed. The gate reads the vocabulary; it emits nothing.

## artifact contract

- Modified: `web/vm/tools/check-vocabulary-parity.ts`.
- `SCAN_PATHS` names `web/reveal` and `web/app`; the header names no classic-shell gate.
- `npm run signals` 0, "36 distinct live tag(s)".
- A planted `emit("NOT_A_TAG")` in a `.tsx` file under `web/reveal/transcript/` makes `npm run signals` exit 1 naming that file; the same under `web/app/` exits 1.

## observation contract

The gate is a command, not app behaviour: the planted runs above are its observation.

## done criteria

An undeclared tag emitted anywhere in the React trees fails the gate.

## result

Closed 2026-11-04. `SCAN_PATHS` adds `web/reveal` and `web/app`; the header describes the gate's scope today and no longer cites the classic shell's gate. `npm run signals` exit 0, 36 distinct live tags, the same count as before: `web/reveal/**` holds no `emit(` call today. Planted `emit("NOT_A_TAG")` in `web/reveal/transcript/zz_planted.tsx`: exit 1, the file named; in `web/app/zz_planted.tsx`: exit 1, the file named. Both planted files removed; `web/app/` does not exist yet and is created by A5. `npx tsc --noEmit -p .` 0. F359 fixed.

## Rubber Duck pass

No signals: the gate emits none. Observations: none in the six categories. Disposition: none needed.
