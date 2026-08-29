# Sprint 038 — piece-G review fold

```yaml
---
id: 038
status: closed-2026-08-29
phase: 5
pass_kind: observation
---
```

## scope

Piece G closes with the same fold discipline the other pieces use.
Run the independent reviewer (or self-review under the same
adversarial-on-SDD lens the substrate-side REVIEW-2026-08-28 docs
carry) over sprints 033-037. Land the findings.

Anticipated categories (based on prior reviews):

- **F1 pattern.** Sprint-id collisions between substrate/ and
  substrate-ui/ sides. Substrate has sprints 033+ from the
  Agent-Orchestration numbering; substrate-ui's 033 is the two-view
  scaffold. Cross-repo id namespacing not enforced by tooling. Verify.
- **Vocab drift.** Any of the five new session-control tags from
  sprint 036 that landed as `vocabulary_change_required` halts need
  final v0.7 lock or fold-back.
- **Frame-monotonic** across the new pane_ids `terminal` and
  `desktop` — the counter must not reset on view flips.
- **Legacy dock removal.** Sprint 037 deleted the docked terminal.
  Any `#termdock` selector references in tests, capture harnesses, or
  documentation need cleanup.
- **HARNESS-CATALOG.md** updated with the three new harnesses and
  the session grader kind.

## context_files

- All sprints 033-037.
- `process/HARNESS-CATALOG.md`.
- Prior review folds: substrate-side REVIEW-2026-08-28 docs for the
  shape.

## artifact contract → Files created/modified

- `substrate-ui/process/REVIEW-2026-08-DD-piece-g-close.md` — new
  review doc.
- Fold sprints for each surviving finding (numbered 038a, 038b, ...
  per the split pattern the substrate side used at 225a-d, 224a-h).
- `substrate-ui/process/HARNESS-CATALOG.md` — updated with
  `e2e_session.js` / `capture_session.js` / `capture_session_signals.js`
  moved out of the "does not exist yet" tail into the main tables.
- `substrate-ui/sprints/sprint-038-piece-g-review-fold.md` — this
  file.

## signal contract → Emits

None (review sprint).

## observation contract

- Every finding either folded or explicitly deferred with a queued
  card.
- Full `npm run e2e && npm run e2e:studio && npm run e2e:assay &&
  npm run e2e:delegate && npm run e2e:session && npm run signals`
  green. **Expected wall-clock: 5-10 minutes** per iteration (six e2e
  runs + grader sweep across all fixtures; per REVIEW-2026-08-28 G9).
  Not a defect; a runtime cost worth naming so the fold pass does not
  read as a hang.
- `test_ui_control_parity.py` green.

## halt conditions

- `dual_contract_fail` if any prior sprint's tests fail after the
  review pass.

## definition of done

Piece G closed. Daily driver v1 complete: substrate side (pieces 0,
A, B, C, D, E, F, H) + substrate-ui side (piece G). The user can
type `substrate` in a terminal or open the browser to `/`, and
either surface drives the same daemon with the same session
semantics.
