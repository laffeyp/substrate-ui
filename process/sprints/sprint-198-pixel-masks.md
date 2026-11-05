---
id: 198
status: closed
phase: shell-to-react A1 follow-up, found in sprint 197
pass_kind: functional
---

# Sprint 198 — the pixel masks hold over time and repetition

## scope

Three faults in `harness/pixel/masks.ts`, found when sprint 197's capture, 30 minutes after the baseline, failed 22 of 28 on an unchanged build. Fix them, recapture `captures/pixel/baseline-2026-11-04/`, and show that fresh captures compare equal to it.

1. The deterministic driver replies `stub[0]:` plus 12 hex digits of a SHA-256 over the seed and the whole prompt (`../substrate/src/substrate/adapters/models.py:113–117`); the prompt carries the session's environment, so the digits change with time. Masked after `stub[N]:`.
2. Text under an overlay (the first-run screen) was masked on top of the overlay, and whether that hidden text existed at capture time varied. Masks now cover only text that `elementFromPoint` finds on top.
3. A mask fitted to the glyphs changed width with the value (`t+9.8ms`, `t+12.3ms`; `2s ago`, `12s ago`). A match that is all of its element's text masks the element's box; a match inside longer text masks from its first character to its element's right edge.

## artifact contract

- Modified: `harness/pixel/masks.ts`.
- Recaptured: `captures/pixel/baseline-2026-11-04/` (the first copy moved to `captures/pixel/superseded-baseline-2026-11-04-unmasked-digest/`, ignored by git).
- `npx tsc -p harness` 0.

## observation contract

- Three fresh captures compare with the baseline: 28 of 28 each.
- A planted 40×40 block on the records page fails: 1,600 pixels, the only failing file.
- Looked at: meta's stream with the masks drawn; only the scratch folder's name, the digest, the time column and the activity counter are covered.

## result

Closed 2026-11-04. All three checks as written. Open: equality over a longer gap is checked again at the next sprint's capture, which runs later than these.

## Rubber Duck pass

No app signals. Observations: three, all the harness reporting differences the app did not make (timing surprise ×2, payload anomaly ×1); resolved here.
