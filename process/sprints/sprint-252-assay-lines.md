---
id: 252
status: closed
phase: shell-to-react B5.1c
pass_kind: functional
---

# Sprint 252 — what the assay page says about each arm

## scope

`web/app/derive/assays.ts`: each arm's line (pass^k as passes/cases and a bar; pass@1; Δ vs control with its interval; the verdict word; tokens; time), the warnings above the table (a control check that did not pass, unpublishable arms, a config that is not verified), and the listing row's summary. The design's rules (D13, D18): numbers in plain text; the accent only on a significant finding (`fdr_significant`); "inconclusive" reads "can't tell yet"; an arm that ran no case gets a hollow dashed bar and "not run". The template's tier columns (EASY·8, MED·12, HARD·8, ADV·4) are in no report and are not carried over.

## context_files

`../substrate/src/substrate/assay/report.py` (`ArmReport`, `Report`), `conformance.py` (`ControlRanCheck`); design: `DESIGN-DECISIONS -through 2026-11-04-.md` D6, D13, D18.

## artifact contract

- Created: `web/app/derive/assays.ts`, `web/app/__tests__/assays.spec.ts`. `npm run test:unit` 0.

## result

Closed 2026-11-05. Spec 5/5.

## Rubber Duck pass

No signals.
