---
id: 345
status: closed
phase: shell-to-react G1
pass_kind: verification
---

# Sprint 345 — every gate on a fresh bundle; the U112 rows recorded

## scope

Plan row G1. On the pushed tree after sprint 344: every `gates:electron` script run alone; the unit specs; the Python tests; `vm_smoke`; all 28 pixel captures against `baseline-2026-11-04` (pre-move); `smoke:packaged` on a fresh signed build. The lens-audit's 37 U112 rows get their outcomes in `process/planning/2026-10-08-lens-audit/LEDGER-2026-11-05-U112-closes.md` (the generated ledger is left as it is); sprints 112 and 113 are marked superseded.

`harness/vm_smoke.ts`: its /help step looked for a row starting "slash commands:", text /help has not written since UI sprint 162 (fcc9ace), so the smoke failed at that step before this plan began; it now finds the SlashHelp row and requires its commands.

## artifact contract

- Created: `process/planning/2026-10-08-lens-audit/LEDGER-2026-11-05-U112-closes.md`. Modified: `harness/vm_smoke.ts`, `process/sprints/sprint-112-retire-dc-runtime.md`, `process/sprints/sprint-113-packaging-and-vocabulary.md` (status superseded).

## observation contract

All of the checks above pass, the pixels differing from the pre-move captures only by logged fixes.

## result

Closed 2026-11-05.
- `gates:electron`: 60 of 60 exit 0, Axis C bugs 0 (the run after sprint 344, on the same code).
- Unit: 139 of 139. Signals: vocabulary 0.5, 38 live, all emitted.
- Python: 257 passed, 5 skipped (real-driver tests, run on demand).
- `vm_smoke`: 12 of 12 steps.
- Pixels: 20 of 28 equal to `baseline-2026-11-04`; the 8 that differ are the logged fixes (end dialog 1190, inspector 58049 and 66, footer 1419 ×4), the same counts as at the restoration.
- `smoke:packaged`: ok on `dist-electron/mac-arm64/Substrate.app`, built from this tree and signed with Developer ID Application: Green Rose Systems, LLC (ZVL8XB9XGU), not notarized (`-c.mac.notarize=false`; nothing was sent to Apple). A typed turn reached the transcript, the kimi-k2.7-code:cloud turn parked, the structure graph populated, the backend was gone 901 ms after quit.

## Rubber Duck pass

`vm_smoke` saw 17 distinct tags; every tag the packaged smoke's turn needed fired.
